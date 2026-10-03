# React + TypeScript + Vite

## External solver providers and destination Uniswap v4 pools

The ERC-20 intent form lets a tester choose both the external quote provider
and the destination DEX pool route. The selections are included in the signed
Compact extra data, so the quote and submitted intent use the same routing
constraints.

### Select a solver provider

Under **External Quote Provider**, choose one of:

- **Any enabled provider** — leaves `provider` out of the witness and lets
  enabled solvers compete.
- **Khalani only**, **NEAR Intents only**, or **LI.FI only** —
  signs the selected provider and switches the routing preset to **External —
  multi-transaction**.

The deployed external solver must enable the selected provider through
`ENABLED_PROVIDERS`. Individual providers can also need their corresponding
server credentials or API keys. The browser never receives those credentials.

### Select a DEX pool route

Under **DEX Pool Route**, choose one of:

- **Automatic Uniswap v3 (default)** — no preferred pool is signed; the solver
  uses its regular route discovery and v3 fallback.
- **Base Sepolia hooked Uniswap v4 pool** — locks the destination to Base
  Sepolia Test USDC → Test USDT and signs the deployed hooked `PoolKey` plus
  its required hook data.
- **Ethereum mainnet USDC/USDT Uniswap v4** — locks the destination to
  Ethereum mainnet USDC → USDT and signs Uniswap's public StablePairHook
  `PoolKey`.

Changing a fixed v4 route fills in its destination chain and token pair. For a
cross-chain test, keep the selected source-chain token funded, click **Get
Quote**, inspect the external source transactions and destination swap, then
click **Deposit + Submit Intent**.

For a provider-specific preferred v4 route, the witness has this shape:

```ts
extraDataTypestring: "string provider,string dexPools"
extraData: {
  provider: "khalani", // or near, lifi
  dexPools: encodeDexPools([pool]),
}
```

The actual Compact witness also preserves the demo's legacy
`uint256 somethingKey` declaration. On submission the SDK:

1. For a selected v4 PoolKey, requires one user-paid EIP-5792 atomic batch for the source-chain calls. MetaMask may offer a smart-account upgrade when it reports atomic capability status `ready`.
2. Waits for the external bridge or solver to settle.
3. Refreshes the destination v4 quote and router deadline using the delivered amount.
4. Requests a wallet network switch to the destination chain, then asks for a separate user-paid atomic destination-chain batch for the bounded Permit2 approvals and Universal Router swap. Cross-chain calls are never bundled together.

The external solver derives the LI.FI bridge asset from the signed PoolKey. For
the Robinhood AI/USDG FablesRamp pool, selecting AI makes USDG the required
bridge asset: LI.FI bridges the source asset to Robinhood USDG, then the
refreshed v4 swap converts USDG to AI. The frontend signs the final output
token, destination chain, provider, and complete `PoolKey`; it does not produce
or trust destination router calldata.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from "eslint-plugin-react";

export default tseslint.config({
  // Set the react version
  settings: { react: { version: "18.3" } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs["jsx-runtime"].rules,
  },
});
```
