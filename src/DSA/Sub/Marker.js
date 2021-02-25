import React, {useRef, useEffect} from 'react';
import {loadImage} from '../../common/drawing';
import {transitionListener} from "../../common/dom-animator";
import marker from './marker_2.png';
import './Sub.css';

async function init() {
  const image = await loadImage(marker);
  const imageWidth = image.width;
  const imageHeight = image.height;
  return [image, imageWidth, imageHeight];
}

const Marker = (props) => {
  const rot = props.rot || 0; // rotate image in radians
  const highlight = props.highlight;
  const style = props.style;  // optional style to apply to wrapping DOM element
  const moved = props.moved;  // if not null - animation done callback

  const canvasRef = useRef(null);

  // draw only once element gets attached to DOM
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const drawElement = async (context) => {
      const [image, imageWidth, imageHeight] = await init();

      const width = context.canvas.width;
      const height = context.canvas.height;
      context.clearRect(0, 0, width, height);
      context.translate(width / 2, height / 2);
      context.rotate(rot);
      context.drawImage(image, 0, 0, imageWidth, imageHeight,
        -width / 2, -height / 2, width, height);
      context.rotate(-rot);
      context.translate(-width / 2, -height / 2);
    };

    void drawElement(context);

    if(moved){
      transitionListener(canvas).then((ev) => {
        moved();
      });
    }
  }, [canvasRef, rot, moved]);

  return (
    <canvas className="Marker" ref={canvasRef} onClick={props.clicked} width={40} height={40} style={style}/>
  )
};

export default Marker;