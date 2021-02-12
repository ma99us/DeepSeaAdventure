import React from 'react';
import {getTreasurePos} from '../Treasures/Treasures';
import Meeple, {MeeplesColors, MeeplesIdsNum} from "./Meeple";
import './Meeples.css';

const Meeples = (props) => {
  const game = props.game;

  //#TEST: only for development
  const clicked = (idx) => {
    console.log('Meeple #' + idx + ' clicked');  //#DEBUG
    game.onSelectMeeple(idx);
  };

  const treasures = game.state.players.map((player, index) => {
    const dirRot = player.playerReturning ? Math.PI / 2 : -Math.PI / 2;
    const pos = player.playerMeeplePos;
    let style = null;
    if (pos >= 0) {
      // meeple is on the treasure track
      let {offsetX, offsetY, rotDeg} = getTreasurePos(pos);
      offsetX += 20;
      offsetY += 12;
      rotDeg += 180 / Math.PI * dirRot;
      let flip = ((!player.playerReturning && pos < 10) || (player.playerReturning && pos > 10)) ? -1 : 1;
      // console.log(`index=${index}, offsetX=${offsetX}, offsetY=${offsetY}, sin=${sin}`);    // #DEBUG
      style = {transform: `scale(0.8) translate(${offsetX}px, ${offsetY}px) rotate(${rotDeg}deg) scaleX(${flip})`};
    } else {
      // meeple is on the submarine
      const rotDeg = 0;
      const offsetX = 115 - 35 * index - (index > 2 ? 80 : 0);
      const offsetY = -195 - (index === 2 || index === 3 ? 15 : 0);
      style = {transform: `scale(1.0) translate(${offsetX}px, ${offsetY}px) rotate(${rotDeg}deg)`};
    }
    return (<Meeple key={index} id={index} selected={game.state.playerTurn === index} style={style}
                    clicked={() => clicked(index)}/>);
  });

  return (
    <div className="Meeples">{treasures}</div>
  );
};

export default Meeples;