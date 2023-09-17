//
const { network } = require("hardhat")
const { verify } = require("../utils/verify");
const { developmentChains } = require("../helper-hardhat-config")
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const daoToken = await deploy("DAOToken", {
        contract: "DAOToken",
        from: deployer,
        log: true,
        args: ["100000000" + "0".repeat(18)], //100million
    })
    log("DaoToken Deployed")
    log("___________________________________________")
    const args = ["100000000" + "0".repeat(18)];
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(daoToken.address,args)
    }
    //1000000000000000000000000
}
module.exports.tags = ["all", "DaoToken"]