import React, {useRef, useEffect} from 'react';
import {loadImage} from '../../common/drawing';
import tokens_40 from './meeples_40.png';
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

  const row = 0;
  const col = id;

  const canvasRef = useRef(null);

  // draw only once element gets attached to DOM
  useEffect(() => {
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

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    void drawElement(context);
  }, [canvasRef, id, masked, rot, col, row]);

  return (
    <canvas className="Meeple" ref={canvasRef} onClick={props.clicked} width={25} height={40} style={style}></canvas>
  )
};

export default Meeple;