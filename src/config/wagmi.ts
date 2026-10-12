import { http } from "wagmi";
import { defineChain } from "viem";
import {
  mainnet,
  robinhood,
  robinhoodTestnet,
  sepolia,
  baseSepolia,
  optimismSepolia,
  polygon,
  arbitrum,
  base,
  optimism,
} from "viem/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { getRpcUrlForChain } from "./rpc";

const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
  "6d06ee285dc5aa014a2bf609d0827cd6";

export const tesoroStaging = defineChain({
  id: 466300,
  name: "Tesoro Staging",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://tesoro-staging1.exe.xyz/rpc"] } },
  testnet: true,
});

export const chains = [
  mainnet,
  robinhood,
  robinhoodTestnet,
  sepolia,
  baseSepolia,
  optimismSepolia,
  polygon,
  arbitrum,
  base,
  optimism,
  tesoroStaging,
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
  MAINNET: mainnet.id,
  ROBINHOOD: robinhood.id,
  ROBINHOOD_TESTNET: robinhoodTestnet.id,
  SEPOLIA: sepolia.id,
  BASE_SEPOLIA: baseSepolia.id,
  OPTIMISM_SEPOLIA: optimismSepolia.id,
  POLYGON: polygon.id,
  ARBITRUM: arbitrum.id,
  BASE: base.id,
  OPTIMISM: optimism.id,
  TESORO_STAGING: tesoroStaging.id,
} as const;
