import { ethers } from "ethers";

// PennyJar smart contract ABI -- this is found in
// artifacts/contracts/PennyJar.sol/PennyJar.json
// and you need to update it if you change and recompile PennyJar.sol
const PENNY_JAR_ABI = [
  {
    inputs: [
      {
        internalType: "string",
        name: "message",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "by",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "message",
        type: "string",
      },
    ],
    name: "PenniesDonated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "by",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "PenniesTaken",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "newMessage",
        type: "string",
      },
    ],
    name: "donatePennies",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "getMessage",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "takePennies",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// See if there's an ethereum provider installed.
const { ethereum } = window as unknown as {
  ethereum?: ethers.providers.ExternalProvider;
};

/** Return true if any ethereum web3 provider is available. */
const isEthereumProviderInstalled = (): boolean => Boolean(ethereum);

/** Return true if the metamask ethereum web3 provider is available. */
const isMetaMaskInstalled = (): boolean => Boolean(ethereum?.isMetaMask);

/** Attempt to connect to the installed ethereum provider; return a signer on success. */
const connectToProvider = async (): Promise<ethers.providers.Web3Provider> => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  // This line of code pops up the metamask interface for account selection.
  await provider.send("eth_requestAccounts", []);
  return provider;
};

/** Get the current contract address. */
const getJarContractAddress = (): string => {
  const addressText = document.getElementById("address") as HTMLInputElement;
  return addressText.value;
};

/** Get a wrapper around the current PennyJar contract. */
const getJarContract = (
  providerOrSigner: ethers.providers.Web3Provider | ethers.Signer
): ethers.Contract =>
  new ethers.Contract(getJarContractAddress(), PENNY_JAR_ABI, providerOrSigner);

/** Get the jar balance as a formatted string. */
const getJarBalance = async (
  provider: ethers.providers.Web3Provider
): Promise<string> =>
  ethers.utils.formatEther(await provider.getBalance(getJarContractAddress()));

/** Get the jar's current message. */
const getJarMessage = async (
  provider: ethers.providers.Web3Provider
): Promise<string> => await getJarContract(provider).getMessage();

/** Get an array of historical donatins and takes to the jar. */
const getJarDonationHistory = async (
  provider: ethers.providers.Web3Provider
): Promise<string[]> => {
  const jar = getJarContract(provider);
  const donateFilter = jar.filters.PenniesDonated();
  const donateEvents = await jar.queryFilter(donateFilter);
  return donateEvents.map((donateEvent) => {
    const ethDonated = ethers.utils.formatEther(donateEvent.args.amount);
    const donatedBy = donateEvent.args.by;
    const newMessage = donateEvent.args.message;
    return `On block number ${donateEvent.blockNumber}, ${donatedBy.slice(
      0,
      8
    )}... donated ${ethDonated}ETH with message '${newMessage}'`;
  });
};

/** Update the jar value in our HTML. */
const updateJarBalance = async (
  provider: ethers.providers.Web3Provider
): Promise<void> => {
  document.getElementById("jar-balance").innerText = await getJarBalance(
    provider
  );
};

/** Update the jar message in our HTML. */
const updateJarMessage = async (
  provider: ethers.providers.Web3Provider
): Promise<void> => {
  document.getElementById("jar-message").innerText = await getJarMessage(
    provider
  );
};

/** Update the historical donations to the jar. */
const updateJarDonationHistory = async (
  provider: ethers.providers.Web3Provider
): Promise<void> => {
  const historyElement = document.getElementById("jar-donation-history");
  historyElement.replaceChildren(...(await getJarDonationHistory(provider)));
};

/** Update the jar status. */
const updateJar = async (
  provider: ethers.providers.Web3Provider
): Promise<void> => {
  await updateJarBalance(provider);
  await updateJarMessage(provider);
  await updateJarDonationHistory(provider);
};

