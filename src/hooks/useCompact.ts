import React from "react";
import {
  useWriteContract,
  useChainId,
  useAccount,
  usePublicClient,
  useWaitForTransactionReceipt,
} from "wagmi";
import { type Hash } from "viem";
import { isSupportedChain } from "../../src/constants/contracts";
import { useNotification } from "./useNotification";
import { sepolia } from "viem/chains";
import COMPACT_ABI from "../abis/COMPACT_ABI.json";
import { COMPACT_ADDRESS } from "@epoch-protocol/epoch-intents-sdk";

const chains: Record<number, any> = {
  [sepolia.id]: sepolia,
};

interface NativeDeposit {
  allocator: `0x${string}`;
  value: bigint;
  displayValue: string;
  isNative: true;
}

interface TokenDeposit {
  // sponsor: `0x${string}`;
  token: `0x${string}`;
  lockTag: `0x${string}`;
  amount: bigint;
  // arbiter: `0x${string}`;
  // nonce: string;
  // expires: string;
  // typehash: `0x${string}`;
  // witness: `0x${string}`;
  recipient: `0x${string}`;
  isNative: false;
}

type DepositParams = NativeDeposit | TokenDeposit;

interface WithdrawalParams {
  args: readonly [bigint] | readonly [bigint, `0x${string}`, bigint];
  amount?: bigint;
  displayAmount?: string;
  symbol?: string;
}

