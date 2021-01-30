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

const Treasures = (props) => {
  const game = props.game;

  const clicked = (idx) => {
    // treasure was clicked
    const id = game.state.treasures[idx];
    if (id != null && game.state.selectedTreasure !== idx) {
      game.onSelectTreasure(idx);
    } else if (id != null) {
      game.onPickTreasure(idx);
    }
  };

  const x0 = -50;
  const y0 = -20;
  const xSpan = -400;

  let prevY = 0;
  const treasures = game.state.treasures.map((id, index) => {
    //const rotDeg = 0;
    const rotDeg = Math.sin(Math.PI / 10 * index) * 50;
    const offsetX = Math.sin(Math.PI / 20 * index) * xSpan + x0;
    const sin = Math.sin(Math.PI / 20 * index);
    prevY += Math.pow(sin, 2)*50;
    const offsetY = prevY + y0;
    // const offsetY = index * (10 + Math.abs(sin) * 20);
    // console.log(`index=${index}, offsetX=${offsetX}, offsetY=${offsetY}, sin=${sin}`);    // #DEBUG
    const style = {transform: `scale(0.8) translate(${offsetX}px, ${offsetY}px) rotate(${rotDeg}deg)`};
    return (<Treasure key={index} id={id} masked={game.state.selectedTreasure !== index} style={style} clicked={() => clicked(index)}></Treasure>);
  });

  return (
    <div className="Treasures" style={{width: `${xSpan * 2}px`, height: `${prevY - 60}px`}}>{treasures}</div>
  );
};

export default Treasures;