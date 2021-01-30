import React, {Component} from 'react';
import './Game.css';
import Bubbles from "./Bubbles/Bubbles";
import Sub from "./Sub/Sub";
import {treasureIdToPoints} from "./Treasures/Treasure";
import Treasures, {makeTreasureTrackIds} from "./Treasures/Treasures";

export default class Game extends Component {

  static GameStates = {STARTING: 1, PLAYING: 5, FINISHED: 10};
  static PlayerStates = {WAITING: 1, PLAYING: 3, DONE: 6, LOST: 11, WON: 12, SPECTATOR: 15};

  // Global game state object
  state = {
    // generic properties:
    version: 0,                 // latest state version. Iterate on every host update!
    gameStatus: null,           // game status, enum, one of the {starting, playing, finished, etc}
    players: [],                // array of player states objects (as bellow)
    playerTurn: 0,              // index of the player, whose turn it is to play
    roundNum: 0,                // game round number
    // game specific properties:
    treasures: [],              // array of treasure ids, null - for picked ones
    selectedTreasure: null      // index of the treasure on a track which is selected by the current player
  };

  // Each player state object template
  static playerStateTemplate = {
    // generic properties:
    playerName: null,
    playerColor: null,          // color rgb array (game specific)
    playerStatus: null,         // player game status, enum, one of the {idle, playing, lost, spectator, etc}
    playerTurnsPlayed: 0,       // number of turns this player have played
    // game specific properties:
    playerStoredTreasures: [],  // array of treasure ids secured by player in previous rounds
    playerPickedTreasures: [],  // array of treasure ids picked by player on the current dive
    playerReturning: false,     // whether or not the player's diver is on the way back to the sub
    playerMeeple: null,         // player marker object, like {id, color, pos, dir, etc.}
  };

  constructor(props) {
    super(props);
    // do not change state here!
    console.log('Game created');
  }

  // Game DOM initial load
  componentDidMount() {
    this.processGameStateChange();
  }

  // DOM updated
  componentDidUpdate(prevProps, prevState) {
    if (this.state.version !== prevState.version) {
      this.processGameStateChange();
    }
  }

  // Game is about to close. DOM destroyed
  componentWillUnmount() {
    console.log('Game closed');
  }

  // The game state machine
  processGameStateChange = () => {
    console.log('processGameStateChange;');
    //TODO:
    if(!this.state.gameStatus){
      this.startGame();
    }
  };

  startGame = () => {
    // all players has to be registered at his point
    const players = [...this.state.players];
    players.forEach(p => p.playerStatus = Game.PlayerStates.WAITING);
    this.setState({players: players});

    // generate random treasure track
    const treasures = makeTreasureTrackIds();
    this.setState({treasures: treasures});

    // update main game state
    this.setState({gameStatus: Game.GameStates.PLAYING});
    this.setState({version: this.state.version + 1});
  };

  registerPlayer = (playerName, playerColor) => {
    const player = {...Game.playerStateTemplate};
    player.playerName = playerName;
    player.playerColor = playerColor;
    const players = [...this.state.players];
    players.push(player);
    this.setState({players: players});
    this.setState({version: this.state.version + 1});
  };

  onSelectTreasure = (idx) => {
    const selected = idx !== this.state.selectedTreasure ? idx : null;
    console.log(`selectTreasure; #${idx}, selected=${selected}`);    // #DEBUG
    this.setState({selectedTreasure: selected});
  };

  onPickTreasure = (idx) => {
    const treasures = [...this.state.treasures];
    const id = treasures.splice(idx, 1, null)[0];
    const points = treasureIdToPoints(id);
    console.log(`pickTreasure; #${idx}; id=${id} => points: ${points}`);    // #DEBUG
    this.setState({treasures: treasures});
  };

  render() {
    return (
      <div className="Game">
        <Bubbles game={this}></Bubbles>
        <Sub game={this}></Sub>
        <Treasures game={this}></Treasures>
      </div>
    )
  }
}