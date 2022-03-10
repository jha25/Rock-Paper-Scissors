/** @format */

import "./App.css"
import React, { useEffect, useState } from "react"
import { getWeb3 } from "./utils/utils"
import { contractABI, contractNetwork } from "./utils/constants"

const states = ["IDLE", "CREATED", "JOINED", "COMMITTED", "REVEALED"]

const App = () => {
	const [web3, setWeb3] = useState()
	const [currentAccount, setCurrentAccount] = useState()
	const [contract, setContract] = useState()
	const [game, setGame] = useState({ state: "0" })
	const [move, setMove] = useState()

	useEffect(() => {
		;(async () => {
			const web3 = await getWeb3()
			const accounts = await web3.eth.getAccounts()
			const networkId = await web3.eth.net.getId()
			const deployedNetwork = contractNetwork[networkId]
			const contract = new web3.eth.Contract(
				contractABI,
				deployedNetwork && deployedNetwork.address,
			)

			setWeb3(web3)
			setCurrentAccount(accounts)
			setContract(contract)
			console.log(contract)
		})()
		window.ethereum.on("accountsChanged", (accounts) => {
			setCurrentAccount(accounts)
		})
	}, [])

	const isReady = () => {
		return (
			typeof contract !== "undefined" &&
			typeof web3 !== "undefined" &&
			typeof currentAccount !== "undefined"
		)
	}

	useEffect(() => {
		if (isReady()) {
			updateGame()
		}
	}, [])

	const updateGame = async () => {
		let gameId = parseInt(await contract.methods.gameId().call())
		gameId = gameId > 0 ? gameId - 1 : gameId
		const game = await contract.methods.getGame(gameId).call()
		setGame({ id: game[0], bet: game[1], players: game[2], state: game[3] })
	}

	const createGame = async (e) => {
		e.preventDefault()
		const participant = e.target.elements[0].value
		const bet = e.target.elements[1].value
		await contract.methods
			.createGame(participant)
			.send({ from: currentAccount, value: bet })
		await updateGame()
	}

	const joinGame = async () => {
		await contract.methods
			.joinGame(game.id)
			.send({ from: currentAccount, value: game.bet })
		await updateGame()
	}

	const commitMove = async (e) => {
		e.preventDefault()
		const select = e.target.elements[0]
		const moveId = select.options[select.selectedIndex].value
		const salt = Math.floor(Math.random() * 1000)
		await contract.methods
			.commitMove(game.id, moveId, salt)
			.send({ from: currentAccount })
		setMove({ id: moveId, salt })
		await updateGame()
	}

	const revealMove = async () => {
		await contract.methods
			.revealMove(game.id, move.id, move.salt)
			.send({ from: currentAccount })
		setMove(undefined)
		await updateGame()
	}

	if (typeof game.state === "undefined") {
		return <div>Loading...</div>
	}

	return (
		<div className='container'>
			<h1 className='text-center'>Rock Paper Scissors</h1>

			<p> State: {states[game.state]}</p>
			{game.state === "1" ? (
				<>
					<div>
						<h2>Players</h2>
						<ul>
							{game.players.map((player) => (
								<li key={player}>{player}</li>
							))}
						</ul>
					</div>
				</>
			) : null}

			{game.state === "0" ? (
				<div className='row'>
					<div className='col-sm-12'>
						<h2>Create Game</h2>
						<form onSubmit={(e) => createGame(e)}>
							<div className='form-group'>
								<label htmlFor='participant'>Participant</label>
								<input
									typeof='text'
									className='form-control'
									id='participant'
								/>
							</div>
							<button type='submit' className='btn btn-primary'>
								Submit
							</button>
						</form>
					</div>
				</div>
			) : null}

			{game.state === "1" &&
			game.players[1].toLowerCase() === currentAccount.toLowerCase() ? (
				<div className='row'>
					<div className='col-sm-12'>
						<h2>Bet</h2>
						<button
							onClick={(e) => joinGame()}
							type='submit'
							className='btn btn-primary'>
							Submit
						</button>
					</div>
				</div>
			) : null}

			{game.state === "2" ? (
				<div className='row'>
					<div className='col-sm-12'>
						<h2>Commit Move</h2>
						<form onSubmit={(e) => commitMove(e)}>
							<div className='form-group'>
								<label htmlFor='move'>Move</label>
								<select className='form-control' id='move'>
									<option value='1'>Rock</option>
									<option value='2'>Paper</option>
									<option value='3'>Scissors</option>
								</select>
							</div>
							<button type='submit' className='btn btn-primary'>
								Submit
							</button>
						</form>
					</div>
				</div>
			) : null}

			{game.state === "3" ? (
				<div className='row'>
					<div className='col-sm-12'>
						<h2>Reveal Move</h2>
						<button
							onClick={() => revealMove()}
							type='submit'
							className='btn btn-primary'>
							Submit
						</button>
					</div>
				</div>
			) : (
				"null"
			)}
		</div>
	)
}

export default App
