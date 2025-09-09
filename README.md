# Memetic Signal Protocol - Blockchain Indexer

## What is MSP?

The **Memetic Signal Protocol (MSP)** is a decentralized reputation system that lets you build credibility by making precise cryptocurrency price predictions. Think of it as a way to prove your market intuition and earn social capital by correctly timing crypto market movements.

Unlike traditional prediction markets where timing doesn't matter much, MSP rewards **precision timing** above all else. A prediction that comes true in 1 day gives you full reputation points, while the same prediction over 300 days gives you almost nothing. This creates genuine skill-based competition rather than safe long-term speculation.

## How This Indexer Fits Into The Complete System

This indexer is the **nervous system** of the MSP ecosystem. While users make predictions and see results, this indexer is constantly watching the blockchain and immediately organizing all the prediction data so the system can respond instantly to what's happening.

### 🏗️ **System Architecture Overview**

The complete MSP system has 5 main parts:

1. **📱 Mobile App (Farcaster Miniapp)** - Where users make predictions
2. **⛓️ Smart Contract (Base Blockchain)** - Stores predictions permanently and securely  
3. **👁️ Blockchain Indexer (This Repository)** - Watches blockchain and organizes all the data
4. **🧠 Backend Server** - Calculates scores and manages the system
5. **💾 Database & Cache** - Stores user data and keeps things running fast

### ⚡ **How A Prediction Works (Step by Step)**

1. **User Makes Prediction**: Someone opens the app and predicts "Token XYZ will go UP in 3 days"
2. **Smart Contract Records It**: The prediction is permanently stored on Base blockchain
3. **Indexer Sees It Instantly**: This indexer immediately detects the new prediction
4. **Data Gets Organized**: The indexer processes all the details and stores them in an organized database
5. **Backend Gets Notified**: The main server learns about the prediction and sets up automatic resolution
6. **Real-Time Updates**: Everyone can see new predictions instantly because the indexer keeps everything up-to-date

## 👁️ **What Makes This Indexer Special**

### **Real-Time Blockchain Monitoring**
- Watches the Base blockchain **24/7** for any MSP activity
- Detects new predictions within **seconds** of being made
- Never misses a transaction - even during network congestion
- Processes events in the exact order they happened on blockchain

### **Intelligent Data Organization**
- Takes raw blockchain data and makes it easy to understand
- Tracks user statistics (total predictions, win rate, reputation score)
- Monitors system health (daily prediction counts, banned users, etc.)
- Stores token information (names, prices, market caps) for quick access

### **Lightning-Fast Queries**
- Pre-processes data so the app responds instantly
- Maintains user leaderboards and statistics in real-time
- Enables complex searches (find all predictions by user, token, time period)
- Supports the main app's need for immediate data access

### **Token Intelligence**
- Automatically fetches token information from CoinGecko and DexScreener
- Stores historical market data for accurate resolution calculations
- Handles new tokens that aren't in major databases yet
- Rate-limits API calls to respect data provider restrictions

## 🔍 **What The Indexer Tracks**

### **User Activity**
- **Predictions Made**: Every signal with full details (token, direction, duration)
- **Wallet Authorizations**: Which wallets are connected to which Farcaster accounts
- **Daily Limits**: How many predictions each user has made today
- **Reputation Changes**: All MFS score updates with full audit trails
- **Ban Status**: Tracks if users have been banned and when

### **System Events**
- **Signal Creation**: New predictions with timestamps and market data
- **Signal Resolution**: When predictions are resolved with outcomes
- **Manual Updates**: Any corrections made by system administrators
- **Admin Changes**: Updates to system configuration (new resolvers, signers)
- **Token Information**: Metadata and pricing data for all tracked tokens

### **Market Data Integration**
- **Historical Prices**: Token prices at the time predictions were made
- **Current Market Caps**: Real-time valuation data for accurate scoring
- **Token Metadata**: Names, symbols, descriptions, and images
- **Price Snapshots**: Regular captures of market conditions

## ⚙️ **How The Indexer Works (Technical Overview)**

### **Event-Driven Architecture**
- Uses **Ponder framework** - a specialized tool for blockchain indexing
- Connects directly to Base network RPC endpoints for maximum reliability
- Processes smart contract events in real-time as blocks are mined
- Maintains perfect synchronization with blockchain state

### **Database Management**
- **PostgreSQL**: Enterprise-grade database that never loses data
- **Optimized Schemas**: Carefully designed tables for maximum query speed
- **Relationship Mapping**: Connects users, predictions, tokens, and outcomes
- **Indexing**: Strategic database indexes for sub-second query responses

### **External Integrations**
- **CoinGecko Pro API**: Primary source for professional market data
- **DexScreener API**: Backup source for new or unlisted tokens
- **Rate Limiting**: Respects API limits to maintain reliable service
- **Fallback Systems**: Graceful handling when data sources are unavailable

## 🛡️ **Reliability & Data Integrity**

### **Never Miss An Event**
- **Block Reorganization Handling**: Adapts when blockchain reorganizes transactions
- **Automatic Retry Logic**: Recovers from temporary network issues
- **Checkpoint System**: Knows exactly where it left off if restarted
- **Duplicate Prevention**: Ensures each blockchain event is only processed once

