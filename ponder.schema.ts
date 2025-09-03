import { onchainTable } from "ponder";

export const signals = onchainTable("signals", (t) => ({
  fid: t.integer().notNull(),
  ca: t.hex().notNull(), // Contract address
  direction: t.boolean().notNull(), // false = DOWN, true = UP
  duration: t.integer().notNull(), // Duration in days
  timestamp: t.bigint().notNull(), // Block timestamp when signal was created
  block_number: t.bigint().notNull(),
  status: t.integer().notNull().default(0), // 0 = active, 1 = won, 2 = lost
  expires_at: t.bigint().notNull(), // When the signal expires
  id: t.hex().notNull().primaryKey(),
}));

export const fid_stats = onchainTable("fid_stats", (t) => ({
  fid: t.integer().primaryKey(),
  total_signals: t.integer().notNull().default(0),
  active_signals: t.integer().notNull().default(0),
  won_signals: t.integer().notNull().default(0),
  lost_signals: t.integer().notNull().default(0),
  block_number: t.bigint().notNull(),
  transaction_hash: t.hex().notNull(),
}));

export const wallet_authorizations = onchainTable(
  "wallet_authorizations",
  (t) => ({
    id: t.text().primaryKey(),
    fid: t.integer().notNull(),
    wallet: t.hex().notNull(),
    block_number: t.bigint().notNull(),
    transaction_hash: t.hex().notNull(),
  })
);

export const daily_signal_counts = onchainTable("daily_signal_counts", (t) => ({
  id: t.text().primaryKey(), // Format: "{fid}-{day}"
  fid: t.integer().notNull(),
  day: t.bigint().notNull(), // Day number since deployment
  count: t.integer().notNull(),
  block_number: t.bigint().notNull(),
  transaction_hash: t.hex().notNull(),
}));

export const fid_bans = onchainTable("fid_bans", (t) => ({
  id: t.text().primaryKey(),
  fid: t.integer().notNull(),
  banned: t.boolean().notNull(),
  block_number: t.bigint().notNull(),
  transaction_hash: t.hex().notNull(),
}));

export const wallet_bans = onchainTable("wallet_bans", (t) => ({
  id: t.text().primaryKey(),
  wallet: t.hex().notNull(),
  banned: t.boolean().notNull(),
  block_number: t.bigint().notNull(),
  transaction_hash: t.hex().notNull(),
}));

export const users = onchainTable("users", (t) => ({
  fid: t.integer().primaryKey(),
  username: t.text(),
  display_name: t.text(),
  pfp_url: t.text(),
  is_verified: t.boolean().default(false),
  follower_count: t.integer().default(0),
  following_count: t.integer().default(0),
  mfs_score: t.real().default(0),
  win_rate: t.real().default(0),
  total_signals: t.integer().default(0),
  active_signals: t.integer().default(0),
  settled_signals: t.integer().default(0),
  total_score: t.real().default(0),
  rank: t.integer(),
  last_score_update: t.bigint(),
  role: t.text().default("USER"),
  is_banned: t.boolean().default(false),
  banned_at: t.bigint(),
  notifications_enabled: t.boolean().default(true),
  notification_token: t.text(),
  notification_url: t.text(),
  last_signal_date: t.text(),
  state_on_the_system: t.text().default("ACTIVE"),
  wallet_address: t.hex(),
  jbm_balance: t.text().default("0"),
  is_subscriber: t.boolean().default(false),
  subscription_expires_at: t.bigint(),
  subscribed_at: t.bigint(),
  created_at: t.bigint().notNull(),
  updated_at: t.bigint().notNull(),
  last_active_at: t.bigint(),
}));

export const tokens = onchainTable("tokens", (t) => ({
  ca: t.hex().primaryKey(),
  name: t.text(),
  symbol: t.text(),
  decimals: t.integer(),
  categories: t.text(),
  description: t.text(),
  image: t.text(),
  image_small: t.text(),
  image_thumb: t.text(),
  market_cap_rank: t.integer(),
  market_data: t.text(),
  created_at: t.bigint().notNull(),
  updated_at: t.bigint().notNull(),
}));

export const notification_queue = onchainTable("notification_queue", (t) => ({
  id: t.text().primaryKey(),
  user_id: t.integer().notNull(),
  type: t.text().notNull(),
  notification_id: t.text(),
  title: t.text().notNull(),
  body: t.text().notNull(),
  target_url: t.text(),
  status: t.text().default("PENDING"),
  retry_count: t.integer().default(0),
  scheduled_for: t.bigint().notNull(),
  sent_at: t.bigint(),
  error_message: t.text(),
  created_at: t.bigint().notNull(),
  updated_at: t.bigint().notNull(),
}));

export const price_snapshots = onchainTable("price_snapshots", (t) => ({
  id: t.text().primaryKey(),
  token_address: t.hex().notNull(),
  market_cap: t.text().notNull(),
  price: t.text().notNull(),
  volume_24h: t.text(),
  created_at: t.bigint().notNull(),
  snapshot_at: t.bigint().notNull(),
}));
