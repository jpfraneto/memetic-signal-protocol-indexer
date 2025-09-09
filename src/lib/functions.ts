import { Token } from "../../types";

const COINGECKO_API_URL = "https://pro-api.coingecko.com/api/v3";
const BASE_NETWORK_PLATFORM_ID = "base";
const REQUEST_DELAY = 1200; // 1.2 seconds between requests

let lastRequestTime = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise((resolve) =>
      setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest)
    );
  }
  lastRequestTime = Date.now();
}

async function fetchTokenMetadata(ca: string): Promise<any> {
  try {
    await rateLimit();
    const coinDataUrl = `${COINGECKO_API_URL}/coins/base/contract/${ca}`;

    const coinDataResponse = await fetch(coinDataUrl, {
      headers: {
        accept: "application/json",
        "x-cg-pro-api-key": process.env.COINGECKO_API_KEY || "",
      },
    });

    if (coinDataResponse.ok) {
      const coinData = await coinDataResponse.json();
      return coinData;
    } else if (coinDataResponse.status === 429) {
      console.warn("CoinGecko rate limit hit, waiting longer...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return await fetchTokenMetadata(ca); // Retry once
    } else {
      console.warn(
        `CoinGecko metadata fetch failed for ${ca}:`,
        coinDataResponse.status
      );
      return null;
    }
  } catch (error) {
    console.error(`Failed to fetch token metadata for ${ca}:`, error);
    return null;
  }
}

async function fetchHistoricalMarketData(
  coinId: string,
  timestamp: Date
): Promise<{ price: number; marketCap: number }> {
  try {
    await rateLimit();

    // Convert timestamp to Unix timestamp (in seconds)
    const unixTimestamp = Math.floor(timestamp.getTime() / 1000);
    // Add a small buffer (1 hour) to ensure we get data around that time
    const fromTimestamp = unixTimestamp - 3600;
    const toTimestamp = unixTimestamp + 3600;

    const url = `${COINGECKO_API_URL}/coins/${coinId}/market_chart/range?vs_currency=usd&from=${fromTimestamp}&to=${toTimestamp}`;
    console.log("Fetching historical market data from:", url);

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "x-cg-pro-api-key": process.env.COINGECKO_API_KEY || "",
      },
    });

    if (response.ok) {
      const data = (await response.json()) as any;

      if (
        data.prices &&
        data.prices.length > 0 &&
        data.market_caps &&
        data.market_caps.length > 0
      ) {
        // Find the data point closest to our target timestamp
        let closestPrice = data.prices[0];
        let closestMarketCap = data.market_caps[0];
        let closestTimeDiff = Math.abs(
          data.prices[0][0] - unixTimestamp * 1000
        );

        for (let i = 0; i < data.prices.length; i++) {
          const pricePoint = data.prices[i];
          const marketCapPoint = data.market_caps[i];
          const timeDiff = Math.abs(pricePoint[0] - unixTimestamp * 1000);

          if (timeDiff < closestTimeDiff) {
            closestPrice = pricePoint;
            closestMarketCap = marketCapPoint;
            closestTimeDiff = timeDiff;
          }
        }

        console.log(
          `Historical data found for ${coinId} at ${timestamp}:`,
          `Price: ${closestPrice[1]}, Market Cap: ${closestMarketCap[1]}`
        );

        return {
          price: closestPrice[1],
          marketCap: closestMarketCap[1],
        };
      }
    } else if (response.status === 429) {
      console.warn("CoinGecko rate limit hit for historical market data");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return await fetchHistoricalMarketData(coinId, timestamp); // Retry once
    }

    console.warn(
      `No historical market data found for ${coinId} at ${timestamp}`
    );
    return { price: 0, marketCap: 0 };
  } catch (error) {
    console.error(
      `Failed to fetch historical market data for ${coinId}:`,
      error
    );
    return { price: 0, marketCap: 0 };
  }
}

