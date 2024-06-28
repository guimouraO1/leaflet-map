const defaultBounds = [
    [-59.98897365428924, -5.026037385661109],
    [59.999999999999986, -139.99999999999997],
  ],
  defaultBoundsRegions = [
    [-59.98897365428924, -30.026037385661109],
    [55.999999999999986, -139.99999999999997],
  ],
  toastLiveExample = document.getElementById("liveToast"),
  toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample);

let map,
  timeDimensionControl,
  currentLayer = null,
  menuButton,
  defaultLayer = "truecolor",
  userLocationButton,
  colorbar;

function openSideNav() {
  document.getElementById("side-nav").style.left = "0px";
  map._controlContainer.firstChild.style.transition = "0.8s";
  map._controlContainer.firstChild.style.left = "350px";
  menuButton.state("close-options");
  menuButton.getContainer().style.visibility = "hidden";
}

function closeSideNav() {
  document.getElementById("side-nav").style.left = "-400px";
  map._controlContainer.firstChild.style.transition = "0.8s";
  map._controlContainer.firstChild.style.left = "0px";
  menuButton.state("open-options");
  menuButton.getContainer().style.visibility = "visible";
}

function getTiledLayer(selectedValue) {
  if (currentLayer) {
    map.removeLayer(currentLayer);
    map.timeDimension.unregisterSyncedLayer(currentLayer);
  }
  let tiledLayer = L.tileLayer(
    `https://eris.cpa.unicamp.br/{d}/{h}{m}/${selectedValue}/{z}/{x}/{y}.png`,
    {
      tms: true,
      noWrap: true,
      attribution: "",
      minNativeZoom: 2,
      maxNativeZoom: 7,
      bounds: defaultBounds,
      fadeAnimation: true,
      zoomAnimation: true,
      updateWhenIdle: true,
      updateWhenZooming: true,
    }
  );

  let timeLayer = L.timeDimension.layer.tileLayer.goes(tiledLayer, {});
  currentLayer = timeLayer.addTo(map);
  map.timeDimension.registerSyncedLayer(currentLayer);
}

function setupDatePicker(dates) {
  const lastDate = moment(dates[dates.length - 1], "YYYYMMDDHHmm");
  const firstDate = moment(dates[0], "YYYYMMDDHHmm");

  $("#datetimepicker1").datetimepicker({
    format: "DD/MM/YYYY HH:mm UTC",
    stepping: 10,
    minDate: firstDate,
    maxDate: lastDate,
    date: lastDate,
    keepOpen: false,
    timeZone: "UTC",
  });

  $("#datetimepicker1").on("change.datetimepicker", function (event) {
    const selectedDate = event.date.toDate();
    const dateExists = dates.some(
      (date) =>
        moment.utc(date).format("YYYY-MM-DD HH:mm") ===
        moment(event.date).format("YYYY-MM-DD HH:mm")
    );

    if (dateExists) {
      map.timeDimension.setCurrentTime(
        moment(selectedDate).subtract({ hours: 2, minutes: 50 }).toISOString()
      );
    } else {
      $("#mensagemToast").text(
        `Data: ${moment(event.date).format(
          "YYYY/MM/DD HH:mm"
        )} UTC indisponível`
      );
      $("#alertToast").text("Alerta");
      $("#iconToast")
        .addClass("fa fa-exclamation-triangle")
        .css("color", "#AA0000");
      toastBootstrap.show();
    }
  });
}

function changeColorbar(selectedValue) {
  if (colorbar && selectedValue != "truecolor") {
    colorbar.update = function (props) {
      this._div.innerHTML = `<img src="./images/colorbars/${selectedValue}.png" class="colorbar" alt="Cepagri-Logo"/>
      <i class="fa fa-times" id="colorbar-close" aria-hidden="true"></i>`;
    };
  }
  if (colorbar && selectedValue == "truecolor") {
    colorbar.update = function (props) {
      this._div.innerHTML = `<img src="./images/colorbars/ch13.png" class="colorbar" alt="Cepagri-Logo"/>
      <i class="fa fa-times" id="colorbar-close" aria-hidden="true"></i>`;
    };
  }
  colorbar.update();
  $("#colorbar-close").on("click", function () {
    if (colorbar) {
      map.removeControl(colorbar);
      colorbar = null;
      localStorage.setItem("colorbar", false);
      colorbarButton.addTo(map);
    }
  });
}

