import React, {useRef, useEffect} from 'react';
import * as drawing from "../../common/drawing";
import GameService from "../GameService";
import {makePlayerColorStyle} from "../Players/Player";
import Dice from "./Dice";
import thumbs_up from "./thumbs_up_60.png";
import thumbs_down from "./thumbs_down_60.png";
import './PlayerBoard.css';
import {makeGlowFilter} from "../../common/drawing";

const PlayerBoard = (props) => {
  const game = props.game;
  const idx = props.idx;
  const style = props.style || {};

  const playerState = game.gameService.getPlayerState(idx);
  if (!playerState) {
    return (
      <div></div>
    );
  }

  // HACK to to resolve promises outside of context
  let onResolve0;
  const p0 = new Promise(function(resolve, reject){
    onResolve0 = playerState.playerDiceToRoll[0] != null ? resolve : null;
  });
  let onResolve1;
  const p1 = new Promise(function(resolve, reject){
    onResolve1 = playerState.playerDiceToRoll[1] != null ? resolve : null;
  });
  Promise.all([p0, p1]).then(() => {
    //console.log('both dice rolled');
    game.onDiceFinishedRolling(idx);
  });
  console.log(`#${idx} ${playerState.playerName}; playerDiceToRoll:${playerState.playerDiceToRoll}`);

  const playerColorStyle = makePlayerColorStyle(playerState);

  const canGoUp = playerState.playerMeeplePos >= 0;
  const playerGoUpStyle = {};
  playerGoUpStyle.visibility = canGoUp ? "visible" : "hidden";

  const goUpStyle = {};
  goUpStyle.filter = makeGlowFilter(3, playerColorStyle, 3);

  const canGoDown = !playerState.playerReturning && playerState.playerMeeplePos < game.state.treasures.length - 1;  //FIXME: this is not accurate, account for other meeples.
  const playerGoDownStyle = {};
  playerGoDownStyle.visibility =  canGoDown ? "visible" : "hidden";

  const goDownStyle = {};
  goDownStyle.filter = makeGlowFilter(3, playerColorStyle, 3);

  const cargoStyle = {};
  cargoStyle.visibility =  playerState.playerPickedTreasures.length > 0 ? "visible" : "hidden";

  return (
    <div className="PlayerBoard" style={style}>
      <div id="playerGoUp" style={playerGoUpStyle}><img src={thumbs_up} onClick={() => game.onMeepleDirectionSelected(idx, true)} style={goUpStyle} alt="go up"></img></div>
      <div id="playerDiceArea">
        <Dice id={playerState.playerDiceRolled[0]} rolled={onResolve0}></Dice>
        <Dice id={playerState.playerDiceRolled[1]} rolled={onResolve1}></Dice>
      </div>
      <div id="playerCargo" style={cargoStyle}>Salvage penalty: -{playerState.playerPickedTreasures.length}</div>
      <div id="playerGoDown" style={playerGoDownStyle}><img src={thumbs_down} onClick={() => game.onMeepleDirectionSelected(idx, false)} style={goDownStyle} alt="go down"></img></div>
    </div>
  )
};

export default PlayerBoard;