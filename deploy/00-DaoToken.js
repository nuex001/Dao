//
const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    if (developmentChains.includes(network.name)) {
        log("Localhost network detected! Deploying mocks...")
        await deploy("DAOToken", {
            contract: "DAOToken",
            from: deployer,
            log: true,
            args: [ "1000000" + "0".repeat(18)], //1million
        })
        log("DaoToken Deployed")
        log("___________________________________________")
    }
    //1000000000000000000000000
}
module.exports.tags = ["all", "DaoToken"]