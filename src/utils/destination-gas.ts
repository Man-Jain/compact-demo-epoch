import { zeroAddress } from "viem";

const GAS_UNITS_PER_CALL = 450_000n;
const GAS_PRICE_BUFFER = 2n;
const MIN_FUNDED_CALLS = 3;

/** Budget three user-paid Robinhood calls, with headroom for gas-price changes. */
export function destinationGasBudget(args: {
  bridgeToken: string;
  estimatedBridgeAmount?: bigint;
  gasPriceWei: bigint;
  transactionCount: number;
  walletBalanceWei: bigint;
}): { reserveWei: bigint; requiredWalletWei: bigint; budgetWei: bigint } {
  if (
    args.gasPriceWei <= 0n ||
    !Number.isSafeInteger(args.transactionCount) ||
    args.transactionCount < 1
  ) {
    throw new Error("Cannot estimate destination gas");
  }
  const callCount = BigInt(Math.max(MIN_FUNDED_CALLS, args.transactionCount));
  const budgetWei =
    callCount * GAS_UNITS_PER_CALL * args.gasPriceWei * GAS_PRICE_BUFFER;
  const shortfallWei =
    args.walletBalanceWei >= budgetWei ? 0n : budgetWei - args.walletBalanceWei;
  if (args.bridgeToken.toLowerCase() === zeroAddress) {
    if (shortfallWei > 0n && args.estimatedBridgeAmount === undefined) {
      throw new Error(
        "Cannot verify destination gas reserve without an estimated ETH bridge amount",
      );
    }
    if (
      args.estimatedBridgeAmount !== undefined &&
      args.estimatedBridgeAmount <= shortfallWei
    ) {
      throw new Error(
        "Bridge amount is too small to cover destination gas and swap input. Increase the input amount.",
      );
    }
    return { reserveWei: shortfallWei, requiredWalletWei: 0n, budgetWei };
  }
  return {
    reserveWei: 0n,
    requiredWalletWei: shortfallWei,
    budgetWei,
  };
}
