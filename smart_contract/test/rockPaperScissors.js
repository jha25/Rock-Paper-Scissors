/** @format */

const { expectRevert, time } = require("@openzeppelin/test-helpers")
const { web3 } = require("@openzeppelin/test-helpers/src/setup")
const RockPaperScissors = artifacts.require("RockPaperScissors")

contract("RockPaperScissors", (accounts) => {
	let contract
	const [player1, player2] = [accounts[1], accounts[2]]
	const [salt1, salt2] = [10, 20]
	const [rock, paper, scissors] = [1, 2, 3]
	beforeEach(async () => {
		contract = await RockPaperScissors.new()
	})

	it("Should not create a game if ether was not sent", async () => {
		await expectRevert(
			contract.createGame(player2, { from: player1, value: 100 }),
			"Must send ether",
		)
	})

	it("Should create a game", async () => {
		await contract.createGame(player2, { from: player1, value: 100 })
		const game = await contract.games(0)
		assert(game.id.toNumber() === 0)
		assert(game.bet.toNumber() === 100)
		assert(game.state.toNumber() === 0)
	})

	it("Should not join a game if its not the second player", async () => {
		await contract.createGame(player2, { from: player1, value: 100 })
		await expectRevert(
			contract.joinGame(0, { from: accounts[5], value: 100 }),
			"Sender must be a second player",
		)
	})

	it("Should not join a game if not enough ether sent", async () => {
		await contract.createGame(player2, { from: player1, value: 100 })
		await expectRevert(
			contract.joinGame(0, { from: player2, value: 50 }),
			"Not enough ether sent",
		)
	})

	it("Should not join a game if not in CREATED state", async () => {
		await contract.createGame(player2, { from: player1, value: 100 })
		await contract.joinGame(0, { from: player2, value: 100 })
		await contract.commitMove(0, rock, salt1, { from: player1 })
		await contract.commitMove(0, paper, salt2, { from: player2 })
		await contract.revealMove(0, rock, salt1, { from: player1 })
		await expectRevert(
			contract.joinGame(0, { from: player2, value: 100 }),
			"Game must be in CREATED state",
		)
	})

	it("Should not commit move if game not in JOINED state", async () => {
		await contract.createGame(player2, { from: player1, value: 100 })
		await expectRevert(
			contract.commitMove(0, rock, salt1, { from: player2 }),
			"Game must be in JOINED state",
		)
	})

	it("Should not commit move if not called by player", async () => {
		await contract.createGame(player2, { from: player1, value: 100 })
		await contract.joinGame(0, { from: player1, value: 100 })
		await expectRevert(
			contract.commitMove(0, rock, salt1),
			"Can only be called by one of the players",
		)
	})

	it("Should not commit move if move was already made", async () => {
		await contract.createGame(player2, { from: player1, value: 100 })
		await contract.joinGame(0, { from: player2, value: 100 })
		await contract.commitMove(0, rock, salt1, { from: player1 })
		await expectRevert(
			contract.commitMove(0, paper, salt1, { from: player1 }),
			"Move already made",
		)
	})

	it("Should not commit move if non-existing move", async () => {
		await contract.createGame(player2, { from: player1, value: 100 })
		await contract.joinGame(0, { from: player2, value: 100 })
		await expectRevert(
			contract.commitMove(0, 10, salt1, { from: player1 }),
			"Move needs to be between 1 - 3",
		)
	})

	it("Should not reveal move if not in COMMITTED state", async () => {
		await contract.createGame(player2, { from: player1, value: 100 })
		await contract.revealMove(
			0,
			rock,
			salt1,
			{ from: player2 },
			"Game must be in COMMITED state",
		)
	})

	it("Should not reveal move if not in COMMITTED state", async () => {
		await contract.createGame(player2, { from: player1, value: 100 })
		await contract.joinGame(0, { from: player2, value: 100 })
		await contract.commitMove(0, rock, salt1, { from: player1 })
		await contract.commitMove(0, paper, salt2, { from: player2 })
		await expectRevert(
			contract.revealMove(0, 1, salt1),
			"Can only be called by one of the players",
		)
	})

	it("Should not reveal move if not in state COMMITTED", async () => {
		await contract.createGame(player2, { from: player1, value: 100 })
		await contract.joinGame(0, { from: player2, value: 100 })
		await contract.commitMove(0, rock, salt1, { from: player1 })
		await contract.commitMove(0, paper, salt2, { from: player2 })
		expectRevert(
			contract.revealMove(0, 3, salt1, { from: player1 }),
			"Move does not match commitment",
		)
	})

	it("Should not reveal move if moveId does not match commitment", async () => {
		await contract.createGame(player2, { from: player1, value: 100 })
		await contract.joinGame(0, { from: player2, value: 100 })
		await contract.commitMove(0, rock, salt1, { from: player1 })
		await contract.commitMove(0, paper, salt2, { from: player2 })
		await expectRevert(
			contract.revealMove(0, 3, salt1, { from: player1 }),
			"moveId does not match commitment",
		)
		await expectRevert(
			contract.revealMove(0, rock, salt2, { from: player1 }),
			"moveId does not match commitment",
		)
	})

	it("Full game", async () => {
		const oneEther = web3.utils.toBN(web3.utils.toWei("1", "ether"))
		await contract.createGame(player2, { from: player1, value: oneEther })
		await contract.joinGame(0, { from: player2, value: oneEther })
		await contract.commitMove(0, rock, salt1, { from: player1 })
		await contract.commitMove(0, paper, salt2, { from: player2 })
		const balanceP1Before = web3.utils.toBN(await web3.eth.getBalance(player1))
		const balanceP2Before = web3.utils.toBN(await web3.eth.getBalance(player2))
		const tx = await contract.revealMove(0, paper, salt2, {
			from: player2,
			gasPrice: 1,
		})
		const game = await contract.games(0)
		const balanceP1After = web3.utils.toBN(await web3.eth.getBalance(player1))
		const balanceP2After = web3.utils.toBN(await web3.eth.getBalance(player2))
		assert(balanceP1After.sub(balanceP1Before).isZero())
		assert(
			balanceP2After
				.add(web3.utils.toBN(tx.receipt.gasUsed))
				.sub(balanceP2Before)
				.eq(oneEther.add(oneEther)),
		)
		assert(game.state.toNumber() === 3)
	})
})
