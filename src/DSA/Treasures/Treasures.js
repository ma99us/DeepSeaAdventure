import React from 'react';
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

const Treasures = (props) => {
  const game = props.game;

  return (
    <div className="Treasures">{
      game.state.treasures.map((id, index) => <Treasure key={index} id={id}></Treasure>)
    }
    </div>
  );
};

export default Treasures;