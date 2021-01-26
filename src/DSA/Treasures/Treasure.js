import React, {useRef, useEffect} from 'react';
import tokens_60 from './tokens_60.png';
import './Treasures.css';

export const TreasureTypesNum = 4;
export const TreasureIdsNum = 4;
export const TreasureIds = [0, 0, 1, 1, 2, 2, 3, 3]; // there are 4 treasure types and each repeats twice
export const TreasureImgSize = 60;

let tokensImg;
let width, height;

export function treasureIdToPoints(id) {
  const tt = Math.floor(id / 10);
  const tid = id % 10;  // 0-3 first tier [0,1,2,3], 10-13 - second tier [4,5,6,7], 20-23 - third [8,9,10,11], 30-33 - forth [12,13,14,15]
  return 4 * tt + tid;
}

async function init() {
  if (tokensImg) {
    return;
  }

  return new Promise((resolve, reject) => {
    tokensImg = new Image();
    tokensImg.setAttribute('crossOrigin', '');
    tokensImg.src = tokens_60;
    tokensImg.onload = () => {
      width = Math.round(tokensImg.width / (TreasureIdsNum + 1));
      height = Math.round(tokensImg.height / TreasureTypesNum);
      resolve("tokens ready");
    };
  });
}

const Treasure = (props) => {
  const id = props.id;
  const rot = props.rot || 0;

  const row = Math.floor(id / 10);
  const col = id % 10 + 1;

  const canvasRef = useRef(null);

  const drawElement = async (context) => {

    await init();

    const width = context.canvas.width;
    const height = context.canvas.height;
    context.translate(width / 2, height / 2);
    context.rotate(rot);
    context.drawImage(tokensImg, col * TreasureImgSize, row * TreasureImgSize, TreasureImgSize, TreasureImgSize,
      -width / 2, -height / 2, width, height);
    context.rotate(-rot);
    context.translate(-width / 2, -height / 2);
    // console.log(`drawElement; ${id} col=${col}, row=${row}`);
  };

  // draw only once element gets attached to DOM
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    drawElement(context);
  }, [drawElement, id, rot]);

  return (
//    <div className="Treasure">{id}</div>
    <canvas className="Treasure" ref={canvasRef} width={TreasureImgSize} height={TreasureImgSize}></canvas>
  )
};

export default Treasure