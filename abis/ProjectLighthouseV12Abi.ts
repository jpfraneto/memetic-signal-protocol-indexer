export const ProjectLighthouseV12Abi = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createAccount",
    inputs: [{ name: "fid", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "subscribe",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "loadMiniapp",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "purchaseRetry",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "submitSignal",
    inputs: [
      {
        name: "tokens",
        type: "tuple[8]",
        components: [
          { name: "ca", type: "address", internalType: "address" },
          { name: "mc", type: "uint64", internalType: "uint64" },
          { name: "direction", type: "uint8", internalType: "uint8" },
        ],
        internalType: "struct ProjectLighthouseV12.TokenPrediction[8]",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "settleSignal",
    inputs: [
      { name: "signalId", type: "uint256", internalType: "uint256" },
      { name: "exitMarketCaps", type: "uint64[8]", internalType: "uint64[8]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "banAccount",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "AccountCreated",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "fid", type: "uint256", indexed: true, internalType: "uint256" },
      {
        name: "timestamp",
        type: "uint64",
        indexed: false,
        internalType: "uint64",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Subscribed",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "fid", type: "uint256", indexed: true, internalType: "uint256" },
      {
        name: "expiresAt",
        type: "uint64",
        indexed: false,
        internalType: "uint64",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SessionStarted",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "fid", type: "uint256", indexed: true, internalType: "uint256" },
      {
        name: "startTime",
        type: "uint64",
        indexed: false,
        internalType: "uint64",
      },
      {
        name: "expiresAt",
        type: "uint64",
        indexed: false,
        internalType: "uint64",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SignalCreated",
    inputs: [
      {
        name: "signalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      { name: "fid", type: "uint256", indexed: true, internalType: "uint256" },
      {
        name: "expiresAt",
        type: "uint64",
        indexed: false,
        internalType: "uint64",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SignalSettled",
    inputs: [
      {
        name: "signalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      { name: "fid", type: "uint256", indexed: true, internalType: "uint256" },
      {
        name: "status",
        type: "uint8",
        indexed: false,
        internalType: "enum ProjectLighthouseV12.Status",
      },
      {
        name: "correctPredictions",
        type: "uint8",
        indexed: false,
        internalType: "uint8",
      },
    ],
    anonymous: false,
  },
] as const;
