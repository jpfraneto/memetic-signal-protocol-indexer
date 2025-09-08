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
} from "../ponder.schema";
import { fetchTokenInformation } from "./lib/functions";

ponder.on("MemeticSignalProtocol:SignalCreated", async ({ event, context }) => {
  const now = new Date();
  const { db } = context;

  const [token_info, mc_when_signaled] = await fetchTokenInformation(
    event.args.token,
    new Date(Number(event.args.createdAt) * 1000) // Contract uses uint64 timestamp
  );

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
    token: event.args.token,
    direction: event.args.direction,
    duration_days: Number(event.args.durationDays),
    entry_market_cap: event.args.entryMarketCap.toString(),
    created_at: event.args.createdAt,
    expires_at: event.args.expiresAt,
    timestamp: now.toISOString(),
    block_number: event.block.number,
    resolved: false,
    mfs_delta: "0",
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
      mfs_delta: event.args.mfsDelta.toString(),
    });

    // Insert resolution record
    await db.insert(signal_resolutions).values({
      id: `${event.args.signalId}-${event.block.number}`,
      signal_id: Number(event.args.signalId),
      fid: Number(event.args.fid),
      mfs_delta: event.args.mfsDelta.toString(),
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
      entry_market_cap: event.args.newEntryMarketCap.toString(),
      mfs_delta: event.args.newMfsDelta.toString(),
    });

    // Insert manual update record
    await db.insert(signal_manual_updates).values({
      id: `${event.args.signalId}-${event.block.number}`,
      signal_id: Number(event.args.signalId),
      fid: Number(event.args.fid),
      old_entry_market_cap: event.args.oldEntryMarketCap.toString(),
      new_entry_market_cap: event.args.newEntryMarketCap.toString(),
      old_mfs_delta: event.args.oldMfsDelta.toString(),
      new_mfs_delta: event.args.newMfsDelta.toString(),
      new_total_mfs: event.args.newTotalMFS.toString(),
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
