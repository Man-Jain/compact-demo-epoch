import { useState, useEffect } from "react";
import { useChainId } from "wagmi";
import { ALLOCATOR_ADDRESS } from "@epoch-protocol/epoch-commons-sdk";
import { getApiUrl } from "../config/api";

interface HealthCheckResponse {
  status: string;
  allocatorAddresses: Record<number, string>;
  signingAddress: string;
  timestamp: string;
  chainConfig?: {
    defaultFinalizationThresholdSeconds: number;
    supportedChains: Array<{
      chainId: string;
      finalizationThresholdSeconds: number;
    }>;
  };
}

interface CompactRequest {
  chainId: string;
  compact: {
    arbiter: string;
    sponsor: string;
    nonce: string | null;
    expires: string;
    id: string;
    amount: string;
    witnessTypeString?: string;
    witnessHash?: string;
  };
  sponsorSignature: string;
  witnessData?: {
    tokenIn?: string;
    tokenInAmount?: string;
    tokenOut?: string;
    minTokenOut?: string;
    destinationChainId?: string;
    taskType?: string;
    protocolHashIdentifier?: string;
    recipient?: string;
  };
}

interface CompactResponse {
  hash: string;
  digest: string;
  nonce: string;
}

export function useAllocatorAPI() {
  const chainId = useChainId();
  const [allocatorAddress, setAllocatorAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const fetchHealthCheck = async () => {
      try {
        const response = await fetch(getApiUrl("/health"));
        if (!response.ok) {
          throw new Error("Health check failed");
        }
        const data: HealthCheckResponse = await response.json();
        const resolved =
          data.allocatorAddresses?.[chainId] ?? ALLOCATOR_ADDRESS[chainId];
        if (!resolved) {
          throw new Error(
            `Allocator address not configured for chain ${chainId}`,
          );
        }
        if (cancelled) return;
        setAllocatorAddress(resolved);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch allocator address",
        );
        setAllocatorAddress(null);
        retryTimer = setTimeout(fetchHealthCheck, 5000);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchHealthCheck();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [chainId]);

  const createAllocation = async (
    sessionToken: string,
    request: CompactRequest,
  ): Promise<CompactResponse> => {
    console.log("request: ", request);
    const response = await fetch(getApiUrl("/compact"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": sessionToken,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        errorData.error ||
          `Failed to create allocation: ${response.statusText}`,
      );
    }

    return response.json();
  };

  const getResourceLockDecimals = async (
    chainId: string,
    lockId: string,
  ): Promise<number> => {
    try {
      // Query the indexer for resource lock details including token decimals
      const response = await fetch(
        getApiUrl(`/resourceLock/${chainId}/${lockId}`),
      );
      if (!response.ok) {
        throw new Error("Failed to fetch resource lock details");
      }
      const data = await response.json();
      return data.token?.decimals || 18; // Default to 18 if not found
    } catch (err) {
      console.error("Error fetching resource lock decimals:", err);
      return 18; // Default to 18 decimals on error
    }
  };

  const generateClaimHash = async (
    sessionToken: string,
    params: {
      chainId: string;
      compact: {
        arbiter: string;
        sponsor: string;
        nonce: string | null;
        expires: string;
        id: string;
        amount: string;
        witnessTypeString: string | null;
        witnessHash: string | null;
      };
    },
  ): Promise<{ hash: string }> => {
    console.log("params: ", params);
    const response = await fetch(getApiUrl("/claim-hash"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": sessionToken,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        errorData.error ||
          `Failed to generate claim hash: ${response.statusText}`,
      );
    }

    return response.json();
  };

  return {
    allocatorAddress,
    isLoading,
    error,
    createAllocation,
    getResourceLockDecimals,
    generateClaimHash,
  };
}