function setupColorbar(selectedValue) {
  if (colorbar) return;
  colorbar = L.control({ position: "bottomright" });

  colorbar.onAdd = function (map) {
    this._div = L.DomUtil.create("div", "info");
    this.update();
    return this._div;
  };

  colorbar.update = function (props) {
    if (selectedValue && selectedValue != "truecolor") {
      this._div.innerHTML = `<img src="./images/colorbars/${selectedValue}.png" class="colorbar" alt="Cepagri-Logo"/>
      <i class="fa fa-times" id="colorbar-close" aria-hidden="true"></i>
      `;
    } else if (selectedValue == "truecolor") {
      this._div.innerHTML = `<img src="./images/colorbars/ch13.png" class="colorbar" alt="Cepagri-Logo"/>
      <i class="fa fa-times" id="colorbar-close" aria-hidden="true"></i>`;
    } else {
      this._div.innerHTML = "";
    }
  };

  colorbar.addTo(map);

  $("#colorbar-close").on("click", function () {
    if (colorbar) {
      map.removeControl(colorbar);
      colorbar = null;
      localStorage.setItem("colorbar", false);
      colorbarButton.addTo(map);
    }
  });
}

function changeLayer() {
  let selectedValue = document.getElementById("layerSelect").value;

  localStorage.setItem("product", selectedValue);
  try {
    changeColorbar(selectedValue);
  } catch (error) {
    console.log("Colorbar Change Error");
  }
  let baseUrl = "https://plataforma.labsat.cpa.unicamp.br/dates/";

  let dateUrl =
    selectedValue !== "truecolor"
      ? `${baseUrl}date_${selectedValue}.json`
      : `${baseUrl}date_ch17.json`;

  let request = new XMLHttpRequest();
  request.open("GET", dateUrl);
  request.responseType = "json";
  request.send();

  request.onload = function () {
    dates = request.response.dates;
    map.timeDimension.setAvailableTimes(dates, "replace");
    setupDatePicker(dates);
    try {
      map.timeDimension.setCurrentTime(moment(dates[dates.length - 2]));
      getTiledLayer(selectedValue);
    } catch (error) {
      console.log("Erro linha 53");
    }
  };
}

function toastFirtTime() {
  if (localStorage.getItem("firstTime")) return;
  localStorage.setItem("firstTime", true);

  $("#mensagemToast").text("Bem vindo(a) ao Labsat!");
  $("#alertToast").text("LABSAT");
  $("#iconToast").addClass("fa fa-check").css("color", "#0e4c66");
  toastBootstrap.show();
}

