import React from 'react';
import subImg from './sub_400.png';
import subRotorImg from './sub_rotor.png';
import './Sub.css';
import Marker from "./Marker";

const Sub = (props) => {
  const game = props.game;  // main game controller

  // #DEBUG only!
  const onClick = () => {
    console.log('air clicked');
    const air = game.state.air;
    if (air > 0) {
      game.setState({air: air - 1});
    }
  };

  const getAirMarkerPos = (airLeft) => {
    let offsetX = 0;
    let offsetY = 0;
    const dx = 45.5;
    const dy = 43;
    const used = 25 - airLeft;
    if (used < 10) {
      offsetX += dx * used;
    } else if (used < 19) {
      offsetX += dx * 9 - 45.5 * (used - 9) + 22;
      offsetY += dy;
    } else if (used < 25) {
      offsetX += 45.5 * (used - 19) + 90;
      offsetY += 2 * dy;
    } else {
      offsetX += 205;
      offsetY += 3 * dy;
    }
    return {offsetX: offsetX, offsetY: offsetY};
  };

  const {offsetX, offsetY} = getAirMarkerPos(game.state.air);

  const mrkStyle = {};
  mrkStyle.transform = `scale(0.8) translate(${offsetX}px, ${offsetY}px)`;

  return (
    <div className="Sub">
      <img src={subImg} className="submarine" alt="sub"/>
      <img src={subRotorImg} className="subrotor" alt="sub-rotor"/>
      <Marker style={mrkStyle} clicked={() => onClick()}/>
    </div>
  )
};

export default Sub;