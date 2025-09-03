import { createConfig } from "ponder";

import { ProjectLighthouseV16Abi } from "./abis/ProjectLighthouseV16Abi";

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: process.env.DATABASE_URL,
  },
  chains: {
    base: { id: 8453, rpc: process.env.PONDER_RPC_URL_1 },
  },
  contracts: {
    ProjectLighthouseV16: {
      abi: ProjectLighthouseV16Abi,
      address: "0xd02De59d7Cc4dbbB609BB84fAb85936739ae0068",
      chain: "base",
      startBlock: 34979321,
    },
  },
});
