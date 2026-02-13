import { useMemo, useState } from 'react';
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import { parseUnits } from 'viem';
import { useNotification } from '../hooks/useNotification';
import { useAllocatorAPI } from '../hooks/useAllocatorAPI';
import { useERC20 } from '../hooks/useERC20';
import { useCompact } from '../hooks/useCompact';
import { useCreateAllocation } from '../hooks/useCreateAllocation';
import { useChainConfig } from '../hooks/use-chain-config';
import { getChainName } from '../utils/chains';
import CompactsList from '../components/CompactsList';
import AccountResourceLockBalances from '../components/AccountResourceLockBalances';
import { WalletConnect } from '../components/WalletConnect';
import { EpochIntentSDK } from '@epoch-protocol/epoch-intents-sdk';
import { TaskType } from '@epoch-protocol/epoch-commons-sdk';

interface IntentTransactionStatus {
  status: string;
  transactionHash: string;
  chainId: number;
}

type TokenType = 'native' | 'erc20';

export default function BalancePage() {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { showNotification } = useNotification();
  const { allocatorAddress } = useAllocatorAPI();
  const { supportedChains } = useChainConfig();
  const { isConfirming } = useCompact();
  const { data: walletClient } = useWalletClient();

  const [tokenType, setTokenType] = useState<TokenType>('erc20');
  const [outputTokenAddress, setOutputTokenAddress] = useState(
    '0x7946dd86eE310D0aC16804A37787289Fa5b88A8A'
  );
  const [depositTokenAddress, setDepositTokenAddress] = useState(
    '0xc04d2869665Be874881133943523723Be5782720'
  );
  const [outputAmount, setOutputAmount] = useState('111');
  const [inputAmount, setInputAmount] = useState('1');
  const [nonce, setNonce] = useState<string | null>(null);
  const [intentStatus, setIntentStatus] = useState<
    IntentTransactionStatus[] | null
  >(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  const {
    decimals,
    isValid,
    isLoading: isLoadingToken,
    symbol,
  } = useERC20(
    tokenType === 'erc20' && outputTokenAddress
      ? (outputTokenAddress as `0x${string}`)
      : undefined
  );

  const {
    symbol: depositSymbol,
    isValid: isValidDeposit,
    isLoading: isLoadingDeposit,
  } = useERC20(
    tokenType === 'erc20' && depositTokenAddress
      ? (depositTokenAddress as `0x${string}`)
      : undefined
  );

  // const { solveWithSolver, isLoading: isLoadingSolveWithSolver } =
  //   useSolveWithSolver();

  // const {
  //   mutate: submitUserIntentMutation,
  //   data: intentResponse,
  //   isPending: isSubmittingUserIntent,
  //   error: submitUserIntentError,
  // } = useSubmitUserIntent();

  const sessionToken = useMemo(
    () =>
      address ? (localStorage.getItem(`session-${address}`) ?? null) : null,
    [address]
  );

  useCreateAllocation(sessionToken ?? '');

  const info = useMemo(() => {
    const chainSpecific = supportedChains?.find(
      (c: any) => c.chainId === chainId.toString()
    );
    return {
      chainName: getChainName(chainId),
      finalizationText: chainSpecific
        ? `Finalized ${chainSpecific.finalizationThresholdSeconds}s after deposit`
        : undefined,
      allocatorAddress,
    };
  }, [supportedChains, chainId, allocatorAddress]);

  const isFormValid = useMemo(() => {
    if (!isConnected || !address || !allocatorAddress) return false;
    if (!inputAmount || isNaN(Number(inputAmount))) return false;
    if (!outputAmount || isNaN(Number(outputAmount))) return false;
    if (tokenType === 'erc20') {
      if (!outputTokenAddress || !isValid || isLoadingToken) return false;
      if (!depositTokenAddress || !isValidDeposit || isLoadingDeposit)
        return false;

      try {
        // decimal check for output amount
        if (decimals !== undefined) {
          const parts = outputAmount.split('.');
          if (parts.length > 1 && parts[1].length > decimals) return false;
        }
      } catch {
        return false;
      }
    }
    return true;
  }, [
    isConnected,
    address,
    allocatorAddress,
    inputAmount,
    outputAmount,
    tokenType,
    outputTokenAddress,
    isValid,
    isLoadingToken,
    depositTokenAddress,
    isValidDeposit,
    isLoadingDeposit,
    decimals,
  ]);

  const onSubmit = async () => {
    if (!isFormValid) return;
    try {
      const epochSdk = new EpochIntentSDK({
        apiBaseUrl: 'http://epoch.intents.dev.epochprotocol.xyz:3000',
        walletClient: walletClient as any,
      });

      const { taskTypeString, intentData } = await epochSdk.getTaskData({
        taskType: TaskType.GetTokenOut,
        intentData: {
          isNative: tokenType === 'native',
          depositTokenAddress,
          tokenInAmount: parseUnits(
            inputAmount || '0',
            decimals ?? 18
          ).toString(),
          outputTokenAddress,
          minTokenOut: parseUnits(
            outputAmount || '0',
            decimals ?? 18
          ).toString(),
          destinationChainId: chainId.toString(),
          protocolHashIdentifier:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          recipient: address as `0x${string}`,
        },
        extraDataTypestring: 'uint256 somethingKey',
        extraData: {
          somethingKey: '123',
        },
      });

      console.log('taskTypeString: ', taskTypeString);
      console.log('intentData: ', intentData);

      const data = await epochSdk.solveIntent({
        isNative: false,
        sponsorAddress: address as `0x${string}`,
        taskTypeString,
        intentData,
        // sessionToken: sessionToken ?? '',
      });
      console.log('data: ', data);

      // Store the nonce from the allocationResponse
      if (data.allocationResponse?.nonce) {
        setNonce(data.allocationResponse.nonce);
      }

      showNotification({
        type: 'success',
        title: 'Deposit + Register + Allocation',
        message:
          'Deposit submitted, compact registered, and allocation created',
        chainId,
        autoHide: true,
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Action Failed',
        message: error instanceof Error ? error.message : 'Failed to submit',
        chainId,
      });
    }
  };

  const checkIntentStatus = async () => {
    if (!nonce || !address) return;

    setIsLoadingStatus(true);
    try {
      const epochSdk = new EpochIntentSDK({
        apiBaseUrl: 'http://epoch.intents.dev.epochprotocol.xyz:3000',
        walletClient: walletClient as any,
      });

      const status = await epochSdk.getIntentStatus(address, nonce);
      setIntentStatus(status);

      showNotification({
        type: 'success',
        title: 'Status Updated',
        message: 'Intent status retrieved successfully',
        chainId,
        autoHide: true,
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Status Check Failed',
        message:
          error instanceof Error ? error.message : 'Failed to check status',
        chainId,
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-3xl font-bold text-white">Balance</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage deposits and allocations.
          </p>
        </div>
        <div className="flex-shrink-0">
          <WalletConnect hasSession={!!sessionToken} />
        </div>
      </div>

      {!isConnected || !address ? (
        <div className="p-12 bg-[#0a0a0a] rounded-lg border border-gray-800 text-center">
          <div className="max-w-md mx-auto">
            <p className="text-gray-300 text-lg mb-2">Please connect your wallet to continue</p>
            <p className="text-gray-500 text-sm">Use the button in the top right corner to connect</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Row: Deposit Form and Your Compacts side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit Form */}
        <div className="p-6 bg-[#0a0a0a] rounded-lg border border-gray-800 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Chain</div>
              <div className="text-gray-200">{info.chainName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Allocator</div>
              <div className="text-gray-200 break-all">
                {info.allocatorAddress}
              </div>
            </div>
            {info.finalizationText && (
              <div className="col-span-2 text-xs text-gray-500">
                {info.finalizationText}
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setTokenType('native')}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                tokenType === 'native'
                  ? 'bg-[#00ff00] text-gray-900'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Native
            </button>
            <button
              type="button"
              onClick={() => setTokenType('erc20')}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                tokenType === 'erc20'
                  ? 'bg-[#00ff00] text-gray-900'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              ERC20
            </button>
          </div>

          {tokenType === 'erc20' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Output Token
              </label>
              <input
                type="text"
                value={outputTokenAddress}
                onChange={(e) => setOutputTokenAddress(e.target.value)}
                placeholder="0x..."
                className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-gray-300 focus:outline-none transition-colors ${
                  outputTokenAddress && !isValid && !isLoadingToken
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-700 focus:border-[#00ff00]'
                }`}
              />
              {tokenType === 'erc20' && isValid && symbol && (
                <div className="mt-1 text-xs text-gray-400">
                  Token: {symbol}
                </div>
              )}
            </div>
          )}

          {tokenType === 'erc20' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Deposit Token Address
              </label>
              <input
                type="text"
                value={depositTokenAddress}
                onChange={(e) => setDepositTokenAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-[#00ff00]"
              />
              {tokenType === 'erc20' &&
                isValidDeposit &&
                depositSymbol &&
                !isLoadingDeposit && (
                  <div className="mt-1 text-xs text-gray-400">
                    Deposit Token: {depositSymbol}
                  </div>
                )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Output Token Amount
              </label>
              <input
                type="text"
                value={outputAmount}
                onChange={(e) => setOutputAmount(e.target.value)}
                placeholder="0.0"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-[#00ff00]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Input Amount
              </label>
              <input
                type="text"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="0.0"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-[#00ff00]"
              />
            </div>
          </div>

          <button
            onClick={onSubmit}
            disabled={!isFormValid || isConfirming}
            className="w-full py-2 px-4 bg-[#00ff00] text-gray-900 rounded-lg font-medium hover:bg-[#00dd00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming ? 'Submitting...' : 'Deposit + Register'}
          </button>
        </div>
        <div>
          <AccountResourceLockBalances />
        </div>
        {/* Your Compacts */}
      </div>

      {/* Bottom Row: Resource Lock Balances and Database Compacts side by side */}
      <div>
        {/* Resource Lock Balances */}
        {/* {sessionToken && ( */}
        <div>
          <CompactsList />
        </div>
        {/* )} */}
      </div>

      {/* Intent Status Section */}
      {nonce && (
        <div className="p-6 bg-[#0a0a0a] rounded-lg border border-gray-800 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-100">
              Intent Status
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Check the status of your intent transaction
            </p>
          </div>

          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-500 mb-1">Nonce</div>
              <div className="text-gray-200 break-all font-mono text-sm">
                {nonce}
              </div>
            </div>

            <button
              onClick={checkIntentStatus}
              disabled={isLoadingStatus}
              className="w-full py-2 px-4 bg-[#00ff00] text-gray-900 rounded-lg font-medium hover:bg-[#00dd00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingStatus ? 'Checking...' : 'Check Intent Status'}
            </button>
          </div>

          {intentStatus && intentStatus.length > 0 && (
            <div className="space-y-3 mt-4">
              <div className="text-sm font-medium text-gray-300">
                Transaction Status:
              </div>
              {intentStatus.map((tx, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">Status</div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        tx.status === 'success'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {tx.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Transaction Hash
                    </div>
                    <div className="text-gray-200 break-all font-mono text-sm">
                      {tx.transactionHash}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Chain ID</div>
                    <div className="text-gray-200">{tx.chainId}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {intentStatus && intentStatus.length === 0 && (
            <div className="text-sm text-gray-400 mt-4">
              No transactions found for this intent.
            </div>
          )}
        </div>
      )}
        </div>
      )}
    </div>
  );
}
