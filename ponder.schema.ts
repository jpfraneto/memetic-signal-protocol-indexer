import { onchainTable } from "ponder";

export const accounts = onchainTable("accounts", (t) => ({
  id: t.text().primaryKey(), // user address
  fid: t.bigint().notNull(),
  createdAt: t.bigint().notNull(),
  isSubscriber: t.boolean().notNull().default(false),
  subscriptionExpiresAt: t.bigint(),
}));

export const signals = onchainTable("signals", (t) => ({
  id: t.bigint().primaryKey(), // signalId from contract
  fid: t.bigint().notNull(),
  user: t.text().notNull(),
  contractAddress: t.text().notNull(), // ca (contract address being predicted)
  direction: t.integer().notNull(), // 0=DOWN, 1=UP
  timeframe: t.integer().notNull(), // 0-100 (24 hours to 30 days)
  createdAt: t.bigint().notNull(),
  expiresAt: t.bigint().notNull(),
  isResolved: t.boolean().notNull().default(false),
  won: t.boolean(), // Set during resolution
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const subscriptions = onchainTable("subscriptions", (t) => ({
  id: t.text().primaryKey(), // transaction hash + log index
  user: t.text().notNull(),
  fid: t.bigint().notNull(),
  expiresAt: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
}));
