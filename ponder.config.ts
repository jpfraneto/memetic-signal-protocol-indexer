import { createConfig } from "ponder";

import { UnverifiedContractAbi } from "./abis/UnverifiedContractAbi";

export default createConfig({
  chains: {
    basePreconf: { id: 8453, rpc: "http(process.env.PONDER_RPC_URL_8453)" },
  },
  contracts: {
    UnverifiedContract: {
      abi: UnverifiedContractAbi,
      address: "0xe6ea0276f2efeae42de1dee0a6c4a4be3cc85beb",
      chain: "basePreconf",
    },
  },
});
