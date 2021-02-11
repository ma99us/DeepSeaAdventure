import React, {useRef, useEffect} from 'react';
import {loadImage} from '../../common/drawing';
import tokens_60 from './tokens_60.png';
import blank_token_60 from './blank_token_60.png';
import './Treasures.css';

export const TreasureTypesNum = 4;
export const TreasureIdsNum = 4;
export const TreasureIds = [0, 0, 1, 1, 2, 2, 3, 3]; // there are 4 treasure types and each repeats twice

export function treasureIdToPoints(id) {
  const tt = Math.floor(id / 10);
  const tid = id % 10;  // 0-3 first tier [0,1,2,3], 10-13 - second tier [4,5,6,7], 20-23 - third [8,9,10,11], 30-33 - forth [12,13,14,15]
  return 4 * tt + tid;
}

async function initTokens() {
  const tokensImg = await loadImage(tokens_60);
  const tokenWidth = Math.round(tokensImg.width / (TreasureIdsNum + 1));
  const tokenHeight = Math.round(tokensImg.height / TreasureTypesNum);
  return [tokensImg, tokenWidth, tokenHeight];
}

async function initBlank() {
  return await loadImage(blank_token_60);
}

const Treasure = (props) => {
  const id = props.id;
  const masked = props.masked;
  const rot = props.rot || 0;
  const style = props.style;

  const row = Math.floor(id / 10);
  const col = id % 10 + 1;

  const canvasRef = useRef(null);

  // draw only once element gets attached to DOM
  useEffect(() => {
    const drawElement = async (context) => {
      const [tokensImg, tokenWidth, tokenHeight] = await initTokens();
      const blankTokenImg = await initBlank();

      const width = context.canvas.width;
      const height = context.canvas.height;
      context.clearRect(0, 0, width, height);
      context.translate(width / 2, height / 2);
      context.rotate(rot);
      if (id != null && id >= 0) {
        context.drawImage(tokensImg, (masked ? 0 : col * tokenWidth), row * tokenHeight, tokenWidth, tokenHeight,
          -width / 2, -height / 2, width, height);
      } else {
        context.drawImage(blankTokenImg, 0, 0, tokenWidth, tokenHeight,
          -width / 2, -height / 2, width, height);
      }
      context.rotate(-rot);
      context.translate(-width / 2, -height / 2);
    };

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    void drawElement(context);
  }, [canvasRef, id, masked, rot, col, row]);

  return (
    <canvas className="Treasure" ref={canvasRef} onClick={props.clicked} width={60} height={60} style={style}></canvas>
  )
};

export default Treasure