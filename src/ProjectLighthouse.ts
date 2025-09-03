import { ponder } from "ponder:registry";
import { sql } from "ponder";
import {
  signals,
  wallet_authorizations,
  daily_signal_counts,
  fid_bans,
  wallet_bans,
  fid_stats,
} from "../ponder.schema";

ponder.on("ProjectLighthouseV16:SignalCreated", async ({ event, context }) => {
  const { db } = context;

  // Calculate expiration time
  const expiresAt =
    event.args.timestamp + BigInt(event.args.duration) * BigInt(86400);

  await db.insert(signals).values({
    transaction_hash: event.transaction.hash,
    fid: Number(event.args.fid),
    ca: event.args.ca,
    direction: event.args.direction,
    duration: Number(event.args.duration),
    timestamp: event.args.timestamp,
    block_number: event.block.number,
    status: 0,
    expires_at: expiresAt,
  });

  // Calculate day from deployment timestamp
  const deploymentTimestamp = BigInt(1735689600); // Replace with actual deployment timestamp
  const currentDay =
    (event.args.timestamp - deploymentTimestamp) / BigInt(86400);
  const dayId = `${event.args.fid}-${currentDay}`;

  // Insert daily signal count
  await db.insert(daily_signal_counts).values({
    id: dayId,
    fid: Number(event.args.fid),
    day: currentDay,
    count: 1,
    block_number: event.block.number,
    transaction_hash: event.transaction.hash,
  });

  // Insert or update FID stats
  await db.insert(fid_stats).values({
    fid: Number(event.args.fid),
    total_signals: 1,
    active_signals: 1,
    won_signals: 0,
    lost_signals: 0,
    block_number: event.block.number,
    transaction_hash: event.transaction.hash,
  });
});

ponder.on(
  "ProjectLighthouseV16:WalletAuthorized",
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

ponder.on("ProjectLighthouseV16:FidBanned", async ({ event, context }) => {
  const { db } = context;

  await db.insert(fid_bans).values({
    id: `${event.args.fid}-${event.block.number}`,
    fid: Number(event.args.fid),
    banned: true,
    block_number: event.block.number,
    transaction_hash: event.transaction.hash,
  });
});

ponder.on("ProjectLighthouseV16:FidUnbanned", async ({ event, context }) => {
  const { db } = context;

  await db.insert(fid_bans).values({
    id: `${event.args.fid}-${event.block.number}`,
    fid: Number(event.args.fid),
    banned: false,
    block_number: event.block.number,
    transaction_hash: event.transaction.hash,
  });
});

ponder.on("ProjectLighthouseV16:WalletBanned", async ({ event, context }) => {
  const { db } = context;

  await db.insert(wallet_bans).values({
    id: `${event.args.wallet}-${event.block.number}`,
    wallet: event.args.wallet,
    banned: true,
    block_number: event.block.number,
    transaction_hash: event.transaction.hash,
  });
});

ponder.on("ProjectLighthouseV16:WalletUnbanned", async ({ event, context }) => {
  const { db } = context;

  await db.insert(wallet_bans).values({
    id: `${event.args.wallet}-${event.block.number}`,
    wallet: event.args.wallet,
    banned: false,
    block_number: event.block.number,
    transaction_hash: event.transaction.hash,
  });
});
