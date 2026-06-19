import { http } from "wagmi";
import {
  sepolia,
  baseSepolia,
  optimismSepolia,
  polygonAmoy,
  polygon,
  arbitrum,
  base,
  optimism,
} from "viem/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { getRpcUrlForChain } from "./rpc";

const projectId = "YOUR_PROJECT_ID"; // Get from WalletConnect Cloud

export const chains = [
  sepolia,
  baseSepolia,
  optimismSepolia,
  polygonAmoy,
  polygon,
  arbitrum,
  base,
  optimism,
] as const;

export const SUPPORTED_CHAIN_IDS = new Set<number>(
  chains.map((chain) => chain.id),
);

export const config = getDefaultConfig({
  appName: "Smallocator",
  projectId,
  chains,
  transports: {
    ...Object.fromEntries(
      chains.map((chain) => [
        chain.id,
        http(getRpcUrlForChain(chain.id) ?? chain.rpcUrls.default.http[0]),
      ]),
    ),
  },
});

export const CHAIN_IDS = {
  SEPOLIA: sepolia.id,
  BASE_SEPOLIA: baseSepolia.id,
  OPTIMISM_SEPOLIA: optimismSepolia.id,
  POLYGON_AMOY: polygonAmoy.id,
  POLYGON: polygon.id,
  ARBITRUM: arbitrum.id,
  BASE: base.id,
  OPTIMISM: optimism.id,
} as const;
