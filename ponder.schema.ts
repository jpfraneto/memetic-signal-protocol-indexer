import { onchainTable, relations } from "ponder";

export const signals = onchainTable("signals", (t) => ({
  signal_id: t.integer().notNull().primaryKey(), // Signal ID from contract
  transaction_hash: t.hex().notNull(),
  fid: t.integer().notNull(),
  ca: t.hex().notNull(), // Token contract address being predicted
  direction: t.boolean().notNull(), // false = DOWN, true = UP
  duration_days: t.integer().notNull(), // Duration in days (uint32)
  entry_market_cap: t.bigint().notNull(), // Market cap in USD when signal created (uint256)
  created_at: t.bigint().notNull(), // uint64 timestamp from contract
  expires_at: t.bigint().notNull(), // uint64 timestamp from contract
  timestamp: t.date().notNull(), // Block timestamp when signal was created
  block_number: t.bigint().notNull(),
  resolved: t.boolean().notNull().default(false), // Whether signal has been resolved
  mfs_delta: t.integer().default(0), // int256 MFS delta applied
  manually_updated: t.boolean().notNull().default(false), // Whether owner has manually updated this signal
  exit_market_cap: t.bigint(), // Market cap at signal resolution time
  resolution_attempts: t.text(), // JSON array of attempted data sources during
  data_sources: t.text(), // JSON array of data sources used for resolution
  resolution_error: t.boolean().notNull().default(false), // Whether signal resolution failed
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
  day: t.integer().notNull(), // Day number since deployment
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

export const signal_resolutions = onchainTable("signal_resolutions", (t) => ({
  id: t.text().primaryKey(), // "{signalId}-{blockNumber}"
  signal_id: t.integer().notNull(),
  fid: t.integer().notNull(),
  mfs_delta: t.integer().notNull(), // int256 as string
  new_total_mfs: t.text().notNull(), // int256 as string
  block_number: t.bigint().notNull(),
  transaction_hash: t.hex().notNull(),
}));

export const signal_manual_updates = onchainTable(
  "signal_manual_updates",
  (t) => ({
    id: t.text().primaryKey(), // "{signalId}-{blockNumber}"
    signal_id: t.integer().notNull(),
    fid: t.integer().notNull(),
    old_entry_market_cap: t.bigint().notNull(), // uint256 as string
    new_entry_market_cap: t.bigint().notNull(), // uint256 as string
    old_mfs_delta: t.integer().notNull(), // int256 as string
    new_mfs_delta: t.integer().notNull(), // int256 as string
    new_total_mfs: t.integer().notNull(), // int256 as string
    reason: t.text().notNull(), // Human-readable reason for the manual update
    block_number: t.bigint().notNull(),
    transaction_hash: t.hex().notNull(),
  })
);

export const fid_total_mfs = onchainTable("fid_total_mfs", (t) => ({
  fid: t.integer().primaryKey(),
  total_mfs: t.text().notNull().default("0"), // int256 as string
  last_updated_block: t.bigint().notNull(),
  last_updated_tx: t.hex().notNull(),
}));

export const wallet_unauthorizations = onchainTable(
  "wallet_unauthorizations",
  (t) => ({
    id: t.text().primaryKey(),
    wallet: t.hex().notNull(),
    block_number: t.bigint().notNull(),
    transaction_hash: t.hex().notNull(),
  })
);

export const backend_signer_updates = onchainTable(
  "backend_signer_updates",
  (t) => ({
    id: t.text().primaryKey(), // "{blockNumber}-{transactionIndex}"
    old_signer: t.hex().notNull(),
    new_signer: t.hex().notNull(),
    block_number: t.bigint().notNull(),
    transaction_hash: t.hex().notNull(),
  })
);

export const resolver_updates = onchainTable("resolver_updates", (t) => ({
  id: t.text().primaryKey(), // "{blockNumber}-{transactionIndex}"
  old_resolver: t.hex().notNull(),
  new_resolver: t.hex().notNull(),
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
  banned_at: t.date(),
  notifications_enabled: t.boolean().default(true),
  notification_token: t.text(),
  notification_url: t.text(),
  last_signal_date: t.text(),
  state_on_the_system: t.text().default("ACTIVE"),
  wallet_address: t.hex(),
  jbm_balance: t.text().default("0"),
  is_subscriber: t.boolean().default(false),
  subscription_expires_at: t.date(),
  subscribed_at: t.date(),
  created_at: t.date().notNull(),
  updated_at: t.date().notNull(),
  last_active_at: t.date(),
}));

export const tokens = onchainTable("tokens", (t) => ({
  ca: t.hex().primaryKey(),
  name: t.text(),
  symbol: t.text(),
  decimals: t.integer(),
  image: t.text(),
  created_at: t.date().notNull(),
  updated_at: t.date().notNull(),
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
  scheduled_for: t.date().notNull(),
  sent_at: t.date(),
  error_message: t.text(),
  created_at: t.date().notNull(),
  updated_at: t.date().notNull(),
}));

export const price_snapshots = onchainTable("price_snapshots", (t) => ({
  id: t.text().primaryKey(),
  token_address: t.hex().notNull(),
  market_cap: t.text().notNull(),
  price: t.text().notNull(),
  volume_24h: t.text(),
  created_at: t.date().notNull(),
  snapshot_at: t.date().notNull(),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  signals: many(signals),
  fid_stats: one(fid_stats, {
    fields: [users.fid],
    references: [fid_stats.fid],
  }),
  wallet_authorizations: many(wallet_authorizations),
  daily_signal_counts: many(daily_signal_counts),
  fid_bans: many(fid_bans),
  notifications: many(notification_queue),
}));

export const signalsRelations = relations(signals, ({ one }) => ({
  user: one(users, { fields: [signals.fid], references: [users.fid] }),
  token: one(tokens, { fields: [signals.ca], references: [tokens.ca] }),
}));

export const tokensRelations = relations(tokens, ({ many }) => ({
  signals: many(signals),
  price_snapshots: many(price_snapshots),
}));

export const fidStatsRelations = relations(fid_stats, ({ one }) => ({
  user: one(users, { fields: [fid_stats.fid], references: [users.fid] }),
}));

export const walletAuthorizationsRelations = relations(
  wallet_authorizations,
  ({ one }) => ({
    user: one(users, {
      fields: [wallet_authorizations.fid],
      references: [users.fid],
    }),
  })
);

export const dailySignalCountsRelations = relations(
  daily_signal_counts,
  ({ one }) => ({
    user: one(users, {
      fields: [daily_signal_counts.fid],
      references: [users.fid],
    }),
  })
);

export const fidBansRelations = relations(fid_bans, ({ one }) => ({
  user: one(users, { fields: [fid_bans.fid], references: [users.fid] }),
}));

export const notificationQueueRelations = relations(
  notification_queue,
  ({ one }) => ({
    user: one(users, {
      fields: [notification_queue.user_id],
      references: [users.fid],
    }),
  })
);

export const priceSnapshotsRelations = relations(
  price_snapshots,
  ({ one }) => ({
    token: one(tokens, {
      fields: [price_snapshots.token_address],
      references: [tokens.ca],
    }),
  })
);

export const signalResolutionsRelations = relations(
  signal_resolutions,
  ({ one }) => ({
    signal: one(signals, {
      fields: [signal_resolutions.signal_id],
      references: [signals.signal_id],
    }),
    user: one(users, {
      fields: [signal_resolutions.fid],
      references: [users.fid],
    }),
  })
);

export const fidTotalMfsRelations = relations(fid_total_mfs, ({ one }) => ({
  user: one(users, {
    fields: [fid_total_mfs.fid],
    references: [users.fid],
  }),
}));

export const walletUnauthorizationsRelations = relations(
  wallet_unauthorizations,
  ({ one }) => ({
    // Note: Can't directly relate to users since we only have wallet address
  })
);

export const signalManualUpdatesRelations = relations(
  signal_manual_updates,
  ({ one }) => ({
    signal: one(signals, {
      fields: [signal_manual_updates.signal_id],
      references: [signals.signal_id],
    }),
    user: one(users, {
      fields: [signal_manual_updates.fid],
      references: [users.fid],
    }),
  })
);

export const backendSignerUpdatesRelations = relations(
  backend_signer_updates,
  ({ one }) => ({
    // No direct relations needed for admin updates
  })
);

export const resolverUpdatesRelations = relations(
  resolver_updates,
  ({ one }) => ({
    // No direct relations needed for admin updates
  })
);
