// Variáveis globais
var defaultBounds = [[-59.98897365428924, -5.026037385661109], [59.999999999999986, -139.99999999999997]],
    defaultBoundsRegions = [[-59.98897365428924, -30.026037385661109], [50.999999999999986, -139.99999999999997]],
    currentLayer = null,
    menuButton;

// Funções de controle do painel lateral
function openSideNav() {
    document.getElementById("panel").style.left = "0px";
    map._controlContainer.firstChild.style.transition = "0.8s";
    map._controlContainer.firstChild.style.left = "350px";
    menuButton.state("close-options");
    menuButton.getContainer().style.visibility = "hidden";
}

function closeSideNav() {
    document.getElementById("panel").style.left = "-400px";
    map._controlContainer.firstChild.style.transition = "0.8s";
    map._controlContainer.firstChild.style.left = "0px";
    menuButton.state("open-options");
    menuButton.getContainer().style.visibility = "visible";
}

// Função para obter camada de azulejos
function getTiledLayer(selectedValue) {
    var tiledLayer = L.tileLayer(
        `http://143.106.227.94:4000/{d}/{h}{m}/${selectedValue}/{z}/{x}/{y}.png`, {
            tms: true,
            attribution: "",
            noWrap: true,
            fadeAnimation: true,
            zoomAnimation: true,
            updateWhenIdle: true,
            updateWhenZooming: true,
            keepBuffer: 8,
        }
    );
    var timeLayer = L.timeDimension.layer.tileLayer.goes(tiledLayer, {
        cacheBackward: 5,
        cacheForward: 5,
    });

    // Remova a camada atual antes de adicionar a nova camada
    if (currentLayer) {
        map.timeDimension.unregisterSyncedLayer(currentLayer);
        map.removeLayer(currentLayer);
    }

    currentLayer = timeLayer.addTo(map);
    map.timeDimension.registerSyncedLayer(currentLayer);
}

// Função para criar o mapa
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
        minSpeed: 2,
        maxSpeed: 7,
        speedStep: 1,
        playerOptions: {
            transitionTime: 0,
            loop: true,
            buffer: 5,
            minBufferReady: 2,
        },
    });
    timeDimensionControl.addTo(map);

    // Selecionar camada de azulejos padrão
    var defaultLayer = document.getElementById("layerSelect").value;
    getTiledLayer(defaultLayer);

    // Adicionar geocodificador
    L.Control.geocoder({
        placeholder: "Pesquisar localização...",
        errorMessage: '<i class="fa fa-exclamation-circle" aria-hidden="true"></i> Localização não encontrada',
        position: "topright",
    }).addTo(map);

    // Adicionar botão de print
    L.simpleMapScreenshoter({
        position: "topright",
        screenName: function () {
            return moment.utc(map.timeDimension.getCurrentTime()).format("DD_MM_YYYY_HH:mm") + "_UTC_CEPAGRI"
        }
    }).addTo(map);

    // Para o player do timedimension para tirar a foto
    map.on('simpleMapScreenshoter.takeScreen', function () {
        timeDimensionControl._player.stop()
    })
   
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
        states: [{
            stateName: "find-user-location",
            icon: '<i id="find-user-location-button" class="fa fa-map-marker" aria-hidden="true"></i>',
            title: "Ir para minha localização",
            onClick: function (e, a) {
                userLocationButton.state("searching-user-location");
                
                var timeout = setTimeout(function() {
                    userLocationButton.state("find-user-location");
                }, 10000);

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function(position) {
                        clearTimeout(timeout);
                        var { latitude, longitude } = position.coords;
                        var userMarker = L.marker([latitude, longitude]).bindPopup("Sua localização", {
                            className: "style_popup"
                        });
                        map.addLayer(userMarker);
                        map.setView([latitude, longitude], 7);
                        userLocationButton.state("find-user-location");
                    }, function(error) {
                        clearTimeout(timeout);
                        console.log("Erro ao obter localização:", error.message);
                        userLocationButton.state("find-user-location");
                    });
                } else {
                    clearTimeout(timeout);
                    console.log("Geolocation is not supported by this browser.");
                    userLocationButton.state("find-user-location");
                }
            },
        }, {
            stateName: "searching-user-location",
            icon: '<i class="fa fa-spinner fa-spin fa-fw"></i>',
            title: "Procurando sua localização...",
            onClick: function (e, a) {},
        }],
        position: "topright",
    }).addTo(map);
    
    // Fechar o menu lateral ao clicar no botão
    $("#close-menu-button").on("click", function () {
        closeSideNav();
    }); 

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
            "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png", {
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
      states: [{
          icon: '<i id="about-button" class="fa fa-info-circle" aria-hidden="true"></i>',
          title: "Sobre",
          onClick: function(e, a) {
              $("#about").modal("show");
          }
      }],
      position: "topleft"
    }).addTo(map);

    // Fechar o modal de informações
    $("#about-close").on("click", function() {
        $("#about").modal("hide");
        console.log("O botão Fechar foi clicado!");
    });
}

// Função para mudar a camada
function changeLayer() {
    const selectedValue = document.getElementById("layerSelect").value;
    const baseUrl = 'http://143.106.227.94:8008/dates/';

   
    const dateUrl = selectedValue !== 'truecolor' ? `${baseUrl}date_${selectedValue}.json` : `${baseUrl}date_ch17.json`;

    const request = new XMLHttpRequest();
    request.open("GET", dateUrl);
    request.responseType = "json";
    request.send();

    request.onload = function () {
        const dates = request.response.dates;
        map.timeDimension.setAvailableTimes(dates, 'replace');
        const lastDate = new Date(dates[dates.length - 1]).getTime();
        map.timeDimension.setCurrentTime(lastDate);
    };

    getTiledLayer(selectedValue);
}


// Carregar o mapa quando a página é carregada
window.onload = function () {
    (function getDate() {
        var dateUrl = "http://143.106.227.94:8008/dates/date_ch17.json";
        var request = new XMLHttpRequest();
        request.open("GET", dateUrl);
        request.responseType = "json";
        request.send();
        request.onload = function () {
            createMap(request.response.dates);
        };
    })();
};
