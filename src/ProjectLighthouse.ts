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
} from "../ponder.schema";
import { fetchTokenInformation } from "./lib/functions";

ponder.on("ProjectLighthouseV16:SignalCreated", async ({ event, context }) => {
  const now = new Date();
  const { db } = context;

  // Calculate expiration time
  const expiresAt =
    event.args.timestamp + BigInt(event.args.duration) * BigInt(86400);

  const [token_info, mc_when_signaled] = await fetchTokenInformation(
    event.args.ca,
    new Date(Number(event.args.timestamp))
  );

  await db
    .insert(tokens)
    .values({
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

  await db.insert(signals).values({
    transaction_hash: event.transaction.hash,
    fid: Number(event.args.fid),
    ca: event.args.ca,
    direction: event.args.direction,
    duration: Number(event.args.duration),
    timestamp: now.toISOString(),
    block_number: event.block.number,
    status: 0,
    expires_at: now.toISOString(),
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
