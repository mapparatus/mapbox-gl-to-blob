var MapboxGl = require('mapbox-gl');
var styleSpec = require("mapbox-gl/src/style-spec/reference/v8.json");
var debounce = require("lodash.debounce");


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
var toBlob = function fn(opts, mimeType, qualityArgument) {
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

    function removeAllTransitions(style) {
      // Global transition
      style.transition = {
        "duration": 0,
        "delay": 0
      }

      // Paint specific transitions
      style.layers.forEach(function(layer) {
        var layerKey = "paint_"+layer.type;
        Object.keys(styleSpec[layerKey]).forEach(function(key) {
          if(styleSpec[layerKey][key].transition) {
            layer.paint = layer.paint || {};
            layer.paint[key+"-transition"] = {
              "duration": 0,
              "delay": 0
            }
          }
        })
      })

      return style;
    }

    function loadStyle(style) {
      return new Promise(function(resolve, reject) {
        if(typeof(style) === "string") {
          fetch(style)
            .then(function(response) {
              return response.json()
            })
            .then(function(style) {
              resolve(style);
            })
        }
        else {
          resolve(style);
        }
      })
    }

    loadStyle(opts.mapboxGl.style)
      .then(function(style) {
        return removeAllTransitions(style)
      })
      .then(function(style) {
        // Calculate pixel ratio
        var actualPixelRatio = window.devicePixelRatio;
        Object.defineProperty(window, 'devicePixelRatio', {
          get: function() {
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
          bearing:     glOpts.bearing,
          center:      glOpts.center,
          container:   container,
          pitch:       glOpts.pitch,
          style:       style,
          zoom:        glOpts.zoom,
          attributionControl: false,
          interactive: false,
          trackResize: false,
          preserveDrawingBuffer: true,
          fadeDuration: 0,
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

        var called = false;
        function onMapRendered() {
          if(called) {
            return;
          }
          called = true;
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

        map.once('load', function() {
          /**
           * While mapbox-gl-js is doing layout we appear to get multiple 'render' events after the 'load' event. Assuming all the loading has happened already we debounce our onMapRendered method by 1 second to allow all render events to take place.
           *
           * This is a bit of a hack, however the theroy is that a 1 second debounce should be vastly greater than the length of time it'll take to complete this action.
           */
          map.on('render', debounce(onMapRendered, 1000))
        });
      })
  });
}


module.exports = {
  toBlob: toBlob,
  toPixels: toPixels
};
