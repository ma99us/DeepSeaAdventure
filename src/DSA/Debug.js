import React, {useState} from 'react';
import GameService, {clone} from "./GameService";

const DebugDiv = (props) => {
  const game = props.game;  // main game controller

  const [shown, setShown] = useState(true);

  const debugDivStyle = {
    zIndex: 100,
    position: "absolute",
    bottom: shown ? 0 : "-44px",
    border: "1px solid orange",
    padding: "5px",
    backgroundColor: "#ff450077",
    textAlign: "right",
    left: "0",
    right: "0",
    height: "30px",
    transition: "all .8s ease-out"
  };

  const debugBtnStyle = {
    zIndex: 101,
    position: "absolute",
    top: "-30px",
    right: "0",
    color: "red",
    margin: "3px",
  };

  const btnStyle = {
    margin: "3px",
  };

  const onDebug = () => {
    setShown(!shown);
  };

  const resetStateTest = () => {
    console.log('! resetStateTest');
    game.setState(clone(GameService.GameStateTemplate));
  };

  const onLowAirTest = () => {
    console.log('! onLowAirTest');
    game.setState({air: 0});
  };

  const onPlayerTurnEndTest = async () => {
    console.log('! onPlayerTurnEndTest');

    const onPlayerTurnEnd = (playerIdx) => {
      return game.gameService.updatePlayerState(playerIdx, (playerState) => {
        playerState.playerPickedTreasures = [];

        const treasures = [...game.state.treasures];
        for (let i = 0; playerState.playerPickedTreasures.length < 3; i++) {
          const idx = Math.floor(Math.random() * treasures.length);
          const id = treasures[idx];
          if (id == null) {
            continue;
          }
          treasures[idx] = null;

          if (Array.isArray(id)) {
            playerState.playerPickedTreasures.push(...id);
          } else {
            playerState.playerPickedTreasures.push(id);
          }
          playerState.playerReturning = true;
          playerState.playerMeeplePos = 0;
        }
        game.setState({treasures: treasures});
      });
    };

    const playerIdx = 0;

    game.gameService.animationService.remove('animateScoreGlow');

    await onPlayerTurnEnd(playerIdx);

    //game.onPlayerTurnsEnd(playerIdx)
  };

  const onGameRoundEndTest = async () => {
    console.log('! onGameRoundEndTest');

    const onPrevRoundEnd = async () => {
      const treasures = [...game.state.treasures];
      for (let i = 0; i < Math.floor(treasures.length / 3); i++) {
        const idx = Math.floor(Math.random() * treasures.length);
        treasures[idx] = null;
      }
      await game.setStateNow({treasures: treasures});
    };

    await onPrevRoundEnd();

    game.onGameRoundEnd();

    game.processGameStateChange();
  };

  return (
    <div id="DebugDiv" style={debugDivStyle}>
      <button id="DebugBtn" style={debugBtnStyle} onClick={onDebug}>DEBUG</button>

      <div>
        <button style={btnStyle} onClick={resetStateTest}>Reset State</button>
        <button style={btnStyle} onClick={onLowAirTest}>Low Air Test</button>
        <button style={btnStyle} onClick={onPlayerTurnEndTest}>Turn End Test</button>
        <button style={btnStyle} onClick={onGameRoundEndTest}>Round End Test</button>
      </div>
    </div>
  );
};

const Empty = () => {
  return (null);
};

export const Debug = process.env.NODE_ENV === 'development' ? DebugDiv : Empty;
