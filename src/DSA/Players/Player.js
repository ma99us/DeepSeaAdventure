import React from 'react';
import * as drawing from "../../common/drawing";
import GameService from "../GameService";
import {treasureIdToPoints} from "../Treasures/Treasure";
import Treasure from "../Treasures/Treasure";
import ScoreLabel from "./ScoreLabel";
import './Players.css';

export function makePlayerColorStyle(playerState, opacity = 1) {
  const color = drawing.colorStyleToArray(playerState ? playerState.playerColor : null);
  color[3] = opacity < 1 ? Math.floor(Math.round(255 * opacity)) : color[3];
  return drawing.colorArrayToStyle(color);
}

const Player = (props) => {
  const game = props.game;  // main game controller
  const idx = props.idx;  // player index, same as player id
  const style = props.style || {};  // optional style for the wrapper div

  const playerState = game.gameService.getPlayerState(idx);
  const playerColorStyle = makePlayerColorStyle(playerState);

  const highlite = (game.gameService.isGamePlaying && game.state.playerTurn === idx)
    || (game.gameService.isGameFinished && playerState.playerStatus === GameService.PlayerStates.WON);
  if (highlite) {
    style.boxShadow = "0 0 5px 5px " + playerColorStyle;
  }

  if (game.gameService.myPlayerId === idx) {
    style.backgroundColor = '#56c5caCC';
  } else {
    style.backgroundColor = '#016b8c33';
  }

  if (game.gameService.playerStatus === GameService.PlayerStates.LOST) {
    style.textDecoration = "line-through";
  }

  const treasures = playerState.playerPickedTreasures.map((tid, idx) => {
    const tStyle = {};
    tStyle.position = "relative";
    tStyle.top = "-10px";
    return <Treasure key={idx} id={tid} style={tStyle}/>
  });

  const oldPlayerScore = playerState.onOldPlayerSavedTreasures != null ? playerState.onOldPlayerSavedTreasures.reduce((score, tid) => score + treasureIdToPoints(tid), 0) : null;
  const playerScore = playerState.playerSavedTreasures.reduce((score, tid) => score + treasureIdToPoints(tid), 0);
  const animateScoreGlow = game.gameService.animationService.resolve('animateScoreGlow');

  return (
    <div id={`player${idx}Div`}>
      <div id={`player${idx}Treasures`} className="PlayerTreasures">{treasures}</div>
      <div className="Player" style={style} onClick={props.clicked}>
        <ScoreLabel tovalue={playerScore} fromvalue={oldPlayerScore} ondone={animateScoreGlow}/>
        <div className="PlayerName player-text truncate-text"
             style={{color: playerColorStyle}}>{playerState.playerName}</div>
      </div>
    </div>
  )
};

export default Player;