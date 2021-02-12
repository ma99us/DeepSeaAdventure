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
import {rollDice} from "./PlayerBoard/Dice";

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

  // this.state updated!
  componentDidUpdate(prevProps, prevState) {
    if (this.state.version > prevState.version) {
      //this.processGameStateChange();
      this.gameService.fireLocalStateUpdated();
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

  // The Game State Machine:
  processGameStateChange = () => {
    //TODO:
    // console.log('processGameStateChange;');

    if (!this.gameService.isGameReady) {
      console.log('start game...');
      this.startGame();
    } else if (this.gameService.isGamePlaying && !this.gameService.isRoundStarted()) {
      console.log('start round...');
      this.onGameRoundStart();
    } else if (!this.gameService.isActivePlayer(this.state.playerTurn)) {
      console.log('start player #' + this.state.playerTurn + ' turn...');
      this.onPlayerTurn(this.state.playerTurn);
    }
  };

  registerPlayer = (playerName, playerColor) => {
    this.gameService.updatePlayersState((players) => {
      this.gameService.addPlayer(playerName, playerColor, players);
    });

    this.setState({version: this.state.version + 1}); // this will fireLocalStateUpdated()
  };

  unregisterPlayer = (playerName) => {
    this.gameService.updatePlayersState((players) => {
      this.gameService.removePlayer(playerName, players);
    });

    this.setState({version: this.state.version + 1}); // this will fireLocalStateUpdated()
  };

  startGame = () => {
    this.gameService.updatePlayersState((players) => {
      ////// #TEST
      this.gameService.addPlayer('Mike aka Very Long Name', MeeplesColors[0], players);
      this.gameService.addPlayer('Stephan', MeeplesColors[1], players);
      this.gameService.addPlayer('Ian', MeeplesColors[2], players);
      this.gameService.addPlayer('Kevin', MeeplesColors[3], players);
      this.gameService.addPlayer('Pascal', MeeplesColors[4], players);
      this.gameService.addPlayer('Alan', MeeplesColors[5], players);

      //////
      // all players has to be registered at his point
      players.forEach(p => {
        p.playerSavedTreasures = [];
        p.playerStatus = GameService.PlayerStates.WAITING;
      });
    });

    // update main game state
    this.setState({gameStatus: GameService.GameStates.PLAYING});

    this.setState({version: this.state.version + 1}); // this will fireLocalStateUpdated()
  };

  onGameRoundStart = () => {
    this.gameService.updatePlayersState(players => {
      // reset players states to start the round
      players.forEach((playerState, idx) => {
        playerState.playerPickedTreasures = [];
        playerState.playerDiceRolled = [];
        playerState.playerDiceToRoll = [];
        playerState.playerMeeplePos = -1;
        playerState.playerReturning = false;
        if (this.gameService.isPlayerPlaying(idx)) {
          playerState.playerStatus = GameService.PlayerStates.PLAYING;
        }
      });
    });

    this.setState({roundNum: this.state.roundNum + 1});
    this.setState({playerTurn: 0});

    // generate new treasures track
    this.setState({treasures: makeTreasureTrackIds()});
  };

  onPlayerTurn = (playerIdx) => {
    this.gameService.updatePlayerState(playerIdx, (playerState) => {
      // reset player state
      playerState.playerDiceRolled = [];
      playerState.playerDiceToRoll = [];
      playerState.playerStatus = GameService.PlayerStates.PLAYING;
    });

    // wait for player input to select diver direction (call onMeepleDirectionSelected())
  };

  onMeepleDirectionSelected = (playerIdx, returning) => {
    this.gameService.updatePlayerState(playerIdx, (playerState) => {
      if (playerState.playerDiceRolled.length) {
        // ignore if dice already rolled (multi-clicks protection).
        // console.log('onMeepleDirectionSelected ignored');  // #DEBUG
        return;
      }
      // console.log('onMeepleDirectionSelected'); // #DEBUG

      // roll the dice
      if (returning && !playerState.playerReturning) {
        console.log('returning...');  // #DEBUG
        playerState.playerReturning = returning;
      }

      console.log('rolling dice...');  // #DEBUG
      playerState.playerDiceRolled = [];
      playerState.playerDiceRolled[0] = rollDice();
      playerState.playerDiceRolled[1] = rollDice();

      // trigger dice animation, onDiceFinishedRolling will be called once it is done
      playerState.playerDiceToRoll = [];
      playerState.playerDiceToRoll[0] = playerState.playerDiceRolled[0];
      playerState.playerDiceToRoll[1] = playerState.playerDiceRolled[1];
    });
  };

  onDiceFinishedRolling = (playerIdx) => {
    let isDiceRolled = false;
    const playerState = this.gameService.updatePlayerState(playerIdx, (playerState) => {
      if (!playerState.playerDiceToRoll.length) {
        // ignore multi-triggers
        return;
      }
      isDiceRolled = true;
      playerState.playerDiceToRoll = [];  // stop dice animation
    });
    if (!isDiceRolled) {
      // ignore multi-triggers
      return;
    }

    console.log('...dice rolled; ' + playerState.playerDiceRolled);  // #DEBUG
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

    // this.gameService.fireLocalStateUpdated();
  };

  getMeepleOnPosition = (idx) => {
    return this.state.players.findIndex((p) => p.playerMeeplePos === idx);
  };

  // #TEST ONLY
  onSelectMeeple = (playerIdx) => {
    this.gameService.updatePlayerState(this.state.playerTurn, (playerState) => {
      playerState.playerStatus = GameService.PlayerStates.DONE;
    });

    this.setState({playerTurn: playerIdx});

    this.setState({version: this.state.version + 1}); // this will fireLocalStateUpdated()
  };

  // #TEST only!
  // onSelectTreasure = (treasureIdx) => {
  //   const selected = treasureIdx !== this.state.selectedTreasure ? treasureIdx : null;
  //   console.log(`selectTreasure; #${treasureIdx}, selected=${selected}`);    // #DEBUG
  //   this.setState({selectedTreasure: selected});
  // };

  onPickTreasure = (playerIdx, treasureIdx) => {
    if (this.state.treasures[treasureIdx] == null) {
      return; // multi-click protection
    }

    const treasures = [...this.state.treasures];
    const id = treasures.splice(treasureIdx, 1, null)[0];
    const points = treasureIdToPoints(id);
    console.log(`pickTreasure; #${treasureIdx}; id=${id} => points: ${points}`);    // #DEBUG
    this.setState({treasures: treasures});

    this.gameService.updatePlayerState(playerIdx, playerState => {
      playerState.playerPickedTreasures.push(id);
    });

    this.onPlayerTurnsEnd(playerIdx);
  };

  onPlayerTurnsEnd = (playerIdx) => {
    this.gameService.updatePlayerState(playerIdx, (playerState) => {
      //TODO: determine winners and losers here
      if (playerState.playerMeeplePos < 0) {
        playerState.playerSavedTreasures = [...playerState.playerSavedTreasures, ...playerState.playerPickedTreasures];
        playerState.playerStatus = GameService.PlayerStates.WON;
      } else {
        playerState.playerStatus = GameService.PlayerStates.DONE;
      }
    });

    this.gameService.advancePlayerTurn(false);

    this.setState({version: this.state.version + 1}); // this will fireLocalStateUpdated()

    //TODO: detect end of round here, call  onGameRoundEnd()
  };

  onGameRoundEnd = () => {
    this.gameService.updatePlayersState(players => {
      // reset players states to start the round
      players.forEach((playerState, idx) => {
        if (this.gameService.isPlayerPlaying(idx)) {
          playerState.playerStatus = GameService.PlayerStates.WAITING;
        }
      });
    });
  };

  render() {
    return (
      <div className="Game">
        <Bubbles game={this}/>
        <Sub game={this}/>
        <div id="game-field">
          <Treasures game={this}/>
          <Meeples game={this}/>
        </div>
        <Players game={this}/>
        <PlayerBoard game={this}/>
      </div>
    )
  }
}