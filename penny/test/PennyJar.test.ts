import { ethers } from "hardhat";
import type {
  Contract,
  ContractTransaction,
  ContractReceipt,
  BigNumber,
} from "ethers";
import { assert, expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("PennyJar", () => {
  /** One quarter ETH, in wei. */
  const ETH_025 = ethers.utils.parseEther("0.25");

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
    it("should fail with a zero donation", async () => {
      const pennyJar = await deploy("hi");

      try {
        // Send 0ETH to the Penny Jar. So uncool.
        const badTxn = await pennyJar.donatePennies("nope", { value: 0 });
        assert(false);
      } catch {
        assert(true);
      }
    });

    describe("success cases", () => {
      let pennyJar: Contract;
      let donateTxn: ContractTransaction;

      beforeEach(async () => {
        pennyJar = await deploy("initial");
        // Donate 1ETH to the Penny Jar
        donateTxn = await pennyJar.donatePennies("updated", {
          value: ETH_1,
        });
        await donateTxn.wait();
      });

      it("should update the message", async () => {
        // Make sure we successfully updated the penny jar's message
        const message: string = await pennyJar.getMessage();
        expect(message).to.equal("updated");
      });

      it("should have a new balance", async () => {
        // Make sure the penny jar contract has 1ETH!
        const newBalance = await pennyJar.provider.getBalance(pennyJar.address);
        expect(newBalance).to.equal(ETH_1);
      });

      it("should emit the PenniesDonated event", async () => {
        expect(donateTxn)
          .to.emit(pennyJar, "PenniesDonated")
          .withArgs(await pennyJar.signer.getAddress(), ETH_1, "updated");
      });
    });
  });

  describe("takePennies()", () => {
    it("should fail when there are no pennies", async () => {
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

    it("should fail when too many pennies are taken", async () => {
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

    describe("success cases", () => {
      let pennyJar: Contract;
      let taker: SignerWithAddress;
      let takeTxn: ContractTransaction;
      let takeTxnReceipt: ContractReceipt;
      let takerInitialBalance: BigNumber;

      beforeEach(async () => {
        pennyJar = await deploy("initial");

        taker = (await ethers.getSigners())[2];

        // Donate 1 ETH to the penny jar
        const donateTxn: ContractTransaction = await pennyJar.donatePennies(
          "test2",
          { value: ETH_1 }
        );
        await donateTxn.wait();

        // Grab the initial balance of the account that's going to *take* pennies
        takerInitialBalance = await taker.getBalance();

        // Take 0.25 ETH from the penny jar
        takeTxn = await pennyJar.connect(taker).takePennies(ETH_025);
        takeTxnReceipt = await takeTxn.wait();
      });

      it("should leave a sensible balance with the taker", async () => {
        // Ensure that the account that took pennies has a sensible final
        // balance, namely 0.25ETH - whatever we spent on gas
        const takerFinalBalance = await taker.getBalance();
        const gasCost = takeTxnReceipt.gasUsed.mul(
          takeTxnReceipt.effectiveGasPrice
        );
        expect(
          takerFinalBalance.sub(takerInitialBalance).add(gasCost)
        ).to.equal(ETH_025);
      });

      it("should leave a sensible balance in the jar", async () => {
        // Ensure that the penny jar is left with exactly 0.75 ETH
        const pennyJarBalance = await pennyJar.provider.getBalance(
          pennyJar.address
        );
        expect(pennyJarBalance).to.equal(ethers.utils.parseEther("0.75"));
      });

      it("should emit the PenniesTaken event", async () => {
        // Ensure that we emitted the PenniesTaken event
        expect(takeTxn)
          .to.emit(pennyJar, "PenniesTaken")
          .withArgs(await taker.getAddress(), ETH_025);
      });
    });
  });
});
