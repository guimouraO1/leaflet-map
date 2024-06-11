const defaultBounds = [
  [-59.98897365428924, -5.026037385661109],
  [59.999999999999986, -139.99999999999997],
];
const defaultBoundsRegions = [
  [-59.98897365428924, -30.026037385661109],
  [55.999999999999986, -139.99999999999997],
];

let map;
let timeDimensionControl;
let currentLayer = null;
let menuButton;
let defaultLayer = "truecolor";
let userLocationButton;

const toastLiveExample = document.getElementById("liveToast");
const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample);

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
    map.timeDimension.unregisterSyncedLayer(currentLayer);
    map.removeLayer(currentLayer);
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

function createMap(dates) {
  console.log(dates[0]);
  map = L.map("map", {
    minZoom: 4,
    maxZoom: 6,
    noWrap: true,
    maxBounds: defaultBounds,
    timeDimension: true,
    timeDimensionOptions: {
      // timeInterval: dates[0] + "/" + dates[5],
      times: dates,
      period: "PT10M",
    },
  }).setView([-15, -60], 5);

  // Adicionar controle de dimensão do tempo
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

  // Selecionar camada de azulejos padrão
  if (localStorage.getItem("product")) {
    defaultLayer = localStorage.getItem("product");
  }
  // Adicionando Tiles goes
  getTiledLayer(defaultLayer);

  // Adicionar geocodificador
  L.Control.geocoder({
    placeholder: "Pesquisar localização...",
    errorMessage:
      '<i class="fa fa-exclamation-circle" aria-hidden="true"></i> Localização não encontrada',
    position: "topright",
  }).addTo(map);

  // Adicionar botão de print
  L.simpleMapScreenshoter({
    position: "topright",
    screenName: function () {
      return (
        moment
          .utc(map.timeDimension.getCurrentTime())
          .format("DD_MM_YYYY_HH:mm") + "_UTC_CEPAGRI"
      );
    },
  }).addTo(map);

  // Para o player do timedimension para tirar a foto
  map.on("simpleMapScreenshoter.takeScreen", function () {
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

  // Adicionar botão do menu
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

  // Botão para localização do usuário
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

  // Fechar o menu lateral ao clicar no botão
  $("#close-menu-button").on("click", function () {
    closeSideNav();
  });

  // Datetimepicker
  setupDatePicker(dates);

  // Adicionar botão de camadas
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
              fillColor: "gray",
              weight: 1,
              opacity: 1,
              color: "White",
              fillOpacity: 0,
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
              fillColor: "green",
              weight: 1,
              opacity: 1,
              color: "White",
              fillOpacity: 0,
            };
          },
        }).addTo(statesLayer);
      });

    let cartoLabels = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
      {
        minZoom: 3,
        maxZoom: 7,
        zIndex: 100,
        attribution: "",
        bounds: defaultBoundsRegions,
        pane: "references-pane",
      }
    );

    let overlayMaps = {
      Lugares: cartoLabels,
      Fronteiras: countriesLayer,
      Estados: statesLayer,
    };

    map.addLayer(countriesLayer);
    map.addLayer(statesLayer);
    map.addLayer(cartoLabels);

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

  // Adicionar botão de informações
  L.easyButton({
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

  // Fechar o modal de informações
  $("#about-close").on("click", function () {
    $("#about").modal("hide");
  });
}

function changeLayer() {
  let selectedValue = document.getElementById("layerSelect").value;

  localStorage.setItem("product", selectedValue);
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
