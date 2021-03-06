/**
 * A bunch of utility function to draw on a canvas
 */

// calculate the "difference" between the two colors. 0 - exact match, 255 - totally different
export function getColorDiff(px1, px2) {
  if (!px1 || !px2) {
    return 255;
  } else if (!Array.isArray(px1) || !Array.isArray(px2)) {
    // eslint-disable-next-line
    throw "px1 and px2 should be in RBGA arrays";
  }

  const len = Math.min(px1.length, px2.length);

  if (len === 4) {
    return (Math.abs(px1[0] - px2[0]) +
      Math.abs(px1[1] - px2[1]) +
      Math.abs(px1[2] - px2[2]) +
      Math.abs(px1[3] - px2[3])) / 4;
  } else if (len === 3) {
    return (Math.abs(px1[0] - px2[0]) +
      Math.abs(px1[1] - px2[1]) +
      Math.abs(px1[2] - px2[2])) / 3;
  } else {
    // eslint-disable-next-line
    throw "bad color array length: " + len + ". Expected to be 3 or 4.";
  }
}

export function getColorStylesDiff(clrStyle1, clrStyle2) {
  if (!clrStyle1 || !clrStyle2) {
    return 255;
  }

  const px1 = colorStyleToArray(clrStyle1);
  const px2 = colorStyleToArray(clrStyle2);

  return getColorDiff(px1, px2);
}

export function colorArrayToStyle(color, rgba = true) {
  if (!color) {
    return '#000000FF'; // black
  } else if (!Array.isArray(color)) {
    // eslint-disable-next-line
    throw "color should be in RBGA array";
  } else if (color.length < 3 || color.length > 4) {
    throw "unexpected color array length: '" + color + "', should be a RBGA array";
  }

  const byteToHex = (num) => {
    return ('0' + num.toString(16)).substr(-2);
  };

  let s = '#' + byteToHex(color[0]) + byteToHex(color[1]) + byteToHex(color[2]);
  if (rgba) {
    s += color.length === 4 ? byteToHex(color[3]) : "FF";
  }
  return s;
}

export function colorStyleToArray(clrStyle, rgba = true){
  if(!clrStyle){
    clrStyle = rgba ? '#000000FF' : '#000000'; // black
  }
  if (typeof clrStyle !== 'string' || !clrStyle.startsWith('#')) {
    // eslint-disable-next-line
    throw "clrStyle should be in color style strings like '#FFFFFF'";
  }

  if (clrStyle.length === 9 && rgba) {
    return [parseInt(clrStyle.substr(1, 2), 16), parseInt(clrStyle.substr(3, 2), 16), parseInt(clrStyle.substr(5, 2), 16), parseInt(clrStyle.substr(7, 2), 16)];
  } else if (clrStyle.length === 9 && !rgba) {
    return [parseInt(clrStyle.substr(1, 2), 16), parseInt(clrStyle.substr(3, 2), 16), parseInt(clrStyle.substr(5, 2), 16)];
  } else if (clrStyle.length === 7 && rgba) {
    return [parseInt(clrStyle.substr(1, 2), 16), parseInt(clrStyle.substr(3, 2), 16), parseInt(clrStyle.substr(5, 2), 16), 255];
  } else if (clrStyle.length === 7 && !rgba) {
    return [parseInt(clrStyle.substr(1, 2), 16), parseInt(clrStyle.substr(3, 2), 16), parseInt(clrStyle.substr(5, 2), 16)];
  } else {
    // eslint-disable-next-line
    throw "unexpected color style string: '" + clrStyle + "'";
  }
}

export function canvasDrawLine(canvas, x0, y0, x1, y1, color = [0xff, 0, 0, 0xff], lineWidth = 1) {
  if (!canvas) {
    return;
  }
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = colorArrayToStyle(color);
  ctx.stroke();
}

export function canvasDrawCircle(canvas, x0, y0, r, color = [0, 0xff, 0, 0xff], fill = null, lineWidth = 1) {
  if (!canvas) {
    return;
  }
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.arc(x0, y0, r, 0, 2 * Math.PI, false);
  if (fill) {
    ctx.fillStyle = colorArrayToStyle(fill);
    ctx.fill();
  }
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = colorArrayToStyle(color);
  ctx.stroke();
}

export function canvasClear(canvas) {
  if (!canvas) {
    return;
  }
  const ctx = canvas.getContext("2d");
  ctx.clearRect(1, 1, canvas.width - 1, canvas.height - 1);
}

export function makeGlowFilter(size, color, blur = 0) {
  return `drop-shadow(${size}px 0px ${blur}px ${color}) drop-shadow(0px ${size}px ${blur}px ${color}) drop-shadow(0px -${size}px ${blur}px ${color}) drop-shadow(-${size}px 0px ${blur}px ${color})`;
}

export function makeDropShadowFilter(size, color, blur = 0) {
  return `drop-shadow(${size}px ${size}px ${blur}px ${color})`;
}

const imgCache = {};

/**
 * Load an image asset and store it in cache
 * @param imgSrc
 * @param cache
 * @returns {Promise<any>}
 */
export async function loadImage(imgSrc, cache = true) {
  return new Promise((resolve, reject) => {
    if (cache && imgCache[imgSrc]) {
      resolve(imgCache[imgSrc]);
    } else {
      const img = new Image();
      img.setAttribute('crossOrigin', '');
      img.src = imgSrc;
      img.onload = () => {
        if (cache) {
          imgCache[imgSrc] = img;
        }
        resolve(img);
      };
      img.onerror = (err) => {
        reject(err);
      };
    }
  });
}