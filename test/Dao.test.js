const { ethers, deployments, getNamedAccounts } = require("hardhat");
const { expect, assert } = require("chai");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");


describe("NFTMARKETPLACE", function () {
  let dao;
  let daoToken;
  let deployer;
  beforeEach(async () => {
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture(["all"]); // Deploys all contracts in the fixture
    daoToken = await ethers.getContract("DAOToken", deployer);
    dao = await ethers.getContract("Dao", deployer);
  });
  // 
  describe("constructor", async () => {
    it("checks if owner is set properly", async () => {
      const response = await dao.getOwner();
      assert.equal(response, deployer);
    });
  });
  // 
  describe("create Proposal", async () => {

    it("creates proposals", async () => {
      const [owner, addr1] = await ethers.getSigners();
      await daoToken.transfer(addr1, "1100" + "0".repeat(18), { from: deployer });
      const response = await dao.connect(addr1).createProposal("Description", "title", "100" + "0".repeat(18), deployer);
      await expect(response).to.emit(dao, "NewProposal");
    });
    it("can't create proposal because of enough funds", async () => {
      const [owner, addr1] = await ethers.getSigners();
      try {
        const response = await dao.connect(addr1).createProposal("Description", "title", "100" + "0".repeat(18), deployer);
        assert.fail('Expected revert not received');
      } catch (error) {
        expect(error.message).to.include("Dao_InsufficientAmount")
      }
    });
    it("can't create proposal because You already have an active proposal", async () => {
      await dao.createProposal("Description", "title", "100" + "0".repeat(18), deployer);
      const response = dao.createProposal("Description", "title", "100" + "0".repeat(18), deployer);
      await expect(response).to.be.revertedWith(
        "You already have an active proposal"
      )
    });
  });
  // 
  describe("Voting", async () => {
    beforeEach(async () => {
      const response = await dao.createProposal("Description", "title", "100" + "0".repeat(18), deployer);
    })
    it("vote on proposals", async () => {
      const [owner, addr1] = await ethers.getSigners();
      await daoToken.transfer(addr1, "1100" + "0".repeat(18), { from: deployer });
      const response = await dao.connect(addr1).Vote("0", true);
      await expect(response).to.emit(dao, "VoteEvent");
    });
    it("can't vote on proposals", async () => {
      const [owner, addr1] = await ethers.getSigners();
      try {
        const response = await dao.connect(addr1).Vote("0", true);
        assert.fail('Expected revert not received');
      } catch (error) {
        expect(error.message).to.include("Dao_InsufficientAmount")
      }
    });
  });
  // 
  describe("Execute Proposal", async () => {
    beforeEach(async () => {
      // console.log(dao.target);
      await daoToken.transfer(dao.target, "100" + "0".repeat(18), { from: deployer });
      await dao.createProposal("Description", "title", "100" + "0".repeat(18), deployer);
      const [owner, addr1] = await ethers.getSigners();
      await daoToken.transfer(addr1, "1100" + "0".repeat(18), { from: deployer });
      const response = await dao.connect(addr1).Vote("0", true);
    })
    it("execute proposal", async () => {
      // Fast-forward time to after the voting period
      const latestTime = (await time.latest()) + 691200;
      await time.increaseTo(latestTime);
      const response = await dao.executeProposal("0");
      await expect(response).to.emit(dao, "ProposalExecuted");
    });

    it("execute proposal when proposal hasn't ended", async () => {
      /**  for reverted with text,don't add await to the method,
      * await waits for the method to process and when it throws an error,
      *  it stops the function before it reaches the revertedWith 
      */
      await expect(dao.executeProposal("0")).to.be.revertedWith(
        "Voting period is still ongoing"
      )
    });
    // it("Proposal has not reached majority support", async () => {
    //   const [owner, addr1] = await ethers.getSigners();
    //   await daoToken.transfer(addr1, "1100" + "0".repeat(18), { from: deployer });
    //   const response = await dao.connect(addr1).createProposal("Description", "title", "100" + "0".repeat(18), deployer);
    //   // Fast-forward time to after the voting period
    //   const latestTime = (await time.latest()) + 691200;
    //   await time.increaseTo(latestTime);
    //   await expect(dao.executeProposal("1")).to.be.revertedWith(
    //     "Proposal has not reached majority support"
    //   )
    // });
  });
  // 
  describe("withdraw", async () => {
    it("withdraw proposals", async () => {
      const value = ethers.toBigInt("100" + "0".repeat(18))
      await daoToken.transfer(dao.target, value, { from: deployer });
      const balance = await daoToken.balanceOf(dao.target);
      const response = await dao.withdraw("100" + "0".repeat(18));
      const balance2 = await daoToken.balanceOf(dao.target);
      assert.equal(balance - value, balance2)
    });
  });
  // 
  describe("getAllProposals", async () => {
    it("withdraw proposals", async () => {
      await dao.createProposal("Description", "title", "100" + "0".repeat(18), deployer);
      const response = await dao.getAllProposals();
      assert.equal(response.length, 1)
    });
  });
  describe("getProposal", async () => {
    it("withdraw proposals", async () => {
      await dao.createProposal("Description", "title", "100" + "0".repeat(18), deployer);
      const response = await dao.getProposal("0");
      assert.equal(Number(response.id), 0)
    });
  });
});
