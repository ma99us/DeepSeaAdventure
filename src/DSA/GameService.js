import {MeeplesIdsNum, MeeplesColors} from "./Meeples/Meeple";
import API from "../services/api-config";
import LocalStorageService from "../services/local-storage-service";
import HostStorageService from "../services/host-storage-service";
import MessageBusService from "../services/message-bus-service";
import RoomService from "./RoomService";

export default class GameService {

  static GameStates = {STARTING: 1, PLAYING: 5, FINISHED: 10};
  static PlayerStates = {WAITING: 1, PLAYING: 3, DONE: 6, LOST: 11, WON: 12, SPECTATOR: 15};

  static GameName = "Deep Sea Adventure";  // game specific

  // Global game state object template
  static GameStateTemplate = {
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
  static PlayerStateTemplate = {
    // generic properties:
    playerName: null,
    playerColor: null,          // color rgb array (game specific)
    playerStatus: null,         // player game status, enum, one of the {idle, playing, lost, spectator, etc}
    playerTurnsPlayed: 0,       // number of turns this player have played
    // game specific properties:
    playerSavedTreasures: [],  // array of treasure ids secured by player in previous rounds
    playerPickedTreasures: [],  // array of treasure ids picked by player on the current dive
    playerReturning: false,     // whether or not the player's diver is on the way back to the sub
    playerMeeplePos: -1,      // player marker position on the treasure track
    playerDiceToRoll: [],        // transient, do not persist!
    playerDiceRolled: [],        // last turn player dice roll result, like [1-3, 1-3]
  };

  constructor(game) {
    // TODO: do not update state here
    this.game = game;
    this.hostStorageService = HostStorageService.getInstance();
    this.messageBusService = MessageBusService.getInstance();
    this.localStorageService = new LocalStorageService('HFG');
    this.roomService = new RoomService(this);

    this.readPlayerInfo();
  }

  init() {
    // this.game.setState({...GameService.GameStateTemplate});
    // TODO: update state here if needed
    try {
      this.connect();
    }
    catch (err) {
      this.game.onError("Connecting error: " + err, err);
    }
  }

  readPlayerInfo() {
    this.selfPlayerName = this.localStorageService.get('PlayerName');
    this.selfPlayerColor = this.localStorageService.get('PlayerColor');
    return {playerName: this.selfPlayerName, playerColor: this.selfPlayerColor};
  }

  savePlayerInfo(playerName, playerColor) {
    this.localStorageService.set('PlayerName', playerName);
    this.localStorageService.set('PlayerColor', playerColor);
  }

  newGame(gameId = null) {
    if (!gameId) {
      gameId = getRandomRange(100000, 999999);
    }
    window.location.hash = gameId;
    window.location.reload();
  }

  get gameName() {
    return GameService.GameName;
  }

  get playersMax() {
    return MeeplesIdsNum;
  }

  get gameId() {
    return window.location.hash ? window.location.hash.substr(1) : '';
  }

  get state() {
    return this.game.state;
  }

  get isGameReady() {
    const state = this.state;
    return state.gameStatus != null;
  }

  get isGameStarting() {
    const state = this.state;
    return state.gameStatus === GameService.GameStates.STARTING;
  }

  get isGamePlaying() {
    const state = this.state;
    return state.gameStatus === GameService.GameStates.PLAYING;
  }

  get isGameFinished() {
    const state = this.state;
    return state.gameStatus === GameService.GameStates.FINISHED;
  }

  get isMyTurn() {
    const state = this.state;
    return this.state.playerTurn === this.myPlayerId;
  }

  get playersTotal() {
    const state = this.state;
    return state.players.length;
  }

  get playingPlayersTotal() {
    const state = this.state;
    let players = state.players.filter((p, idx) => this.isPlayerPlaying(idx));
    return players.length;
  }

  get myPlayerId() {
    const state = this.state;
    return this.selfPlayerName ? state.players.findIndex(p => p.playerName === this.selfPlayerName) : -1;
  }

  get isGameOwner() {
    return this.myPlayerId === 0;
  }

  addPlayer(playerName, playerColor, players) {
    if (!playerName || !playerName.trim()) {
      throw "Name can not be empty.";
    }

    // prevent duplicate player names
    playerName = playerName.trim();
    const idx = players.findIndex(p => p.playerName === playerName);
    if (idx >= 0) {
      throw "Name '" + playerName + "' already taken. Choose another.";
    }

    const player = {...GameService.PlayerStateTemplate};
    player.playerName = playerName;
    player.playerColor = playerColor;
    players.push(player);
    console.log("registerPlayer; '" + playerName + "' color: " + playerColor + "; total players: " + players.length);   //#DEBUG
    return players;
  };

  removePlayer(playerName, players) {
    if (!playerName || !playerName.trim()) {
      throw "Name can not be empty.";
    }

    playerName = playerName.trim();
    const idx = players.findIndex(p => p.playerName === playerName);
    if (idx >= 0) {
      players.splice(idx, 1);
      console.log("unregisterPlayer; '" + playerName + "; total players: " + players.length);   //#DEBUG
    }
    return players;
  }

  getPlayerState(idx) {
    return (idx != null && this.game.state.players.length > idx) ? {...this.game.state.players[idx]} : null;
  }

  isPlayerReady(idx) {
    const playerState = this.getPlayerState(idx);
    return playerState && playerState.playerStatus != null;
  }

  isPlayerPlaying(idx) {
    const playerState = this.getPlayerState(idx);
    return this.isPlayerReady(idx) && playerState.playerStatus < GameService.PlayerStates.LOST;
  }

  /**
   * Copies Players array, modifies it in a callback, sets the new players array, returns the modified players array.
   * @param funk callback to iterate over player states array
   * @returns {*[]} modified players array
   */
  updatePlayersState(funk) {
    const players = [...this.game.state.players];
    funk(players);
    this.game.setState({players: players});
    return players;
  }

  /**
   * Copies Player State object, modifies it in a callback, sets the new player state, returns the modified player state.
   * @param idx player index
   * @param funk callback to modify player state in
   * @returns {*} modified player state
   */
  updatePlayerState(idx, funk) {
    const players = [...this.game.state.players];
    if (idx >= players.length) {
      throw 'No player id: ' + idx;
    }
    funk(players[idx]);
    this.game.setState({players: players});
    return players[idx];
  }

  findNextPlayerIdx(onlyPlayingPlayers = true, playerTurn = this.game.state.playerTurn) {
    let nextPlayerTurn = playerTurn;
    do {
      nextPlayerTurn = (nextPlayerTurn + 1) % this.playersTotal;
    } while (onlyPlayingPlayers && !this.isPlayerPlaying(nextPlayerTurn) && nextPlayerTurn !== playerTurn);
    return nextPlayerTurn !== playerTurn ? nextPlayerTurn : -1;
  }

  advancePlayerTurn(onlyPlayingPlayers = true) {
    const state = this.state;
    const nextPlayerTurn = this.findNextPlayerIdx(onlyPlayingPlayers);
    if (nextPlayerTurn >= 0) {
      state.prevPlayerTurn = state.playerTurn;
      state.playerTurn = nextPlayerTurn;
    }
    return state.playerTurn;
  }

  //////// host state synchronization methods

  connect() {
    const dbName = API.HOST_DB_NAME + this.gameId;
    this.hostStorageService.API.setDbName(dbName);

    // subscribe to all session and db events
    this.messageBusService.subscribe(null, (eventName, data) => {
      //console.log("<<< " + eventName + ": " + JSON.stringify(data));  // #DEBUG

      if (eventName === 'session-event' && data.event === 'OPENED' && data.sessionId === this.hostStorageService.sessionId) {
        this.onSessionConnected(data.sessionId);
      } else if (eventName === 'session-event' && data.event === 'CLOSED' && data.sessionId === this.hostStorageService.sessionId) {
        this.onSessionClosed();
      } else if (eventName === 'session-event' && data.event === 'ERROR' && (!data.sessionId || data.sessionId === this.hostStorageService.sessionId)) {
        this.onSessionError();
      } else if (eventName === 'db-event' && data.event === 'UPDATED' && data.key === 'state' && (data.value.version > this.state.version || data.value.version === 0)) {
        this.onRemoteStateUpdate(data.value);
      }
    });

    console.log("Connecting to Game id='" + this.gameId + "'; DB name='" + dbName + "'...");  // #DEBUG
    this.hostStorageService.connect();
  }

  onSessionConnected(sessionId) {
    this.sessionId = sessionId;

    if (this.gameId) {
      // get current game state from host or submit local state if none exists on host yet
      this.getRemoteState()
        .then(() => {
          return this.roomService.syncRooms();
        })
        .then(() => {
          this.game.onGameLoaded();
        });
    } else {
      this.roomService.syncRooms()
        .then(() => {
          this.game.onGameLoaded();
        });
    }
  }

  onSessionClosed() {
    this.sessionId = null;
  }

  onSessionError() {
    //this.sessionId = null;
    this.game.onError('Server connection error');
  }

  getRemoteState() {
    return this.hostStorageService.get("state")
      .then(remoteState => {
        if (!remoteState) {
          console.log('no remote state; pushing local');
          return this.fireLocalStateUpdated();
        } else if (remoteState.version > this.state.version || remoteState.version === 0) {
          return this.onRemoteStateUpdate(remoteState);
        } else {
          console.log('old remote state ignored; local version=' + this.state.version + '; remote version=' + remoteState.version); // #DEBUG
          console.log(JSON.stringify(remoteState)); // #DEBUG
        }
      })
      .catch(err => {
        this.game.onError('getRemoteState; error: ' + err, err);
      })
  }

  updateRemoteState() {
    return this.hostStorageService.update("state", this.state);
  }

  onRemoteStateUpdate(remoteState) {
    //TODO: apply full state or re-play an action
    this.game.processGameStateChange();
  }

  fireLocalStateUpdated() {
    if (!this.gameId) {
      console.log('not in game. not pushing local state.');
      return;
    }

    this.game.setState({version: this.game.state.version + 1});
    console.log('fireLocalStateUpdated; version=' + this.state.version);  // #DEBUG

    return this.updateRemoteState()
      .catch(err => {
        this.game.onError('updateRemoteState; error: ' + err, err);
      })
  }

}

/**
 * Generates a random number in the range from "to" to "from" inclusive.
 */
export function getRandomRange(from = 1, to = 999999) {
  return Math.floor(Math.random() * (to + 1 - from) + from);
}