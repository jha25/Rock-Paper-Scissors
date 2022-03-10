// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RockPaperScissors {
    enum State {
        CREATED,
        JOINED,
        COMMITED,
        REVEALED
    }

    struct Game {
        uint256 id;
        uint256 bet;
        address payable[] players;
        State state;
    }

    struct Move {
        bytes32 hash;
        uint256 value;
    }

    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(address => Move)) public moves;
    mapping(uint256 => uint256) public winningMoves;
    uint256 public gameId;

    constructor() {
        winningMoves[1] = 3;
        winningMoves[2] = 1;
        winningMoves[3] = 2;
    }

    function createGame(address payable _participant) external payable {
        require(msg.value > 0, "Must send ether to create game");
        address payable[] memory players = new address payable[](2);
        players[0] = payable(msg.sender);
        players[1] = _participant;

        games[gameId] = Game(gameId, msg.value, players, State.CREATED);
        gameId++;
    }

    function joinGame(uint256 _gameId) external payable {
        Game storage game = games[_gameId];
        require(
            msg.sender == game.players[1],
            "Participant must be new player"
        );
        require(
            msg.value >= game.bet,
            "Amount sent must be greater or equal to bet amount"
        );
        require(
            game.state == State.CREATED,
            "Current state must be at CREATED"
        );
        if (msg.value >= game.bet) {
            payable(msg.sender).transfer(msg.value - game.bet);
        }
        game.state = State.JOINED;
    }

    function commitMove(
        uint256 _gameId,
        uint256 _moveId,
        uint256 _salt
    ) external {
        Game storage game = games[_gameId];
        require(game.state == State.JOINED, "Must have joined game to play");
        require(
            msg.sender == game.players[0] || msg.sender == game.players[1],
            "Must be registed player"
        );
        require(
            moves[_gameId][msg.sender].hash == 0,
            "Player already made their move"
        );
        require(
            _moveId == 1 || _moveId == 2 || _moveId == 3,
            "Move must be between 1 - 3"
        );
        moves[_gameId][msg.sender] = Move(
            keccak256(abi.encodePacked(_moveId, _salt)),
            0
        );
        if (
            moves[_gameId][game.players[0]].hash != 0 &&
            moves[_gameId][game.players[1]].hash != 0
        ) {
            game.state = State.COMMITED;
        }
    }

    function revealMove(
        uint256 _gameId,
        uint256 _moveId,
        uint256 _salt
    ) external {
        Game storage game = games[_gameId];
        Move storage move1 = moves[_gameId][game.players[0]];
        Move storage move2 = moves[_gameId][game.players[1]];
        Move storage moveSender = moves[_gameId][msg.sender];
        require(game.state == State.COMMITED, "Game must be in COMMITED state");
        require(
            msg.sender == game.players[0] || msg.sender == game.players[1],
            "Can only be registered players"
        );
        require(
            moveSender.hash == keccak256(abi.encodePacked(_moveId, _salt)),
            "Move id does not match commitment"
        );
        moveSender.value = _moveId;
        if (move1.value != 0 && move2.value != 0) {
            if (move1.value == move2.value) {
                game.players[0].transfer(game.bet);
                game.players[1].transfer(game.bet);
                game.state = State.REVEALED;
                return;
            }
            address payable winner;
            winner = winningMoves[move1.value] == move2.value
                ? game.players[0]
                : game.players[1];
            winner.transfer(2 * game.bet);
            game.state = State.REVEALED;
        }
    }
}
