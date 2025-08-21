import { createConfig } from "ponder";

import { ProjectLighthouseV13Abi } from "./abis/ProjectLighthouseV13Abi";

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: process.env.DATABASE_URL,
    poolConfig: {
      max: 20,
      ssl: true,
    },
  },
  chains: {
    base: {
      id: 8453,
      rpc: process.env.PONDER_RPC_URL_8453,
    },
  },
  contracts: {
    ProjectLighthouseV13: {
      abi: ProjectLighthouseV13Abi,
      address: "0xb6e81aad2585a772f0802b79eff6ce333634d6e7",
      chain: "base",
      startBlock: 34492600,
    },
  },
});
