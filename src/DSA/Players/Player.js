import React from 'react';
import * as drawing from "../../common/drawing";
import {getElementsOffset} from "../../common/dom-animator";
import GameService from "../GameService";
import {treasureIdToPoints} from "../Treasures/Treasure";
import Treasure from "../Treasures/Treasure";
import ScoreLabel from "./ScoreLabel";
import './Players.css';
import {getTreasurePos} from "../Treasures/Treasures";

export function makePlayerColorStyle(playerState, opacity = 1) {
  const color = drawing.colorStyleToArray(playerState ? playerState.playerColor : null);
  color[3] = opacity < 1 ? Math.floor(Math.round(255 * opacity)) : color[3];
  return drawing.colorArrayToStyle(color);
}

const Player = (props) => {
  const game = props.game;  // main game controller
  const playerIdx = props.idx;  // player index, same as player id
  const style = props.style || {};  // optional style for the wrapper div

  const playerState = game.gameService.getPlayerState(playerIdx);
  const playerColorStyle = makePlayerColorStyle(playerState);
  const isActivePlayer = game.state.playerTurn === playerIdx;
  const playerIsDone = playerState.playerReturning && playerState.playerMeeplePos <= -1;
  const oldPlayerScore = playerState.onOldPlayerSavedTreasures != null ? playerState.onOldPlayerSavedTreasures.reduce((score, tid) => score + treasureIdToPoints(tid), 0) : null;
  const playerScore = playerState.playerSavedTreasures.reduce((score, tid) => score + treasureIdToPoints(tid), 0);
  const animateScoreGlow = game.gameService.animationService.resolve('animateScoreGlow');
  const animateScoreGlowIsDone = game.gameService.animationService.isDone('animateScoreGlow');
  const animateTreasureFlipPart1 = game.gameService.animationService.resolve('animateTreasureFlipPart1');
  const animateTreasureFlipPart2 = game.gameService.animationService.resolve('animateTreasureFlipPart2');
  const animateAllTreasuresDrop = game.gameService.animationService.resolve('animateAllTreasuresDrop');
  const animateAllTreasuresDropIsDone = game.gameService.animationService.isDone('animateAllTreasuresDrop');
  const animateTreasureDrop = game.gameService.animationService.resolve('animateTreasureDrop');
  const animateTreasureDropIsDone = game.gameService.animationService.isDone('animateTreasureDrop');
  const treasureDropIdx = game.findTreasureIndexToDrop(playerIdx);
  // const treasureDropId = treasureDropIdx >= 0 ? playerState.playerPickedTreasures[treasureDropIdx] : null;

  const highlight = (game.gameService.isGamePlaying && isActivePlayer)
    || (game.gameService.isGameFinished && playerState.playerStatus === GameService.PlayerStates.WON);
  if (highlight) {
    style.boxShadow = "0 0 5px 5px " + playerColorStyle;
  }

  if (game.gameService.myPlayerId === playerIdx) {
    style.backgroundColor = '#56c5caCC';
  } else {
    style.backgroundColor = '#016b8c33';
  }

  if (game.gameService.playerStatus === GameService.PlayerStates.LOST) {
    style.textDecoration = "line-through";
  }

  const treasures = playerState.playerPickedTreasures.map((tid, idx) => {
    const elemId = `player${playerIdx}-treasure${idx}`;
    let moved = null;
    let masked = true;
    const tStyle = {};
    tStyle.position = "relative";
    tStyle.top = "-10px";
    tStyle.marginLeft = "-10px";
    tStyle.opacity = 1;
    tStyle.transform = "scaleX(1)";
    tStyle.zIndex = "4";
    if (playerIsDone && animateTreasureFlipPart1) {
      masked = true;
      tStyle.transition = "all 0.5s";
      tStyle.transform = "scaleX(0)";
      moved = animateTreasureFlipPart1;
      // console.log('animateTreasureFlipPart1');
    } else if (playerIsDone && animateTreasureFlipPart2) {
      masked = false;
      tStyle.transition = "all 0.5s";
      tStyle.transform = "scaleX(1)";
      moved = animateTreasureFlipPart2;
      // console.log('animateTreasureFlipPart2');
    } else if (playerIsDone && (animateScoreGlow || animateScoreGlowIsDone)) {
      masked = false;
      tStyle.transition = "all 1.0s";
      tStyle.opacity = 0;
      tStyle.transform = "translate(200px, 0px) rotate(180deg) scaleX(1)";
      // console.log('animateScoreGlow=' + animateScoreGlow + ' || animateScoreGlowIsDone=' + animateScoreGlowIsDone);
    } else if(isActivePlayer && (animateAllTreasuresDrop || animateAllTreasuresDropIsDone)) {
      masked = true;
      const {offsetX, offsetY, rotDeg} = getTreasurePos(game.state.treasures.length);
      const playerTreasuresElem = document.getElementById(elemId);
      const treasuresElem = document.getElementById("Treasures");
      let {dx, dy} = getElementsOffset(playerTreasuresElem, treasuresElem);
      dx += offsetX;
      dy += offsetY;
      dx += 180; //TODO: this should not be hardcoded
      dy += 45; //TODO: this should not be hardcoded
      tStyle.transition = "all 1.0s";
      // tStyle.opacity = 0;
      tStyle.transform = `scale(0.8) translate(${dx}px, ${dy}px) rotate(${rotDeg}deg`;
      moved = animateAllTreasuresDrop;
    } else if(isActivePlayer && treasureDropIdx === idx && (animateTreasureDrop || animateTreasureDropIsDone)) {
      masked = true;
      const {offsetX, offsetY, rotDeg} = getTreasurePos(playerState.playerMeeplePos);
      const playerTreasuresElem = document.getElementById(elemId);
      const treasuresElem = document.getElementById("Treasures");
      let {dx, dy} = getElementsOffset(playerTreasuresElem, treasuresElem);
      dx += offsetX;
      dy += offsetY;
      dx += 180; //TODO: this should not be hardcoded
      dy += 45; //TODO: this should not be hardcoded
      tStyle.transition = "all 1.0s";
      // tStyle.opacity = 0;
      tStyle.transform = `scale(0.8) translate(${dx}px, ${dy}px) rotate(${rotDeg}deg)`;
      moved = animateTreasureDrop;
    } else {
      masked = !playerIsDone;
    }
    return <Treasure elemid={elemId} key={idx} id={tid} masked={masked} style={tStyle} moved={moved}/>
  });

  return (
    <div id={`player${playerIdx}Div`}>
      <div id={`player${playerIdx}Treasures`} className="PlayerTreasures">{treasures}</div>
      <div className="Player" style={style} onClick={props.clicked}>
        <ScoreLabel tovalue={playerScore} fromvalue={oldPlayerScore} ondone={animateScoreGlow}/>
        <div className="PlayerName player-text truncate-text"
             style={{color: playerColorStyle}}>{playerState.playerName}</div>
      </div>
    </div>
  )
};

export default Player;