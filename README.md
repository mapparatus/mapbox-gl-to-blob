# mapbox-gl-to-blob
Render mapbox-gl styles as rasters

[![stability-unstable](https://img.shields.io/badge/stability-unstable-yellow.svg)][stability]
[![Build Status](https://circleci.com/gh/orangemug/mapbox-gl-to-blob.png?style=shield)][circleci]
[![Dependency Status](https://david-dm.org/orangemug/mapbox-gl-to-blob.svg)][dm-prod]
[![Dev Dependency Status](https://david-dm.org/orangemug/mapbox-gl-to-blob/dev-status.svg)][dm-dev]

[stability]:   https://github.com/orangemug/stability-badges#unstable
[circleci]:    https://circleci.com/gh/orangemug/mapbox-gl-to-blob
[dm-prod]:     https://david-dm.org/orangemug/mapbox-gl-to-blob
[dm-dev]:      https://david-dm.org/orangemug/mapbox-gl-to-blob#info=devDependencies



## Install
To install

```
npm install orangemug/mapbox-gl-to-blob
```


## Usage
Example usage shown below

```js
const mapboxGlToBlob = require("mapbox-gl-to-blob");

const opts = {
  // See <https://www.mapbox.com/mapbox-gl-js/api/#map> for usage
  mapboxGl: {
    // Required arguments
    style: "https://rawgit.com/lukasmartinelli/osm-liberty/gh-pages/style.json",
    // Optional arguments (showing defaults)
    pitch: 0,
    zoom: 0,
    center: [0,0],
    bearing: 0,
  },
  output: {
    dpi: 300,
    dimensions: {
      unit: "mm",
      width: 300,
      height: 300
    }
  }
}

mapboxGlToBlob
  .toBlob(opts)
  .then(function(pngBlob) {
    // ...
  })
```


## Browser support
Although at the moment somewhat untested, it should work in all modern browsers. With the exception of IE which will require a polyfill, see

 - https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
 - https://github.com/Financial-Times/polyfill-service/blob/8717a9e04ac7aff99b4980fbedead98036b0929a/packages/polyfill-library/polyfills/HTMLCanvasElement/prototype/toBlob/polyfill.js


## License
[MIT](LICENSE)

