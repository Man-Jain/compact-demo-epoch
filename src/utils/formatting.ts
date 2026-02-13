export function formatTimeRemaining(
  expiryTimestamp: number,
  currentTime: number
): string {
  const diff = expiryTimestamp - currentTime;

  if (diff <= 0) return 'Ready';

  const days = Math.floor(diff / (24 * 60 * 60));
  const hours = Math.floor((diff % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((diff % (60 * 60)) / 60);
  const seconds = diff % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function formatResetPeriod(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  return `${Math.floor(seconds / 86400)} days`;
}

export function formatAddress(address: string): string {
  if (!address) return '';
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatAmount(amount: string): string {
  try {
    const num = BigInt(amount);
    const eth = Number(num) / 1e18;
    return eth.toFixed(6);
  } catch {
    return amount;
  }
}

export function formatTimestamp(timestamp: string): string {
  try {
    // Handle both Unix timestamp (seconds) and ISO string
    const date = timestamp.includes('T')
      ? new Date(timestamp)
      : new Date(parseInt(timestamp) * 1000);

    return date.toLocaleString();
  } catch {
    return timestamp;
  }
}
