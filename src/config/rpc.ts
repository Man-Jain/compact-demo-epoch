import {
  mainnet,
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

function ankrRpc(network: string, fallback: string): string {
  return ANKR_API_KEY
    ? `https://rpc.ankr.com/${network}/${ANKR_API_KEY}`
    : fallback;
}

export const RPC_ENDPOINTS: Record<number, string> = {
  1: ankrRpc("eth", mainnet.rpcUrls.default.http[0]),
  10: ankrRpc("optimism", optimism.rpcUrls.default.http[0]),
  137: ankrRpc("polygon", polygon.rpcUrls.default.http[0]),
  8453: ankrRpc("base", base.rpcUrls.default.http[0]),
  42161: ankrRpc("arbitrum", arbitrum.rpcUrls.default.http[0]),
  4663: "https://rpc.mainnet.chain.robinhood.com",
  84532: ankrRpc("base_sepolia", baseSepolia.rpcUrls.default.http[0]),
  11155420: ankrRpc(
    "optimism_sepolia",
    optimismSepolia.rpcUrls.default.http[0],
  ),
  11155111: ankrRpc("eth_sepolia", sepolia.rpcUrls.default.http[0]),
  46630: "https://rpc.testnet.chain.robinhood.com",
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
