import React, {Component} from 'react';
import Prompt, {registerGlobalErrorHandler} from "../common/prompt-component";
import Bubbles from "./Bubbles/Bubbles";
import Sub from "./Sub/Sub";
import {treasureIdToPoints} from "./Treasures/Treasure";
import Treasures, {makeTreasureTrackIds} from "./Treasures/Treasures";
import {MeeplesColors} from "./Meeples/Meeple";
import Meeples from "./Meeples/Meeples";
import GameService, {clone} from "./GameService";
import Players from "./Players/Players";
import PlayerBoard from "./PlayerBoard/PlayerBoard";
import {rollDice} from "./PlayerBoard/Dice";
import './Game.css';
import {Debug} from "./Debug";
import {sleep} from "../common/dom-animator";

export default class Game extends Component {

  state = clone(GameService.GameStateTemplate);

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
    void this.prompt.showWarning("Loading...", -1);

    // connect to host and start the game
    this.gameService.init();
  }

  // this.state updated!
  componentDidUpdate(prevProps, prevState) {
    if (this.state.version > prevState.version) {
      console.log("componentDidUpdate; version=" + this.state.version);  //#DEBUG
      this.gameService.fireLocalStateUpdated();
    }
  }

  // Game is about to close. DOM destroyed
  componentWillUnmount() {
    console.log('Game closed');
  }

  setStateNow(obj) {
    return new Promise((resolve => {
      this.setState(obj, () => resolve(this.state));
    }));
  }

  onError = (text, err = null) => {
    console.log('ERROR: ' + text);
    if (err && err.stack) {
      console.log(err.stack);
    }

    void this.prompt.showError(text);
  };

  onGameLoaded = () => {
    void this.prompt.hidePrompt();
  };

  // The Game State Machine:
  processGameStateChange = async () => {
    //TODO:
    // console.log('processGameStateChange;');

    if (!this.gameService.isGameReady) {
      console.log('* on start game...');
      void this.startGame();

      return;
    } else if (this.gameService.isGamePlaying && !this.gameService.isRoundStarted()) {
      console.log('* on game round #' + this.state.roundNum + ' start...');
      await this.onGameRoundStart();

      void this.processGameStateChange(); // recurse
    } else if (this.gameService.isGamePlaying && this.gameService.isRoundEnded()) {
      console.log('* on game round #' + this.state.roundNum + ' end...');
      await this.onGameRoundEnd();

      void this.processGameStateChange(); // recurse
    } else if (this.gameService.isGamePlaying && this.gameService.isPlayerPlaying(this.state.playerTurn) && !this.gameService.isActivePlayer(this.state.playerTurn)) {
      console.log('* on player #' + this.state.playerTurn + ' turn...');
      await this.onPlayerTurn(this.state.playerTurn);

      void this.processGameStateChange(); // recurse
    } else if(this.gameService.isGamePlaying && !this.gameService.isPlayerPlaying(this.state.playerTurn)){
      console.log('* skipping player #' + this.state.playerTurn + ' turn...');
      this.gameService.advancePlayerTurn(false);
      this.setState({version: this.state.version + 1}); // this will fireLocalStateUpdated()

      // return;
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

  startGame = async () => {
    await this.gameService.updatePlayersState((players) => {
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

  onGameRoundStart = async () => {
    await this.gameService.updatePlayersState(players => {
      // reset players states to start the first player turn
      players.forEach((playerState, idx) => {
        playerState.playerPickedTreasures = [];
        playerState.playerDiceRolled = [];
        playerState.playerMeeplePos = -1;
        playerState.playerReturning = false;
        playerState.playerStatus = GameService.PlayerStates.DONE;
      });
    });

    this.setState({roundNum: this.state.roundNum + 1});
    this.setState({air: 25});
    this.setState({playerTurn: 0});

    let treasures = [...this.state.treasures];
    if(treasures.length){
      // prepare treasures track from the previous round
      await this.gameService.animationService.promise('animateTreasureTrack');
      treasures = treasures.filter(id => id !== null);
      await this.setStateNow({treasures: treasures});
      this.gameService.animationService.remove('animateTreasureTrack');
    } else {
      // generate new treasures track
      await this.setStateNow({treasures: makeTreasureTrackIds()});
    }
  };

  onPlayerTurn = async (playerIdx) => {
    this.gameService.animationService.clean();  // reset animations

    const playerState = this.gameService.getPlayerState(playerIdx);
    let outOfAir = this.state.air < 0;
    if(playerState.playerMeeplePos >= 0){
      let air = this.state.air - playerState.playerPickedTreasures.length;
      if (air < 0) {
        outOfAir = true;
      }
      this.setState({air: air});
    }

    if (outOfAir) {
      await this.onDropAllPickedTreasures(playerIdx);
    }

    await this.gameService.updatePlayerState(playerIdx, (playerState) => {
      // reset player state
      playerState.playerDiceRolled = [];
      playerState.playerStatus = outOfAir ? GameService.PlayerStates.LOST : GameService.PlayerStates.PLAYING;
    });

    // wait for player input to select diver direction (call onMeepleDirectionSelected())
  };

  onMeepleDirectionSelected = async (playerIdx, returning) => {
    this.gameService.updatePlayerState(playerIdx, async (playerState) => {
      if (playerState.playerDiceRolled.length) {
        // ignore if dice already rolled (multi-clicks protection).
        return;
      }

      // roll the dice
      if (returning && !playerState.playerReturning) {
        console.log('returning...');  // #DEBUG
        playerState.playerReturning = returning;
      }

      console.log('rolling dice...');  // #DEBUG
      playerState.playerDiceRolled = [];
      playerState.playerDiceRolled[0] = rollDice();
      playerState.playerDiceRolled[1] = rollDice();

      await this.gameService.animationService.promise('animateDice1Roll', 'animateDice2Roll');

      console.log('...dice rolled; ' + playerState.playerDiceRolled);  // #DEBUG
      let steps = playerState.playerDiceRolled[0] + 1 + playerState.playerDiceRolled[1] + 1 - playerState.playerPickedTreasures.length;
      this.moveMeeple(playerIdx, steps)
    });
  };

  moveMeeple = (playerIdx, steps) => {
    this.gameService.updatePlayerState(playerIdx, (playerState) => {

      // check if we need to turn back now
      if (!playerState.playerReturning && this.getNextMeeplePos(playerState.playerReturning, playerState.playerMeeplePos) > this.state.treasures.length - 1) {
        playerState.playerReturning = true;
      }

      void this.gameService.animationService.promise('animateMeepleMove');

      let step = 0;
      while (step++ < steps) {
        const pos = this.getNextMeeplePos(playerState.playerReturning, playerState.playerMeeplePos);

        if (!playerState.playerReturning && pos > this.state.treasures.length - 1) {
          break;
        } else if (playerState.playerReturning && pos < 0) {
          playerState.playerMeeplePos = -1;

          if(playerState.playerPickedTreasures.length){
            // trigger treasure flipping animation, wich coinsist of two parts
            this.gameService.animationService.promise('animateTreasureFlipPart1')
              .then(() => {
                void this.gameService.animationService.promise('animateTreasureFlipPart2');
              });
          }
          break;
        }

        playerState.playerMeeplePos = pos;
      }

      if(steps <= 0){
        // if meeple did not move, resolve the animation right away
        this.gameService.animationService.resolve('animateMeepleMove')();
      }

      console.log("meeple #" + playerIdx + " moved by: " + steps + "; playerReturning: " + playerState.playerReturning + ", meeple pos=" + playerState.playerMeeplePos);
    });

    // this.gameService.fireLocalStateUpdated();
  };

  getNextMeeplePos = (playerReturning, meeplePos) => {
    const getMeepleOnPosition = (idx) => {
      return this.state.players.findIndex((p) => p.playerMeeplePos === idx);
    };

    const delta = playerReturning ? -1 : 1;
    do {
      meeplePos += delta;
    } while (getMeepleOnPosition(meeplePos) >= 0);

    return meeplePos;
  };


  // #TEST ONLY
  onSelectMeeple = async (playerIdx) => {
    this.gameService.updatePlayerState(this.state.playerTurn, (playerState) => {
      playerState.playerStatus = GameService.PlayerStates.DONE;
    });

    //this.setState({playerTurn: playerIdx});
    await this.setStateNow({playerTurn: playerIdx});

    this.setState({version: this.state.version + 1}); // this will fireLocalStateUpdated()
  };

  // #TEST only!
  // onSelectTreasure = (treasureIdx) => {
  //   const selected = treasureIdx !== this.state.selectedTreasure ? treasureIdx : null;
  //   console.log(`selectTreasure; #${treasureIdx}, selected=${selected}`);    // #DEBUG
  //   this.setState({selectedTreasure: selected});
  // };

  onPickTreasure = async (playerIdx, treasureIdx) => {
    if (this.state.treasures[treasureIdx] == null) {
      return; // multi-click protection
    }

    //this.setState({selectedTreasure: treasureIdx});
    this.gameService.updatePlayerState(playerIdx, playerState => {
      playerState.onSelectedTreasure = treasureIdx;
    });

    await this.gameService.animationService.promise('animateTreasureMove');

    const treasures = [...this.state.treasures];
    const id = treasures.splice(treasureIdx, 1, null)[0];
    const points = treasureIdToPoints(id);
    console.log(`pickTreasure; #${treasureIdx}; id=${id} => points: ${points}`);    // #DEBUG
    this.setState({treasures: treasures});

    this.gameService.updatePlayerState(playerIdx, playerState => {
      if (Array.isArray(id)) {
        playerState.playerPickedTreasures.push(...id);
      } else {
        playerState.playerPickedTreasures.push(id);
      }
      playerState.onSelectedTreasure = null;
    });

    await this.onPlayerTurnsEnd(playerIdx);
  };

  onDropAllPickedTreasures = async (playerIdx) => {
    const playerState = this.gameService.getPlayerState(playerIdx);
    if (!playerState.playerPickedTreasures.length) {
      return; // multi-click protection
    }

    await this.gameService.animationService.promise('animateTreasureDrop');

    const treasures = [...this.state.treasures];
    treasures.push([...playerState.playerPickedTreasures]);  // do not deconstruct, add as an array (group)
    this.setState({treasures: treasures});

    this.gameService.updatePlayerState(playerIdx, playerState => {
      playerState.playerPickedTreasures = [];
    });
  };

  onPlayerTurnsEnd = async (playerIdx) => {
    let doScoreAnimation = false;
    this.gameService.updatePlayerState(playerIdx, (playerState) => {
      //TODO: determine winners and losers here
      if (playerState.playerMeeplePos < 0) {
        doScoreAnimation = true;
        playerState.onOldPlayerSavedTreasures = [...playerState.playerSavedTreasures];
        playerState.playerSavedTreasures = [...playerState.playerSavedTreasures, ...playerState.playerPickedTreasures];
        playerState.playerStatus = GameService.PlayerStates.WON;
      } else {
        playerState.playerStatus = GameService.PlayerStates.DONE;
      }
    });

    if (doScoreAnimation) {
      await this.gameService.animationService.promise('animateScoreGlow');

      this.gameService.updatePlayerState(playerIdx, (playerState) => {
        playerState.onOldPlayerSavedTreasures = null;
        playerState.playerPickedTreasures = [];
      });
    }

    this.gameService.advancePlayerTurn(false);

    this.setState({version: this.state.version + 1}); // this will fireLocalStateUpdated()
    // console.log('onPlayerTurnsEnd; version=' + this.state.version + '; playerTurn=' + this.state.playerTurn); // #DEBUG

    //TODO: detect end of round here, call  onGameRoundEnd()
  };

  onGameRoundEnd = async () => {
    await this.gameService.updatePlayersState(players => {
      // reset players states to start new round
      players.forEach((playerState, idx) => {
        playerState.playerStatus = GameService.PlayerStates.WAITING;
      });
    });
  };

  render() {
    return (
      <div className="Game">
        <div id="game-content">
          <Bubbles game={this}/>
          <Sub game={this}/>
          <div id="game-field">
            <Treasures game={this}/>
            <Meeples game={this}/>
          </div>
        </div>
        <Players game={this}/>
        <PlayerBoard game={this}/>
        <Debug game={this}/>
      </div>
    )
  }
}