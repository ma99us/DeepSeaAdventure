export async function elementEventsListener(elem, events, before = null, after = null) {
  if (elem == null || typeof elem !== "object" || !document.body.contains(elem)) {
    throw "'elem' should be a DOM element";
  }
  if (!Array.isArray(events)) {
    if (typeof events !== 'string') {
      throw "'events' should be a name or array of names of DOM events";
    }
    events = [events];  // make an array of it
  }

  return new Promise(resolve => {
    function onEnd(ev) {
      events.forEach(evt => {
        elem.removeEventListener(evt, onEnd);
      });

      if (after && typeof after === 'function') {
        after(ev);
      }

      resolve(ev);
    }

    events.forEach(evt => {
      elem.addEventListener(evt, onEnd, false);
    });

    if (before && typeof before === 'function') {
      before(elem);
    }
  });
}

export async function transitionListener(elem, before = null, after = null) {
  const events = ["transitionend", "oTransitionEnd", "transitionend", "webkitTransitionEnd"];
  return elementEventsListener(elem, events, before, after);
}

/**
 * perform CSS transition with the callback once done
 * @param elem DOM element
 * @param styles object like {transition: "all .3s linear", left: "100px"}
 * @param callback
 */
export async function transitionElement(elem, styles, callback = null) {
  if (styles == null || typeof styles !== "object") {
    throw "'styles' should be an object with style attributes";
  }

  return transitionListener(elem, () => {
    // force browser to calculate initial style of the element
    const computedStyle = window.getComputedStyle(elem, null);
    for (let styleName in styles) {
      void computedStyle.getPropertyValue(styleName);
    }

    // force browser to render element first, before applying transition result style
    requestAnimationFrame(() => {
      setStyles(elem, styles);
    });
  }, callback);
}

export async function animationListener(elem, before = null, after = null) {
  const events = ["animationend", "oanimationend", "msAnimationEnd", "webkitAnimationEnd"];
  return elementEventsListener(elem, events, before, after);
}

export async function animateElement(elem, animClassName, callback = null) {
  if (typeof animClassName !== "string") {
    throw "'animClassName' should be a string with animation class name";
  }

  return animationListener(elem, () => {
    // force browser to render element first, before applying transition result style
    // requestAnimationFrame(() => {
    //   elem.classList.add(animClassName);
    // });

    elem.classList.add(animClassName);
  }, (ev) => {
    elem.classList.remove(animClassName);

    if (callback && typeof callback === 'function') {
      callback(ev);
    }
  });
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * apply multiple styles to DOM element
 * @param elem
 * @param styles
 */
export function setStyles(elem, styles) {
  if (typeof elem !== "object") {
    throw "'elem' should be a DOM element";
  }
  if (typeof styles !== "object") {
    throw "'styles' should be an object with style names";
  }
  for (let styleName in styles) {
    elem.style[styleName] = styles[styleName];
  }
}

// clear transition styles by names
export function removeStyles(elem, styles) {
  if (!Array.isArray(styles)) {
    throw "'styles' should be an array of js style names";
  }
  styles.forEach((style) => {
    elem.style[style] = '';
  });
}

export function getElementsOffset(elem1, elem2) {
  if (!document.body.contains(elem1)) {
    throw "'elem1' element is not on DOM";
  }
  if (!document.body.contains(elem2)) {
    throw "'elem2' element is not on DOM";
  }
// these are relative to the viewport, i.e. the window
  const vpOffset1 = elem1.getBoundingClientRect();
  const vpOffset2 = elem2.getBoundingClientRect();
  const dx = vpOffset2.left - vpOffset1.left;
  const dy = vpOffset2.top - vpOffset1.top;
  return {dx: dx, dy: dy};
}