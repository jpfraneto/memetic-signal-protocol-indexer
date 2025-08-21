import { onchainTable } from "ponder";

export const accounts = onchainTable("accounts", (t) => ({
  id: t.text().primaryKey(), // user address
  fid: t.bigint().notNull(),
  createdAt: t.bigint().notNull(),
  isBanned: t.boolean().notNull().default(false),
  isSubscriber: t.boolean().notNull().default(false),
  subscriptionExpiresAt: t.bigint(),
}));

export const sessions = onchainTable("sessions", (t) => ({
  id: t.text().primaryKey(), // transaction hash + log index
  user: t.text().notNull(),
  fid: t.bigint().notNull(),
  startTime: t.bigint().notNull(),
  expiresAt: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const signals = onchainTable("signals", (t) => ({
  id: t.bigint().primaryKey(), // signalId from contract
  fid: t.bigint().notNull(),
  user: t.text().notNull(),
  createdAt: t.bigint().notNull(),
  expiresAt: t.bigint().notNull(),
  status: t.integer().notNull().default(0), // 0=ACTIVE, 1=WON, 2=LOST, 3=EXPIRED
  correctPredictions: t.integer().notNull().default(0),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const tokenPredictions = onchainTable("token_predictions", (t) => ({
  id: t.text().primaryKey(), // signalId + token index
  signalId: t.bigint().notNull(),
  tokenIndex: t.integer().notNull(),
  contractAddress: t.text().notNull(),
  marketCap: t.bigint().notNull(),
  direction: t.integer().notNull(), // 0=DOWN, 1=UP
  exitMarketCap: t.bigint(), // Set during settlement
  isCorrect: t.boolean(), // Set during settlement
}));

export const subscriptions = onchainTable("subscriptions", (t) => ({
  id: t.text().primaryKey(), // transaction hash + log index
  user: t.text().notNull(),
  fid: t.bigint().notNull(),
  expiresAt: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
}));
