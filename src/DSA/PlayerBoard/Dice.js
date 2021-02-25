import React, {useRef, useEffect} from 'react';
import {loadImage} from '../../common/drawing';
import dice_80 from './dice_80.png';
import './PlayerBoard.css';

//export const DiceSidesIds = [0, 1, 2, 3, 4, 5]; // these are side indexes, not values! (usually index + 1 = value)
export const DiceSidesIds = [0, 0, 1, 1, 2, 2]; // this game custom dice

export const DiceMaskedId = 6;

export function rollDice() {
  const idx = Math.floor(Math.random() * DiceSidesIds.length);
  return DiceSidesIds[idx];
}

async function initTokens() {
  const tokensNum = 7;     // 6 + 1 for masked id
  const tokensImg = await loadImage(dice_80);
  const tokenWidth = Math.round(tokensImg.width / tokensNum);
  const tokenHeight = tokensImg.height;
  return [tokensImg, tokenWidth, tokenHeight];
}

// function clicked() {
//   console.log('this is:', this);
//   //console.log('this is:', this, props.clicked);
//   // props.clicked();
// }

const Dice = (props) => {
  const id = props.id;
  const masked = props.masked;
  const rot = props.rot || 0;
  const style = props.style || {};
  const rolled = props.rolled;

  const canvasRef = useRef(null);

  // draw only once element gets attached to DOM
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const drawElement = async (context, id1, rot1, offset1, masked1) => {
      const [tokensImg, tokenWidth, tokenHeight] = await initTokens();
      const row = 0;
      const col = (masked1 || id1 == null) ? DiceMaskedId : id1;

      const width = context.canvas.width;
      const height = context.canvas.height;
      context.clearRect(0, 0, width, height);
      context.translate(width / 2, height / 2 + offset1);
      context.rotate(rot1);
      context.drawImage(tokensImg, col * tokenWidth, row * tokenHeight, tokenWidth, tokenHeight,
        -width / 2, -height / 2, width, height);
      context.rotate(-rot1);
      context.translate(-width / 2, -height / 2 - offset1);
    };

    const animateRoll = () => {
      const start = Date.now(); // remember start time

      const maxRot = Math.PI;
      const maxOffset = Math.round(context.canvas.height / 4);  // 25% vertical bounce
      const duration = 500 + Math.round(Math.random() * 1500);
      const timer = setInterval(async () => {
        const timePassed = Date.now() - start;
        const timeLeft = duration - timePassed;
        if (timeLeft <= 0) {
          // finish the animation
          clearInterval(timer);
          // draw the final state of animation
          void drawElement(context, id, rot, 0, masked);
          if (rolled) {
            rolled(id);
          }
          return;
        }

        // draw the intermediate state of animation
        const id1 = rollDice();
        const rot1 = Math.random() * maxRot;
        const offset1 = maxOffset / 2 - Math.floor(Math.random() * maxOffset);
        await drawElement(context, id1, rot1, offset1, masked);
      }, 20);
    };

    if (rolled && id != null && id !== DiceMaskedId) {
      animateRoll();
    } else {
      void drawElement(context, id, rot, 0, masked);
    }
  }, [canvasRef, id, masked, rot, rolled]);


  return (
    <canvas className="Dice" ref={canvasRef} onClick={props.clicked} width={80} height={80} style={style}/>
  )
};

export default Dice;