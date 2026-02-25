import React, { useState, useMemo } from "react";
import { useCompacts, CompactRecord } from "../hooks/useCompacts";
import { formatAddress, formatTimestamp } from "../utils/formatting";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useIntentStatus } from "../hooks/useIntentStatus";
import { getBlockExplorerTxUrl } from "../utils/chains";

const AccountResourceLockBalances: React.FC = () => {
  const { address } = useAccount();
  const {
    compacts: databaseCompacts,
    isLoading: compactsLoading,
    refetch: refetchCompacts,
  } = useCompacts(address ?? "");

  const [expandedCompacts, setExpandedCompacts] = useState<Set<string>>(
    new Set(),
  );

  // Group registered compacts by chain
  const groupedRegisteredCompacts = useMemo(() => {
    if (!databaseCompacts) return {};

    return databaseCompacts.reduce(
      (acc, compact) => {
        const groupKey = `chain-${compact.chainId}`;
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey].push(compact);
        return acc;
      },
      {} as Record<string, CompactRecord[]>,
    );
  }, [databaseCompacts]);

  const toggleCompactExpanded = (claimHash: string) => {
    const newExpanded = new Set(expandedCompacts);
    if (newExpanded.has(claimHash)) {
      newExpanded.delete(claimHash);
    } else {
      newExpanded.add(claimHash);
    }
    setExpandedCompacts(newExpanded);
  };

  if (compactsLoading) {
    return (
      <div className="p-6 bg-[#0a0a0a] rounded-lg shadow-xl border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">
          Your Intents History
        </h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff00]"></div>
          <span className="ml-3 text-gray-400">Loading intents history...</span>
        </div>
      </div>
    );
  }

  const hasCompacts = databaseCompacts && databaseCompacts.length > 0;
  const groupKeys = Object.keys(groupedRegisteredCompacts);

  if (!hasCompacts) {
    return (
      <div className="p-6 bg-[#0a0a0a] rounded-lg shadow-xl border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">
          Your Intents History
        </h2>
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2 text-lg">📄 No intents found</div>
          <div className="text-gray-500 text-sm">
            Intents will appear here once they are created
          </div>
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    refetchCompacts();
  };

  return (
    <div className="p-6 bg-[#0a0a0a] rounded-lg shadow-xl border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Your Intents History</h2>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-3">
          {groupKeys.map(
            (groupKey) =>
              groupedRegisteredCompacts[groupKey] && (
                <div
                  key={groupKey}
                  className="bg-gray-900 rounded-lg border border-gray-700 p-4"
                >
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    {groupKey.replace("chain-", "Chain ")}
                  </h4>
                  <div className="space-y-2">
                    {groupedRegisteredCompacts[groupKey].map((compact) => (
                      <DatabaseCompactCard
                        key={compact.hash}
                        compact={compact}
                        isExpanded={expandedCompacts.has(compact.hash)}
                        onToggleExpanded={() =>
                          toggleCompactExpanded(compact.hash)
                        }
                      />
                    ))}
                  </div>
                </div>
              ),
          )}
        </div>
      </div>
    </div>
  );
};

