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
} from "../ponder.schema";
import { fetchTokenInformation } from "./lib/functions";

ponder.on("ProjectLighthouseV19:SignalCreated", async ({ event, context }) => {
  const now = new Date();
  const { db } = context;

  const [token_info, mc_when_signaled] = await fetchTokenInformation(
    event.args.ca,
    new Date(Number(event.args.createdAt) * 1000) // V19 uses uint64 timestamp
  );

  await db
    .insert(tokens)
    .values({
      coingecko_id: token_info.id,
      ca: event.args.ca,
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
    ca: event.args.ca,
    direction: event.args.direction,
    duration_days: Number(event.args.durationDays), // V19 uses durationDays
    created_at: event.args.createdAt,
    expires_at: event.args.expiresAt,
    timestamp: now.toISOString(),
    block_number: event.block.number,
    resolved: false,
    mfs_applied: "0",
    status: 0,
    mc: mc_when_signaled,
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
  "ProjectLighthouseV19:WalletAuthorized",
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

ponder.on("ProjectLighthouseV19:FidBanned", async ({ event, context }) => {
  const { db } = context;

  await db.insert(fid_bans).values({
    id: `${event.args.fid}-${event.block.number}`,
    fid: Number(event.args.fid),
    banned: true,
    block_number: event.block.number,
    transaction_hash: event.transaction.hash,
  });
});

ponder.on("ProjectLighthouseV19:FidUnbanned", async ({ event, context }) => {
  const { db } = context;

  await db.insert(fid_bans).values({
    id: `${event.args.fid}-${event.block.number}`,
    fid: Number(event.args.fid),
    banned: false,
    block_number: event.block.number,
    transaction_hash: event.transaction.hash,
  });
});

ponder.on("ProjectLighthouseV19:WalletBanned", async ({ event, context }) => {
  const { db } = context;

  await db.insert(wallet_bans).values({
    id: `${event.args.wallet}-${event.block.number}`,
    wallet: event.args.wallet,
    banned: true,
    block_number: event.block.number,
    transaction_hash: event.transaction.hash,
  });
});

ponder.on("ProjectLighthouseV19:WalletUnbanned", async ({ event, context }) => {
  const { db } = context;

  await db.insert(wallet_bans).values({
    id: `${event.args.wallet}-${event.block.number}`,
    wallet: event.args.wallet,
    banned: false,
    block_number: event.block.number,
    transaction_hash: event.transaction.hash,
  });
});

// New V19 event handlers
ponder.on("ProjectLighthouseV19:SignalResolved", async ({ event, context }) => {
  const { db } = context;

  // Update the signal as resolved
  await db.update(signals, { signal_id: Number(event.args.signalId) }).set({
    resolved: true,
    mfs_applied: event.args.mfsDelta.toString(),
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
});

ponder.on(
  "ProjectLighthouseV19:ResolverUpdated",
  async ({ event, context }) => {
    // This event is informational - we can log it or track resolver changes
    // For now, we'll just capture it in logs but not store in DB
    console.log(
      `Resolver updated from ${event.args.oldResolver} to ${event.args.newResolver}`
    );
  }
);

ponder.on(
  "ProjectLighthouseV19:WalletUnauthorized",
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
