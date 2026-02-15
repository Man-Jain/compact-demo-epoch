import React, { useState, useMemo } from 'react';
import {
  useAccountResourceLockBalances,
  ResourceLockBalance,
} from '../hooks/useAccountResourceLockBalances';
import { useCompacts, CompactRecord } from '../hooks/useCompacts';
import { formatAddress, formatTimestamp } from '../utils/formatting';
import { formatUnits } from 'viem';
import { useAccount, useChainId } from 'wagmi';
import { ForcedWithdrawalDialog } from './ForcedWithdrawalDialog';
import { InitiateForcedWithdrawalDialog } from './InitiateForcedWithdrawalDialog';
import { useCompact } from '../hooks/useCompact';
import { useIntentStatus } from '../hooks/useIntentStatus';
import { getBlockExplorerTxUrl } from '../utils/chains';

const AccountResourceLockBalances: React.FC = () => {
  const { accountData, isLoading, error, refetch } =
    useAccountResourceLockBalances();
  const { address } = useAccount();

  // // Get session token for compacts
  // const sessionToken = useMemo(() => {
  //   if (accountData?.address) {
  //     return localStorage.getItem(`session-${accountData.address}`) ?? null;
  //   }
  //   return null;
  // }, [accountData?.address]);

  // Use compacts from database instead of GraphQL registered compacts
  const { compacts: databaseCompacts, isLoading: compactsLoading } =
    useCompacts(address ?? '');

  const [expandedBalances, setExpandedBalances] = useState<Set<string>>(
    new Set()
  );
  const [expandedCompacts, setExpandedCompacts] = useState<Set<string>>(
    new Set()
  );

  // Group resource locks by allocator for better organization
  const groupedResourceLocks = useMemo(() => {
    if (!accountData?.resourceLocks.items) return {};

    return accountData.resourceLocks.items.reduce(
      (acc, balance) => {
        const allocatorAddress = balance.resourceLock.allocatorAddress;
        if (!acc[allocatorAddress]) {
          acc[allocatorAddress] = [];
        }
        acc[allocatorAddress].push(balance);
        return acc;
      },
      {} as Record<string, ResourceLockBalance[]>
    );
  }, [accountData?.resourceLocks.items]);

  // Group registered compacts by allocator (using database compacts)
  const groupedRegisteredCompacts = useMemo(() => {
    if (!databaseCompacts) return {};

    return databaseCompacts.reduce(
      (acc, compact) => {
        // For database compacts, we'll group by chainId since we don't have allocator info
        const groupKey = `chain-${compact.chainId}`;
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey].push(compact);
        return acc;
      },
      {} as Record<string, CompactRecord[]>
    );
  }, [databaseCompacts]);

  const toggleBalanceExpanded = (lockId: string) => {
    const newExpanded = new Set(expandedBalances);
    if (newExpanded.has(lockId)) {
      newExpanded.delete(lockId);
    } else {
      newExpanded.add(lockId);
    }
    setExpandedBalances(newExpanded);
  };

  const toggleCompactExpanded = (claimHash: string) => {
    const newExpanded = new Set(expandedCompacts);
    if (newExpanded.has(claimHash)) {
      newExpanded.delete(claimHash);
    } else {
      newExpanded.add(claimHash);
    }
    setExpandedCompacts(newExpanded);
  };

  const formatBalance = (balance: string, decimals: number, symbol: string) => {
    try {
      const formatted = formatUnits(BigInt(balance), decimals);
      return `${formatted} ${symbol}`;
    } catch {
      return `${balance} ${symbol}`;
    }
  };

  const formatResetPeriod = (resetPeriod: string) => {
    const period = parseInt(resetPeriod);
    switch (period) {
      case 0:
        return 'One Second';
      case 1:
        return 'Fifteen Seconds';
      case 2:
        return 'One Minute';
      case 3:
        return 'Ten Minutes';
      case 4:
        return 'One Hour and Five Minutes';
      case 5:
        return 'One Day';
      case 6:
        return 'Seven Days and One Hour';
      case 7:
        return 'Thirty Days';
      default:
        return `Period ${period}`;
    }
  };

  if (isLoading || compactsLoading) {
    return (
      <div className="p-6 bg-[#0a0a0a] rounded-lg shadow-xl border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">
          Resource Lock Balances
        </h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff00]"></div>
          <span className="ml-3 text-gray-400">
            Loading resource lock balances...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#0a0a0a] rounded-lg shadow-xl border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">
          Resource Lock Balances
        </h2>
        <div className="text-center py-12">
          <div className="text-red-400 mb-2 text-lg">
            ⚠️ Error loading resource lock balances
          </div>
          <div className="text-gray-400 text-sm mb-6">{error.message}</div>
          <button
            onClick={refetch}
            className="px-6 py-2 bg-[#00ff00] text-black rounded-lg hover:bg-[#00cc00] transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (
    !accountData ||
    (accountData.resourceLocks.totalCount === 0 &&
      databaseCompacts.length === 0)
  ) {
    return (
      <div className="p-6 bg-[#0a0a0a] rounded-lg shadow-xl border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">
          Resource Lock Balances
        </h2>
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2 text-lg">
            📄 No resource locks or compacts found
          </div>
          <div className="text-gray-500 text-sm">
            Resource locks and compacts will appear here once they are created
          </div>
        </div>
      </div>
    );
  }

  const allAllocators = new Set([
    ...Object.keys(groupedResourceLocks),
    ...Object.keys(groupedRegisteredCompacts),
  ]);

  return (
    <div className="p-6 bg-[#0a0a0a] rounded-lg shadow-xl border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">
          Resource Lock Balances & Database Compacts
        </h2>
        <button
          onClick={refetch}
          className="px-4 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Vertical layout */}
      <div className="space-y-8">
        {/* Resource Lock Balances */}
        <div className="space-y-4">
          <h3 className="text-md font-semibold text-white mb-4">
            Resource Lock Balances
          </h3>
          <div className="max-h-96 overflow-y-auto space-y-3">
            {Array.from(allAllocators).map(
              (allocatorAddress) =>
                groupedResourceLocks[allocatorAddress] && (
                  <div
                    key={allocatorAddress}
                    className="bg-gray-900 rounded-lg border border-gray-700 p-4"
                  >
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Allocator: {formatAddress(allocatorAddress)}
                    </h4>
                    <div className="space-y-2">
                      {groupedResourceLocks[allocatorAddress].map((balance) => (
                        <ResourceLockBalanceCard
                          key={balance.resourceLock.lockId}
                          balance={balance}
                          isExpanded={expandedBalances.has(
                            balance.resourceLock.lockId
                          )}
                          onToggleExpanded={() =>
                            toggleBalanceExpanded(balance.resourceLock.lockId)
                          }
                          formatBalance={formatBalance}
                          formatResetPeriod={formatResetPeriod}
                        />
                      ))}
                    </div>
                  </div>
                )
            )}
          </div>
        </div>

        {/* Database Compacts */}
        <div className="space-y-4">
          <h3 className="text-md font-semibold text-white mb-4">
            Database Compacts
          </h3>
          <div className="max-h-96 overflow-y-auto space-y-3">
            {Array.from(allAllocators).map(
              (groupKey) =>
                groupedRegisteredCompacts[groupKey] && (
                  <div
                    key={groupKey}
                    className="bg-gray-900 rounded-lg border border-gray-700 p-4"
                  >
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      {groupKey.replace('chain-', 'Chain ')}
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
                )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ResourceLockBalanceCardProps {
  balance: ResourceLockBalance;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  formatBalance: (balance: string, decimals: number, symbol: string) => string;
  formatResetPeriod: (resetPeriod: string) => string;
}

const ResourceLockBalanceCard: React.FC<ResourceLockBalanceCardProps> = ({
  balance,
  isExpanded,
  onToggleExpanded,
  formatBalance,
  formatResetPeriod,
}) => {
  const { resourceLock } = balance;
  const chainId = useChainId();
  const { disableForcedWithdrawal } = useCompact();
  const [showForcedWithdrawalDialog, setShowForcedWithdrawalDialog] =
    useState(false);
  const [showInitiateDialog, setShowInitiateDialog] = useState(false);

  const isNative =
    resourceLock.tokenAddress === '0x0000000000000000000000000000000000000000';

  // Check if withdrawal can be executed
  const canExecuteWithdrawal = useMemo(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    const withdrawableAt = parseInt(balance.withdrawableAt || '0');
    return (
      balance.withdrawalStatus !== 0 &&
      withdrawableAt > 0 &&
      withdrawableAt <= currentTime
    );
  }, [balance.withdrawalStatus, balance.withdrawableAt]);

  // Check if withdrawal is initiated but not yet ready
  const isWithdrawalInitiated = useMemo(() => {
    return balance.withdrawalStatus !== 0;
  }, [balance.withdrawalStatus]);

  const handleDisableForcedWithdrawal = async () => {
    try {
      await disableForcedWithdrawal({
        args: [BigInt(resourceLock.lockId)],
      });
    } catch (error) {
      console.error('Error disabling forced withdrawal:', error);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-600 p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white">
              {resourceLock.name || (isNative ? 'ETH' : 'Token')}
            </span>
            <span className="text-xs text-gray-400">
              ({resourceLock.symbol || (isNative ? 'ETH' : 'TOKEN')})
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                resourceLock.isMultichain
                  ? 'bg-blue-900 text-blue-300'
                  : 'bg-purple-900 text-purple-300'
              }`}
            >
              {resourceLock.isMultichain ? 'Multichain' : 'Chain Specific'}
            </span>
          </div>

          <div className="text-sm text-gray-300">
            Balance:{' '}
            <span className="text-white font-medium">
              {formatBalance(
                balance.balance,
                resourceLock.decimals,
                resourceLock.symbol || 'TOKEN'
              )}
            </span>
          </div>

          <div className="text-xs text-gray-400 break-all">
            Lock ID: {resourceLock.lockId} | Reset:{' '}
            {formatResetPeriod(resourceLock.resetPeriod)}
          </div>
        </div>

        <div className="flex gap-2">
          {!isWithdrawalInitiated && (
            <button
              onClick={() => setShowInitiateDialog(true)}
              className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
            >
              Initiate Withdrawal
            </button>
          )}
          {canExecuteWithdrawal && (
            <button
              onClick={() => setShowForcedWithdrawalDialog(true)}
              className="px-3 py-1 text-xs bg-[#00ff00] text-gray-900 rounded hover:bg-[#00dd00] transition-colors font-medium"
            >
              Withdraw
            </button>
          )}
          {isWithdrawalInitiated && (
            <button
              onClick={handleDisableForcedWithdrawal}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Disable Withdrawal
            </button>
          )}
          <button
            onClick={onToggleExpanded}
            className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
          >
            {isExpanded ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {showForcedWithdrawalDialog && (
        <ForcedWithdrawalDialog
          isOpen={showForcedWithdrawalDialog}
          onClose={() => setShowForcedWithdrawalDialog(false)}
          lockId={resourceLock.lockId}
          maxAmount={balance.balance}
          decimals={resourceLock.decimals}
          symbol={resourceLock.symbol || 'TOKEN'}
          tokenName={resourceLock.name || (isNative ? 'ETH' : 'Token')}
          chainId={chainId}
        />
      )}

      {showInitiateDialog && (
        <InitiateForcedWithdrawalDialog
          isOpen={showInitiateDialog}
          onClose={() => setShowInitiateDialog(false)}
          lockId={resourceLock.lockId}
          resetPeriod={parseInt(resourceLock.resetPeriod)}
        />
      )}

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500">Token Address:</span>
              <div className="font-mono text-gray-300 break-all">
                {isNative
                  ? 'Native (0x0...)'
                  : formatAddress(resourceLock.tokenAddress)}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Total Supply:</span>
              <div className="text-gray-300">
                {formatBalance(
                  resourceLock.totalSupply,
                  resourceLock.decimals,
                  resourceLock.symbol || 'TOKEN'
                )}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Minted At:</span>
              <div className="text-gray-300">
                {formatTimestamp(resourceLock.mintedAt)}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Last Updated:</span>
              <div className="text-gray-300">
                {formatTimestamp(balance.lastUpdatedAt)}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Withdrawal Status:</span>
              <div className="text-gray-300">
                {balance.withdrawalStatus === 0
                  ? 'Normal'
                  : `Status ${balance.withdrawalStatus}`}
              </div>
            </div>
            {balance.withdrawableAt !== '0' && (
              <div>
                <span className="text-gray-500">Withdrawable At:</span>
                <div className="text-gray-300">
                  {formatTimestamp(balance.withdrawableAt)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
  const { statuses, isLoading: isStatusLoading, error: statusError } = useIntentStatus(
    address,
    compact.compact.nonce,
    true, // enabled
    true, // autoRefresh
    5000  // 5 second refresh interval
  );

  // Determine overall status
  const getOverallStatus = () => {
    if (isStatusLoading) return { label: 'Loading...', color: 'bg-blue-900 text-blue-300' };
    if (statusError) return { label: 'Error', color: 'bg-red-900 text-red-300' };
    if (!statuses || statuses.length === 0) return { label: 'Pending', color: 'bg-yellow-900 text-yellow-300' };
    
    // Check if all transactions are successful
    const allSuccess = statuses.every(s => s.status === 'success');
    if (allSuccess) return { label: 'Completed', color: 'bg-green-900 text-green-300' };
    
    // Check if any transaction failed
    const anyFailed = statuses.some(s => s.status === 'failed' || s.status === 'reverted');
    if (anyFailed) return { label: 'Failed', color: 'bg-red-900 text-red-300' };
    
    // Otherwise, in progress
    return { label: 'In Progress', color: 'bg-blue-900 text-blue-300' };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-600 p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white">
              Database Compact
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                isExpired
                  ? 'bg-red-900 text-red-300'
                  : 'bg-green-900 text-green-300'
              }`}
            >
              {isExpired ? 'Expired' : 'Active'}
            </span>
            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300">
              Chain {compact.chainId}
            </span>
            {/* Intent Status Badge */}
            <span className={`px-2 py-1 rounded text-xs font-medium ${overallStatus.color}`}>
              {overallStatus.label}
            </span>
          </div>

          <div className="text-xs text-gray-400">
            Amount: {formatUnits(BigInt(compact.compact.amount), 18)} USDT
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
          {isExpanded ? 'Hide' : 'Details'}
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
                  const explorerUrl = getBlockExplorerTxUrl(tx.chainId, tx.transactionHash);
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
                            tx.status === 'success'
                              ? 'bg-green-500/20 text-green-400'
                              : tx.status === 'failed' || tx.status === 'reverted'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        <span className="text-gray-500">Chain:</span>{' '}
                        {tx.chainId}
                      </div>
                      <div className="text-xs text-gray-400 font-mono break-all">
                        <span className="text-gray-500">Hash:</span>{' '}
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
                        18
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
