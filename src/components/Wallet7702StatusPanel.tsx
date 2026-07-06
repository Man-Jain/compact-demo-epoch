import type {
  DelegationState,
  WalletAccountType,
} from "../gasless/wallet-capability";
import { formatAddress } from "../utils/formatting";

interface Wallet7702StatusPanelProps {
  address?: string;
  chainId?: number;
  chainName?: string;
  accountType: WalletAccountType | null;
  delegation: DelegationState | null;
  delegateAddress?: `0x${string}`;
  is7702Capable: boolean;
  needsEpochSetup: boolean;
  canRelayEnable: boolean;
  canRelayDeposit: boolean;
  chainSupportsGasless: boolean;
  gaslessSelected: boolean;
  checking: boolean;
  onRefresh: () => void;
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "ok" | "warn" | "muted" | "error";
}) {
  const tones = {
    ok: "border-[#00ff00]/35 bg-[#00ff00]/10 text-[#00ff00]",
    warn: "border-amber-500/35 bg-amber-500/10 text-amber-300",
    muted: "border-gray-700 bg-gray-800/80 text-gray-400",
    error: "border-red-500/35 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

function delegationLabel(state: DelegationState | null): string {
  switch (state) {
    case "epoch":
      return "Epoch delegate (7702)";
    case "other":
      return "Other delegate (7702)";
    case "none":
      return "Not delegated";
    default:
      return "Unknown";
  }
}

function delegationTone(
  state: DelegationState | null,
): "ok" | "warn" | "muted" | "error" {
  switch (state) {
    case "epoch":
      return "ok";
    case "other":
      return "error";
    case "none":
      return "muted";
    default:
      return "muted";
  }
}

function walletTypeLabel(type: WalletAccountType | null): string {
  switch (type) {
    case "local":
      return "Local signer";
    case "json-rpc":
      return "Browser wallet";
    case "unknown":
      return "Unknown wallet";
    default:
      return "Not connected";
  }
}

function boolLabel(value: boolean): string {
  return value ? "Yes" : "No";
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span
        className={`min-w-0 text-right break-all text-gray-200 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export function Wallet7702StatusPanel({
  address,
  chainId,
  chainName,
  accountType,
  delegation,
  delegateAddress,
  is7702Capable,
  needsEpochSetup,
  canRelayEnable,
  canRelayDeposit,
  chainSupportsGasless,
  gaslessSelected,
  checking,
  onRefresh,
}: Wallet7702StatusPanelProps) {
  return (
    <div className="rounded-lg border border-gray-800 bg-[#0a0a0a] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-100">
            Wallet & EIP-7702 status
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            On-chain delegation and gasless readiness for this session.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={checking}
          className="shrink-0 rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checking ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <StatusBadge
          label={walletTypeLabel(accountType)}
          tone={accountType === "local" ? "ok" : "muted"}
        />
        <StatusBadge
          label={delegationLabel(delegation)}
          tone={delegationTone(delegation)}
        />
        {gaslessSelected ? (
          <StatusBadge label="Gasless selected" tone="ok" />
        ) : null}
        {checking ? <StatusBadge label="Checking…" tone="muted" /> : null}
      </div>

      <div className="space-y-2 rounded-md border border-gray-800 bg-gray-900/50 p-3">
        {address ? (
          <Row label="Address" value={formatAddress(address)} mono />
        ) : null}
        <Row
          label="Chain"
          value={
            chainId != null ? `${chainName ?? "Unknown"} (${chainId})` : "—"
          }
        />
        <Row label="Gasless chain" value={boolLabel(chainSupportsGasless)} />
        <Row label="7702 capable" value={boolLabel(is7702Capable)} />
        <Row label="Needs Epoch setup" value={boolLabel(needsEpochSetup)} />
        <Row label="Can relay enable" value={boolLabel(canRelayEnable)} />
        <Row label="Can relay deposit" value={boolLabel(canRelayDeposit)} />
        {delegateAddress ? (
          <Row label="Delegate" value={formatAddress(delegateAddress)} mono />
        ) : (
          <Row label="Delegate" value="—" />
        )}
      </div>
    </div>
  );
}