async function fetchFromDexScreener(ca: string): Promise<any> {
  try {
    const dexScreenerUrl = `https://api.dexscreener.com/tokens/v1/base/${ca}`;
    console.log("Fetching from DexScreener:", dexScreenerUrl);

    const response = await fetch(dexScreenerUrl);

    if (!response.ok) {
      throw new Error(`DexScreener API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error("No token data found in DexScreener response");
    }

    const tokenData = data[0];

    // Transform DexScreener data to match CoinGecko format
    return {
      name: tokenData.baseToken?.name,
      symbol: tokenData.baseToken?.symbol,
      image: {
        large: tokenData.info?.imageUrl,
        small: tokenData.info?.imageUrl,
        thumb: tokenData.info?.imageUrl,
      },
      market_data: {
        current_price: {
          usd: parseFloat(tokenData.priceUsd) || 0,
        },
        market_cap: {
          usd: tokenData.marketCap || 0,
        },
      },
      detail_platforms: {
        base: {
          decimal_place: 18, // Default to 18 decimals for most ERC20 tokens
        },
      },
      categories: [],
      description: {
        en: `Token on Base network with symbol ${tokenData.baseToken?.symbol}`,
      },
    };
  } catch (error) {
    console.error(`Failed to fetch from DexScreener for ${ca}:`, error);
    throw error;
  }
}

export async function fetchTokenInformation(
  ca: string,
  timestamp: Date
): Promise<[Token, number]> {
  const normalizedAddress = ca.toLowerCase();

  try {
    console.log(
      `Fetching token information for ${normalizedAddress} at ${timestamp}`
    );

    // Step 1: Get token metadata from CoinGecko
    let coinData = await fetchTokenMetadata(normalizedAddress);

    // Step 2: If CoinGecko fails, try DexScreener as fallback
    if (!coinData) {
      console.log(
        `CoinGecko failed, trying DexScreener for ${normalizedAddress}`
      );
      try {
        coinData = await fetchFromDexScreener(normalizedAddress);
      } catch (error) {
        console.warn(
          `DexScreener also failed for ${normalizedAddress}:`,
          error
        );
        // Return default token data if both fail
        return [
          {
            name: "Unknown Token",
            symbol: "UNKNOWN",
            decimals: 18,
            categories: "Unknown",
            description: "Token data could not be fetched",
            image: "",
            imageSmall: "",
            imageThumb: "",
            marketData: JSON.stringify({ current_price: 0 }),
            createdAt: timestamp,
            updatedAt: timestamp,
            ca: normalizedAddress,
          },
          0,
        ];
      }
    }

    // Step 3: Get historical market data ONLY if we have a CoinGecko coin ID
    let historicalPrice = 0;
    let marketCapAtSignal = 0;

    if (coinData?.id) {
      const historicalData = await fetchHistoricalMarketData(
        coinData.id,
        timestamp
      );
      historicalPrice = historicalData.price;
      marketCapAtSignal = historicalData.marketCap;
    }
    // NO FALLBACK - if no historical data found, leave as 0

    // Step 5: Build token object
    const token: Token = {
      name: coinData?.name || "Unknown Token",
      symbol: coinData?.symbol || "UNKNOWN",
      decimals:
        parseInt(coinData?.detail_platforms?.base?.decimal_place?.toString()) ||
        18,
      categories: Array.isArray(coinData?.categories)
        ? coinData.categories.join(", ")
        : "Unknown",
      description:
        coinData?.description?.en ||
        `Token ${coinData?.symbol || "UNKNOWN"} on Base network`,
      image: coinData?.image?.large || "",
      imageSmall: coinData?.image?.small || "",
      imageThumb: coinData?.image?.thumb || "",
      marketData: JSON.stringify({
        current_price: historicalPrice,
        market_cap: marketCapAtSignal,
        price_at_signal: historicalPrice,
      }),
      createdAt: timestamp,
      updatedAt: timestamp,
      ca: normalizedAddress,
    };

    console.log(`Token information complete for ${normalizedAddress}:`, {
      name: token.name,
      symbol: token.symbol,
      priceAtSignal: historicalPrice,
      marketCap: marketCapAtSignal,
    });

    return [token, marketCapAtSignal];
  } catch (error) {
    console.error(
      `Failed to fetch token information for ${normalizedAddress}:`,
      error
    );

    // Return default token data on error
    return [
      {
        name: "Error Token",
        symbol: "ERROR",
        decimals: 18,
        categories: "Error",
        description: "Failed to fetch token data",
        image: "",
        imageSmall: "",
        imageThumb: "",
        marketData: JSON.stringify({ current_price: 0 }),
        createdAt: timestamp,
        updatedAt: timestamp,
        ca: normalizedAddress,
      },
      0,
    ];
  }
}

export async function fetchUserFromNeynar(fid: number): Promise<any> {
  try {
    const url = `https://api.neynar.com/v2/farcaster/user/bulk/?fids=${fid}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        api_key: process.env.NEYNAR_API_KEY || "",
        accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch user ${fid} from Neynar:`, response.status);
      return null;
    }

    const data = (await response.json()) as any;

    if (data.users && data.users.length > 0) {
      return data.users[0]; // Return the first user from the bulk response
    }

    return null;
  } catch (error) {
    console.error(`Error fetching user ${fid} from Neynar:`, error);
    return null;
  }
}
