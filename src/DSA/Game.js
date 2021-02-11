import React, {Component} from 'react';
import './Game.css';
import Prompt, {registerGlobalErrorHandler} from "../common/prompt-component";
import Bubbles from "./Bubbles/Bubbles";
import Sub from "./Sub/Sub";
import {treasureIdToPoints} from "./Treasures/Treasure";
import Treasures, {makeTreasureTrackIds} from "./Treasures/Treasures";
import {MeeplesColors} from "./Meeples/Meeple";
import Meeples from "./Meeples/Meeples";
import GameService from "./GameService";
import Players from "./Players/Players";
import PlayerBoard from "./PlayerBoard/PlayerBoard";

export default class Game extends Component {

  state = {...GameService.GameStateTemplate};

  constructor(props) {
    super(props);

    this.prompt = new Prompt();

    registerGlobalErrorHandler((txt) => {
      this.onError(txt);
    });

    this.gameService = new GameService(this);

    // do not change state here!
    console.log('Game created');
  }

  // Game DOM initial load
  componentDidMount() {
    this.prompt.showWarning("Loading...", -1);

    this.gameService.init();

    // this.processGameStateChange();
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

  onError = (text, err = null) => {
    console.log('ERROR: ' + text);
    if (err && err.stack) {
      console.log(err.stack);
    }

    this.prompt.showError(text);
  };

  onGameLoaded = () => {
    this.prompt.hidePrompt();
  };

  // The game state machine
  processGameStateChange = () => {
    console.log('processGameStateChange;');
    //TODO:
    if (!this.state.gameStatus) {
      this.startGame();
    }
  };

  startGame = () => {
    this.gameService.updatePlayersState((players) => {
      ////// #TEST
      this.gameService.addPlayer('Mike', MeeplesColors[0], players);
      this.gameService.addPlayer('Stephan', MeeplesColors[1], players);
      this.gameService.addPlayer('Ian', MeeplesColors[2], players);
      this.gameService.addPlayer('Kevin', MeeplesColors[3], players);
      this.gameService.addPlayer('Pascal', MeeplesColors[4], players);
      this.gameService.addPlayer('Alan', MeeplesColors[5], players);
      //////

      // all players has to be registered at his point
      players.forEach(p => p.playerStatus = GameService.PlayerStates.WAITING);
    });

    // generate initial random treasures track
    this.setState({treasures: makeTreasureTrackIds()});

    // update main game state
    this.setState({gameStatus: GameService.GameStates.PLAYING});
    this.gameService.fireLocalStateUpdated();
  };

  registerPlayer = (playerName, playerColor) => {
    this.gameService.updatePlayersState((players) => {
      this.gameService.addPlayer(playerName, playerColor, players);
    });
    this.gameService.fireLocalStateUpdated();
  };

  // #TEST ONLY
  onMeepleSelected = (playerIdx) => {
    this.setState({playerTurn: playerIdx});
  };

  onMeepleDirectionSelected = (playerIdx, returning) => {
    this.gameService.updatePlayerState(playerIdx, (playerState) => {
      // roll the dice
      if (returning && !playerState.playerReturning) {
        playerState.playerReturning = returning
      }
      playerState.playerDiceRolled = [];
      playerState.playerDiceRolled[0] = Math.floor(Math.random() * 6);
      playerState.playerDiceRolled[1] = Math.floor(Math.random() * 6);

      // trigger dice animation, onDiceFinishedRolling will be called once it is done
      playerState.playerDiceToRoll = [];
      playerState.playerDiceToRoll[0] = playerState.playerDiceRolled[0];
      playerState.playerDiceToRoll[1] = playerState.playerDiceRolled[1];
    });
  };

  onDiceFinishedRolling = (playerIdx) => {
    const playerState = this.gameService.updatePlayerState(playerIdx, (playerState) => {
      playerState.playerDiceToRoll = [];  // stop dice animation
    });

    let steps = playerState.playerDiceRolled[0] + 1 + playerState.playerDiceRolled[1] + 1 - playerState.playerPickedTreasures.length;
    this.moveMeeple(playerIdx, steps)
  };

  moveMeeple = (playerIdx, steps) => {
    this.gameService.updatePlayerState(playerIdx, (playerState) => {

      const doStep = (pos) => {
        const delta = playerState.playerReturning ? -1 : 1;
        do {
          pos += delta;
        } while (this.getMeepleOnPosition(pos) >= 0);
        return pos;
      };

      // check if we need to turn back now
      if (!playerState.playerReturning && doStep(playerState.playerMeeplePos) > this.state.treasures.length - 1) {
        playerState.playerReturning = true;
      }

      let step = 0;
      while (step++ < steps) {
        let pos = doStep(playerState.playerMeeplePos);

        if (!playerState.playerReturning && pos > this.state.treasures.length - 1) {
          break;
        } else if (playerState.playerReturning && pos < 0) {
          playerState.playerMeeplePos = -1;
          break;
        }

        playerState.playerMeeplePos = pos;
      }
      console.log("meeple #" + playerIdx + " moved by: " + steps + "; playerReturning: " + playerState.playerReturning + ", meeple pos=" + playerState.playerMeeplePos);
    });

    this.gameService.fireLocalStateUpdated();
  };

  getMeepleOnPosition = (idx) => {
    return this.state.players.findIndex((p) => p.playerMeeplePos === idx);
  };

  onSelectTreasure = (treasureIdx) => {
    const selected = treasureIdx !== this.state.selectedTreasure ? treasureIdx : null;
    console.log(`selectTreasure; #${treasureIdx}, selected=${selected}`);    // #DEBUG
    this.setState({selectedTreasure: selected});
  };

  onPickTreasure = (treasureIdx) => {
    const treasures = [...this.state.treasures];
    const id = treasures.splice(treasureIdx, 1, null)[0];
    const points = treasureIdToPoints(id);
    console.log(`pickTreasure; #${treasureIdx}; id=${id} => points: ${points}`);    // #DEBUG
    this.setState({treasures: treasures});
  };

  render() {
    return (
      <div className="Game">
        <Bubbles game={this}></Bubbles>
        <Sub game={this}></Sub>
        <div id="game-field">
          <Treasures game={this}></Treasures>
          <Meeples game={this}></Meeples>
        </div>
        <Players game={this}></Players>
        <PlayerBoard game={this} idx={this.state.playerTurn}></PlayerBoard>
      </div>
    )
  }
}