import { ponder } from "ponder:registry";
import { sql } from "ponder";
import {
  signals,
  wallet_authorizations,
  daily_signal_counts,
  fid_bans,
  wallet_bans,
  tokens,
  fid_stats,
  signal_resolutions,
  fid_total_mfs,
  wallet_unauthorizations,
  signal_manual_updates,
  backend_signer_updates,
  resolver_updates,
  users,
} from "../ponder.schema";
import { fetchTokenInformation, fetchUserFromNeynar } from "./lib/functions";

ponder.on("MemeticSignalProtocol:SignalCreated", async ({ event, context }) => {
  const now = new Date();
  const { db } = context;

  const [token_info, mc_when_signaled] = await fetchTokenInformation(
    event.args.token,
    new Date(Number(event.block.timestamp) * 1000)
  );

  console.log(
    `PROCESSING TOKEN: ${token_info.name}, SIGNALED BY: ${event.args.fid}. ITS SIGNALING MC IS ${mc_when_signaled}Z`
  );

  const userFromNeynar = await fetchUserFromNeynar(Number(event.args.fid));

  // Upsert user data if we got it from Neynar
  if (userFromNeynar) {
    await db
      .insert(users)
      .values({
        fid: Number(event.args.fid),
        username: userFromNeynar.username || null,
        display_name: userFromNeynar.display_name || null,
        pfp_url: userFromNeynar.pfp_url || null,
        is_verified:
          userFromNeynar.verifications &&
          userFromNeynar.verifications.length > 0,
        follower_count: userFromNeynar.follower_count || 0,
        following_count: userFromNeynar.following_count || 0,
        mfs_score: 0, // Will be updated when signals are resolved
        win_rate: 0, // Will be calculated based on resolved signals
        total_signals: 0, // Will be incremented as signals are created
        active_signals: 0, // Will be tracked as signals are created/resolved
        settled_signals: 0, // Will be incremented when signals are resolved
        total_score: 0, // Will be updated with MFS scores
        rank: null, // Will be calculated based on total MFS
        last_score_update: null,
        role: "USER",
        is_banned: false, // Will be updated if user gets banned
        banned_at: null,
        notifications_enabled: true,
        notification_token: null,
        notification_url: null,
        last_signal_date: now.toISOString().split("T")[0], // YYYY-MM-DD format
        state_on_the_system: "ACTIVE",
        wallet_address:
          userFromNeynar.verified_addresses?.primary?.eth_address || null,
        jbm_balance: "0",
        is_subscriber: userFromNeynar.pro?.status === "subscribed" || false,
        subscription_expires_at: userFromNeynar.pro?.expires_at
          ? new Date(userFromNeynar.pro.expires_at).toISOString()
          : null,
        subscribed_at: userFromNeynar.pro?.subscribed_at
          ? new Date(userFromNeynar.pro.subscribed_at).toISOString()
          : null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        last_active_at: now.toISOString(),
      })
      .onConflictDoUpdate({
        username: userFromNeynar.username || null,
        display_name: userFromNeynar.display_name || null,
        pfp_url: userFromNeynar.pfp_url || null,
        is_verified:
          userFromNeynar.verifications &&
          userFromNeynar.verifications.length > 0,
        follower_count: userFromNeynar.follower_count || 0,
        following_count: userFromNeynar.following_count || 0,
        is_subscriber: userFromNeynar.pro?.status === "subscribed" || false,
        subscription_expires_at: userFromNeynar.pro?.expires_at
          ? new Date(userFromNeynar.pro.expires_at).toISOString()
          : null,
        subscribed_at: userFromNeynar.pro?.subscribed_at
          ? new Date(userFromNeynar.pro.subscribed_at).toISOString()
          : null,
        last_signal_date: now.toISOString().split("T")[0],
        updated_at: now.toISOString(),
        last_active_at: now.toISOString(),
      });
  }

  await db
    .insert(tokens)
    .values({
      coingecko_id: token_info.id,
      ca: event.args.token,
      name: token_info.name,
      symbol: token_info.symbol,
      decimals: token_info.decimals,
      categories: token_info.categories,
      description: token_info.description,
      image: token_info.image,
      image_small: token_info.imageSmall,
      image_thumb: token_info.imageThumb,
      market_cap_rank: mc_when_signaled,
      market_data: token_info.marketData,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .onConflictDoUpdate({ market_data: token_info.marketData });

  // The signalId should be the first indexed parameter in SignalCreated event
  const signalId = Number(event.args.signalId);

  await db.insert(signals).values({
    signal_id: signalId,
    transaction_hash: event.transaction.hash,
    fid: Number(event.args.fid),
    ca: event.args.token,
    direction: event.args.direction,
    duration_days: Number(event.args.durationDays),
    entry_market_cap: Number(mc_when_signaled),
    created_at: event.args.createdAt,
    expires_at: event.args.expiresAt,
    timestamp: now.toISOString(),
    block_number: event.block.number,
    resolved: false,
    mfs_delta: 0,
    manually_updated: false,
  });

  // Calculate day from deployment timestamp
  const deploymentTimestamp = 1735689600; // Replace with actual deployment timestamp
  const currentDay = Math.floor(
    (now.getTime() - deploymentTimestamp) / 86400000
  );
  const dayId = `${event.args.fid}-${currentDay}`;

  // Insert daily signal count
  await db
    .insert(daily_signal_counts)
    .values({
      id: dayId,
      fid: Number(event.args.fid),
      day: currentDay,
      count: 1,
      block_number: event.block.number,
      transaction_hash: event.transaction.hash,
    })
    .onConflictDoNothing();
});

ponder.on(
  "MemeticSignalProtocol:WalletAuthorized",
  async ({ event, context }) => {
    const { db } = context;

    await db.insert(wallet_authorizations).values({
      id: `${event.args.fid}-${event.args.wallet}`,
      fid: Number(event.args.fid),
      wallet: event.args.wallet,
      block_number: event.block.number,
      transaction_hash: event.transaction.hash,
    });
  }
);

ponder.on("MemeticSignalProtocol:FidBanned", async ({ event, context }) => {
  const { db } = context;

  await db.insert(fid_bans).values({
    id: `${event.args.fid}-${event.block.number}`,
    fid: Number(event.args.fid),
    banned: true,
    block_number: event.block.number,
    transaction_hash: event.transaction.hash,
  });
});

ponder.on("MemeticSignalProtocol:FidUnbanned", async ({ event, context }) => {
  const { db } = context;

  await db.insert(fid_bans).values({
    id: `${event.args.fid}-${event.block.number}`,
    fid: Number(event.args.fid),
    banned: false,
    block_number: event.block.number,
    transaction_hash: event.transaction.hash,
  });
});

ponder.on("MemeticSignalProtocol:WalletBanned", async ({ event, context }) => {
  const { db } = context;

  await db.insert(wallet_bans).values({
    id: `${event.args.wallet}-${event.block.number}`,
    wallet: event.args.wallet,
    banned: true,
    block_number: event.block.number,
    transaction_hash: event.transaction.hash,
  });
});

ponder.on(
  "MemeticSignalProtocol:WalletUnbanned",
  async ({ event, context }) => {
    const { db } = context;

    await db.insert(wallet_bans).values({
      id: `${event.args.wallet}-${event.block.number}`,
      wallet: event.args.wallet,
      banned: false,
      block_number: event.block.number,
      transaction_hash: event.transaction.hash,
    });
  }
);

// Signal resolution event handler
ponder.on(
  "MemeticSignalProtocol:SignalResolved",
  async ({ event, context }) => {
    const { db } = context;

    // Update the signal as resolved
    await db.update(signals, { signal_id: Number(event.args.signalId) }).set({
      resolved: true,
      mfs_delta: Number(event.args.mfsDelta),
    });

    // Insert resolution record
    await db.insert(signal_resolutions).values({
      id: `${event.args.signalId}-${event.block.number}`,
      signal_id: Number(event.args.signalId),
      fid: Number(event.args.fid),
      mfs_delta: Number(event.args.mfsDelta),
      new_total_mfs: event.args.newTotalMFS.toString(),
      block_number: event.block.number,
      transaction_hash: event.transaction.hash,
    });

    // Update FID total MFS
    await db
      .insert(fid_total_mfs)
      .values({
        fid: Number(event.args.fid),
        total_mfs: event.args.newTotalMFS.toString(),
        last_updated_block: event.block.number,
        last_updated_tx: event.transaction.hash,
      })
      .onConflictDoUpdate({
        total_mfs: event.args.newTotalMFS.toString(),
        last_updated_block: event.block.number,
        last_updated_tx: event.transaction.hash,
      });
  }
);

ponder.on(
  "MemeticSignalProtocol:ResolverUpdated",
  async ({ event, context }) => {
    const { db } = context;

    await db.insert(resolver_updates).values({
      id: `${event.block.number}-${event.transaction.transactionIndex}`,
      old_resolver: event.args.oldResolver,
      new_resolver: event.args.newResolver,
      block_number: event.block.number,
      transaction_hash: event.transaction.hash,
    });
  }
);

ponder.on(
  "MemeticSignalProtocol:WalletUnauthorized",
  async ({ event, context }) => {
    const { db } = context;

    await db.insert(wallet_unauthorizations).values({
      id: `${event.args.wallet}-${event.block.number}`,
      wallet: event.args.wallet,
      block_number: event.block.number,
      transaction_hash: event.transaction.hash,
    });
  }
);

// Backend signer update event handler
ponder.on(
  "MemeticSignalProtocol:BackendSignerUpdated",
  async ({ event, context }) => {
    const { db } = context;

    await db.insert(backend_signer_updates).values({
      id: `${event.block.number}-${event.transaction.transactionIndex}`,
      old_signer: event.args.oldSigner,
      new_signer: event.args.newSigner,
      block_number: event.block.number,
      transaction_hash: event.transaction.hash,
    });
  }
);

// Manual signal update event handler
ponder.on(
  "MemeticSignalProtocol:SignalManuallyUpdated",
  async ({ event, context }) => {
    const { db } = context;

    // Update the signal with manual update flag
    await db.update(signals, { signal_id: Number(event.args.signalId) }).set({
      manually_updated: true,
      entry_market_cap: Number(event.args.newEntryMarketCap),
      mfs_delta: Number(event.args.newMfsDelta),
    });

    // Insert manual update record
    await db.insert(signal_manual_updates).values({
      id: `${event.args.signalId}-${event.block.number}`,
      signal_id: Number(event.args.signalId),
      fid: Number(event.args.fid),
      old_entry_market_cap: Number(event.args.oldEntryMarketCap),
      new_entry_market_cap: Number(event.args.newEntryMarketCap),
      old_mfs_delta: Number(event.args.oldMfsDelta),
      new_mfs_delta: Number(event.args.newMfsDelta),
      new_total_mfs: Number(event.args.newTotalMFS),
      reason: event.args.reason,
      block_number: event.block.number,
      transaction_hash: event.transaction.hash,
    });

    // Update FID total MFS
    await db
      .insert(fid_total_mfs)
      .values({
        fid: Number(event.args.fid),
        total_mfs: event.args.newTotalMFS.toString(),
        last_updated_block: event.block.number,
        last_updated_tx: event.transaction.hash,
      })
      .onConflictDoUpdate({
        total_mfs: event.args.newTotalMFS.toString(),
        last_updated_block: event.block.number,
        last_updated_tx: event.transaction.hash,
      });
  }
);
