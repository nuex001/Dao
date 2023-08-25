//
const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    if (developmentChains.includes(network.name)) {
        log("x network detected! Deploying mocks...")
        await deploy("DAOToken", {
            contract: "DAOToken",
            from: deployer,
            log: true,
            args: ["1000000"], //1million
        })
        log("DaoToken Deployed")
        log("___________________________________________")
    }
    //
}
module.exports.tags = ["all", "DaoToken"]