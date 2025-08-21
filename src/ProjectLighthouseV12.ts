import { ponder } from "ponder:registry";
import { accounts, sessions, signals, tokenPredictions, subscriptions } from "../ponder.schema";

// Account creation event handler
ponder.on("ProjectLighthouseV12:AccountCreated", async ({ event, context }) => {
  await context.db.insert(accounts).values({
    id: event.args.user,
    fid: event.args.fid,
    createdAt: event.args.timestamp,
    isBanned: false,
    isSubscriber: false,
  });
});

// Subscription event handler
ponder.on("ProjectLighthouseV12:Subscribed", async ({ event, context }) => {
  // Update account subscription status
  await context.db.update(accounts, { id: event.args.user })
    .set({
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

// Session started event handler
ponder.on("ProjectLighthouseV12:SessionStarted", async ({ event, context }) => {
  await context.db.insert(sessions).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    user: event.args.user,
    fid: event.args.fid,
    startTime: event.args.startTime,
    expiresAt: event.args.expiresAt,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  });
});

// Signal created event handler
ponder.on("ProjectLighthouseV12:SignalCreated", async ({ event, context }) => {
  // Get the user address from the transaction
  const userAddress = event.transaction.from;
  
  await context.db.insert(signals).values({
    id: event.args.signalId,
    fid: event.args.fid,
    user: userAddress,
    createdAt: BigInt(event.block.timestamp),
    expiresAt: event.args.expiresAt,
    status: 0, // ACTIVE
    correctPredictions: 0,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  });

  // Note: Token predictions are not directly available in the event
  // They would need to be extracted from transaction input data
  // For now, we'll create placeholder entries that can be populated later
  for (let i = 0; i < 8; i++) {
    await context.db.insert(tokenPredictions).values({
      id: `${event.args.signalId}-${i}`,
      signalId: event.args.signalId,
      tokenIndex: i,
      contractAddress: "0x0000000000000000000000000000000000000000", // Placeholder
      marketCap: 0n, // Placeholder
      direction: 0, // Placeholder
    });
  }
});

// Signal settled event handler
ponder.on("ProjectLighthouseV12:SignalSettled", async ({ event, context }) => {
  // Update signal with settlement results
  await context.db.update(signals, { id: event.args.signalId })
    .set({
      status: event.args.status,
      correctPredictions: event.args.correctPredictions,
    });
});
