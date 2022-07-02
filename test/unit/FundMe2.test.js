const { assert, expect } = require("chai");
const { getAccountPath } = require("ethers/lib/utils");
const { network, deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe2", function () {
      let fundMe;
      let mockV3Aggregator;
      let deployer;
      let sendValue = ethers.utils.parseEther("1");
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe2", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });
      describe("constructor", function () {
        it("sets the aggregator addresses correctly", async () => {
          const address = await fundMe.getPriceFeed();
          assert.equal(address, mockV3Aggregator.address);
        });
      });
      describe("fund", function () {
        it("Should reject if enough ETH not send", async () => {
          //   await expect(fundMe.fund()).to.be.revertedWith("Spend More ETH");
          await expect(fundMe.fund()).to.be.reverted;
        });
        it("Should update maping data", async () => {
          await fundMe.fund({ value: sendValue });
          const answer = await fundMe.getAddressToFunded(deployer);
          assert.equal(answer.toString(), sendValue.toString());
        });
        it("Adds funder to array", async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getFunder(0);
          assert.equal(response, deployer);
        });
      });
      describe("withdraw", function () {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue });
        });
        it("Wiithdraws ETH from a single funder", async () => {
          const beforeFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const BeforeDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const afterFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const AfterDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          assert(AfterDeployerBalance, 0);
          assert(
            beforeFundMeBalance.add(BeforeDeployerBalance).toString(),
            afterFundMeBalance.add(gasCost).toString()
          );
        });
        it("withdraws with multiple funders", async () => {
          const accounts = await ethers.getSigners();
          for (let i = 0; i < 8; i++) {
            const connectedAccount = await fundMe.connect(accounts[i]);
            await connectedAccount.fund({ value: sendValue });
          }
          const beforeFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const BeforeDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const afterFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const AfterDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          assert(AfterDeployerBalance, 0);
          assert(
            beforeFundMeBalance.add(BeforeDeployerBalance).toString(),
            afterFundMeBalance.add(gasCost).toString()
          );
          await expect(fundMe.getFunder(0)).to.be.reverted;
          for (i = 1; i < 8; i++) {
            assert.equal(
              await fundMe.getAddressToFunded(accounts[i].address),
              0
            );
          }
        });
        it("Only allows the owner to withdraw", async () => {
          const accounts = await ethers.getSigners();
          const connectedContract = await fundMe.connect(accounts[1]);
          await expect(connectedContract.withdraw()).to.be.reverted;
        });
      });
      describe("cheaperWithdraw", function () {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue });
        });
        it("Wiithdraws ETH from a single funder", async () => {
          const beforeFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const BeforeDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const afterFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const AfterDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          assert(AfterDeployerBalance, 0);
          assert(
            beforeFundMeBalance.add(BeforeDeployerBalance).toString(),
            afterFundMeBalance.add(gasCost).toString()
          );
        });
        it("withdraws with multiple funders", async () => {
          const accounts = await ethers.getSigners();
          for (let i = 0; i < 8; i++) {
            const connectedAccount = await fundMe.connect(accounts[i]);
            await connectedAccount.fund({ value: sendValue });
          }
          const beforeFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const BeforeDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const afterFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const AfterDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          assert(AfterDeployerBalance, 0);
          assert(
            beforeFundMeBalance.add(BeforeDeployerBalance).toString(),
            afterFundMeBalance.add(gasCost).toString()
          );
          await expect(fundMe.getFunder(0)).to.be.reverted;
          for (i = 1; i < 8; i++) {
            assert.equal(
              await fundMe.getAddressToFunded(accounts[i].address),
              0
            );
          }
        });
        it("Only allows the owner to withdraw", async () => {
          const accounts = await ethers.getSigners();
          const connectedContract = await fundMe.connect(accounts[1]);
          await expect(connectedContract.cheaperWithdraw()).to.be.reverted;
        });
      });
    });
