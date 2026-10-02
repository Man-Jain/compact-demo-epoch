import assert from "node:assert/strict";
import { mainnetGraph, testnetGraph } from "@epoch-protocol/epoch-commons-sdk";

assert.equal(mainnetGraph.chains.Ethereum.chainId, 1);
assert.equal(mainnetGraph.chains.Robinhood.chainId, 4663);
assert.equal(testnetGraph.chains.Robinhood.chainId, 46630);
assert.equal(mainnetGraph.tokens.ETH.decimals, 18);
assert.equal(mainnetGraph.tokens.ETH.contractAddress.Ethereum, "0x0000000000000000000000000000000000000000");
assert.equal(mainnetGraph.tokens.ETH.contractAddress.Robinhood, "0x0000000000000000000000000000000000000000");
assert.ok(mainnetGraph.tokens.WETH.contractAddress.Robinhood);
assert.equal(mainnetGraph.tokens.USDG.decimals, 6);
assert.ok(mainnetGraph.tokens.USDe.contractAddress.Robinhood);
assert.equal(testnetGraph.tokens.USDC.decimals, 18);
assert.ok(testnetGraph.tokens.USDC.contractAddress.Robinhood);
console.log("Canonical Commons Ethereum, Robinhood mainnet and testnet graph checks passed");
