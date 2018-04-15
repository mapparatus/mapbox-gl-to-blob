var mapboxGlToBlob = require("../");


function saveBlob(blob) {
  var el = document.createElement("a")
  el.href = URL.createObjectURL(blob);
  el.download = 'map.png';
  el.click();
}

function render() {
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
    .then(function(blob) {
      console.log(blob);
      saveBlob(blob);
    })
}

window.render = render;
render();
