import { ponder } from "ponder:registry";
import { accounts, signals, subscriptions } from "../ponder.schema";

// Account creation event handler
ponder.on("ProjectLighthouseV13:AccountCreated", async ({ event, context }) => {
  await context.db.insert(accounts).values({
    id: event.args.user,
    fid: event.args.fid,
    createdAt: BigInt(event.block.timestamp),
    isSubscriber: false,
    subscriptionExpiresAt: null,
  });
});

// Subscription event handler
ponder.on("ProjectLighthouseV13:Subscribed", async ({ event, context }) => {
  // Update account subscription status
  await context.db.update(accounts, { id: event.args.user }).set({
    isSubscriber: true,
    subscriptionExpiresAt: event.args.expiresAt,
  });

  // Create subscription record
  await context.db.insert(subscriptions).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    user: event.args.user,
    fid: event.args.fid,
    expiresAt: event.args.expiresAt,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  });
});

// Signal created event handler
ponder.on("ProjectLighthouseV13:SignalCreated", async ({ event, context }) => {
  // Get the user address from the transaction
  const userAddress = event.transaction.from;

  await context.db.insert(signals).values({
    id: event.args.signalId,
    fid: event.args.fid,
    user: userAddress,
    contractAddress: event.args.ca,
    direction: event.args.direction,
    timeframe: event.args.timeframe,
    createdAt: BigInt(event.block.timestamp),
    expiresAt: event.args.expiresAt,
    isResolved: false,
    won: null,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  });
});

// Signal resolved event handler
ponder.on("ProjectLighthouseV13:SignalResolved", async ({ event, context }) => {
  // Update signal with resolution results
  await context.db.update(signals, { id: event.args.signalId }).set({
    isResolved: true,
    won: event.args.won,
  });
});
