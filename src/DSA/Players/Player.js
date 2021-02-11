import React, {useRef, useEffect} from 'react';
import './Players.css';
import * as drawing from "../../common/drawing";
import GameService from "../GameService";

export function makePlayerColorStyle(playerState, opacity = 1) {
  const color = drawing.colorStyleToArray(playerState ? playerState.playerColor : null);
  color[3] = opacity < 1 ? Math.floor(Math.round(255 * opacity)) : color[3];
  return drawing.colorArrayToStyle(color);
}

const Player = (props) => {
  const game = props.game;
  const idx = props.idx;
  const style = props.style || {};

  const playerState = game.gameService.getPlayerState(idx);
  const playerColorStyle = makePlayerColorStyle(playerState);

  const highlite = (game.gameService.isGamePlaying && game.state.playerTurn === idx)
    || (game.gameService.isGameFinished && playerState.playerStatus === GameService.PlayerStates.WON);
  if (highlite) {
    style.boxShadow = "0 0 5px 5px " + playerColorStyle;
  } else {
    style.boxShadow = "";
  }

  if (game.gameService.myPlayerId === idx) {
    style.backgroundColor = '#56c5caCC';
  } else {
    style.backgroundColor = '#016b8c33';
  }

  if (game.gameService.playerStatus === GameService.PlayerStates.LOST) {
    style.textDecoration = "line-through";
  } else {
    style.textDecoration = "";
  }

  return (
    <div className="Player" style={style} onClick={props.clicked}><span className="player-text" style={{color: playerColorStyle}}>{playerState.playerName}</span></div>
  )
};

export default Player;