import { useEffect, useId, useRef, useState } from "react";
import type { TokenInfo } from "../config/web3";
import type { TokenMetadataSource } from "../utils/resolveTokenMetadata";
import {
  findGraphTokenByAddress,
  getTokenLabel,
  isEvmTokenAddress,
} from "../utils/tokens";

interface TokenAddressInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions?: TokenInfo[];
  symbol?: string;
  decimals?: number;
  balance?: string;
  isLoading?: boolean;
  isResolved?: boolean;
  resolutionError?: string;
  source?: TokenMetadataSource;
}

export function TokenAddressInput({
  label,
  value,
  onChange,
  suggestions = [],
  symbol,
  decimals,
  balance,
  isLoading = false,
  isResolved = false,
  resolutionError,
  source,
}: TokenAddressInputProps) {
  const listId = useId();
  const isFocusedRef = useRef(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(value);
    }
  }, [value]);

  const committedValue = value.trim();
  const graphToken = findGraphTokenByAddress(suggestions, committedValue);
  const hasAddress = committedValue.length > 0;
  const isValidAddress = isEvmTokenAddress(committedValue);
  const displaySymbol = symbol ?? graphToken?.symbol;
  const displayDecimals = decimals ?? graphToken?.decimals;

  const commitDraft = () => {
    const trimmed = draft.trim();
    setDraft(trimmed);
    onChange(trimmed);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>

      {suggestions.length > 0 && (
        <select
          value={
            suggestions.find(
              (t) => t.address.toLowerCase() === committedValue.toLowerCase(),
            )?.address ?? ""
          }
          onChange={(e) => {
            const next = e.target.value;
            if (!next) return;
            setDraft(next);
            onChange(next);
          }}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-[#00ff00]"
        >
          <option value="">Quick pick a known token…</option>
          {suggestions.map((token) => (
            <option key={token.address} value={token.address}>
              {token.symbol} ({token.address.slice(0, 6)}…
              {token.address.slice(-4)})
            </option>
          ))}
        </select>
      )}

      <input
        type="text"
        list={listId}
        value={draft}
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          isFocusedRef.current = false;
          commitDraft();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        placeholder="0x..."
        spellCheck={false}
        autoComplete="off"
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-mono text-sm focus:outline-none focus:border-[#00ff00]"
      />
      <datalist id={listId}>
        {suggestions.map((token) => (
          <option key={token.address} value={token.address} />
        ))}
      </datalist>

      <div className="text-xs text-gray-400 break-all">
        {hasAddress && !isValidAddress && (
          <span className="text-red-400">
            Enter a valid ERC-20 address (0x + 40 hex chars). Press Enter or
            click away to apply.
          </span>
        )}
        {hasAddress && isValidAddress && isLoading && (
          <span>Fetching decimals() from chain…</span>
        )}
        {hasAddress && isValidAddress && !isLoading && isResolved && (
          <span>
            {getTokenLabel(committedValue, displaySymbol)}
            {displayDecimals !== undefined
              ? ` · ${displayDecimals} decimals`
              : ""}
            {source ? ` · ${source}` : ""}
          </span>
        )}
        {hasAddress &&
          isValidAddress &&
          !isLoading &&
          !isResolved &&
          resolutionError && (
            <span className="text-red-400">
              Could not read token on chain: {resolutionError}
            </span>
          )}
        {hasAddress &&
          isValidAddress &&
          !isLoading &&
          !isResolved &&
          !resolutionError && (
            <span className="text-yellow-400">
              Waiting for on-chain token metadata…
            </span>
          )}
      </div>

      {balance && displaySymbol && (
        <div className="text-xs text-gray-400">
          Balance:{" "}
          {parseFloat(balance).toLocaleString(undefined, {
            maximumFractionDigits: 6,
          })}{" "}
          {displaySymbol}
        </div>
      )}
    </div>
  );
}
