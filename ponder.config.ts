import { createConfig } from "ponder";

import { ProjectLighthouseV19Abi } from "./abis/ProjectLighthouseV19Abi";

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: process.env.DATABASE_URL,
  },
  chains: {
    base: { id: 8453, rpc: process.env.PONDER_RPC_URL_1 },
  },
  contracts: {
    ProjectLighthouseV19: {
      abi: ProjectLighthouseV19Abi,
      address: "0x74FFfF39a370f67329F3C85582A2d55e3A36DFFC",
      chain: "base",
      startBlock: 35227708,
    },
  },
});
