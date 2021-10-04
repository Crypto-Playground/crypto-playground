import { ethers } from "ethers";

const connectButton = document.getElementById("connect") as HTMLButtonElement;
const donateButton = document.getElementById("donate") as HTMLButtonElement;
const takeButton = document.getElementById("take") as HTMLButtonElement;

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
  provider: ethers.providers.Web3Provider
): ethers.Contract =>
  new ethers.Contract(getJarContractAddress(), PENNY_JAR_ABI, provider);

/** Get the jar balance as a formatted string. */
const getJarBalance = async (
  provider: ethers.providers.Web3Provider
): Promise<string> =>
  ethers.utils.formatEther(await provider.getBalance(getJarContractAddress()));

/** Get the jar's current message. */
const getJarMessage = async (
  provider: ethers.providers.Web3Provider
): Promise<string> => await getJarContract(provider).getMessage();

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

/** Update the jar status. */
const updateJar = async (
  provider: ethers.providers.Web3Provider
): Promise<void> => {
  await updateJarBalance(provider);
  await updateJarMessage(provider);
};

//
// Initialization code
//

// Manage the connect button.
let connected: boolean = false;
let provider: ethers.providers.Web3Provider | null = null;

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
