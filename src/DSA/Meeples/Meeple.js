import React, {useRef, useEffect} from 'react';
import {loadImage} from '../../common/drawing';
import tokens_40 from './meeples_40.png';
import {transitionListener} from "../../common/dom-animator";
import './Meeples.css';

export const MeeplesIdsNum = 6;
export const MeeplesColors = ['#710B06', '#0B5A23', '#003277', '#A24300', '#BDA400', '#351E2E'];

async function initTokens() {
  const tokensImg = await loadImage(tokens_40);
  const tokenWidth = Math.round(tokensImg.width / MeeplesIdsNum);
  const tokenHeight = tokensImg.height;
  return [tokensImg, tokenWidth, tokenHeight];
}

const Meeple = (props) => {
  const id = props.id;
  const masked = props.masked;
  const rot = props.rot || 0;
  const style = props.style;
  const moved = props.moved;

  const row = 0;
  const col = id;

  const canvasRef = useRef(null);

  // draw only once element gets attached to DOM
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const drawElement = async (context) => {
      const [tokensImg, tokenWidth, tokenHeight] = await initTokens();

      const width = context.canvas.width;
      const height = context.canvas.height;
      context.clearRect(0, 0, width, height);
      context.translate(width / 2, height / 2);
      context.rotate(rot);
      context.drawImage(tokensImg, (masked ? 0 : col * tokenWidth), row * tokenHeight, tokenWidth, tokenHeight,
        -width / 2, -height / 2, width, height);
      context.rotate(-rot);
      context.translate(-width / 2, -height / 2);
    };

    void drawElement(context);

    if(moved){
      transitionListener(canvas).then((ev) => {
        // console.log("Meeple #" + id + " transition finished; propertyName=" + ev.propertyName + ", elapsedTime=" + ev.elapsedTime);  //#DEBUG
        moved(id);
      });
    }
  }, [canvasRef, id, masked, rot, col, row, style, moved]);

  return (
    <canvas className="Meeple" ref={canvasRef} onClick={props.clicked} width={25} height={40} style={style}/>
  )
};

export default Meeple;