export function useCompact() {
  const chainId = useChainId();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { showNotification } = useNotification();
  const [hash, setHash] = React.useState<Hash | undefined>();

  const { writeContractAsync } = useWriteContract({
    mutation: {
      onError: (error) => {
        // Only show transaction-related errors, not network or user rejection errors
        if (
          error instanceof Error &&
          !error.message.toLowerCase().includes("user rejected") &&
          !error.message.toLowerCase().includes("network") &&
          !error.message.toLowerCase().includes("chain") &&
          !error.message.toLowerCase().includes("invalid network") &&
          !error.message.toLowerCase().includes("wrong network") &&
          !error.message.toLowerCase().includes("unsupported network") &&
          error.message !== "Unsupported chain" &&
          error.message !== "Chain configuration not found"
        ) {
          showNotification({
            type: "error",
            title: "Transaction Failed",
            message: error.message,
            autoHide: true,
          });
        }
      },
    },
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
      onReplaced: (replacement) => {
        showNotification({
          type: "info",
          title: "Transaction Replaced",
          message: `Transaction was ${replacement.reason}. Waiting for new transaction...`,
          txHash: replacement.transaction.hash,
          chainId,
          autoHide: false,
        });
      },
    });

  const getContractAddress = () => {
    if (!isSupportedChain(chainId)) {
      throw new Error("Unsupported chain");
    }

    const chain = chains[chainId];
    if (!chain) {
      throw new Error("Chain configuration not found");
    }

    return COMPACT_ADDRESS as `0x${string}`;
  };

  const deposit = async (params: DepositParams) => {
    if (!publicClient) throw new Error("Public client not available");

    const contractAddress = getContractAddress();
    if (!contractAddress)
      throw new Error("Contract address not found for current network");

    // Generate a temporary transaction ID for linking notifications
    const tempTxId = `pending-${Date.now()}`;

    showNotification({
      type: "info",
      title: "Initiating Deposit",
      message: "Please confirm the transaction in your wallet...",
      stage: "initiated",
      txHash: tempTxId,
      chainId,
      autoHide: false,
    });
    console.log(
      "[params.token, params.allocator, params.amount, params.allocator]: ",
      params,
    );

    try {
      const newHash = await writeContractAsync({
        address: contractAddress,
        abi: COMPACT_ABI,
        functionName: "depositERC20",
        args: params.isNative
          ? [params.allocator]
          : [params.token, params.lockTag, params.amount, params.recipient],
        value: params.isNative ? params.value : 0n,
      });

      showNotification({
        type: "success",
        title: "Transaction Submitted",
        message: "Waiting for confirmation...",
        stage: "submitted",
        txHash: newHash,
        chainId,
        autoHide: true,
      });

      setHash(newHash);

      // Start watching for confirmation but don't wait for it
      void publicClient
        .waitForTransactionReceipt({
          hash: newHash,
        })
        .then((receipt) => {
          if (receipt.status === "success") {
            showNotification({
              type: "success",
              title: "Deposit Confirmed",
              message: params.isNative
                ? `Successfully deposited ${params.displayValue} ETH`
                : `Successfully deposited ${params.amount} `,
              stage: "confirmed",
              txHash: newHash,
              chainId,
              autoHide: false,
            });
          }
        });

      return newHash;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes("user rejected")
      ) {
        showNotification({
          type: "error",
          title: "Transaction Rejected",
          message: "You rejected the transaction",
          txHash: tempTxId,
          chainId,
          autoHide: true,
        });
      }
      throw error;
    }
  };

  const depositAndRegister = async ({
    isNative,
    allocator,
    value,
    token,
    lockTag,
    amount,
    claimHash,
    typehash,
  }: {
    isNative: boolean;
    allocator?: `0x${string}`;
    value?: bigint;
    token?: `0x${string}`;
    lockTag: `0x${string}`;
    amount?: bigint;
    claimHash: `0x${string}`;
    typehash: `0x${string}`;
  }) => {
    console.log(
      "[isNative, allocator, value, token, lockTag, amount, claimHash, typehash]: ",
      isNative,
      allocator,
      value,
      token,
      lockTag,
      amount,
      claimHash,
      typehash,
    );
    if (!publicClient) throw new Error("Public client not available");

    const contractAddress = getContractAddress();
    if (!contractAddress)
      throw new Error("Contract address not found for current network");

    const tempTxId = `pending-${Date.now()}`;
    showNotification({
      type: "info",
      title: "Initiating Deposit + Register",
      message: "Please confirm the transaction in your wallet...",
      stage: "initiated",
      txHash: tempTxId,
      chainId,
      autoHide: false,
    });

    try {
      const newHash = await writeContractAsync({
        address: contractAddress,
        abi: COMPACT_ABI,
        functionName: isNative
          ? "depositNativeAndRegister"
          : "depositERC20AndRegister",
        args: isNative
          ? [lockTag, claimHash, typehash]
          : [token!, lockTag, amount!, claimHash, typehash],
        value: isNative ? value! : 0n,
      });
      console.log("newHash: ", newHash);

      showNotification({
        type: "success",
        title: "Transaction Submitted",
        message: "Waiting for confirmation...",
        stage: "submitted",
        txHash: newHash,
        chainId,
        autoHide: true,
      });
      setHash(newHash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: newHash,
      });

      if (receipt.status === "success") {
        showNotification({
          type: "success",
          title: "Deposit + Register Confirmed",
          message: "Your compact is registered and funded",
          stage: "confirmed",
          txHash: newHash,
          chainId,
          autoHide: false,
        });
      }

      return { hash: newHash, receipt };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes("user rejected")
      ) {
        showNotification({
          type: "error",
          title: "Transaction Rejected",
          message: "You rejected the transaction",
          txHash: tempTxId,
          chainId,
          autoHide: true,
        });
      }
      throw error;
    }
  };

  const enableForcedWithdrawal = async ({ args }: { args: [bigint] }) => {
    if (!publicClient) throw new Error("Public client not available");

    const tempTxId = `pending-${Date.now()}`;

    showNotification({
      type: "info",
      title: "Initiating Forced Withdrawal",
      message: "Please confirm the transaction in your wallet...",
      stage: "initiated",
      txHash: tempTxId,
      chainId,
      autoHide: false,
    });

    try {
      const newHash = await writeContractAsync({
        abi: COMPACT_ABI,
        address: getContractAddress(),
        functionName: "enableForcedWithdrawal",
        args,
      });

      showNotification({
        type: "success",
        title: "Transaction Submitted",
        message: "Waiting for confirmation...",
        stage: "submitted",
        txHash: newHash,
        chainId,
        autoHide: true,
      });

      setHash(newHash);

      // Start watching for confirmation but don't wait for it
      void publicClient
        .waitForTransactionReceipt({
          hash: newHash,
        })
        .then((receipt) => {
          if (receipt.status === "success") {
            showNotification({
              type: "success",
              title: "Forced Withdrawal Initiated",
              message: "The timelock period has started",
              stage: "confirmed",
              txHash: newHash,
              chainId,
              autoHide: false,
            });
          }
        });

      return newHash;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes("user rejected")
      ) {
        showNotification({
          type: "error",
          title: "Transaction Rejected",
          message: "You rejected the transaction",
          txHash: tempTxId,
          chainId,
          autoHide: true,
        });
      }
      throw error;
    }
  };

  const disableForcedWithdrawal = async ({ args }: { args: [bigint] }) => {
    if (!publicClient) throw new Error("Public client not available");

    const tempTxId = `pending-${Date.now()}`;

    showNotification({
      type: "info",
      title: "Initiating Reactivation",
      message: "Please confirm the transaction in your wallet...",
      stage: "initiated",
      txHash: tempTxId,
      chainId,
      autoHide: false,
    });

    try {
      const newHash = await writeContractAsync({
        abi: COMPACT_ABI,
        address: getContractAddress(),
        functionName: "disableForcedWithdrawal",
        args,
      });

      showNotification({
        type: "success",
        title: "Transaction Submitted",
        message: "Waiting for confirmation...",
        stage: "submitted",
        txHash: newHash,
        chainId,
        autoHide: true,
      });

      setHash(newHash);

      // Start watching for confirmation but don't wait for it
      void publicClient
        .waitForTransactionReceipt({
          hash: newHash,
        })
        .then((receipt) => {
          if (receipt.status === "success") {
            showNotification({
              type: "success",
              title: "Resource Lock Reactivated",
              message: "Your resource lock has been reactivated",
              stage: "confirmed",
              txHash: newHash,
              chainId,
              autoHide: false,
            });
          }
        });

      return newHash;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes("user rejected")
      ) {
        showNotification({
          type: "error",
          title: "Transaction Rejected",
          message: "You rejected the transaction",
          txHash: tempTxId,
          chainId,
          autoHide: true,
        });
      }
      throw error;
    }
  };

  const forcedWithdrawal = async ({
    args,
    displayAmount,
    symbol,
  }: WithdrawalParams) => {
    if (!publicClient) throw new Error("Public client not available");

    if (!isSupportedChain(chainId)) {
      throw new Error("Unsupported chain");
    }

    const chain = chains[chainId];
    if (!chain) {
      throw new Error("Chain configuration not found");
    }

    const tempTxId = `pending-${Date.now()}`;

    showNotification({
      type: "info",
      title: `Initiating Forced Withdrawal of ${displayAmount} ${symbol}`,
      message: "Please confirm the transaction in your wallet...",
      stage: "initiated",
      txHash: tempTxId,
      chainId,
      autoHide: false,
    });

    try {
      const newHash = await writeContractAsync({
        address: COMPACT_ADDRESS as `0x${string}`,
        abi: [
          COMPACT_ABI.find((x: any) => x.name === "forcedWithdrawal"),
        ] as const,
        functionName: "forcedWithdrawal",
        args,
        account: address,
        chain,
      });

      showNotification({
        type: "success",
        title: "Transaction Submitted",
        message: "Waiting for confirmation...",
        stage: "submitted",
        txHash: newHash,
        chainId,
        autoHide: true,
      });

      setHash(newHash);

      // Start watching for confirmation but don't wait for it
      void publicClient
        .waitForTransactionReceipt({
          hash: newHash,
        })
        .then((receipt) => {
          if (receipt.status === "success") {
            showNotification({
              type: "success",
              title: "Withdrawal Confirmed",
              message: `Successfully withdrew ${displayAmount} ${symbol}`,
              stage: "confirmed",
              txHash: newHash,
              chainId,
              autoHide: false,
            });
          }
        });

      return newHash;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes("user rejected")
      ) {
        showNotification({
          type: "error",
          title: "Transaction Rejected",
          message: "You rejected the transaction",
          txHash: tempTxId,
          chainId,
          autoHide: true,
        });
      }
      throw error;
    }
  };

  return {
    deposit,
    depositAndRegister,
    enableForcedWithdrawal,
    disableForcedWithdrawal,
    forcedWithdrawal,
    isSupported: isSupportedChain(chainId),
    isConfirming,
    isConfirmed,
  };
}
