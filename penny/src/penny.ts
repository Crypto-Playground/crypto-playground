import { ethers } from "ethers";

const connectButton = document.getElementById("connect") as HTMLButtonElement;
const donateButton = document.getElementById("donate") as HTMLButtonElement;
const takeButton = document.getElementById("take") as HTMLButtonElement;

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
  // This line of code actually enables the connection.
  await provider.send("eth_requestAccounts", []);
  return provider;
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
    alert("Sorry, but we were unable to connect. Please try again.");
  }

  connectButton.innerText = "connected";
  connectButton.disabled = true;
  connected = true;

  alert("Connected to account: " + (await provider.getSigner().getAddress()));
};
