# PennyJar example dApp

This is the dApp that I cover in "Command-Line Crypto #02 -- Ethereum the Easier Way".

## What does it do?

It's a penny jar. It's an Ethereum contract that you can **donate** money to, or **take** money from.

The jar has a **message** on it. When you donate to the jar, you can change the message.

When you take from the jar, you are restricted to taking at most half its Ether. Of course, you can call again and again. It's Zeno's Penny Jar.

## How does it work?

This dApp has just two parts:

- A very simple web-based **front-end** that connects to MetaMask.
- A smart contract deployed to the Ethereum blockchain. Let's call it the **blockchain-end**.

It does not have a traditional server side (back-end) component.

## How was it built?

The front-end is built using [ethers.js](https://docs.ethers.io/v5/). You may have heard of `web3.js` but my experience is that `ethers.js` has the better API, solid documentation, and all the community momentum. The front-end is bundled using `esbuild`.

The smart contract is written in [Solidity](https://docs.soliditylang.org/en/v0.8.7/). I used the [Hardhat](https://hardhat.org/) toolchain to develop it. In particular, Hardhat lets you (1) run a blockchain locally on your dev box, and (2) write tests in javascript that test your smart contract's functionality &mdash; tests that actually invoke the smart contract _on_ the blockchain. There's a _lot_ of machinery necessary to make this possible, so it's pretty awesome to find it so nicely packaged for devs to use.

## What are the sub-directories here?

Blockchain-related:

- `contracts/` contains the actual `PennyJar.sol` that is deployed to the blockchain
- `test/` contains test code _for our smart contract_
- `scripts/` contain helper scripts for managing and testing our smart contract

Frontend-related:

- `public/` contains the bootstrapping html
- `src/` contains our front-end typescript code

## Can I try it?

Sure. I've deployed the front-end here: (XXX TODO where did I deploy it?)

You can also run it locally:

```
# Run a local blockchain
npx hardhat node

# Deploy the smart contract to the local blockchain
npx hardhat scripts/deploy-penny-jar.ts --network localhost

# Bundle and run frontend
npm run dev
```

When running locally, you'll want to configure MetaMask to talk to the localhost blockchain. Add a new "Custom RPC" network in the MetaMask UI, with `http://localhost:8545/` as the URL for the JSON-RPC endpoint, and `31337` as the associated `chainId`.

When you first start the local blockchain, you'll see that Hardhat automatically populates it with 20-ish test accounts and gives them each 1000ETH. Choose one of them and copy its private key into MetaMask so you can use the account directly.
