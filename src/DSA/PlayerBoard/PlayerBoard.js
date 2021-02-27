import React from 'react';
import {makePlayerColorStyle} from "../Players/Player";
import Dice from "./Dice";
import {makeGlowFilter} from "../../common/drawing";
import thumbs_up from "./thumbs_up_60.png";
import thumbs_down from "./thumbs_down_60.png";
import pass_hand from "./pass_hand_60.png";
import pick_hand from "./pick_hand_60.png";
import drop_icon from "./discard_60.png";
import Treasure, {TreasureGroup, TreasureIdsNum} from "../Treasures/Treasure";
import './PlayerBoard.css';

const PlayerBoard = (props) => {
  const game = props.game;  // main game controller
  const idx = props.idx != null ? props.idx : game.state.playerTurn;  // player index, same as player id
  const style = props.style || {};  // optional css style to apply to a wrapping dom element

  const playerState = game.gameService.getPlayerState(idx);
  if (!playerState) {
    return (
      <div></div>
    );
  }

  const playerColorStyle = makePlayerColorStyle(playerState);

  // first part
  const showFirstPart = !playerState.playerReturning || playerState.playerMeeplePos >= 0;
  const canGoUp = !playerState.playerDiceRolled.length && playerState.playerMeeplePos >= 0;
  const playerGoUpStyle = {};
  playerGoUpStyle.visibility = canGoUp ? "visible" : "hidden";

  const goUpStyle = {};
  goUpStyle.filter = makeGlowFilter(3, playerColorStyle, 3);

  const nextMeeplePos = game.getNextMeeplePos(playerState.playerReturning, playerState.playerMeeplePos);
  const canGoDown = !playerState.playerDiceRolled.length && !playerState.playerReturning && nextMeeplePos < game.state.treasures.length;
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
  playerPickStyle.position = "relative";
  playerPickStyle.visibility = treasureId != null ? "visible" : "hidden";

  const treasureStyle = {};
  treasureStyle.position = "absolute";
  treasureStyle.top = "50px";
  treasureStyle.left = "40px";

  const pickStyle = {};
  pickStyle.position = "relative";
  pickStyle.top = "-10px";
  pickStyle.left = "20px";
  pickStyle.filter = makeGlowFilter(3, playerColorStyle, 3);

  const dropTreasureIdx = game.findTreasureIndexToDrop(idx);
  const dropTreasureId = dropTreasureIdx >= 0 ? playerState.playerPickedTreasures[dropTreasureIdx] : null;
  const playerDropStyle = {};
  playerDropStyle.position = "relative";
  playerDropStyle.visibility = (treasureId == null && dropTreasureId != null) ? "visible" : "hidden";
  const dropStyle = {};
  dropStyle.position = "relative";
  dropStyle.top = "50px";
  dropStyle.left = "20px";
  dropStyle.zIndex = "4";
  dropStyle.filter = makeGlowFilter(3, playerColorStyle, 3);
  const treasureDropStyle = {};
  treasureDropStyle.position = "absolute";
  treasureDropStyle.top = "15px";
  treasureDropStyle.left = "70px";

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
        <div id="playerPickTreasure" style={playerPickStyle} onClick={() => game.onPickTreasure(idx)}>
          <TreasureGroup id={treasureId} masked={true} style={treasureStyle}/>
          <img src={pick_hand} style={pickStyle} alt="pick" width="73" height="50"/>
        </div>
        <div id="playerDropTreasure" style={playerDropStyle} onClick={() => game.onDropTreasure(idx)}>
          <Treasure id={dropTreasureId} masked={true} style={treasureDropStyle}/>
          <img src={drop_icon} style={dropStyle} alt="drop" width="30" height="30"/>
        </div>
      </div>
    </div>
  )
};

export default PlayerBoard;