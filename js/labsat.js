var defaultBounds = [
    [-59.98897365428924, -5.026037385661109],
    [59.999999999999986, -139.99999999999997],
  ],
  defaultBoundsRegions = [
    [-59.98897365428924, -30.026037385661109],
    [50.999999999999986, -139.99999999999997],
  ],
  currentLayer = null,
  menuButton,
  toastLiveExample = document.getElementById("liveToast"),
  toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample);

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
  var tiledLayer = L.tileLayer(
    `http://143.106.227.94:4000/{d}/{h}{m}/${selectedValue}/{z}/{x}/{y}.png`,
    {
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
    cacheBackward: 8,
    cacheForward: 8,
  });

  // Remova a camada atual antes de adicionar a nova camada
  if (currentLayer) {
    map.timeDimension.unregisterSyncedLayer(currentLayer);
    map.removeLayer(currentLayer);
  }

  currentLayer = timeLayer.addTo(map);
  map.timeDimension.registerSyncedLayer(currentLayer);
}

function datepickerT(dates) {
  var date = moment(dates[dates.length - 1], "YYYYMMDDHHmm");
  var firstDate = moment(dates[0], "YYYYMMDDHHmm");

  console.log(date.format("YYYY-MM-DD HH:mm"));
  $("#datetimepicker1").datetimepicker({
    format: "DD/MM/YYYY HH:mm",
    stepping: 10,
    minDate: firstDate,
    maxDate: date,
    date: date,
    keepOpen: false,
    timeZone: "UTC",
  });

  $("#datetimepicker1").on("change.datetimepicker", function (o) {
    dateTempus = o.date.toDate();

    var dateExists = dates.some((element) => {
      return (
        moment.utc(element).format("YYYY-MM-DD HH:mm") ===
        moment(o.date).format("YYYY-MM-DD HH:mm")
      );
    });
    if (dateExists) {
      map.timeDimension.setCurrentTime(
        moment(dateTempus).subtract({ hours: 2, minutes: 50 }).toISOString()
      );
    } else {
      $("#mensagemToast").text(
        `Data: ${moment(o.date).format(
          "YYYY/MM/DD HH:mm"
        )} UTC indisponível`
      );
      $("#alertToast").text("Alerta");
      $("#iconToast").addClass("fa fa-exclamation-triangle").css("color", "#AA0000");
      toastBootstrap.show();
    }
  });
}

function createMap(dates) {
  map = L.map("map", {
    minZoom: 5,
    maxZoom: 6,
    noWrap: true,
    maxBounds: defaultBounds,
    timeDimension: true,
    timeDimensionOptions: {
      times: dates,
    },
  }).setView([-15, -60], 5);

  // Adicionar controle de dimensão do tempo
  var timeDimensionControl = new L.Control.TimeDimensionCustom({
    position: "topright",
    timeZones: ["UTC", "Local"],
    autoPlay: false,
    loopButton: false,
    timeSteps: 1,
    playReverseButton: false,
    limitSliders: false,
    minSpeed: 1,
    maxSpeed: 7,
    speedStep: 1,
    timeSliderDragUpdate: true,
    playerOptions: {
      transitionTime: 0,
      loop: true,
      buffer: 6,
      minBufferReady: 4,
      startOver: true,
    },
  });
  timeDimensionControl.addTo(map);

  // Selecionar camada de azulejos padrão
  var defaultLayer = document.getElementById("layerSelect").value;
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
  });

  //   map.timeDimension.on("timeloading", function () {
  //     var currentTime = map.timeDimension.getCurrentTime();
  //     var currentTimeISO = moment.utc(currentTime).toISOString();

  //     // Verifica se a data atual está no array dates
  //     var dateExists = dates.some(function (element) {
  //       return moment.utc(element).toISOString() === currentTimeISO;
  //     });

  //     if (dateExists) {
  //       $("#datetimepicker1").datetimepicker("date", moment.utc(currentTime));
  //     }
  //   });

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
  var userLocationButton = L.easyButton({
    states: [
      {
        stateName: "find-user-location",
        icon: '<i id="find-user-location-button" class="fa fa-map-marker" aria-hidden="true"></i>',
        title: "Ir para minha localização",
        onClick: function (e, a) {
          userLocationButton.state("searching-user-location");

          var timeout = setTimeout(function () {
            userLocationButton.state("find-user-location");
          }, 10000);

          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              function (position) {
                clearTimeout(timeout);
                var { latitude, longitude } = position.coords;
                var userMarker = L.marker([latitude, longitude]).bindPopup(
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
  datepickerT(dates);

  // Adicionar botão de camadas
  (function () {
    map.createPane("references-pane");
    map.getPane("references-pane").style.zIndex = 201;

    var countriesLayer = L.layerGroup();
    var statesLayer = L.layerGroup();

    // Carregar dados geopolíticos
    fetch("./shapefiles/ne_50m_admin_0_countries.geojson")
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
              maxBounds: defaultBoundsRegions,
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
        bounds: defaultBoundsRegions,
        pane: "references-pane",
      }
    );

    var overlayMaps = {
      Lugares: cartoLabels,
      Fronteiras: countriesLayer,
      Estados: statesLayer,
    };

    var layerControl = L.control.layers(null, overlayMaps, {
      collapsed: false,
    });
    var stateLayerControl = false;

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
  const selectedValue = document.getElementById("layerSelect").value;
  const baseUrl = "http://143.106.227.94:8008/dates/";

  const dateUrl =
    selectedValue !== "truecolor"
      ? `${baseUrl}date_${selectedValue}.json`
      : `${baseUrl}date_ch17.json`;

  const request = new XMLHttpRequest();
  request.open("GET", dateUrl);
  request.responseType = "json";
  request.send();

  request.onload = function () {
    const dates = request.response.dates;
    map.timeDimension.setAvailableTimes(dates, "replace");
    const lastDate = new Date(dates[dates.length - 1]).getTime();
    map.timeDimension.setCurrentTime(lastDate);
    datepickerT(dates);
  };

  getTiledLayer(selectedValue);
}

window.onload = function () {
  (function getDate() {
    var dateUrl = "http://143.106.227.94:8008/dates/date_ch17.json";
    var request = new XMLHttpRequest();
    request.open("GET", dateUrl);
    request.responseType = "json";
    request.send();
    request.onload = function () {
      createMap(request.response.dates);
      
      $("#mensagemToast").text("Bem vindo(a) ao Labsat!");
      $("#alertToast").text("LABSAT")
      $("#iconToast").addClass("fa fa-check").css("color", "#0e4c66");
      toastBootstrap.show();
    };
  })();
};
