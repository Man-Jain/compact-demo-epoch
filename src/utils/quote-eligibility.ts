export function canRequestQuote(input: {
  connected: boolean;
  address?: string;
  allocatorAddress?: string | null;
  sourceChainId?: number;
  inputAmount: string;
  outputAmount: string;
  tokenType: "erc20" | "native";
  outputResolved: boolean;
  depositResolved: boolean;
  outputDecimals?: number;
  depositDecimals?: number;
  customRoutingValid: boolean;
}): boolean {
  if (!input.connected || !input.address || !input.allocatorAddress) {
    return false;
  }
  if (!Number.isSafeInteger(input.sourceChainId) || input.sourceChainId! < 1) {
    return false;
  }
  if (!input.inputAmount || Number.isNaN(Number(input.inputAmount))) {
    return false;
  }
  if (!input.outputAmount || Number.isNaN(Number(input.outputAmount))) {
    return false;
  }
  if (!input.customRoutingValid) return false;
  if (input.tokenType !== "erc20") return true;
  return (
    input.outputResolved &&
    input.depositResolved &&
    input.outputDecimals !== undefined &&
    input.depositDecimals !== undefined
  );
}
