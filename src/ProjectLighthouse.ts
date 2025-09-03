import { ponder } from "ponder:registry";
import { sql } from "ponder";
import {
  signals,
  walletAuthorizations,
  dailySignalCounts,
  fidBans,
  walletBans,
  fidStats,
} from "../ponder.schema";

ponder.on("ProjectLighthouseV16:SignalCreated", async ({ event, context }) => {
  const { db } = context;

  // Convert signalId (uint256) to hex string
  const signalId = `0x${event.args.signalId
    .toString(16)
    .padStart(64, "0")}` as `0x${string}`;

  // Calculate expiration time
  const expiresAt =
    event.args.timestamp + BigInt(event.args.duration) * BigInt(86400);

  await db.insert(signals).values({
    id: signalId,
    fid: Number(event.args.fid),
    ca: event.args.ca,
    direction: event.args.direction,
    duration: Number(event.args.duration),
    timestamp: event.args.timestamp,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
    status: 0, // Active
    expiresAt: expiresAt,
  });

  // Calculate day from deployment timestamp
  const deploymentTimestamp = BigInt(1735689600); // Replace with actual deployment timestamp
  const currentDay =
    (event.args.timestamp - deploymentTimestamp) / BigInt(86400);
  const dayId = `${event.args.fid}-${currentDay}`;

  // Insert daily signal count
  await db.insert(dailySignalCounts).values({
    id: dayId,
    fid: Number(event.args.fid),
    day: currentDay,
    count: 1,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });

  // Insert or update FID stats
  await db.insert(fidStats).values({
    fid: Number(event.args.fid),
    totalSignals: 1,
    activeSignals: 1,
    wonSignals: 0,
    lostSignals: 0,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
});

ponder.on(
  "ProjectLighthouseV16:WalletAuthorized",
  async ({ event, context }) => {
    const { db } = context;

    await db.insert(walletAuthorizations).values({
      id: `${event.args.fid}-${event.args.wallet}`,
      fid: Number(event.args.fid),
      wallet: event.args.wallet,
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
    });
  }
);

ponder.on("ProjectLighthouseV16:FidBanned", async ({ event, context }) => {
  const { db } = context;

  await db.insert(fidBans).values({
    id: `${event.args.fid}-${event.block.number}`,
    fid: Number(event.args.fid),
    banned: true,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("ProjectLighthouseV16:FidUnbanned", async ({ event, context }) => {
  const { db } = context;

  await db.insert(fidBans).values({
    id: `${event.args.fid}-${event.block.number}`,
    fid: Number(event.args.fid),
    banned: false,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("ProjectLighthouseV16:WalletBanned", async ({ event, context }) => {
  const { db } = context;

  await db.insert(walletBans).values({
    id: `${event.args.wallet}-${event.block.number}`,
    wallet: event.args.wallet,
    banned: true,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("ProjectLighthouseV16:WalletUnbanned", async ({ event, context }) => {
  const { db } = context;

  await db.insert(walletBans).values({
    id: `${event.args.wallet}-${event.block.number}`,
    wallet: event.args.wallet,
    banned: false,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
});
