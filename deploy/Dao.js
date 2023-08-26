const { network } = require("hardhat");
const { verify } = require("../utils/verify");
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    let Daotoken
    if (developmentChains.includes(network.name)) {
        Daotoken = await deployments.get("DAOToken")
    } else {
        Daotoken = "0xxxx";
    }
    const args = [deployer,Daotoken.address]
    const doa = await deploy("Dao", {
        from: deployer,
        args:args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log("________________________________")
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(args)
    }
}
module.exports.tags = ["all"]