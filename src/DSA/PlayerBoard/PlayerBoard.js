import React, {useRef, useEffect} from 'react';
import * as drawing from "../../common/drawing";
import GameService from "../GameService";
import {makePlayerColorStyle} from "../Players/Player";
import Dice from "./Dice";
import {makeGlowFilter} from "../../common/drawing";
import PromiseEx from "../../common/PromiseEx";
import thumbs_up from "./thumbs_up_60.png";
import thumbs_down from "./thumbs_down_60.png";
import pass_hand from "./pass_hand_60.png";
import pick_hand from "./pick_hand_60.png";
import discard_icon from "./discard_60.png";
import './PlayerBoard.css';
import Treasure from "../Treasures/Treasure";

const PlayerBoard = (props) => {
  const game = props.game;
  const idx = props.idx != null ? props.idx : game.state.playerTurn;
  const style = props.style || {};

  const playerState = game.gameService.getPlayerState(idx);
  if (!playerState) {
    return (
      <div></div>
    );
  }

  // const promises = [new PromiseEx(), new PromiseEx()];
  // Promise.all(promises).then(() => {
  //   //console.log('both dice rolled');  // #DEBUG
  //   game.onDiceFinishedRolling(idx);
  // });
  // console.log(`#${idx} ${playerState.playerName}; playerDiceToRoll:${playerState.playerDiceToRoll}`); // #DEBUG

  const playerColorStyle = makePlayerColorStyle(playerState);

  // first part
  const showFirstPart = !playerState.playerReturning || playerState.playerMeeplePos >= 0;
  const canGoUp = !playerState.playerDiceRolled.length && playerState.playerMeeplePos >= 0;
  const playerGoUpStyle = {};
  playerGoUpStyle.visibility = canGoUp ? "visible" : "hidden";

  const goUpStyle = {};
  goUpStyle.filter = makeGlowFilter(3, playerColorStyle, 3);

  const canGoDown = !playerState.playerDiceRolled.length && !playerState.playerReturning && playerState.playerMeeplePos < game.state.treasures.length - 1;  //FIXME: this is not accurate, account for other meeples.
  const playerGoDownStyle = {};
  playerGoDownStyle.visibility = canGoDown ? "visible" : "hidden";

  const goDownStyle = {};
  goDownStyle.filter = makeGlowFilter(3, playerColorStyle, 3);

  const cargoStyle = {};
  cargoStyle.visibility = playerState.playerPickedTreasures.length ? "visible" : "hidden";

  // second part
  const showSecondPart = playerState.playerDiceRolled.length && game.gameService.animationService.isDone('animateDice1Roll', 'animateDice2Roll', 'animateMeepleMove');
  const playerPassStyle = {};
  const passStyle = {};
  passStyle.visibility = showSecondPart ? "visible" : "hidden";
  passStyle.filter = makeGlowFilter(3, playerColorStyle, 3);

  const treasureId = game.state.treasures[playerState.playerMeeplePos];

  const playerPickStyle = {};
  playerPickStyle.visibility = treasureId != null ? "visible" : "hidden";

  const treasureStyle = {};
  treasureStyle.position = "relative";
  treasureStyle.top = "20px";
  treasureStyle.left = "10px";

  const pickStyle = {};
  pickStyle.position = "relative";
  pickStyle.top = "-10px";
  pickStyle.left = "0";
  pickStyle.filter = makeGlowFilter(3, playerColorStyle, 3);

  style.width = showSecondPart ? "400px" : (showFirstPart ? "200px" : 0);

  return (
    <div className="PlayerBoard" style={style}>
      <div id="playerDiveContainer">
        <div id="playerGoUp" style={playerGoUpStyle} onClick={() => game.onMeepleDirectionSelected(idx, true)}>
          <img src={thumbs_up} style={goUpStyle} alt="go up"/></div>
        <div id="playerDiceArea">
          <Dice id={playerState.playerDiceRolled[0]}
                rolled={game.gameService.animationService.resolve('animateDice1Roll')}/>
          <Dice id={playerState.playerDiceRolled[1]}
                rolled={game.gameService.animationService.resolve('animateDice2Roll')}/>
        </div>
        <div id="playerCargo" style={cargoStyle}>
          Overburden: -{playerState.playerPickedTreasures.length}</div>
        <div id="playerGoDown" style={playerGoDownStyle} onClick={() => game.onMeepleDirectionSelected(idx, false)}>
          <img src={thumbs_down} style={goDownStyle} alt="go down"/></div>
      </div>
      <div id="playerTreasureContainer">
        <div id="playerPass" style={playerPassStyle} onClick={() => game.onPlayerTurnsEnd(idx)}>
          <img src={pass_hand} style={passStyle} alt="pass"/></div>
        <div id="playerPickTreasure" style={playerPickStyle} onClick={() => game.onPickTreasure(idx, playerState.playerMeeplePos)}>
          <Treasure id={treasureId} masked={true} style={treasureStyle}/>
          <img src={pick_hand} style={pickStyle} alt="pass" width="73" height="50"/></div>
        <div id="playerDropTreasure">TODO: drop treasures</div>
      </div>
    </div>
  )
};

export default PlayerBoard;