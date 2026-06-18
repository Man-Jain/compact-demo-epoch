import {
  arbitrum,
  base,
  baseSepolia,
  optimism,
  polygon,
  polygonAmoy,
  sepolia,
} from "viem/chains";

/** RPC URLs for supported chains (including chains not in wagmi config). */
export const RPC_ENDPOINTS: Record<number, string> = {
  10: "https://rpc.ankr.com/optimism/328f2943cccedcece01572bbf49bebb41a773bca7c6d1fdea5ca239f55e72a5b",
  137: "https://rpc.ankr.com/polygon/328f2943cccedcece01572bbf49bebb41a773bca7c6d1fdea5ca239f55e72a5b",
  8453: "https://rpc.ankr.com/base/328f2943cccedcece01572bbf49bebb41a773bca7c6d1fdea5ca239f55e72a5b",
  42161:
    "https://rpc.ankr.com/arbitrum/328f2943cccedcece01572bbf49bebb41a773bca7c6d1fdea5ca239f55e72a5b",
  84532:
    "https://rpc.ankr.com/base_sepolia/328f2943cccedcece01572bbf49bebb41a773bca7c6d1fdea5ca239f55e72a5b",
  11155111:
    "https://rpc.ankr.com/eth_sepolia/328f2943cccedcece01572bbf49bebb41a773bca7c6d1fdea5ca239f55e72a5b",
  80002:
    "https://rpc.ankr.com/polygon_amoy/328f2943cccedcece01572bbf49bebb41a773bca7c6d1fdea5ca239f55e72a5b",
};

const VIEM_CHAIN_RPCS = [
  sepolia,
  baseSepolia,
  polygonAmoy,
  polygon,
  arbitrum,
  base,
  optimism,
] as const;

export function getRpcUrlForChain(chainId: number): string | undefined {
  if (RPC_ENDPOINTS[chainId]) {
    return RPC_ENDPOINTS[chainId];
  }

  const chain = VIEM_CHAIN_RPCS.find((entry) => entry.id === chainId);
  return chain?.rpcUrls.default.http[0];
}