function createMap(dates) {
  // Criando mapa
  map = L.map("map", {
    minZoom: 4,
    maxZoom: 7,
    noWrap: true,
    attributionControl: false,
    maxBounds: defaultBounds,
    timeDimension: true,
    timeDimensionOptions: {
      times: dates,
      period: "PT10M",
    },
  }).setView([-15, -60], 5);
  // Adicionando dimensão temporal
  timeDimensionControl = new L.Control.TimeDimensionCustom({
    position: "topright",
    timeZones: ["UTC", "Local"],
    autoPlay: false,
    loopButton: true,
    timeSteps: 1,
    playReverseButton: false,
    limitSliders: false,
    minSpeed: 1,
    maxSpeed: 7,
    speedStep: 1,
    timeSliderDragUpdate: true,
    playerOptions: {
      transitionTime: 350,
      loop: true,
      buffer: 2,
      minBufferReady: 1,
      startOver: true,
    },
  });

  map.addControl(timeDimensionControl);

  // Verficando ultima Layer escolhida e adicionando ao timedimension
  if (localStorage.getItem("product")) {
    defaultLayer = localStorage.getItem("product");
  }
  getTiledLayer(defaultLayer);

  // Botão Menu
  menuButton = L.easyButton({
    states: [
      {
        stateName: "open-options",
        icon: '<i id="menu-button" class="fa fa-bars" aria-hidden="true"></i>',
        title: "Acessar opções CEPAGRI",
        onClick: function (e, a) {
          openSideNav();
        },
      },
      {
        stateName: "close-options",
        icon: '<i id="menu-button" class="fa fa-bars" aria-hidden="true"></i>',
        title: "Acessar opções CEPAGRI",
        onClick: function (e, a) {
          closeSideNav();
        },
      },
    ],
    position: "topleft",
  }).addTo(map);

  $("#close-menu-button").on("click", function () {
    closeSideNav();
  });

  // Botão sobre
  sobre = L.easyButton({
    states: [
      {
        icon: '<i id="about-button" class="fa fa-info-circle" aria-hidden="true"></i>',
        title: "Sobre",
        onClick: function (e, a) {
          $("#about").modal("show");
        },
      },
    ],
    position: "topleft",
  }).addTo(map);

  $("#about-close").on("click", function () {
    $("#about").modal("hide");
  });

  // Adicionando  Botão Pesquisar
  L.Control.geocoder({
    placeholder: "Pesquisar localização...",
    errorMessage:
      '<i class="fa fa-exclamation-circle" aria-hidden="true"></i> Localização não encontrada',
    position: "topright",
  }).addTo(map);

  // Configurando e adicionando map ScreenShoter
  L.simpleMapScreenshoter({
    position: "topright",
    hideElementsWithSelectors: [
      ".leaflet-touch .leaflet-control-attribution",
      ".leaflet-touch .leaflet-control-layers",
      ".leaflet-touch .leaflet-bar",
      ".leaflet-control-simpleMapScreenshoter",
    ],
    screenName: function () {
      try {
        const layerValueNow = localStorage.getItem("product") || "True Color";
        return (
          moment
            .utc(map.timeDimension.getCurrentTime())
            .format("YYYY-MM-DD_HH-mm") +
          "_UTC_CEPAGRI_" +
          layerValueNow
        );
      } catch (error) {
        return "CEPAGRI_ch??";
      }
    },
  }).addTo(map);

  map.on("simpleMapScreenshoter.takeScreen", () => {
    timeDimensionControl._player.stop();
    $("#mensagemToast").text(
      "Carregando sua imagem. Isso pode levar alguns instantes."
    );
    $("#alertToast").text("Processando...");
    $("#iconToast")
      .addClass("fa fa-spinner fa-spin fa-fw")
      .css("color", "#0e4c66");
    toastBootstrap.show();
  });
  map.on("simpleMapScreenshoter.done", () => {
    timeDimensionControl._player.stop();
    $("#mensagemToast").text("Imagem pronta!");
    $("#alertToast").text("Baixando...");
    $("#iconToast").addClass("fa fa-check").css("color", "#4CBB17");
    toastBootstrap.show();
  });

  // Adicionando botão Ir para minha localização
  userLocationButton = L.easyButton({
    states: [
      {
        stateName: "find-user-location",
        icon: '<i id="find-user-location-button" class="fa fa-map-marker" aria-hidden="true"></i>',
        title: "Ir para minha localização",
        onClick: function (e, a) {
          userLocationButton.state("searching-user-location");

          let timeout = setTimeout(function () {
            userLocationButton.state("find-user-location");
          }, 10000);

          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              function (position) {
                clearTimeout(timeout);
                let { latitude, longitude } = position.coords;
                let userMarker = L.marker([latitude, longitude]).bindPopup(
                  "Sua localização",
                  {
                    className: "style_popup",
                  }
                );
                map.addLayer(userMarker);
                map.setView([latitude, longitude], 7);
                userLocationButton.state("find-user-location");
              },
              function (error) {
                clearTimeout(timeout);
                console.log("Erro ao obter localização:", error.message);
                userLocationButton.state("find-user-location");
              }
            );
          } else {
            clearTimeout(timeout);
            console.log("Geolocation is not supported by this browser.");
            userLocationButton.state("find-user-location");
          }
        },
      },
      {
        stateName: "searching-user-location",
        icon: '<i class="fa fa-spinner fa-spin fa-fw"></i>',
        title: "Procurando sua localização...",
        onClick: function (e, a) {},
      },
    ],
    position: "topright",
  }).addTo(map);

  // Adicionando Botão Selecionar camadas
  (function () {
    map.createPane("references-pane");
    map.getPane("references-pane").style.zIndex = 201;

    let countriesLayer = L.layerGroup();
    let statesLayer = L.layerGroup();

    // geoJSON
    fetch("./shapefiles/americas.geojson")
      .then((response) => response.json())
      .then((data) => {
        L.geoJSON(data, {
          style: function (feature) {
            return {
              fillOpacity: 0,
              weight: 0.4,
              opacity: 1,
              color: "White",
            };
          },
        }).addTo(countriesLayer);
      });

    fetch("./shapefiles/brazil-states.geojson")
      .then((response) => response.json())
      .then((data) => {
        L.geoJSON(data, {
          style: function (feature) {
            return {
              fillOpacity: 0,
              weight: 0.4,
              opacity: 1,
              color: "White",
            };
          },
        }).addTo(statesLayer);
      });

    let cartoLabels = L.esri.Vector.vectorBasemapLayer(
      "arcgis/human-geography/labels",
      {
        apiKey: API_KEY,
        version: 2,
        language: "pt-BR",
      }
    );

    // let cartoLabels = L.tileLayer(
    //   "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
    //   {
    //     minZoom: 3,
    //     maxZoom: 7,
    //     zIndex: 100,
    //     attribution: "",
    //     bounds: defaultBoundsRegions,
    //     pane: "references-pane",
    //   }
    // );

    let overlayMaps = {
      Lugares: cartoLabels,
      Fronteiras: countriesLayer,
      Estados: statesLayer,
    };
    map.addLayer(cartoLabels);
    map.addLayer(countriesLayer);
    map.addLayer(statesLayer);

    let layerControl = L.control.layers(null, overlayMaps, {
      collapsed: false,
    });

    let stateLayerControl = false;

    L.easyButton({
      states: [
        {
          stateName: "open-options",
          icon: '<i class="fa fa-map" aria-hidden="true"></i>',
          title: "Selecionar camadas",
          onClick: function (e, a) {
            stateLayerControl = !stateLayerControl;
            if (stateLayerControl) {
              layerControl.addTo(map);
            } else {
              map.removeControl(layerControl);
            }
          },
        },
      ],
      position: "topright",
    }).addTo(map);
  })();

  // Configurando datetimepicker
  setupDatePicker(dates);

  // Adicionando logo CEPAGRI
  (function () {
    cepagriLogo = L.control({ position: "bottomright" });
    cepagriLogo.onAdd = function (map) {
      this._div = L.DomUtil.create("div", "logoCepagriPrint");
      this.update();
      return this._div;
    };
    cepagriLogo.update = function (props) {
      this._div.innerHTML = `<img src="./images/logos/CEPAGRI-Logo.png" alt="Cepagri-Logo"/>`;
    };
    cepagriLogo.addTo(map);
  })();

  // Adicionando colorbar
  colorbarButton = L.easyButton({
    states: [
      {
        stateName: "open-colorbar",
        icon: '<i class="fa fa-bar-chart" aria-hidden="true"></i>',
        title: "Abrir tabela de cores",
        onClick: function (btn, map) {
          let selectedValue = document.getElementById("layerSelect").value;
          if (localStorage.getItem("product")) {
            selectedValue = localStorage.getItem("product");
          }
          setupColorbar(selectedValue);
          localStorage.setItem("colorbar", true);
          map.removeControl(colorbarButton);
        },
      },
    ],
    position: "bottomright",
  });

  if (localStorage.getItem("colorbar") == "false") {
    colorbarButton.addTo(map);
  } else {
    let selectedValue = document.getElementById("layerSelect").value;
    if (localStorage.getItem("product")) {
      selectedValue = localStorage.getItem("product");
    }
    setupColorbar(selectedValue);
  }
}

window.onload = function () {
  (function getDate() {
    let dateUrl =
      "https://plataforma.labsat.cpa.unicamp.br/dates/date_ch17.json";
    let request = new XMLHttpRequest();
    request.open("GET", dateUrl, true);
    request.responseType = "json";
    request.send();
    request.onload = function () {
      createMap(request.response.dates);
      toastFirtTime();
    };
  })();
};
