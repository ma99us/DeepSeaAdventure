import React from 'react';
import Treasure, {TreasureTypesNum, TreasureIds, treasureIdToPoints} from "./Treasure";
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
  const game = props.game;

  //#TEST: only for development
  const clicked = (idx) => {
    // treasure was clicked
    const id = game.state.treasures[idx];
    if (id != null && game.state.selectedTreasure !== idx) {
      game.onSelectTreasure(idx);
    } else if (id != null) {
      game.onPickTreasure(idx);
    }
  };

  const treasures = game.state.treasures.map((id, index) => {
    const {offsetX, offsetY, rotDeg} = getTreasurePos(index);
    // console.log(`index=${index}, offsetX=${offsetX}, offsetY=${offsetY}, sin=${sin}`);    // #DEBUG
    const style = {transform: `scale(0.8) translate(${offsetX}px, ${offsetY}px) rotate(${rotDeg}deg)`};
    return (<Treasure key={index} id={id} masked={game.state.selectedTreasure !== index} style={style}
                      clicked={() => clicked(index)}></Treasure>);
  });

  return (
    <div className="Treasures">{treasures}</div>
  );
};

export default Treasures;