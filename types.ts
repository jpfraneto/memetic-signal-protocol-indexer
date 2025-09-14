export interface User {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  mfsScore: number;
  winRate: number;
  totalSignals: number;
  activeSignals: number;
  settledSignals: number;
  totalScore: number;
  rank?: number;
  lastScoreUpdate?: number;
  role: string;
  isBanned: boolean;
  bannedAt?: number;
  notificationsEnabled: boolean;
  notificationToken?: string;
  notificationUrl?: string;
  lastSignalDate?: string;
  stateOnTheSystem: string;
  walletAddress?: string;
  subscribedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt?: Date;
}

export interface Token {
  ca: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  categories?: string;
  description?: string;
  image?: string;
  imageSmall?: string;
  imageThumb?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationQueue {
  id: string;
  userId: number;
  type: string;
  notificationId?: string;
  title: string;
  body: string;
  targetUrl?: string;
  status: string;
  retryCount: number;
  scheduledFor: Date;
  sentAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceSnapshot {
  id: string;
  tokenAddress: string;
  marketCap: string;
  price: string;
  volume24h?: string;
  createdAt: Date;
  snapshotAt: Date;
}
