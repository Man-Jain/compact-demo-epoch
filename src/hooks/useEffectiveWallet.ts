import { useMemo } from "react";
import {
  useAccount,
  useChainId,
  useDisconnect,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { useLocalSigner } from "../context/LocalSignerContext";

export type WalletConnectionMode = "browser" | "local" | "disconnected";

export function useEffectiveWallet() {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { data: wagmiWalletClient } = useWalletClient();
  const wagmiChainId = useChainId();
  const wagmiPublicClient = usePublicClient();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const local = useLocalSigner();

  return useMemo(() => {
    if (local.isLocalConnected && local.address && local.walletClient) {
      return {
        mode: "local" as const,
        address: local.address,
        isConnected: true,
        walletClient: local.walletClient,
        publicClient: local.publicClient,
        chainId: local.chainId,
        isLocalSigner: true,
        disconnect: () => {
          local.disconnect();
        },
      };
    }

    return {
      mode: (wagmiConnected
        ? "browser"
        : "disconnected") as WalletConnectionMode,
      address: wagmiAddress,
      isConnected: wagmiConnected,
      walletClient: wagmiWalletClient,
      publicClient: wagmiPublicClient,
      chainId: wagmiChainId,
      isLocalSigner: false,
      disconnect: wagmiDisconnect,
    };
  }, [
    local,
    wagmiAddress,
    wagmiConnected,
    wagmiWalletClient,
    wagmiPublicClient,
    wagmiChainId,
    wagmiDisconnect,
  ]);
}
