import { db } from "ponder:api";
import { Hono } from "hono";
import { sql } from "ponder";
import {
  signals,
  wallet_authorizations,
  daily_signal_counts,
  fid_bans,
  wallet_bans,
  signal_manual_updates,
  backend_signer_updates,
  resolver_updates,
  fid_total_mfs,
  signal_resolutions,
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
      .where(sql`resolved = false AND expires_at > ${Date.now() / 1000}`);

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
      .where(sql`created_at > ${Math.floor(Date.now() / 1000) - 86400}`);

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

// Get signal details by ID
app.get("/signals/:id", apiKeyAuth, async (c) => {
  try {
    const signalId = parseInt(c.req.param("id"));

    if (isNaN(signalId)) {
      return c.json({ error: "Invalid signal ID" }, 400);
    }

    const signal = await db
      .select()
      .from(signals)
      .where(sql`signal_id = ${signalId}`)
      .limit(1);

    if (signal.length === 0) {
      return c.json({ error: "Signal not found" }, 404);
    }

    return c.json({ signal: signal[0] });
  } catch (error) {
    console.error("Error fetching signal:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get user's MFS score
app.get("/users/:fid/mfs", apiKeyAuth, async (c) => {
  try {
    const fid = parseInt(c.req.param("fid"));

    if (isNaN(fid)) {
      return c.json({ error: "Invalid FID" }, 400);
    }

    const mfsData = await db
      .select()
      .from(fid_total_mfs)
      .where(sql`fid = ${fid}`)
      .limit(1);

    if (mfsData.length === 0) {
      return c.json({
        fid,
        total_mfs: "0",
        last_updated_block: 0,
        last_updated_tx: "0x",
      });
    }

    return c.json({ mfs: mfsData[0] });
  } catch (error) {
    console.error("Error fetching MFS data:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get manual updates for a signal
app.get("/signals/:id/manual-updates", apiKeyAuth, async (c) => {
  try {
    const signalId = parseInt(c.req.param("id"));

    if (isNaN(signalId)) {
      return c.json({ error: "Invalid signal ID" }, 400);
    }

    const manualUpdates = await db
      .select()
      .from(signal_manual_updates)
      .where(sql`signal_id = ${signalId}`)
      .orderBy(sql`block_number DESC`);

    return c.json({ manualUpdates });
  } catch (error) {
    console.error("Error fetching manual updates:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get admin changes (backend signer and resolver updates)
app.get("/admin/changes", apiKeyAuth, async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");

    // Get backend signer updates
    const signerUpdates = await db
      .select()
      .from(backend_signer_updates)
      .orderBy(sql`block_number DESC`)
      .limit(limit)
      .offset(offset);

    // Get resolver updates
    const resolverUpdates = await db
      .select()
      .from(resolver_updates)
      .orderBy(sql`block_number DESC`)
      .limit(limit)
      .offset(offset);

    return c.json({
      signerUpdates,
      resolverUpdates,
      pagination: {
        limit,
        offset,
        hasMore:
          signerUpdates.length === limit || resolverUpdates.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching admin changes:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get signal resolutions
app.get("/signals/:id/resolutions", apiKeyAuth, async (c) => {
  try {
    const signalId = parseInt(c.req.param("id"));

    if (isNaN(signalId)) {
      return c.json({ error: "Invalid signal ID" }, 400);
    }

    const resolutions = await db
      .select()
      .from(signal_resolutions)
      .where(sql`signal_id = ${signalId}`)
      .orderBy(sql`block_number DESC`);

    return c.json({ resolutions });
  } catch (error) {
    console.error("Error fetching signal resolutions:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get user's signals with pagination
app.get("/users/:fid/signals", apiKeyAuth, async (c) => {
  try {
    const fid = parseInt(c.req.param("fid"));
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");
    const resolved = c.req.query("resolved"); // optional filter

    if (isNaN(fid)) {
      return c.json({ error: "Invalid FID" }, 400);
    }

    // Build where conditions
    const whereConditions = [sql`fid = ${fid}`];
    if (resolved !== undefined) {
      const isResolved = resolved === "true";
      whereConditions.push(sql`resolved = ${isResolved}`);
    }

    const userSignals = await db
      .select()
      .from(signals)
      .where(sql`${sql.join(whereConditions, sql` AND `)}`)
      .orderBy(sql`created_at DESC`)
      .limit(limit)
      .offset(offset);

    return c.json({
      signals: userSignals,
      pagination: {
        limit,
        offset,
        hasMore: userSignals.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching user signals:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get last 50 signals (open API - no authentication required)
app.get("/signals", async (c) => {
  try {
    const recentSignals = await db
      .select()
      .from(signals)
      .orderBy(sql`expires_at DESC`)
      .limit(50);

    return c.json({ signals: recentSignals });
  } catch (error) {
    console.error("Error fetching signals:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
