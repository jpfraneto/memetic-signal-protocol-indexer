import { Token } from "../../types";
import axios from "axios";

const COINGECKO_API_URL = "https://pro-api.coingecko.com/api/v3";
const BASE_NETWORK_PLATFORM_ID = "base";
const REQUEST_DELAY = 1200; // 1.2 seconds between requests

const ZAPPER_API_URL = "https://public.zapper.xyz/graphql";
const BASE_CHAIN_ID = 8453;

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

async function fetchZapperTokenData(
  ca: string,
  timestamp: Date
): Promise<{
  price: number;
  signalingMarketCap: number;
  name: string;
  symbol: string;
  decimals: number;
  imageUrlV2: string;
} | null> {
  try {
    const query = `
      query TokenPriceData($address: Address!, $chainId: Int!) {
        fungibleTokenV2(address: $address, chainId: $chainId) {
          address
          symbol
          name
          decimals
          imageUrlV2
          priceData {
            historicalPrice(timestamp: ${timestamp.getTime()}) {
              timestamp
              price
            }
            marketCap
            price
          }
        }
      }
    `;

    const variables = {
      address: ca.toLowerCase(),
      chainId: BASE_CHAIN_ID,
    };

    console.log(`Fetching Zapper data for ${ca} at ${timestamp.getTime()}`);

    const response = await fetch(ZAPPER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-zapper-api-key": process.env.ZAPPER_API_KEY || "",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      console.warn(`Zapper API returned ${response.status}`);
      return null;
    }

    const data = (await response.json()) as any;

    if (data.errors) {
      console.warn("Zapper GraphQL errors:", data.errors);
      return null;
    }

    const tokenData = data.data?.fungibleTokenV2;
    if (!tokenData?.priceData) {
      console.warn(`No price data found for ${ca} on Zapper`);
      return null;
    }

    const historicalPriceData = tokenData.priceData.historicalPrice;
    if (!historicalPriceData) {
      console.warn(`No historical price data found for ${ca} at ${timestamp}`);
      return null;
    }

    const currentMarketCap = tokenData.priceData.marketCap || 0;
    const currentPrice = tokenData.priceData.price || 0;
    const historicalPrice = historicalPriceData.price || 0;

    console.log(`Zapper historical data for ${ca}:`, {
      signalingPrice: historicalPrice,
      signalingTimestamp: historicalPriceData.timestamp,
      currentPrice: currentPrice,
      currentMarketCap: currentMarketCap,
    });

    // Calculate historical market cap using our derived equation:
    // Historical Market Cap = (Current Market Cap / Current Price) × Historical Price
    let signalingMarketCap = 0;
    if (currentPrice > 0 && currentMarketCap > 0) {
      signalingMarketCap = (currentMarketCap / currentPrice) * historicalPrice;
    }

    console.log(
      `Calculated signaling market cap for ${ca}: ${signalingMarketCap}`
    );

    return {
      price: historicalPrice,
      signalingMarketCap: Math.floor(signalingMarketCap),
      name: tokenData.name || "Unknown Token",
      symbol: tokenData.symbol || "UNKNOWN",
      decimals: tokenData.decimals || 18,
      imageUrlV2: tokenData.imageUrlV2 || "",
    };
  } catch (error) {
    console.error(`Failed to fetch Zapper data for ${ca}:`, error);
    return null;
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

    // Try Zapper as primary source (both price data and metadata)
    const zapperData = await fetchZapperTokenData(normalizedAddress, timestamp);

    if (zapperData) {
      // Build token object from Zapper data
      const token: Token = {
        name: zapperData.name,
        symbol: zapperData.symbol,
        decimals: zapperData.decimals,
        image: zapperData.imageUrlV2,
        createdAt: timestamp,
        updatedAt: timestamp,
        ca: normalizedAddress,
      };

      console.log(`Token information complete for ${normalizedAddress}:`, {
        name: token.name,
        symbol: token.symbol,
        priceAtSignal: zapperData.price,
        signalingMarketCap: zapperData.signalingMarketCap,
      });

      return [token, zapperData.signalingMarketCap];
    }

    // Fallback to CoinGecko if Zapper fails
    console.log(
      `Zapper failed for ${normalizedAddress}, trying CoinGecko fallback`
    );

    const coinData = await fetchTokenMetadata(normalizedAddress);
    if (coinData) {
      let historicalPrice = 0;
      let marketCapAtSignal = 0;

      if (coinData.id) {
        const historicalData = await fetchHistoricalMarketData(
          coinData.id,
          timestamp
        );
        if (historicalData.marketCap > 0) {
          historicalPrice = historicalData.price;
          marketCapAtSignal = historicalData.marketCap;
        }
      }

      const token: Token = {
        name: coinData.name || "Unknown Token",
        symbol: coinData.symbol || "UNKNOWN",
        decimals:
          parseInt(
            coinData?.detail_platforms?.base?.decimal_place?.toString()
          ) || 18,
        categories: Array.isArray(coinData?.categories)
          ? coinData.categories.join(", ")
          : "Unknown",
        description:
          coinData?.description?.en ||
          `Token ${coinData?.symbol || "UNKNOWN"} on Base network`,
        image: coinData?.image?.large || "",
        imageSmall: coinData?.image?.small || "",
        imageThumb: coinData?.image?.thumb || "",
        createdAt: timestamp,
        updatedAt: timestamp,
        ca: normalizedAddress,
      };

      return [token, marketCapAtSignal];
    }

    // Both sources failed - return fallback data with raw token address
    console.warn(
      `Both Zapper and CoinGecko failed for ${normalizedAddress}, using fallback data`
    );
    
    const fallbackToken: Token = {
      name: `Token ${normalizedAddress.slice(0, 8)}...`,
      symbol: "UNKNOWN",
      decimals: 18,
      categories: "Unknown",
      description: `Token at address ${normalizedAddress} on Base network`,
      image: "",
      imageSmall: "",
      imageThumb: "",
      createdAt: timestamp,
      updatedAt: timestamp,
      ca: normalizedAddress,
    };

    return [fallbackToken, 0];
  } catch (error) {
    console.error(
      `Failed to fetch token information for ${normalizedAddress}:`,
      error
    );
    
    // Return fallback data instead of throwing error
    const fallbackToken: Token = {
      name: `Token ${normalizedAddress.slice(0, 8)}...`,
      symbol: "UNKNOWN",
      decimals: 18,
      categories: "Unknown",
      description: `Token at address ${normalizedAddress} on Base network`,
      image: "",
      imageSmall: "",
      imageThumb: "",
      createdAt: timestamp,
      updatedAt: timestamp,
      ca: normalizedAddress,
    };

    return [fallbackToken, 0];
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
