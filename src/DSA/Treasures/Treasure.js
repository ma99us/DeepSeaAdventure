import React, {useRef, useEffect} from 'react';
import {loadImage} from '../../common/drawing';
import {transitionListener} from "../../common/dom-animator";
import tokens_60 from './tokens_60.png';
import blank_token_60 from './blank_token_60.png';
import './Treasures.css';

export const TreasureTypesNum = 4;
export const TreasureIdsNum = 4;
export const TreasureIds = [0, 0, 1, 1, 2, 2, 3, 3]; // there are 4 treasure types and each repeats twice

export function treasureIdToPoints(id) {
  const idToPoints = (tid) => {
    const tt = Math.floor(tid / 10);
    const ttid = tid % 10;  // 0-3 first tier [0,1,2,3], 10-13 - second tier [4,5,6,7], 20-23 - third [8,9,10,11], 30-33 - forth [12,13,14,15]
    return 4 * tt + ttid;
  };

  if(Array.isArray(id)){
    return id.reduce((points, tid) => points + idToPoints(tid), 0);
  } else {
    return idToPoints(id);
  }
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
  const id = props.id;  // treasure id
  const masked = props.masked;  // if true - show treasure back side, false - show value side
  const rot = props.rot || 0; // rotate treasure image in radians
  const style = props.style;  // optional style to apply to wrapping DOM element
  const moved = props.moved;  // if not null - animation done callback

  const row = Math.floor(id / 10);
  const col = id % 10 + 1;

  const canvasRef = useRef(null);

  // draw only once element gets attached to DOM
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

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

    void drawElement(context);

    if(moved){
      transitionListener(canvas).then((ev) => {
        // console.log("Treasure id=" + id + " transition finished; propertyName=" + ev.propertyName + ", elapsedTime=" + ev.elapsedTime);  //#DEBUG
        moved(id);
      });
    }
  }, [canvasRef, id, masked, rot, col, row, moved]);

  return (
    <canvas className="Treasure" ref={canvasRef} onClick={props.clicked} width={60} height={60} style={style}/>
  )
};

export const TreasureGroup = (props) => {
  const id = props.id;  // treasure id
  const masked = props.masked;  // if true - show treasure back side, false - show value side
  const rot = props.rot || 0; // rotate treasure image in radians
  const style = props.style;  // optional style to apply to wrapping DOM element
  const moved = props.moved;  // if not null - animation done callback

  if (Array.isArray(id)) {
    return (<div className={TreasureGroup}>
      {
        id.map((tid, idx) => {
          const style1 = {...style};
          // stagger each treasure in a group
          style1.marginTop = (1 * idx) + "px";
          style1.marginLeft = (3 * idx) + "px";
          return <Treasure id={tid} masked={masked} rot={rot} style={style1} moved={moved}/>;
        })
      }
    </div>)
  } else {
    return <Treasure id={id} masked={masked} rot={rot} style={style} moved={moved}/>
  }
};

export default Treasure;