interface DatabaseCompactCardProps {
  compact: CompactRecord;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const DatabaseCompactCard: React.FC<DatabaseCompactCardProps> = ({
  compact,
  isExpanded,
  onToggleExpanded,
}) => {
  const { address } = useAccount();
  const isExpired =
    new Date(parseInt(compact.compact.expires) * 1000) < new Date();

  // Fetch intent status with auto-refresh every 5 seconds
  const {
    statuses,
    isLoading: isStatusLoading,
    error: statusError,
  } = useIntentStatus(
    address,
    compact.compact.nonce,
    true, // enabled
    true, // autoRefresh
    5000, // 5 second refresh interval
  );

  // Determine overall status
  const getOverallStatus = () => {
    if (isStatusLoading)
      return { label: "Loading...", color: "bg-blue-900 text-blue-300" };
    if (statusError)
      return { label: "Error", color: "bg-red-900 text-red-300" };
    if (!statuses || statuses.length === 0)
      return { label: "Pending", color: "bg-yellow-900 text-yellow-300" };

    // Check if all transactions are successful
    const allSuccess = statuses.every((s) => s.status === "success");
    if (allSuccess)
      return { label: "Completed", color: "bg-green-900 text-green-300" };

    // Check if any transaction failed
    const anyFailed = statuses.some(
      (s) => s.status === "failed" || s.status === "reverted",
    );
    if (anyFailed) return { label: "Failed", color: "bg-red-900 text-red-300" };

    // Otherwise, in progress
    return { label: "In Progress", color: "bg-blue-900 text-blue-300" };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-600 p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white">Intent</span>
            {/* Intent Status Badge */}
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${overallStatus.color}`}
            >
              {overallStatus.label}
            </span>
          </div>

          <div className="text-xs text-gray-400">
            Amount: {compact.compact.amount} Wei
          </div>

          <div className="text-xs text-gray-400">
            Expires: {formatTimestamp(compact.compact.expires)}
          </div>

          <div className="text-xs text-gray-400 font-mono break-all">
            Hash: {compact.hash.slice(0, 10)}...
          </div>

          {/* Show transaction count if available */}
          {statuses && statuses.length > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              Transactions: {statuses.length}
            </div>
          )}
        </div>

        <button
          onClick={onToggleExpanded}
          className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
        >
          {isExpanded ? "Hide" : "Details"}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-600 space-y-4">
          {/* Intent Status Transactions */}
          {statuses && statuses.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-300 mb-2">
                Intent Transactions:
              </div>
              <div className="space-y-2">
                {statuses.map((tx, index) => {
                  const explorerUrl = getBlockExplorerTxUrl(
                    tx.chainId,
                    tx.transactionHash,
                  );
                  return (
                    <div
                      key={index}
                      className="p-2 bg-gray-700 rounded border border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">
                          Transaction {index + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            tx.status === "success"
                              ? "bg-green-500/20 text-green-400"
                              : tx.status === "failed" ||
                                  tx.status === "reverted"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        <span className="text-gray-500">Chain:</span>{" "}
                        {tx.chainId}
                      </div>
                      <div className="text-xs text-gray-400 font-mono break-all">
                        <span className="text-gray-500">Hash:</span>{" "}
                        {explorerUrl ? (
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00ff00] hover:text-[#00dd00] underline transition-colors"
                          >
                            {tx.transactionHash}
                          </a>
                        ) : (
                          tx.transactionHash
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Compact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500">Status:</span>
              <div className="mt-1">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    isExpired
                      ? "bg-red-900 text-red-300"
                      : "bg-green-900 text-green-300"
                  }`}
                >
                  {isExpired ? "Expired" : "Active"}
                </span>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Chain ID:</span>
              <div className="font-mono text-gray-300 mt-1">
                {compact.chainId}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Arbiter:</span>
              <div className="font-mono text-gray-300">
                {formatAddress(compact.compact.arbiter)}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Sponsor:</span>
              <div className="font-mono text-gray-300">
                {formatAddress(compact.compact.sponsor)}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Nonce:</span>
              <div className="font-mono text-gray-300 break-all">
                {compact.compact.nonce}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Lock ID:</span>
              <div className="font-mono text-gray-300 break-all">
                {compact.compact.id}
              </div>
            </div>

            {compact.witnessData && (
              <>
                {compact.witnessData.tokenIn && (
                  <div>
                    <span className="text-gray-500">Token In:</span>
                    <div className="font-mono text-gray-300 break-all">
                      {formatAddress(compact.witnessData.tokenIn)}
                    </div>
                  </div>
                )}
                {compact.witnessData.tokenInAmount && (
                  <div>
                    <span className="text-gray-500">Token In Amount:</span>
                    <div className="font-mono text-gray-300">
                      {formatUnits(
                        BigInt(compact.witnessData.tokenInAmount),
                        18,
                      )}
                    </div>
                  </div>
                )}
                {compact.witnessData.tokenOut && (
                  <div>
                    <span className="text-gray-500">Token Out:</span>
                    <div className="font-mono text-gray-300 break-all">
                      {formatAddress(compact.witnessData.tokenOut)}
                    </div>
                  </div>
                )}
                {compact.witnessData.minTokenOut && (
                  <div>
                    <span className="text-gray-500">Min Token Out:</span>
                    <div className="font-mono text-gray-300">
                      {formatUnits(BigInt(compact.witnessData.minTokenOut), 18)}
                    </div>
                  </div>
                )}
                {compact.witnessData.destinationChainId && (
                  <div>
                    <span className="text-gray-500">Destination Chain ID:</span>
                    <div className="font-mono text-gray-300">
                      {compact.witnessData.destinationChainId}
                    </div>
                  </div>
                )}
                {compact.witnessData.protocolHashIdentifier && (
                  <div>
                    <span className="text-gray-500">
                      Protocol Hash Identifier:
                    </span>
                    <div className="font-mono text-gray-300 break-all">
                      {compact.witnessData.protocolHashIdentifier}
                    </div>
                  </div>
                )}
                {compact.witnessData.recipient && (
                  <div>
                    <span className="text-gray-500">Recipient:</span>
                    <div className="font-mono text-gray-300 break-all">
                      {compact.witnessData.recipient}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountResourceLockBalances;
