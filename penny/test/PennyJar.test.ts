import { ethers } from "hardhat";
import type {
  Contract,
  ContractTransaction,
  ContractReceipt,
  BigNumber,
} from "ethers";
import { assert, expect } from "chai";

describe("PennyJar", () => {
  /** One ETH, in wei. */
  const ETH_1 = ethers.utils.parseEther("1.0");

  /** Deploy the PennyJar.sol contract to the blockchain. */
  const deploy = async (message: string): Promise<Contract> => {
    const PennyJar = await ethers.getContractFactory("PennyJar");
    const pennyJar = await PennyJar.deploy(message);
    return await pennyJar.deployed();
  };

  it("Should have an initial balance of zero when deployed", async () => {
    const pennyJar = await deploy("initial message");
    const balance = await pennyJar.provider.getBalance(pennyJar.address);
    expect(balance).to.equal(0);
  });

  describe("getMessage()", () => {
    it("Should return the constructor message", async () => {
      const pennyJar = await deploy("Have a penny, take a penny");
      const message: string = await pennyJar.getMessage();
      expect(message).to.equal("Have a penny, take a penny");
    });
  });

  describe("donatePennies()", () => {
    it("Should demand a donation", async () => {
      const pennyJar = await deploy("hi");

      try {
        // Send 0ETH to the Penny Jar. So uncool.
        const badTxn = await pennyJar.donatePennies("nope", { value: 0 });
        assert(false);
      } catch {
        assert(true);
      }
    });

    it("Should update the message", async () => {
      const pennyJar = await deploy("initial message");

      // Donate 1ETH to the Penny Jar
      const donateTxn: ContractTransaction = await pennyJar.donatePennies(
        "updated message",
        { value: ETH_1 }
      );
      await donateTxn.wait();

      // Make sure we successfully updated the penny jar's message
      const message: string = await pennyJar.getMessage();
      expect(message).to.equal("updated message");

      // Make sure the penny jar contract has 1ETH!
      const newBalance = await pennyJar.provider.getBalance(pennyJar.address);
      expect(newBalance).to.equal(ETH_1);
    });
  });

  describe("takePennies()", () => {
    it("Should prevent pennies from being taken when there are none.", async () => {
      const pennyJar = await deploy("test");

      try {
        // Try to take 1 ETH from a contract that has a balance of 0 ETH
        const takeTxn: ContractTransaction = await pennyJar.takePennies({
          value: ETH_1,
        });
        await takeTxn.wait();
        assert(false);
      } catch {
        assert(true);
      }
    });

    it("Should prevent too many pennies from being taken.", async () => {
      const pennyJar = await deploy("test");

      const [owner, addr1, addr2] = await ethers.getSigners();

      // Donate 1 ETH to the penny jar
      const donateTxn: ContractTransaction = await pennyJar.donatePennies(
        "test2",
        { value: ETH_1 }
      );
      await donateTxn.wait();

      try {
        // Try to take 0.51 ETH from a contract that has a balance of 1.0 ETH
        const takeTxn: ContractTransaction = await pennyJar
          .connect(addr2)
          .takePennies(ethers.utils.parseEther("0.51"));
        await takeTxn.wait();
        assert(false);
      } catch {
        assert(true);
      }
    });

    it("Should allow a sensible number of pennies to be taken.", async () => {
      const pennyJar = await deploy("test");

      const [owner, addr1, addr2] = await ethers.getSigners();

      // Donate 1 ETH to the penny jar
      const donateTxn: ContractTransaction = await pennyJar.donatePennies(
        "test2",
        { value: ETH_1 }
      );
      await donateTxn.wait();

      // Grab the initial balance of the account that's going to *take* pennies
      const takerInitialBalance = await addr2.getBalance();

      // Take 0.25 ETH from the penny jar
      const takeTxn: ContractTransaction = await pennyJar
        .connect(addr2)
        .takePennies(ethers.utils.parseEther("0.25"));
      const receipt: ContractReceipt = await takeTxn.wait();

      // Ensure that the account that took pennies has a sensible final
      // balance, namely 0.25ETH - whatever we spent on gas
      const takerFinalBalance = await addr2.getBalance();
      const gasCost = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      expect(takerFinalBalance.sub(takerInitialBalance).add(gasCost)).to.equal(
        ethers.utils.parseEther("0.25")
      );

      // Ensure that the penny jar is left with exactly 0.75 ETH
      const pennyJarBalance = await pennyJar.provider.getBalance(
        pennyJar.address
      );
      expect(pennyJarBalance).to.equal(ethers.utils.parseEther("0.75"));
    });
  });
});
