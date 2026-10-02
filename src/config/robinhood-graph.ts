// Robinhood metadata from the canonical epoch-commons-sdk graph.
// Keep the UI usable until the published SDK contains these networks.
interface EpochGraph {
  chains: Record<string, { chainId: number; explorer: string }>;
  tokens: Record<string, { contractAddress: Record<string, string>; decimals: number }>;
}

const mainnetRobinhood = {
  "chain": {
    "chainId": 4663,
    "explorer": "https://robinhoodchain.blockscout.com"
  },
  "tokens": {
    "WETH": {
      "contractAddress": {
        "Robinhood": "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73"
      },
      "decimals": 18
    },
    "USDG": {
      "contractAddress": {
        "Robinhood": "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168"
      },
      "decimals": 6
    },
    "USDe": {
      "contractAddress": {
        "Robinhood": "0x5d3a1Ff2b6BAb83B63cd9AD0787074081a52ef34"
      },
      "decimals": 18
    }
  }
};

const testnetRobinhood = {
  "chain": {
    "chainId": 46630,
    "explorer": "https://explorer.testnet.chain.robinhood.com"
  },
  "tokens": {
    "USDC": {
      "contractAddress": {
        "Robinhood": "0x2BB4FfD7E2c6D432b697554Efd77fA13bdbefd69"
      },
      "decimals": 18
    },
    "DAI": {
      "contractAddress": {
        "Robinhood": "0xc30f1Ce05d1434d484E9A47283aA925fc8A8699a"
      },
      "decimals": 18
    },
    "USDT": {
      "contractAddress": {
        "Robinhood": "0xc04d2869665Be874881133943523723Be5782720"
      },
      "decimals": 18
    },
    "WETH": {
      "contractAddress": {
        "Robinhood": "0x7946dd86eE310D0aC16804A37787289Fa5b88A8A"
      },
      "decimals": 18
    },
    "WBTC": {
      "contractAddress": {
        "Robinhood": "0x9b2a2754a9182fD65360E23afCDf3BeFF51796E9"
      },
      "decimals": 18
    },
    "PENGU": {
      "contractAddress": {
        "Robinhood": "0xEA7dC9849206Ce73b11c465d37b85eC06B11Cf2C"
      },
      "decimals": 18
    },
    "OSWALD": {
      "contractAddress": {
        "Robinhood": "0xB588418c0f90F07Bc9587d0050845a90C23C7502"
      },
      "decimals": 18
    },
    "KICK": {
      "contractAddress": {
        "Robinhood": "0x512Ee6Bd7A4be5Ba4796F15Df080c4D0F89a38eD"
      },
      "decimals": 18
    },
    "FERB": {
      "contractAddress": {
        "Robinhood": "0x145e03A80c19ad1b9d0429d06b6d52707de724A0"
      },
      "decimals": 18
    }
  }
};

export function withRobinhoodGraph<T extends EpochGraph>(graph: T, testnet: boolean): T {
  const fallback = testnet ? testnetRobinhood : mainnetRobinhood;
  if (Object.values(graph.chains).some((chain) => chain.chainId === fallback.chain.chainId)) {
    return graph;
  }
  const tokens = { ...graph.tokens };
  for (const [symbol, token] of Object.entries(fallback.tokens)) {
    tokens[symbol] = {
      ...tokens[symbol],
      decimals: token.decimals,
      contractAddress: { ...tokens[symbol]?.contractAddress, ...token.contractAddress },
    };
  }
  return { ...graph, chains: { ...graph.chains, Robinhood: fallback.chain }, tokens };
}
