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

export const users = onchainTable("users", (t) => ({
  fid: t.integer().primaryKey(),
  username: t.text(),
  displayName: t.text(),
  pfpUrl: t.text(),
  isVerified: t.boolean().default(false),
  followerCount: t.integer().default(0),
  followingCount: t.integer().default(0),
  mfsScore: t.real().default(0),
  winRate: t.real().default(0),
  totalSignals: t.integer().default(0),
  activeSignals: t.integer().default(0),
  settledSignals: t.integer().default(0),
  totalScore: t.real().default(0),
  rank: t.integer(),
  lastScoreUpdate: t.integer(),
  role: t.text().default("USER"),
  isBanned: t.boolean().default(false),
  bannedAt: t.integer(),
  notificationsEnabled: t.boolean().default(true),
  notificationToken: t.text(),
  notificationUrl: t.text(),
  lastSignalDate: t.text(),
  stateOnTheSystem: t.text().default("ACTIVE"),
  walletAddress: t.hex(),
  jbmBalance: t.text().default("0"),
  isSubscriber: t.boolean().default(false),
  subscriptionExpiresAt: t.integer(),
  subscribedAt: t.integer(),
  createdAt: t.integer().notNull(),
  updatedAt: t.integer().notNull(),
  lastActiveAt: t.integer(),
}));

export const tokens = onchainTable("tokens", (t) => ({
  ca: t.hex().primaryKey(),
  name: t.text(),
  symbol: t.text(),
  decimals: t.integer(),
  categories: t.text(),
  description: t.text(),
  image: t.text(),
  imageSmall: t.text(),
  imageThumb: t.text(),
  marketCapRank: t.integer(),
  marketData: t.text(),
  createdAt: t.integer().notNull(),
  updatedAt: t.integer().notNull(),
}));

export const notificationQueue = onchainTable("notification_queue", (t) => ({
  id: t.text().primaryKey(),
  userId: t.integer().notNull(),
  type: t.text().notNull(),
  notificationId: t.text(),
  title: t.text().notNull(),
  body: t.text().notNull(),
  targetUrl: t.text(),
  status: t.text().default("PENDING"),
  retryCount: t.integer().default(0),
  scheduledFor: t.integer().notNull(),
  sentAt: t.integer(),
  errorMessage: t.text(),
  createdAt: t.integer().notNull(),
  updatedAt: t.integer().notNull(),
}));

export const priceSnapshots = onchainTable("price_snapshots", (t) => ({
  id: t.text().primaryKey(),
  tokenAddress: t.hex().notNull(),
  marketCap: t.text().notNull(),
  price: t.text().notNull(),
  volume24h: t.text(),
  createdAt: t.integer().notNull(),
  snapshotAt: t.integer().notNull(),
}));