### **Data Quality**
- **Transaction Verification**: Confirms all events came from the official MSP contract
- **Timestamp Accuracy**: Uses blockchain timestamps for perfect chronological order
- **Market Data Validation**: Verifies token information from multiple sources
- **Error Logging**: Comprehensive logs for troubleshooting any issues

### **Performance Optimization**
- **Parallel Processing**: Handles multiple events simultaneously for speed
- **Efficient Queries**: Optimized database operations for minimal latency
- **Memory Management**: Handles large datasets without consuming excessive resources
- **Scaling Ready**: Designed to handle thousands of predictions per day

## 📊 **Data Available Through The Indexer**

### **For Users**
- **Personal Statistics**: Win rate, total predictions, reputation score history
- **Prediction History**: All past predictions with outcomes and point changes
- **Token Performance**: Which tokens you've predicted and how accurately
- **Daily Tracking**: How many predictions you've made today

### **For The System**
- **Global Leaderboards**: Top performers ranked by reputation and accuracy
- **System Statistics**: Total predictions, active users, resolved outcomes
- **Token Popularity**: Which cryptocurrencies are being predicted most
- **Network Health**: System performance and usage metrics

### **For Developers**
- **Complete Audit Trail**: Every action with blockchain transaction hashes
- **API Endpoints**: RESTful access to all system data
- **Real-Time Updates**: WebSocket support for live data feeds
- **Historical Analysis**: Time-series data for research and analysis

## 🔌 **Integration With The MSP Ecosystem**

### **Frontend Integration**
- Provides instant data for the mobile app's user interface
- Enables real-time updates when new predictions are made
- Powers search and filtering features
- Supplies data for charts and visualizations

### **Backend Integration** 
- Triggers job scheduling when new predictions are created
- Provides historical data needed for accurate resolution calculations
- Supplies user authentication and authorization data
- Enables batch processing of multiple predictions

### **Blockchain Integration**
- Maintains perfect synchronization with the Base blockchain
- Verifies all data against the immutable smart contract state
- Provides cryptographic proof for all reported statistics
- Ensures data integrity through blockchain verification

## 🚀 **Why This Architecture Matters**

### **Decentralization**
- **No Single Point of Failure**: Data exists on blockchain permanently
- **Transparent Operations**: Anyone can verify the indexer's work
- **Open Source**: Complete code available for audit and improvement
- **Permissionless**: Anyone can run their own copy of this indexer

### **User Experience**
- **Instant Responses**: Pre-processed data means no waiting
- **Always Available**: 24/7 operation with automatic recovery
- **Complete History**: Nothing is ever lost or forgotten
- **Real-Time Updates**: See changes as they happen on blockchain

### **Developer Experience**
- **Clean APIs**: Easy access to any data developers need
- **Complete Documentation**: Every endpoint and data structure explained
- **Flexible Queries**: Support for complex filtering and sorting
- **Reliable Performance**: Predictable response times under any load

## 🔧 **Technical Foundation (For The Curious)**

While you don't need to understand the technical details to benefit from MSP, here's what powers this indexer:

- **Ponder Framework**: Specialized blockchain indexing with TypeScript
- **PostgreSQL**: Enterprise database with ACID guarantees
- **Base Network RPC**: Direct connection to Base blockchain infrastructure
- **CoinGecko Pro**: Professional-grade market data API
- **DexScreener**: Decentralized exchange data for comprehensive token coverage
- **Hono Framework**: Lightweight API server for maximum performance

## 💡 **Getting Started (For Users)**

You don't interact with this indexer directly. Instead:

1. **Install Farcaster app** (like Warpcast)
2. **Open the MSP miniapp** within Farcaster
3. **Connect your wallet** for identity verification  
4. **Start making predictions** on tokens you know
5. **View your statistics** powered by this indexer's real-time data
6. **Climb the leaderboards** with accurate timing

## 👨‍💻 **For Developers & Contributors**

This is **open source software** (MIT license) built by [@jpfraneto.eth](https://warpcast.com/jpfraneto.eth). The complete codebase is available for:

- **Study**: Learn how blockchain indexing works in practice
- **Audit**: Verify data accuracy and system security
- **Contribute**: Submit improvements and optimizations
- **Fork**: Build your own indexing solutions
- **Integrate**: Connect other applications to MSP data

### **Local Development**
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start the indexer
npm run dev

# View the API
npm run start
```

## 🌅 **The Future of Decentralized Data**

This indexer represents a new model for application data:

- **Blockchain-First**: Data lives on immutable blockchain, indexer provides convenient access
- **User-Owned**: All prediction data belongs to users, not platforms
- **Interoperable**: Any application can access this data through standard APIs
- **Verifiable**: Every statistic can be cryptographically verified
- **Permanent**: Data survives even if specific indexer instances go offline

## ⚠️ **Important Disclaimer**

This system is experimental and could have bugs or vulnerabilities. It's deployed as a starting point for innovation, not as a finished product. All code is open source and we welcome security audits and improvements.

**Use at your own risk. This is not financial advice.**

---

*Built with ❤️ for the decentralized web. The future belongs to open protocols and verifiable data.*

---

**Questions?** Check out the [full technical whitepaper](../whitepaper/) or join the conversation on Farcaster.