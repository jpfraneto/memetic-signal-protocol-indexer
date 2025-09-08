import { createConfig } from "ponder";

import { MemeticSignalProtocolAbi } from "./abis/MemeticSignalProtocolAbi";

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: process.env.DATABASE_URL,
  },
  chains: {
    base: { id: 8453, rpc: process.env.PONDER_RPC_URL_1 },
  },

  contracts: {
    MemeticSignalProtocol: {
      abi: MemeticSignalProtocolAbi,
      address: "0x241dc35F698d3bA887Fffc30A6d6bf0E05FF46D8",
      chain: "base",
      startBlock: 35227708, // Update this to the actual deployment block
    },
  },
});
