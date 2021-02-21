import React from 'react';
import subImg from './sub_400.png';
import subRotorImg from './sub_rotor.png';
import './Sub.css';

const Sub = (props) => {
  const game = props.game;  // main game controller

  return (
    <div className="Sub">
      <img src={subImg} className="submarine" alt="sub"/>
      <img src={subRotorImg} className="subrotor" alt="sub-rotor"/>
    </div>
  )
};

export default Sub;