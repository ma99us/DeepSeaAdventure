import React from 'react';
import {getElementsOffset} from "../../common/dom-animator";
import Treasure, {TreasureTypesNum, TreasureIds} from "./Treasure";
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

  //const rotDeg = -Math.pow(Math.sin(Math.PI / 20 * pos), 2) * 90;
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

  const playerIdx = game.state.playerTurn;
  const playerState = game.gameService.getPlayerState(playerIdx);
  const selectedTreasure = playerState ? playerState.onSelectedTreasure : null;

  const treasures = game.state.treasures.map((id, index) => {
    const {offsetX, offsetY, rotDeg} = getTreasurePos(index);
    if(selectedTreasure !== index){
      // console.log(`index=${index}, offsetX=${offsetX}, offsetY=${offsetY}, sin=${sin}`);    // #DEBUG
      const style = {transform: `scale(0.8) translate(${offsetX}px, ${offsetY}px) rotate(${rotDeg}deg)`};
      return (<Treasure key={index} id={id} masked={true} style={style}
                        clicked={() => clicked(index)}/>);
    } else {
      const treasuresElem = document.getElementById("Treasures");
      const playerTreasuresElem = document.getElementById(`player${playerIdx}Treasures`);
      let {dx, dy} = getElementsOffset(treasuresElem, playerTreasuresElem);
      dx -= 260;  // TODO: this should not be hardcoded
      dy -= 10;  // TODO: this should not be hardcoded
      const style = {transform: `scale(1.0) translate(${dx}px, ${dy}px) rotate(0deg)`};
      return (<Treasure key={index} id={id} masked={false} style={style}
                        moved={game.gameService.animationService.resolve('animateTreasureMove')}
                        />);
    }
  });

  return (
    <div id="Treasures" className="Treasures">{treasures}</div>
  );
};

export default Treasures;