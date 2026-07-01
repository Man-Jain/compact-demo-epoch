interface GaslessEnableButtonProps {
  gasless: boolean;
  onEnable: () => void;
  onDisable: () => void;
  disabledReason?: string | null;
  needsEpochSetup?: boolean;
  onSwitchSmartAccount?: () => void;
  setupBusy?: boolean;
  setupError?: string | null;
  checking?: boolean;
  className?: string;
}

function SparklesIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  );
}

export function GaslessEnableButton({
  gasless,
  onEnable,
  onDisable,
  disabledReason,
  needsEpochSetup = false,
  onSwitchSmartAccount,
  setupBusy = false,
  setupError,
  checking = false,
  className = "",
}: GaslessEnableButtonProps) {
  const blocked = !!disabledReason;
  const busy = setupBusy || checking;

  if (gasless) {
    return (
      <div
        className={`flex flex-col gap-2 rounded-lg border border-[#00ff00]/35 bg-[#00ff00]/10 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#00ff00]">
            Gasless enabled
          </p>
          <p className="mt-0.5 text-xs leading-snug text-gray-400">
            Epoch smart account active — you only sign, we sponsor Compact
            deposit gas.
          </p>
        </div>
        <button
          type="button"
          onClick={onDisable}
          className="shrink-0 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:bg-gray-700 hover:text-gray-100"
        >
          Use standard
        </button>
      </div>
    );
  }

  const showSwitch =
    needsEpochSetup && !blocked && typeof onSwitchSmartAccount === "function";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {showSwitch ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => !busy && onSwitchSmartAccount()}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border border-[#00ff00]/35 bg-[#00ff00] px-4 py-2.5 text-sm font-semibold text-gray-900 transition-opacity hover:bg-[#00dd00] ${
            busy ? "cursor-not-allowed opacity-60" : ""
          }`}
        >
          {busy ? (
            <span className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
          ) : (
            <SparklesIcon />
          )}
          {busy ? "Switching smart account…" : "Switch to Epoch smart account"}
        </button>
      ) : (
        <button
          type="button"
          disabled={blocked || busy}
          title={blocked ? disabledReason : undefined}
          onClick={() => !blocked && !busy && onEnable()}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border border-[#00ff00]/35 bg-gray-800 px-4 py-2.5 text-sm font-semibold text-[#00ff00] transition-colors hover:bg-gray-700 ${
            blocked || busy ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          <SparklesIcon />
          Enable gasless deposits
        </button>
      )}

      {setupError ? (
        <p className="text-center text-xs leading-snug text-red-400">
          {setupError}
        </p>
      ) : blocked && disabledReason ? (
        <p className="text-center text-xs leading-snug text-gray-500">
          {disabledReason}
        </p>
      ) : showSwitch ? (
        <p className="text-center text-xs leading-snug text-gray-500">
          Sign the 7702 authorization — Epoch relays setup gas, then gasless
          deposits unlock.
        </p>
      ) : (
        <p className="text-center text-xs leading-snug text-gray-500">
          Sign only — no gas for Compact approve + deposit.
        </p>
      )}
    </div>
  );
}
