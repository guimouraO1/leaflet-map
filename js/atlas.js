Date.prototype.format = function (e, a) {
  return dateFormat(this, e, a);
};

var bounds = [
    [-59.98897365428924, -5.026037385661109],
    [59.999999999999986, -139.99999999999997],
  ],
  boundsRegions = [
    [-59.98897365428924, -30.026037385661109],
    [50.999999999999986, -139.99999999999997],
  ],
  o,
  layer = null;

function openSideNav() {
  (document.getElementById("panel").style.left = "0px"),
    (o._controlContainer.firstChild.style.transition = "0.8s"),
    (o._controlContainer.firstChild.style.left = "350px"),
    (p = !0);
}
function closeSideNav() {
  (document.getElementById("panel").style.left = "-400px"),
    (o._controlContainer.firstChild.style.transition = "0.8s"),
    (o._controlContainer.firstChild.style.left = "0px"),
    (p = !1);
}
function getTiledLayer(selectedValue) {
  var tiledLayer = L.tileLayer(
    `http://143.106.29.47:8080/{d}/{h}{m}/${selectedValue}/{z}/{x}/{y}.png`,
    {
      // crs: L.CRS.EPSG4326,
      tms: true,
      attribution: "",
      noWrap: true,
      fadeAnimation: true,
      zoomAnimation: true,
      updateWhenIdle: true,
      updateWhenZooming: true,
    }
  );

  var timeLayer = L.timeDimension.layer.tileLayer.goes(tiledLayer, {
    cacheBackward: 2,
    cacheForward: 2,
  });

  // Remova a camada atual antes de adicionar a nova camada
  if (layer) {
    o.timeDimension.unregisterSyncedLayer(layer);
    o.removeLayer(layer);
  }

  layer = timeLayer.addTo(o);
  o.timeDimension.registerSyncedLayer(layer);
}

function createMap(dates) {
  o = L.map("map", {
    // crs: L.CRS.EPSG4326,
    minZoom: 4,
    maxZoom: 7,
    noWrap: true,
    maxBounds: bounds,
    timeDimension: true,
    timeDimensionOptions: {
      times: dates,
    },
    timeDimensionControl: true,
    timeDimensionControlOptions: {
      position: "topright",
      // timeZones: ["UTC", "Local"],
      autoPlay: false,
      loopButton: false,
      timeSteps: 1,
      playReverseButton: false,
      limitSliders: false,
      playerOptions: {
        transitionTime: 0,
        loop: true,
        buffer: 2,
        minBufferReady: 1,
        speed: 3,
      },
    },
  }).setView([-15, -60], 5);

  var defaut = document.getElementById("layerSelect").value;
  getTiledLayer(defaut);

  L.Control.geocoder({
    placeholder: "Pesquisar localização...",
    errorMessage:
      '<i class="fa fa-exclamation-circle" aria-hidden="true"></i> Localização não encontrada',
    position: "topright",
  }).addTo(o);

  L.simpleMapScreenshoter({
    position: "topright",
  }).addTo(o)


  L.easyButton({
    states: [
      {
        stateName: "open-options",
        icon: '<i id="menu-button" class="fa fa-bars" aria-hidden="true">',
        title: "Acessar opções CEPAGRI",
        onClick: function (e, a) {
          openSideNav();
        },
      },
      {
        stateName: "close-options",
        icon: '<i id="menu-button" class="fa fa-bars" aria-hidden="true">',
        title: "Acessar opções CEPAGRI",
        onClick: function (e, a) {
          closeSideNav();
        },
      },
    ],
    position: "topleft",
  }).addTo(o);

  $("#close-menu-button").on("click", function () {
    closeSideNav();
  });

  (function () {
    o.createPane("references-pane");
    o.getPane("references-pane").style.zIndex = 201;

    var countriesLayer = L.layerGroup();
    var statesLayer = L.layerGroup();

    var political_countries_url =
      "./shapefiles/ne_50m_admin_0_countries.geojson";
    fetch(political_countries_url)
      .then((response) => response.json())
      .then((data) => {
        L.geoJSON(data, {
          style: function (feature) {
            return {
              fillColor: "gray",
              weight: 1.2,
              opacity: 1,
              color: "White",
              fillOpacity: 0,
              maxBounds: boundsRegions,
            };
          },
        }).addTo(countriesLayer);
      });

    var brazil_states_url = "./shapefiles/brazil-states.geojson";
    fetch(brazil_states_url)
      .then((response) => response.json())
      .then((data) => {
        L.geoJSON(data, {
          style: function (feature) {
            return {
              fillColor: "green",
              weight: 1.2,
              opacity: 1,
              color: "White",
              fillOpacity: 0,
            };
          },
        }).addTo(statesLayer);
      });

    var cartoLabels = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
      {
        attribution: "©OpenStreetMap, ©CartoDB",
        bounds: boundsRegions,
        pane: "references-pane",
      }
    );

    var overlaymaps = {
      Lugares: cartoLabels,
      Fronteiras: countriesLayer,
      Estados: statesLayer,
    };

    var layerControl = L.control.layers(null, overlaymaps, {
      collapsed: false,
    });
    var stateLayerControl = false;

    L.easyButton({
      states: [
        {
          stateName: "open-options",
          icon: '<i class="fa fa-map" aria-hidden="true"></i>',
          title: "Acessar opções CEPAGRI",
          onClick: function (e, a) {
            stateLayerControl = !stateLayerControl;
            if (stateLayerControl) {
              layerControl.addTo(o);
            } else {
              o.removeControl(layerControl);
            }
          },
        },
      ],
      position: "topright",
    }).addTo(o);
  })();
}
function changeLayer() {
  var selectedValue = document.getElementById("layerSelect").value;
  getTiledLayer(selectedValue);
}
window.onload = function () {
  (function getDate() {
    var date = "http://localhost:3000/date",
      r = new XMLHttpRequest();
    r.open("GET", date);
    r.responseType = "json";
    r.send();
    r.onload = function () {
      createMap(r.response.dates);
    };
  })();
};
