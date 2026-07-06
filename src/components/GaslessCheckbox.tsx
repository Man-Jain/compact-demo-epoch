interface GaslessCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabledReason?: string | null;
  needsEpochSetup?: boolean;
  onSwitchSmartAccount?: () => void;
  setupBusy?: boolean;
  setupError?: string | null;
  checking?: boolean;
  className?: string;
}

export function GaslessCheckbox({
  checked,
  onChange,
  disabledReason,
  needsEpochSetup = false,
  onSwitchSmartAccount,
  setupBusy = false,
  setupError,
  checking = false,
  className = "",
}: GaslessCheckboxProps) {
  const blocked = !!disabledReason;
  const busy = setupBusy || checking;
  const checkboxDisabled = blocked || busy;

  const showSetup =
    checked &&
    needsEpochSetup &&
    !blocked &&
    typeof onSwitchSmartAccount === "function";

  return (
    <div
      className={`rounded-lg border border-gray-800 bg-gray-900/60 px-3.5 py-3 ${className}`}
    >
      <label
        className={`flex items-start gap-3 ${checkboxDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        title={blocked ? disabledReason : undefined}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={checkboxDisabled}
          onChange={(event) => {
            if (checkboxDisabled) return;
            onChange(event.target.checked);
          }}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-600 bg-gray-800 text-[#00ff00] focus:ring-[#00ff00]/40 focus:ring-offset-0 disabled:cursor-not-allowed"
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-gray-100">
            Gasless deposit (optional)
          </span>
          <span className="mt-0.5 block text-xs leading-snug text-gray-500">
            Epoch sponsors Compact approve + deposit gas via EIP-7702. Local
            signer only — browser wallets use standard deposits.
          </span>
        </span>
      </label>

      {showSetup ? (
        <div className="mt-3 border-t border-gray-800 pt-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => !busy && onSwitchSmartAccount()}
            className={`w-full rounded-lg border border-[#00ff00]/35 bg-[#00ff00] px-3 py-2 text-sm font-semibold text-gray-900 transition-opacity hover:bg-[#00dd00] ${
              busy ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            {busy ? "Setting up smart account…" : "Enable Epoch smart account"}
          </button>
          <p className="mt-2 text-center text-xs leading-snug text-gray-500">
            One-time 7702 authorization — relay pays setup gas, then gasless
            deposits work.
          </p>
        </div>
      ) : null}

      {setupError ? (
        <p className="mt-2 text-xs leading-snug text-red-400">{setupError}</p>
      ) : blocked && disabledReason ? (
        <p className="mt-2 text-xs leading-snug text-gray-500">
          {disabledReason}
        </p>
      ) : checked && !needsEpochSetup && !blocked ? (
        <p className="mt-2 text-xs leading-snug text-[#00ff00]/80">
          Gasless enabled — you sign, Epoch relays deposit transactions.
        </p>
      ) : null}
    </div>
  );
}
