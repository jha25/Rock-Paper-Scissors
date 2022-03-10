/** @format */

const HDWalletProvider = require("@truffle/hdwallet-provider")
require("dotenv").config()

const private_keys = [
	process.env.META_KEY1,
	process.env.META_KEY2,
	process.env.META_KEY3,
	process.env.META_KEY4,
]

module.exports = {
	networks: {
		rinkeby: {
			provider: () =>
				new HDWalletProvider({
					privateKeys: private_keys,
					providerOrUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_RINKEBY_ID}`,
				}),
			network_id: 4, // Rinkeby's id
			gas: 5500000, // Rinkeby has a lower block limit than mainnet
			confirmations: 2, // # of confs to wait between deployments. (default: 0)
			timeoutBlocks: 200, // # of blocks before a deployment times out  (minimum/default: 50)
			skipDryRun: true, // Skip dry run before migrations? (default: false for public nets )
		},
	},

	// Set default mocha options here, use special reporters etc.
	mocha: {
		// timeout: 100000
	},
	contracts_build_directory: "../frontend/src/utils",

	// Configure your compilers
	compilers: {
		solc: {
			version: "0.8.0", // Fetch exact version from solc-bin (default: truffle's version)
			// docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
			settings: {
				// See the solidity docs for advice about optimization and evmVersion
				optimizer: {
					enabled: false,
					runs: 200,
				},
				evmVersion: "byzantium",
			},
		},
	},
}
