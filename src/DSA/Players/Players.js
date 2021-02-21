import React from 'react';
import Player from "./Player";
import './Players.css';

const Players = (props) => {
  const game = props.game;  // main game controller

  //#TEST: only for development
  const clicked = (idx) => {
//    console.log('Player #' + idx + ' clicked');  //#DEBUG
    game.onSelectMeeple(idx);
  };

  const players = game.state.players.map((player, index) => {
    let style = null;
    return (<Player key={index} game={game} idx={index} selected={game.state.playerTurn === index} style={style} clicked={() => clicked(index)}/>);
  });

  return (
    <div className="Players">{players}</div>
  );
};

export default Players;