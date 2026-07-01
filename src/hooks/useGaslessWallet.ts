import { useCallback, useEffect, useState } from "react";
import { createPublicClient, http, type WalletClient } from "viem";
import { EpochIntentSDK } from "@epoch-protocol/epoch-intents-sdk";
import {
  getWalletGaslessStatus,
  GASLESS_SUPPORTED_CHAIN_IDS,
  isInjectedWallet,
  type DelegationState,
} from "../gasless/wallet-capability";
import { getRpcUrlForChain } from "../config/rpc";

interface UseGaslessWalletParams {
  allowGasless: boolean;
  apiBaseUrl: string;
  gasless: boolean;
  setGasless: (next: boolean) => void;
  walletClient?: WalletClient;
  address?: string;
  chainIdForCheck?: number | null;
  switchChain?: (args: { chainId: number }) => void | Promise<unknown>;
}

export type UseGaslessWalletResult = {
  unavailableReason: string | null;
  delegation: DelegationState | null;
  needsEpochSetup: boolean;
  is7702Capable: boolean;
  checking: boolean;
  setupBusy: boolean;
  setupError: string | null;
  switchToEpochSmartAccount: () => Promise<void>;
};

export function useGaslessWallet({
  allowGasless,
  apiBaseUrl,
  gasless,
  setGasless,
  walletClient,
  address,
  chainIdForCheck,
  switchChain,
}: UseGaslessWalletParams): UseGaslessWalletResult {
  const [unavailableReason, setUnavailableReason] = useState<string | null>(
    null,
  );
  const [delegation, setDelegation] = useState<DelegationState | null>(null);
  const [needsEpochSetup, setNeedsEpochSetup] = useState(false);
  const [is7702Capable, setIs7702Capable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [setupBusy, setSetupBusy] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const probe = useCallback(async () => {
    if (!allowGasless || !walletClient || !address || chainIdForCheck == null) {
      setUnavailableReason(null);
      setDelegation(null);
      setNeedsEpochSetup(false);
      setIs7702Capable(false);
      return;
    }

    if (isInjectedWallet(walletClient)) {
      setUnavailableReason(null);
      setDelegation(null);
      setNeedsEpochSetup(false);
      setIs7702Capable(false);
      return;
    }

    setChecking(true);
    try {
      const rpcUrl =
        getRpcUrlForChain(chainIdForCheck) ??
        walletClient.chain?.rpcUrls?.default?.http?.[0] ??
        "";

      const publicClient = createPublicClient({
        transport: http(rpcUrl),
      });

      const status = await getWalletGaslessStatus({
        publicClient,
        walletClient,
        chainId: chainIdForCheck,
        user: address as `0x${string}`,
      });

      setDelegation(status.delegation);
      setIs7702Capable(status.is7702Capable);
      setNeedsEpochSetup(status.needsSetup);

      if (status.delegation === "other") {
        setUnavailableReason(
          "Wallet delegated to an unsupported smart account — use a different address",
        );
      } else if (!GASLESS_SUPPORTED_CHAIN_IDS.includes(chainIdForCheck)) {
        setUnavailableReason(
          `Gasless is not enabled on chain ${chainIdForCheck} — switch to Base Sepolia (84532) or another supported testnet`,
        );
      } else if (!status.is7702Capable) {
        setUnavailableReason("Gasless not available for this wallet or chain");
      } else {
        setUnavailableReason(null);
      }
    } catch {
      setUnavailableReason(null);
      setDelegation(null);
      setNeedsEpochSetup(false);
      setIs7702Capable(false);
    } finally {
      setChecking(false);
    }
  }, [allowGasless, walletClient, address, chainIdForCheck]);

  useEffect(() => {
    void probe();
  }, [probe]);

  useEffect(() => {
    if (gasless && unavailableReason) {
      setGasless(false);
    }
  }, [gasless, unavailableReason, setGasless]);

  const switchToEpochSmartAccount = useCallback(async () => {
    if (!walletClient || !address || chainIdForCheck == null) {
      return;
    }

    setSetupBusy(true);
    setSetupError(null);

    try {
      if (
        chainIdForCheck != null &&
        walletClient.chain?.id !== chainIdForCheck &&
        switchChain
      ) {
        try {
          await Promise.resolve(switchChain({ chainId: chainIdForCheck }));
        } catch (switchErr) {
          const switchMsg =
            switchErr instanceof Error ? switchErr.message : String(switchErr);
          setSetupError(
            switchMsg.includes("User rejected") ||
              switchMsg.includes("User denied")
              ? "Network switch declined in wallet"
              : `Could not switch wallet to chain ${chainIdForCheck}. Switch manually in MetaMask, then try again.`,
          );
          return;
        }
      }

      const sdk = new EpochIntentSDK({
        apiBaseUrl,
        walletClient: walletClient as never,
      });

      const result = await sdk.setupSmartAccount({ chainId: chainIdForCheck });

      if (!result.ok) {
        setSetupError(
          result.reason ?? "Could not switch to Epoch smart account",
        );
        return;
      }
      await probe();
      setGasless(true);
    } catch (err) {
      setSetupError(
        err instanceof Error ? err.message : "Smart account setup failed",
      );
    } finally {
      setSetupBusy(false);
    }
  }, [
    apiBaseUrl,
    walletClient,
    address,
    chainIdForCheck,
    probe,
    setGasless,
    switchChain,
  ]);

  return {
    unavailableReason,
    delegation,
    needsEpochSetup,
    is7702Capable,
    checking,
    setupBusy,
    setupError,
    switchToEpochSmartAccount,
  };
}
