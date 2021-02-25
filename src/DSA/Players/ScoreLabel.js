import React, {useRef, useEffect} from 'react';
import {animateElement} from "../../common/dom-animator";
import './Players.css';

const ScoreLabel = (props) => {
  const toValue = props.tovalue;  // final numerical value to show
  const fromValue = props.fromvalue; // if not null, increment from this value to 'toValue'
  const onDone = props.ondone;  // if not null, animation done callback
  const style = props.style || {};

  const elemRef = useRef(null);

  // draw only once element gets attached to DOM
  useEffect(() => {
    const elem = elemRef.current;

    const animateValue = async (duration) => {
      return new Promise((resolve, reject) => {
        const start = Date.now(); // remember start time
        const step = (toValue - fromValue) / (duration / 20);
        let curValue = fromValue;

        const timer = setInterval(() => {
          let timePassed = Date.now() - start;
          if (timePassed >= duration) {
            // finish the animation
            clearInterval(timer);
            elem.innerHTML = toValue;
            resolve();
          }

          // draw the intermediate state of animation
          elem.innerHTML = Math.round(curValue);
          curValue += step;
        }, 20);
      });
    };

    if (onDone && fromValue != null) {
      // animate glowing
      void animateElement(elem, 'animate-glow').then((ev) => {
        // console.log('onDone(ev)='+onDone);
        onDone(ev);
      });
      // at the same time, animate value increment
      animateValue(1000).then(() => {
        // console.log('onDone='+onDone);
        onDone();
      });
    } else {
      // no animation, just show the final value
      elem.innerHTML = Math.round(toValue);
    }
  }, [elemRef, toValue, fromValue, onDone]);

  return (
    <div className="PlayerScore">
      <div className="PlayerScoreValue" ref={elemRef} style={style}/>
    </div>
  )
};

export default ScoreLabel;