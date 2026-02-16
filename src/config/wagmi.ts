import { http } from 'wagmi';
import { sepolia, baseSepolia, optimismSepolia, arbitrumSepolia } from 'viem/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Configure supported chains
const projectId = 'YOUR_PROJECT_ID'; // Get from WalletConnect Cloud

export const chains = [sepolia, baseSepolia, optimismSepolia, arbitrumSepolia] as const;

// Create wagmi config using RainbowKit's getDefaultConfig
// Sepolia is set as the first chain, making it the default chain
export const config = getDefaultConfig({
  appName: 'Smallocator',
  projectId,
  chains,
  transports: {
    // Use a single transport configuration for all chains
    ...Object.fromEntries(
      chains.map((chain) => [chain.id, http(chain.rpcUrls.default.http[0])])
    ),
  },
});

// Export chain IDs for type safety
export const CHAIN_IDS = {
  SEPOLIA: sepolia.id,
  BASE_SEPOLIA: baseSepolia.id,
  OPTIMISM_SEPOLIA: optimismSepolia.id,
  ARBITRUM_SEPOLIA: arbitrumSepolia.id,
} as const;
