import {
  arbitrum,
  base,
  baseSepolia,
  optimism,
  optimismSepolia,
  polygon,
  sepolia,
} from "viem/chains";

/** RPC URLs for supported chains (including chains not in wagmi config). */
const ANKR_API_KEY = import.meta.env.VITE_ANKR_API_KEY;

export const RPC_ENDPOINTS: Record<number, string> = {
  4663: "https://rpc.mainnet.chain.robinhood.com",
  46630: "https://rpc.testnet.chain.robinhood.com",
  1: `https://rpc.ankr.com/eth/${ANKR_API_KEY ?? ""}`,
  10: `https://rpc.ankr.com/optimism/${ANKR_API_KEY}`,
  137: `https://rpc.ankr.com/polygon/${ANKR_API_KEY}`,
  8453: `https://rpc.ankr.com/base/${ANKR_API_KEY}`,
  42161: `https://rpc.ankr.com/arbitrum/${ANKR_API_KEY}`,
  84532: `https://rpc.ankr.com/base_sepolia/${ANKR_API_KEY}`,
  11155420: `https://rpc.ankr.com/optimism_sepolia/${ANKR_API_KEY}`,
  11155111: `https://rpc.ankr.com/eth_sepolia/${ANKR_API_KEY}`,
};

const VIEM_CHAIN_RPCS = [
  sepolia,
  baseSepolia,
  optimismSepolia,
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