/** Donate to the jar. */
const donatePennies = async (
  provider: ethers.providers.Web3Provider,
  amountEth: ethers.BigNumber,
  message: string
): Promise<void> => {
  const jar = getJarContract(provider.getSigner());
  const donateResponse: ethers.providers.TransactionResponse =
    await jar.donatePennies(message, {
      value: amountEth,
    });
  const donateReceipt: ethers.providers.TransactionReceipt =
    await donateResponse.wait();
  console.log(donateReceipt);
};

/** Take from the jar. */
const takePennies = async (
  provider: ethers.providers.Web3Provider,
  amountEth: ethers.BigNumber
): Promise<void> => {
  const jar = getJarContract(provider.getSigner());
  const takeResponse: ethers.providers.TransactionResponse =
    await jar.takePennies(amountEth);
  const takeReceipt: ethers.providers.TransactionReceipt =
    await takeResponse.wait();
  console.log(takeReceipt);
};

/** Get a single human-readable string describing an error. */
const getErrorMessage = (e: unknown): string => {
  // errors/exceptions from metamask and ethers look a bit different;
  // sometimes they have a top-level message; sometimes they have an
  // embedded message inside `data`, as when the transaction fails on-chain.
  const { message, data } = e as {
    message?: string;
    data?: { message?: string };
  };
  const { message: dataMessage } = data ?? {};
  return dataMessage || message || e.toString();
};

//
// Initialization code
//

// Our three buttons
const connectButton = document.getElementById("connect") as HTMLButtonElement;
const donateButton = document.getElementById("donate") as HTMLButtonElement;
const takeButton = document.getElementById("take") as HTMLButtonElement;

// Global state
let connected: boolean = false;
let provider: ethers.providers.Web3Provider | null = null;

// Hook up the "Connect to Ethereum" button
connectButton.innerText = isEthereumProviderInstalled()
  ? "Connect to Ethereum"
  : "Click here to install MetaMask";
connectButton.onclick = async (e: MouseEvent) => {
  e.preventDefault();

  // Don't do anything if we're already connected.
  if (connected) return;

  // If there's no ethereum provider installed, take us to install MetaMask.
  if (!isEthereumProviderInstalled()) {
    window.location.href = "https://metamask.io/";
    return;
  }

  // Great; let's connect to the ethereum provider.
  try {
    provider = await connectToProvider();
  } catch (e) {
    console.error(e);
    alert(`Sorry, but we were unable to connect: ${e}.`);
  }

  const accountAddress = await provider.getSigner().getAddress();
  connectButton.innerText = `Connected to ${accountAddress}`;
  connectButton.disabled = true;
  connected = true;

  updateJar(provider);
};

// Hook up the "Donate to the jar" button
donateButton.onclick = async (e: MouseEvent) => {
  e.preventDefault();

  // Don't do anything if we're not connected to an Eth provider, like MetaMask.
  if (!connected) return;

  try {
    const amount: string | null = prompt(
      "How much would you like to donate (in Eth)?",
      "0.25"
    );
    if (amount === null) return;
    const amountEth = ethers.utils.parseEther(amount);
    const message: string | null = prompt(
      "What would you like the new message to be?",
      await getJarMessage(provider)
    );
    if (message === null) return;

    await donatePennies(provider, amountEth, message);
    updateJar(provider);
  } catch (e) {
    console.error(e);
    alert(getErrorMessage(e));
  }
};

// Hook up the "Take from the jar" button
takeButton.onclick = async (e: MouseEvent) => {
  e.preventDefault();

  // Don't do anything if we're not connected to an Eth provider, like MetaMask.
  if (!connected) return;

  try {
    const amount: string | null = prompt(
      "How much would you like to take from the jar (in Eth)?",
      "0.25"
    );
    if (amount === null) return;
    const amountEth = ethers.utils.parseEther(amount);

    await takePennies(provider, amountEth);
    updateJar(provider);
  } catch (e) {
    console.error(e);
    alert(getErrorMessage(e));
  }
};
