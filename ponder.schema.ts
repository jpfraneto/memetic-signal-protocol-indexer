import { onchainTable } from "ponder";

export const signals = onchainTable("signals", (t) => ({
  fid: t.integer().notNull(),
  ca: t.hex().notNull(), // Contract address
  direction: t.boolean().notNull(), // false = DOWN, true = UP
  duration: t.integer().notNull(), // Duration in days
  timestamp: t.bigint().notNull(), // Block timestamp when signal was created
  blockNumber: t.bigint().notNull(),
  id: t.hex().notNull().primaryKey(),
  status: t.integer().notNull().default(0), // 0 = active, 1 = won, 2 = lost
  expiresAt: t.bigint().notNull(), // When the signal expires
  transactionHash: t.hex().notNull(),
}));

export const fidStats = onchainTable("fid_stats", (t) => ({
  fid: t.integer().primaryKey(),
  totalSignals: t.integer().notNull().default(0),
  activeSignals: t.integer().notNull().default(0),
  wonSignals: t.integer().notNull().default(0),
  lostSignals: t.integer().notNull().default(0),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));

export const walletAuthorizations = onchainTable(
  "wallet_authorizations",
  (t) => ({
    id: t.text().primaryKey(),
    fid: t.integer().notNull(),
    wallet: t.hex().notNull(),
    blockNumber: t.bigint().notNull(),
    transactionHash: t.hex().notNull(),
  })
);

export const dailySignalCounts = onchainTable("daily_signal_counts", (t) => ({
  id: t.text().primaryKey(), // Format: "{fid}-{day}"
  fid: t.integer().notNull(),
  day: t.bigint().notNull(), // Day number since deployment
  count: t.integer().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));

export const fidBans = onchainTable("fid_bans", (t) => ({
  id: t.text().primaryKey(),
  fid: t.integer().notNull(),
  banned: t.boolean().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));

export const walletBans = onchainTable("wallet_bans", (t) => ({
  id: t.text().primaryKey(),
  wallet: t.hex().notNull(),
  banned: t.boolean().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));
