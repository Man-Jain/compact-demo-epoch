import { useState, useEffect, useRef, useCallback } from "react";
import { getApiUrl } from "../config/api";

export interface IntentTransactionStatus {
  status: string;
  transactionHash: string;
  chainId: number;
}

interface UseIntentStatusResult {
  statuses: IntentTransactionStatus[] | null;
  isLoading: boolean;
  error: string | null;
  isComplete: boolean;
  refetch: () => void;
}

/** Statuses that mean the intent is done — stop polling once every tx hits one. */
const TERMINAL_STATUSES = new Set([
  "success",
  "failed",
  "completed",
  "finalized",
  "reverted",
]);

function allTerminal(statuses: IntentTransactionStatus[]): boolean {
  return (
    statuses.length > 0 &&
    statuses.every((s) => TERMINAL_STATUSES.has((s.status || "").toLowerCase()))
  );
}

export function useIntentStatus(
  address: string | undefined,
  nonce: string | undefined,
  enabled: boolean = true,
  autoRefresh: boolean = false,
  refreshInterval: number = 5000, // 5 seconds default
): UseIntentStatusResult {
  const [statuses, setStatuses] = useState<IntentTransactionStatus[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // `silent` refreshes (the background poll) don't flip the loading flag, so the
  // UI doesn't flicker to "Loading…" every interval.
  const fetchIntentStatus = useCallback(
    async (silent = false): Promise<IntentTransactionStatus[] | null> => {
      if (!address || !nonce || !enabled) {
        setStatuses(null);
        return null;
      }

      if (!silent) setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          getApiUrl(`/intentStatus/${address}/${nonce}`),
          { method: "GET", headers: { "Content-Type": "application/json" } },
        );

        if (!response.ok) {
          if (response.status === 404) {
            // No status yet — normal for a new intent.
            setStatuses([]);
            return [];
          }
          throw new Error(
            `Failed to fetch intent status: ${response.statusText}`,
          );
        }

        const data: IntentTransactionStatus[] = await response.json();
        setStatuses(data);
        setIsComplete(allTerminal(data));
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch intent status";
        setError(errorMessage);
        console.error("Error fetching intent status:", err);
        return null;
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [address, nonce, enabled],
  );

  useEffect(() => {
    let cancelled = false;
    const clearPoll = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Initial (non-silent) fetch; stop before starting a new poll below.
    void fetchIntentStatus(false).then((data) => {
      if (cancelled) return;
      if (data && allTerminal(data)) clearPoll();
    });

    if (autoRefresh && enabled) {
      intervalRef.current = setInterval(() => {
        void fetchIntentStatus(true).then((data) => {
          // Reached a terminal state → stop polling. This is the fix: the poll
          // used to run forever, even after the intent was already settled.
          if (data && allTerminal(data)) clearPoll();
        });
      }, refreshInterval);
    }

    return () => {
      cancelled = true;
      clearPoll();
    };
  }, [fetchIntentStatus, autoRefresh, enabled, refreshInterval]);

  return {
    statuses,
    isLoading,
    error,
    isComplete,
    refetch: () => void fetchIntentStatus(false),
  };
}
