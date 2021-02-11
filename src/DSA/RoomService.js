import API from "../services/api-config";
import HostStorageService from "../services/host-storage-service";
import MessageBusService from "../services/message-bus-service";

export default class RoomService {

  rooms = [];
  room = null;  // current game room registration. (key is in a separate/parent database!)

  // Room state object template
  static RoomTemplate = {
    // generic properties:
    id: null,                   // unique id of the game/room
    version: 0,                 // latest state version. Iterate on every host update!
    gameName: null,             // name of the game
    gameStatus: null,           // game status, enum, one of the {starting, playing, finished, etc}
    playersNum: 0,              // current registered players in the room
    playersMax: 0,              // maximum allowed players fro this gmae type
    createdBy: null,            // player name who created the game room
  };

  constructor(gameService) {
    this.gameService = gameService;
    this.hostStorageService = HostStorageService.getInstance();
    this.messageBusService = MessageBusService.getInstance();

    this.room = {...RoomService.RoomTemplate};

    // subscribe to all events for now
    this.messageBusService.subscribe(null, (eventName, data) => {
      // console.log("<<< " + eventName + ": " + JSON.stringify(data));  // #DEBUG

      if (eventName === 'db-event' && data.key === 'rooms') {
        this.syncRooms();
      }
    });
  }

  getRooms() {
    return this.hostStorageService.get("rooms", 0, -1, API.HOST_DB_NAME)   // use home db
      .then(data => {
        return ((!Array.isArray(data) && data !== null) ? [data] : data) || [];
      }).then(rooms => {
        this.onAllRoomsUpdate(rooms);
        return rooms;
      }).catch(err => {
        this.gameService.game.onError('Error getting all rooms: ' + err, err);
      })
  }

  getRoom(gameId) {
    return this.getRooms()
      .then(rooms => {
        return rooms ? rooms.find(l => l && l.id == gameId) : null;   // intentional equal-ish
      }).then(room => {
        if (room && (room.version > this.room.version || room.version === 0)) {
          this.onRemoteRoomUpdate(room);
        }
        return room;
      }).catch(err => {
        this.gameService.game.onError('Error getting room id:' + gameId + '; ' + err, err);
      })
  }

  unregisterRoom() {
    if (!this.room) {
      return;
    }
    if (!this.room.id) {
      throw "room has to be registered first. This should not happen!";
    }
    return this.hostStorageService.delete("rooms", this.room, this.room.id, null, API.HOST_DB_NAME)   // use home db
      .then(() => {
        this.room = {...RoomService.RoomTemplate};
        console.log("room unregistered");
      })// use home db
      .catch(err => {
        this.gameService.game.onError('Error unregistering room: ' + err, err);
      });
  }

  registerRoom() {
    if (!this.room) {
      return;
    }
    return this.hostStorageService.add("rooms", this.room, 0, API.HOST_DB_NAME)   // use home db
      .then((room) => {
        const id = Array.isArray(room) ? room[0].id : room.id;
        this.room.id = id;
        console.log("room registered; DB id=" + id);   // #DEBUG
      })
      .catch(err => {
        this.gameService.game.onError('Error registering room: ' + err, err);
      });
  }

  updateRoom() {
    if (!this.room) {
      return;
    }
    if (!this.room.id) {
      throw 'Room has to have an id. This should not happen!';  //paranoia check
    }
    this.room.version++;
    return this.hostStorageService.update("rooms", this.room, null, API.HOST_DB_NAME)   // use home db
      .then((room) => {
        const id = Array.isArray(room) ? room[0].id : room.id;
        if (this.room.id !== id) {
          throw 'Room id mismatch. This should not happen!';  //paranoia check
        }
        console.log("room updated; id=" + id);   // #DEBUG
      })
      .catch(err => {
        this.gameService.game.onError('Error updating room: ' + err, err);
      });
  }

  // call this only when local room changes needs to be pushed
  syncRooms() {
    const gameId = this.gameService.gameId;
    if (gameId) {
      return this.getRoom(gameId)
        .then((room) => {
          return this.onLocalRoomUpdated(); // update tor register
        });
    } else {
      return this.getRooms();
    }
  }

  onRemoteRoomUpdate(remoteRoom) {
    this.room = remoteRoom;
    console.log("got room update; " + JSON.stringify(this.room));   // #DEBUG

    //TODO: update state if on Home screen
    // if (!this.gameService.gameId) {
    //   this.gameService.game.processGameStateChange();
    // }
    this.gameService.game.processGameStateChange();
  }

  onAllRoomsUpdate(rooms) {
    this.rooms = rooms;

    //TODO: update state if on Home screen
    // if (!this.gameService.gameId) {
    //   this.gameService.game.processGameStateChange();
    // }
    this.gameService.game.processGameStateChange();
  }

  onLocalRoomUpdated() {
    const state = this.gameService.state;
    const room = this.room;
    let doRegister = false;
    if (!room.id && !this.gameService.isGameOwner) {
      // room is not registered yet and we are nto the owner
      console.log("room has to be registered by the 'owner' first");
      return;
    } else if (!room.id && this.gameService.gameId && this.gameService.isGameOwner) {
      console.log("registering room id " + this.gameId);
      room.id = parseInt(this.gameService.gameId); // register new room if id was not set yet
      doRegister = true;
    }

    room.gameName = this.gameService.gameName;
    room.gameStatus = state.gameStatus;
    room.playersNum = this.gameService.playersTotal;
    room.playersMax = this.gameService.playersMax;
    room.createdBy = state.players.length ? this.gameService.getPlayerState(0).playerName : null; // player id=0 is the "owner"

    if (doRegister) {
      return this.registerRoom();
    } else {
      return this.updateRoom();
    }
  }


  ///// DEBUG ONLY!

  deleteAllRooms() {
    return this.hostStorageService.delete("rooms", null, null, null, API.HOST_DB_NAME)   // use home db
      .then(() => {
        console.log("All Rooms deleted!");
      })
      .catch(err => {
        this.gameService.game.onError(err, err);
      });
  }
}