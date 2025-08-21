import { createConfig } from "ponder";

import { ProjectLighthouseV12Abi } from "./abis/ProjectLighthouseV12Abi";

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
    ProjectLighthouseV12: {
      abi: ProjectLighthouseV12Abi,
      address: "0xE6EA0276F2efEAe42dE1DeE0A6C4a4bE3cC85bEB",
      chain: "base",
      startBlock: 34492600,
    },
  },
});
