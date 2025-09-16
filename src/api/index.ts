import { db } from "ponder:api";
import { Hono } from "hono";
import { sql } from "ponder";
import { signals, fid_total_mfs } from "ponder:schema";

const app = new Hono();

// Dashboard data endpoint (password protected)
app.post("/data", async (c) => {
  try {
    const body = await c.req.json();
    const { password } = body;
    console.log("THE PASSWORD IS", password);

    if (password !== "seacasa") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get total signals count
    const totalSignalsResult = await db
      .select({ count: sql`count(*)` })
      .from(signals);
    const totalSignals = Number(totalSignalsResult[0]?.count || 0);

    // Get resolved signals count
    const resolvedSignalsResult = await db
      .select({ count: sql`count(*)` })
      .from(signals)
      .where(sql`resolved = true`);
    const resolvedSignals = Number(resolvedSignalsResult[0]?.count || 0);

    // Get correct signals (wins) count
    const correctSignalsResult = await db
      .select({ count: sql`count(*)` })
      .from(signals)
      .where(sql`resolved = true AND mfs_delta > 0`);
    const correctSignals = Number(correctSignalsResult[0]?.count || 0);

    // Get signals without historical token data (resolution errors)
    const noHistoricalDataResult = await db
      .select({ count: sql`count(*)` })
      .from(signals)
      .where(sql`resolution_error = true`);
    const noHistoricalData = Number(noHistoricalDataResult[0]?.count || 0);

    // Get active signals count
    const activeSignalsResult = await db
      .select({ count: sql`count(*)` })
      .from(signals)
      .where(sql`resolved = false AND expires_at > ${Date.now() / 1000}`);
    const activeSignals = Number(activeSignalsResult[0]?.count || 0);

    // Get most signaled tokens
    const mostSignaledTokensResult = await db
      .select({
        ca: signals.ca,
        count: sql`count(*) as signal_count`,
      })
      .from(signals)
      .groupBy(signals.ca)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    // Get token symbols for the most signaled tokens
    const tokenAddresses = mostSignaledTokensResult.map((row) => row.ca);
    let tokenDetails: any[] = [];

    if (tokenAddresses.length > 0) {
      const { tokens } = await import("ponder:schema");
      tokenDetails = await db
        .select()
        .from(tokens)
        .where(sql`ca IN (${sql.join(tokenAddresses, sql`,`)})`);
    }

    // Merge token details with signal counts
    const mostSignaledTokens = mostSignaledTokensResult.map((signalData) => {
      const tokenInfo = tokenDetails.find(
        (token) => token.ca === signalData.ca
      );
      return {
        address: signalData.ca,
        symbol: tokenInfo?.symbol || "UNKNOWN",
        name: tokenInfo?.name || "Unknown Token",
        signalCount: Number(signalData.count),
      };
    });

    // Get top users by MFS
    const topUsersByMfsResult = await db
      .select()
      .from(fid_total_mfs)
      .orderBy(sql`CAST(total_mfs AS INTEGER) DESC`)
      .limit(10);

    // Get recent activity (last 24 hours)
    const recentActivityResult = await db
      .select({ count: sql`count(*)` })
      .from(signals)
      .where(sql`created_at > ${Math.floor(Date.now() / 1000) - 86400}`);
    const recentActivity = Number(recentActivityResult[0]?.count || 0);

    // Get unique users count
    const uniqueUsersResult = await db
      .select({ count: sql`count(distinct fid)` })
      .from(signals);
    const uniqueUsers = Number(uniqueUsersResult[0]?.count || 0);

    // Get average MFS delta for resolved signals
    const avgMfsDeltaResult = await db
      .select({ avg: sql`avg(mfs_delta)` })
      .from(signals)
      .where(sql`resolved = true AND mfs_delta IS NOT NULL`);
    const avgMfsDelta = Number(avgMfsDeltaResult[0]?.avg || 0);

    return c.json({
      timestamp: Date.now(),
      metrics: {
        signals: {
          total: totalSignals,
          resolved: resolvedSignals,
          correct: correctSignals,
          active: activeSignals,
          noHistoricalData: noHistoricalData,
          recent24h: recentActivity,
        },
        users: {
          unique: uniqueUsers,
          topByMfs: topUsersByMfsResult,
        },
        tokens: {
          mostSignaled: mostSignaledTokens,
        },
        performance: {
          winRate:
            totalSignals > 0
              ? ((correctSignals / resolvedSignals) * 100).toFixed(2)
              : "0.00",
          avgMfsDelta: avgMfsDelta.toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Serve dashboard HTML
app.get("/", async (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Memetic Signal Protocol - Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }

        .mobile-only {
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            text-align: center;
            padding: 2rem;
        }

        .mobile-only h1 {
            font-size: 2.5rem;
            color: white;
            margin-bottom: 1rem;
        }

        .mobile-only a {
            color: #ffeb3b;
            text-decoration: underline;
            font-weight: bold;
        }

        .mobile-only a:hover {
            color: #fff59d;
        }

        .desktop-content {
            display: block;
        }

        .login-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 2rem;
        }

        .login-box {
            background: white;
            padding: 3rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            width: 100%;
        }

        .login-box h1 {
            margin-bottom: 2rem;
            color: #333;
            font-size: 1.8rem;
        }

        .login-box input {
            width: 100%;
            padding: 1rem;
            border: 2px solid #ddd;
            border-radius: 10px;
            margin-bottom: 1rem;
            font-size: 1rem;
        }

        .login-box button {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1rem;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .login-box button:hover {
            transform: translateY(-2px);
        }

        .error {
            color: #f44336;
            margin-top: 1rem;
        }

        .dashboard {
            display: none;
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
        }

        .dashboard h1 {
            text-align: center;
            color: white;
            margin-bottom: 2rem;
            font-size: 2.5rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .metric-card {
            background: white;
            padding: 1.5rem;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }

        .metric-card:hover {
            transform: translateY(-5px);
        }

        .metric-title {
            font-size: 0.9rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 0.5rem;
        }

        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: #333;
            margin-bottom: 0.5rem;
        }

        .metric-subtitle {
            font-size: 0.8rem;
            color: #999;
        }

        .tokens-section, .users-section {
            background: white;
            padding: 1.5rem;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }

        .section-title {
            font-size: 1.5rem;
            color: #333;
            margin-bottom: 1rem;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 0.5rem;
        }

        .token-item, .user-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid #f5f5f5;
        }

        .token-item:last-child, .user-item:last-child {
            border-bottom: none;
        }

        .token-info, .user-info {
            flex: 1;
        }

        .token-symbol, .user-fid {
            font-weight: bold;
            color: #333;
        }

        .token-name, .user-mfs {
            color: #666;
            font-size: 0.9rem;
        }

        .signal-count, .mfs-score {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: bold;
        }

        .refresh-btn {
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: rgba(255,255,255,0.2);
            color: white;
            border: 2px solid rgba(255,255,255,0.3);
            padding: 0.7rem 1.5rem;
            border-radius: 25px;
            cursor: pointer;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }

        .refresh-btn:hover {
            background: rgba(255,255,255,0.3);
            border-color: rgba(255,255,255,0.5);
        }

        .loading {
            text-align: center;
            color: white;
            font-size: 1.2rem;
        }

        @media (max-width: 768px) {
            .mobile-only {
                display: flex;
            }
            .desktop-content {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="mobile-only">
        <h1>DESKTOP ONLY</h1>
        <button style="background: transparent; border: 2px solid white; color: white; padding: 1rem 2rem; border-radius: 10px; font-size: 1.1rem; cursor: pointer;">
            <a href="#" style="color: inherit; text-decoration: none;">read about the memetic signal protocol <span style="text-decoration: underline;">here</span></a>
        </button>
    </div>

    <div class="desktop-content">
        <div class="login-container" id="loginContainer">
            <div class="login-box">
                <h1>Memetic Signal Protocol<br/>Dashboard</h1>
                <input type="password" id="passwordInput" placeholder="Enter password..." />
                <button onclick="login()">Access Dashboard</button>
                <div id="loginError" class="error"></div>
            </div>
        </div>

        <div class="dashboard" id="dashboard">
            <button class="refresh-btn" onclick="refreshData()">Refresh Data</button>
            <h1>Memetic Signal Protocol Dashboard</h1>
            <div id="dashboardContent" class="loading">Loading dashboard data...</div>
        </div>
    </div>

    <script>
        let dashboardData = null;

        async function login() {
            const password = document.getElementById('passwordInput').value;
            const errorDiv = document.getElementById('loginError');
            
            if (!password) {
                errorDiv.textContent = 'Please enter a password';
                return;
            }

            try {
                const response = await fetch('/api/data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ password })
                });

                if (response.ok) {
                    dashboardData = await response.json();
                    document.getElementById('loginContainer').style.display = 'none';
                    document.getElementById('dashboard').style.display = 'block';
                    renderDashboard();
                } else {
                    errorDiv.textContent = 'Invalid password';
                }
            } catch (error) {
                errorDiv.textContent = 'Error connecting to server';
            }
        }

        async function refreshData() {
            const password = 'seacasa'; // We know it's correct at this point
            try {
                const response = await fetch('/api/data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ password })
                });

                if (response.ok) {
                    dashboardData = await response.json();
                    renderDashboard();
                }
            } catch (error) {
                console.error('Error refreshing data:', error);
            }
        }

        function renderDashboard() {
            if (!dashboardData) return;

            const { metrics } = dashboardData;
            
            const html = \`
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-title">Total Signals</div>
                        <div class="metric-value">\${metrics.signals.total.toLocaleString()}</div>
                        <div class="metric-subtitle">All time signals created</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-title">Resolved Signals</div>
                        <div class="metric-value">\${metrics.signals.resolved.toLocaleString()}</div>
                        <div class="metric-subtitle">Completed predictions</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-title">Correct Signals</div>
                        <div class="metric-value">\${metrics.signals.correct.toLocaleString()}</div>
                        <div class="metric-subtitle">Winning predictions</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-title">Active Signals</div>
                        <div class="metric-value">\${metrics.signals.active.toLocaleString()}</div>
                        <div class="metric-subtitle">Currently running</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-title">Missing Data</div>
                        <div class="metric-value">\${metrics.signals.noHistoricalData.toLocaleString()}</div>
                        <div class="metric-subtitle">No historical token data</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-title">24h Activity</div>
                        <div class="metric-value">\${metrics.signals.recent24h.toLocaleString()}</div>
                        <div class="metric-subtitle">Signals created today</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-title">Win Rate</div>
                        <div class="metric-value">\${metrics.performance.winRate}%</div>
                        <div class="metric-subtitle">Overall accuracy</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-title">Unique Users</div>
                        <div class="metric-value">\${metrics.users.unique.toLocaleString()}</div>
                        <div class="metric-subtitle">Active participants</div>
                    </div>
                </div>

                <div class="tokens-section">
                    <h2 class="section-title">Most Signaled Tokens</h2>
                    \${metrics.tokens.mostSignaled.map(token => \`
                        <div class="token-item">
                            <div class="token-info">
                                <div class="token-symbol">\${token.symbol}</div>
                                <div class="token-name">\${token.name}</div>
                            </div>
                            <div class="signal-count">\${token.signalCount} signals</div>
                        </div>
                    \`).join('')}
                </div>

                <div class="users-section">
                    <h2 class="section-title">Top Users by MFS Score</h2>
                    \${metrics.users.topByMfs.map((user, index) => \`
                        <div class="user-item">
                            <div class="user-info">
                                <div class="user-fid">#\${index + 1} - FID: \${user.fid}</div>
                                <div class="user-mfs">Memetic Footprint Score</div>
                            </div>
                            <div class="mfs-score">\${Number(user.total_mfs).toLocaleString()}</div>
                        </div>
                    \`).join('')}
                </div>
            \`;

            document.getElementById('dashboardContent').innerHTML = html;
        }

        // Allow Enter key to login
        document.getElementById('passwordInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    </script>
</body>
</html>`;

  return c.html(html);
});

export default app;
