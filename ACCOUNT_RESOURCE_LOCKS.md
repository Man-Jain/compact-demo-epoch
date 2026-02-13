# Account Resource Lock Balances with Registered Compacts

This implementation adds a new component `AccountResourceLockBalances` that displays both resource lock balances and registered compacts data from the GraphQL indexer.

## Features

- **Resource Lock Balances**: Shows all token balances locked in The Compact contract
- **Registered Compacts**: Displays all registered compacts with their claim status
- **Grouped by Allocator**: Data is organized by allocator for better readability
- **Real-time Updates**: Automatically polls for updates every 10 seconds
- **Expandable Details**: Click "Details" to see full information for each item

## Data Sources

The component uses the GraphQL indexer to fetch:

- `accountResourceLockBalance` - Token balances and lock details
- `registeredCompact` - Compact registrations and claim information

## GraphQL Query

The component queries:

```graphql
query GetAccountResourceLockBalances(
  $accountAddress: String!
  $chainId: BigInt!
) {
  account(address: $accountAddress) {
    address
    registeredCompacts(where: { sponsor: $accountAddress, chainId: $chainId })
    resourceLocks(where: { accountAddress: $accountAddress, chainId: $chainId })
  }
}
```

## Usage

The component is automatically included in the BalancePage and will show:

1. Resource lock balances grouped by allocator
2. Registered compacts grouped by allocator
3. Token information (name, symbol, decimals)
4. Lock details (reset period, scope, etc.)
5. Claim status and details

## Configuration

- GraphQL endpoint: `/graphql` (proxied to `http://localhost:42069`)
- Poll interval: 10 seconds
- Auto-refresh on wallet connection changes
