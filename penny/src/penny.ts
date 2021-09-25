const connectButton = document.getElementById("connect") as HTMLButtonElement;
const donateButton = document.getElementById("donate") as HTMLButtonElement;
const takeButton = document.getElementById("take") as HTMLButtonElement;

const isMetaMaskInstalled = () => {
  const { ethereum } = window as { ethereum?: { isMetaMask: boolean } };
  return Boolean(ethereum?.isMetaMask);
};

connectButton.innerText = isMetaMaskInstalled()
  ? "Connect with MetaMask"
  : "Click here to install MetaMask";
