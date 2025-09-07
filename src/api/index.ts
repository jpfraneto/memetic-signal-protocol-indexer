import { db } from "ponder:api";
import { Hono } from "hono";
import { sql } from "ponder";
import {
  signals,
  wallet_authorizations,
  daily_signal_counts,
  fid_bans,
  wallet_bans,
  fid_stats,
} from "ponder:schema";

const app = new Hono();

// Middleware for API key authentication
const apiKeyAuth = async (c: any, next: any) => {
  const apiKey = c.req.header("x-api-key");
  const expectedApiKey = process.env.API_KEY;

  if (!expectedApiKey) {
    return c.json({ error: "API key not configured" }, 500);
  }

  if (!apiKey || apiKey !== expectedApiKey) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
};

// System state endpoint
app.get("/system-state", apiKeyAuth, async (c) => {
  try {
    // Get total active signals
    const activeSignalsResult = await db
      .select({ count: sql`count(*)` })
      .from(signals)
      .where(sql`status = 0 AND expires_at > ${Date.now() / 1000}`);

    const activeSignalsCount = Number(activeSignalsResult[0]?.count || 0);

    // Get total signals
    const totalSignalsResult = await db
      .select({ count: sql`count(*)` })
      .from(signals);

    const totalSignalsCount = Number(totalSignalsResult[0]?.count || 0);

    // Get unique users count
    const uniqueUsersResult = await db
      .select({ count: sql`count(distinct fid)` })
      .from(signals);

    const uniqueUsersCount = Number(uniqueUsersResult[0]?.count || 0);

    // Get authorized wallets count
    const authorizedWalletsResult = await db
      .select({ count: sql`count(*)` })
      .from(wallet_authorizations);

    const authorizedWalletsCount = Number(
      authorizedWalletsResult[0]?.count || 0
    );

    // Get banned FIDs count
    const bannedFidsResult = await db
      .select({ count: sql`count(distinct fid)` })
      .from(fid_bans)
      .where(sql`banned = true`);

    const bannedFidsCount = Number(bannedFidsResult[0]?.count || 0);

    // Get banned wallets count
    const bannedWalletsResult = await db
      .select({ count: sql`count(distinct wallet)` })
      .from(wallet_bans)
      .where(sql`banned = true`);

    const bannedWalletsCount = Number(bannedWalletsResult[0]?.count || 0);

    // Get today's signals count
    const currentDay = Math.floor((Date.now() / 1000 - 1735689600) / 86400); // Using deployment timestamp
    const todaySignalsResult = await db
      .select({ count: sql`sum(count)` })
      .from(daily_signal_counts)
      .where(sql`day = ${currentDay}`);

    const todaySignalsCount = Number(todaySignalsResult[0]?.count || 0);

    // Get recent signal activity (last 24 hours)
    const recent24hResult = await db
      .select({ count: sql`count(*)` })
      .from(signals)
      .where(sql`timestamp > ${Math.floor(Date.now() / 1000) - 86400}`);

    const recent24hCount = Number(recent24hResult[0]?.count || 0);

    return c.json({
      timestamp: Math.floor(Date.now() / 1000),
      systemState: {
        signals: {
          active: activeSignalsCount,
          total: totalSignalsCount,
          today: todaySignalsCount,
          last24h: recent24hCount,
        },
        users: {
          unique: uniqueUsersCount,
          authorizedWallets: authorizedWalletsCount,
          bannedFids: bannedFidsCount,
          bannedWallets: bannedWalletsCount,
        },
        system: {
          currentDay,
          deploymentTimestamp: 1735689600,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching system state:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
