import React from 'react';
import {getElementsOffset, sleep} from "../../common/dom-animator";
import Treasure, {TreasureTypesNum, TreasureIds, TreasureGroup} from "./Treasure";
import './Treasures.css';

export function makeTreasureTrackIds() {
  const tids = [];
  for (let tt = 0; tt < TreasureTypesNum; tt++) {
    const ids = [...TreasureIds];
    while (ids.length) {
      const i = Math.floor(Math.random() * ids.length);
      const id = ids.splice(i, 1)[0];
      tids.push(10 * tt + id);
    }
  }
  return tids;
}

export function getTreasurePos(pos) {
  const x0 = -50;
  const y0 = -20;
  const xSpan = -400;

  const getOffsetY = (idx) => {
    let prevY = 0;
    let rotDeg = 0;
    for (let i = 0; i <= idx; i++) {
      const sin = Math.sin(Math.PI / 20 * i);
      prevY += Math.pow(sin, 2) * 50;
      rotDeg -= sin * 13;
    }
    return {offsetY: prevY, rotDeg: rotDeg};
  };

  const offsetX = Math.sin(Math.PI / 20 * pos) * xSpan + x0;
  let {offsetY, rotDeg} = getOffsetY(pos);
  offsetY += y0;

  return {offsetX: offsetX, offsetY: offsetY, rotDeg: rotDeg};
}

const Treasures = (props) => {
  const game = props.game;  // main game controller

  //#TEST: only for development
  const clicked = (idx) => {
    // treasure was clicked
    const id = game.state.treasures[idx];
    console.log('Treasure #' + id + ' clicked');
  };

  const animateTreasureTrack = game.gameService.animationService.resolve('animateTreasureTrack');
  const animateTreasureTrackIsDone = game.gameService.animationService.isDone('animateTreasureTrack');
  const animateTreasureMove = game.gameService.animationService.resolve('animateTreasureMove');

  const playerIdx = game.state.playerTurn;
  const playerState = game.gameService.getPlayerState(playerIdx);
  const selectedTreasure = playerState ? playerState.onSelectedTreasure : null;

  let lastGoodIdx = 0;
  const treasures = game.state.treasures.map((id, index) => {
    const idx = id != null ? lastGoodIdx : index;
    const {offsetX, offsetY, rotDeg} = getTreasurePos((animateTreasureTrack || animateTreasureTrackIsDone) ? idx :index);
    lastGoodIdx += id != null ? 1 : 0;
    // console.log(`index=${index}, offsetX=${offsetX}, offsetY=${offsetY}, rotDeg=${rotDeg}`);    // #DEBUG

    if (animateTreasureMove && selectedTreasure === index) {
      // animate treasure pick-up by player
      const treasuresElem = document.getElementById("Treasures");
      const playerTreasuresElem = document.getElementById(`player${playerIdx}Treasures`);
      let {dx, dy} = getElementsOffset(treasuresElem, playerTreasuresElem);
      dx -= 161;  // TODO: this should not be hardcoded
      dy -= 10;  // TODO: this should not be hardcoded
      const style = {transform: `scale(1.0) translate(${dx}px, ${dy}px) rotate(0deg)`};
      style.transition = "all 1.0s";
      return (<TreasureGroup key={index} id={id} masked={true} style={style}
                        moved={animateTreasureMove}
      />);
    }
    else {
      // normal track layout or animated, hiding picked treasures
      const doHidePicked = (animateTreasureTrack || animateTreasureTrackIsDone) && id == null;
      const style = {transform: `scale(0.8) translate(${offsetX}px, ${offsetY}px) rotate(${rotDeg}deg)`};
      style.opacity = doHidePicked ? "0" : "1";
      style.transition = animateTreasureTrack ? "all 1.0s" : "";
      return (<TreasureGroup key={index} id={id} masked={true} style={style}
                        clicked={() => clicked(index)}/>);
    }
  });

  if (animateTreasureTrack) {
    // just resolve animation after some time > transition time. FIXME: there is got to be a better way to detect when animation is done!?
    sleep(1500).then(() => {
      // console.log("animateTreasureTrack done.");  //#DEBUG
      animateTreasureTrack();
    });
  }

  return (
    <div id="Treasures" className="Treasures">{treasures}</div>
  );
};

export default Treasures;