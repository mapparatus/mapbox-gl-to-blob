var MapboxGl = require('mapbox-gl');

/**
 * Util
 */
function createElement(tagName, style) {
  var el = document.createElement('div');
  for(let styleProp in style) {
    if(style.hasOwnProperty(styleProp)) {
      el.style[styleProp] = style[styleProp];
    }
  }
  return el;
}

function removeEl(el) {
  el.parentNode.removeChild(el);
}

function toPixels(length, unit) {
  let conversionFactor;
  if (unit === "inch") {
    // https://www.unitconverters.net/typography/inch-to-pixel-x.htm
    conversionFactor = 96;
  }
  else if (unit == 'mm') {
    // https://www.unitconverters.net/typography/inch-to-millimeter.htm
    conversionFactor = 96 / 25.4;
  }

  return (conversionFactor * length) + 'px';
}


/**
 * mapbox-gl-js-render
 *
 * Render a mapbox-gl-js style client side.
 *
 * See <https://www.mapbox.com/mapbox-gl-js/api/#map> for usage
 *
 * @params {Array}         opts.mapboxGl.center
 * @params {Number}        opts.mapboxGl.zoom
 * @params {Object|String} opts.mapboxGl.style
 * @params {Number}        opts.mapboxGl.bearing
 * @params {Number}        opts.mapboxGl.pitch
 *
 * @params {Number}        opts.output.dpi
 * @params {String}        opts.output.dimensions.unit
 * @params {Number}        opts.output.dimensions.width
 * @params {Number}        opts.output.dimensions.height
 *
 * @returns {Blob}
 */
function toBlob(opts, mimeType, qualityArgument) {
  // HACK: Massive hack to get a unique function name we can grep for in a stack trace.
  Object.defineProperty(fn, 'name', { writable: true });
  var uniqueKey = "mapboxGlToBlob_"+Math.random().toString(36).substr(2, 9);
  fn.name = uniqueKey;
  
  // Copy opts for safety
  var outOpts = opts.output;
  var glOpts = Object.assign({
    dpi: 300,
    pitch: 0,
    zoom: 0,
    center: [0,0],
    bearing: 0
  }, opts.mapboxGl);

	return new Promise(function(resolve, reject) {
    // Calculate pixel ratio
    var actualPixelRatio = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', {
			get: function fn() {
        // HACK: We throw an error so we can see if we (this library)
        // is in the stack trace. This means that `window.devicePixelRatio`
        // will continue to function as normal in other code running on the
        // page. 
        try {
          throw new Error();
        }
        catch (e) { 
          if(e.stack.indexOf(uniqueKey)) {
            return outOpts.dpi / 96;
          }
          else {
            return actualPixelRatio;
          }
        }
      }
    });

    // Hidden map container
    var hidden = createElement("div", {
      overflow: "hidden",
      width: "0px",
      height: "0px"
    })
    document.body.appendChild(hidden);

    // Actual map container with dimensions set, ready for raster render
    var container = createElement("div", {
      width:  toPixels(outOpts.dimensions.width, outOpts.dimensions.unit),
      height: toPixels(outOpts.dimensions.height, outOpts.dimensions.unit)
    });
    hidden.appendChild(container);

    var map = new MapboxGl.Map({
			attributionControl: false,
			bearing:     glOpts.bearing,
			center:      glOpts.center,
			container:   container,
			interactive: false,
			pitch:       glOpts.pitch,
			style:       glOpts.style,
			zoom:        glOpts.zoom
    });

    function cleanUp() {
      map.remove();
      removeEl(hidden);
      Object.defineProperty(window, 'devicePixelRatio', {
        get: function() {
          return actualPixelRatio
        }
      });
    }

    function onMapLoad() {
      try {
        map.getCanvas().toBlob(function(blob) {
          cleanUp();
          resolve(blob);
        }, mimeType, qualityArgument);
      } catch(err) {
        cleanUp();
        reject(err);
      }
    }

    map.once('load', onMapLoad);
  });
}


module.exports = {
  toBlob: toBlob
};
