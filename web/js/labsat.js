class MapApp {
  constructor() {
      this.defaultBounds = [[-59.98897365428924, -5.026037385661109], [59.999999999999986, -139.99999999999997]];
      this.defaultBoundsRegions = [[-59.98897365428924, -30.026037385661109], [55.999999999999986, -139.99999999999997]];
      
      this.map = null;
      this.timeDimensionControl = null;
      this.currentLayer = null;
      this.overlayObj = null;
      this.menuButton = null;
      this.defaultLayer = null;
      this.userLocationButton = null;
      this.colorbar = null;
      this.layerProduct = false;
      this.toastLiveExample = document.getElementById("liveToast");
      this.toastBootstrap = bootstrap.Toast.getOrCreateInstance(this.toastLiveExample);
      this.overlay = null;
      this.overlayLayer = null;
      this.colorbarImg = null;
      this.overlayColorbar = null;
      this.overlayColorbarImg = null;

      this.init();
  }

  init() {
      $('#labsat-btn').click(() => {
          window.location.href = 'https://labsat.cpa.unicamp.br/';
      });

      this.fetchDates();
  }

  fetchDates() {
    let dateUrl = "https://plataforma.labsat.cpa.unicamp.br/dates/date_truecolor.json";

    if (localStorage.getItem('product')) {
      const jsonProduct = localStorage.getItem('product').replace('ch', '')
      dateUrl = `https://plataforma.labsat.cpa.unicamp.br/dates/date_${jsonProduct}.json`;
    }

    const request = new XMLHttpRequest();
    request.open("GET", dateUrl, true);
    request.responseType = "json";
    request.send();
    request.onload = () => {
        this.createMap(request.response.dates);
        this.showWelcomeToast();
    };
  }

  openSideNav() {
      document.getElementById("side-nav").style.left = "0px";
      this.map._controlContainer.firstChild.style.transition = "0.8s";
      this.map._controlContainer.firstChild.style.left = "350px";
      this.menuButton.state("close-options");
      this.menuButton.getContainer().style.visibility = "hidden";
  }

  closeSideNav() {
      document.getElementById("side-nav").style.left = "-400px";
      this.map._controlContainer.firstChild.style.transition = "0.8s";
      this.map._controlContainer.firstChild.style.left = "0px";
      this.menuButton.state("open-options");
      this.menuButton.getContainer().style.visibility = "visible";
  }

  getTiledLayer(selectedValue) {
      if (this.currentLayer) {
          this.map.removeLayer(this.currentLayer);
          this.map.timeDimension.unregisterSyncedLayer(this.currentLayer);
      }

      const tiledLayer = L.tileLayer(
          `https://eris.cpa.unicamp.br/{d}/{h}{m}/${selectedValue}/{z}/{x}/{y}.png`, {
              tms: true,
              noWrap: true,
              attribution: "",
              minNativeZoom: 4,
              maxNativeZoom: 6,
              bounds: this.defaultBounds,
              keepBuffer: 8
          }
      );

      const timeLayer = L.timeDimension.layer.tileLayer.goes(tiledLayer, {});
      this.currentLayer = timeLayer.addTo(this.map);
      this.map.timeDimension.registerSyncedLayer(this.currentLayer);
  }

  setupDatePicker(dates) {
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

      $("#datetimepicker1").on("change.datetimepicker", (event) => {
          const selectedDate = event.date.toDate();
          const dateExists = dates.some(date =>
              moment.utc(date).format("YYYY-MM-DD HH:mm") === moment(event.date).format("YYYY-MM-DD HH:mm")
          );

          if (dateExists) {
              this.map.timeDimension.setCurrentTime(moment(selectedDate).subtract({ hours: 2, minutes: 50 }).toISOString());
          } else {
              this.showDateUnavailableToast(event.date);
          }
      });
  }

  showDateUnavailableToast(date) {
      $("#mensagemToast").text(`Data: ${moment(date).format("YYYY/MM/DD HH:mm")} UTC indisponível`);
      $("#alertToast").text("Alerta");
      $("#iconToast").addClass("fa fa-exclamation-triangle").css("color", "#AA0000");
      this.toastBootstrap.show();
  }

  showWelcomeToast() {
      if (localStorage.getItem("firstTime")) return;
      localStorage.setItem("firstTime", true);

      $("#mensagemToast").text("Bem vindo(a) ao Labsat!");
      $("#alertToast").text("LABSAT");
      $("#iconToast").addClass("fa fa-check").css("color", "#0e4c66");
      this.toastBootstrap.show();
  }

  createMap(dates) {
      this.map = L.map("map", {
          minZoom: 4,
          maxZoom: 6,
          noWrap: true,
          attributionControl: false,
          maxBounds: this.defaultBounds,
          timeDimension: true,
          timeDimensionOptions: {
              times: dates,
              period: "PT10M",
          },
      }).setView([-15, -60], 5);
      
      this.initializeControls(dates);
  }

  initializeControls(dates) {
      this.timeDimensionControl = new L.Control.TimeDimensionCustom({
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

      L.control.mousePosition().addTo(this.map);
      this.map.addControl(this.timeDimensionControl);
      
      this.defaultLayer = localStorage.getItem("product") || "truecolor";
      $("#layerSelect").val(this.defaultLayer).change();
      
      this.getTiledLayer(this.defaultLayer);
      this.setupMenuButton();
      this.setupAboutButton();
      this.setupGeocoder();
      this.setupScreenshoter();
      this.setupUserLocationButton();
      this.setupLayersControl();
      this.setupDatePicker(dates);
      this.addLogoControl();
      this.setupColorbar();
  }

  setupMenuButton() {
      this.menuButton = L.easyButton({
          states: [
              {
                  stateName: "open-options",
                  icon: '<i id="menu-button" class="fa fa-bars" aria-hidden="true"></i>',
                  title: "Acessar opções CEPAGRI",
                  onClick: () => this.openSideNav(),
              },
              {
                  stateName: "close-options",
                  icon: '<i id="menu-button" class="fa fa-bars" aria-hidden="true"></i>',
                  title: "Acessar opções CEPAGRI",
                  onClick: () => this.closeSideNav(),
              },
          ],
          position: "topleft",
      }).addTo(this.map);
      
      $("#close-menu-button").on("click", () => this.closeSideNav());
  }

  setupAboutButton() {
      const aboutButton = L.easyButton({
          states: [
              {
                  icon: '<i id="about-button" class="fa fa-info-circle" aria-hidden="true"></i>',
                  title: "Sobre",
                  onClick: () => $("#about").modal("show"),
              },
          ],
          position: "topleft",
      }).addTo(this.map);
      
      $("#about-close").on("click", () => $("#about").modal("hide"));
  }

  setupGeocoder() {
      L.Control.geocoder({
          placeholder: "Pesquisar localização...",
          errorMessage: '<i class="fa fa-exclamation-circle" aria-hidden="true"></i> Localização não encontrada',
          position: "topright",
      }).addTo(this.map);
  }

  setupScreenshoter() {
      L.simpleMapScreenshoter({
          position: "topright",
          hideElementsWithSelectors: [
              ".leaflet-touch .leaflet-control-attribution",
              ".leaflet-touch .leaflet-control-layers",
              ".leaflet-touch .leaflet-bar",
              ".leaflet-control-simpleMapScreenshoter",
          ],
          screenName: () => {
              const layerValueNow = localStorage.getItem("product") || "True Color";
              return `${moment.utc(this.map.timeDimension.getCurrentTime()).format("YYYY-MM-DD_HH-mm")}_UTC_CEPAGRI_${layerValueNow}`;
          },
      }).addTo(this.map);

      this.map.on("simpleMapScreenshoter.takeScreen", () => {
          this.timeDimensionControl._player.stop();
          $("#mensagemToast").text("Carregando sua imagem. Isso pode levar alguns instantes.");
          $("#alertToast").text("Processando...");
          $("#iconToast").addClass("fa fa-spinner fa-spin fa-fw").css("color", "#0e4c66");
          this.toastBootstrap.show();
      });

      this.map.on("simpleMapScreenshoter.done", () => {
          this.timeDimensionControl._player.stop();
          $("#mensagemToast").text("Captura de tela finalizada.");
          $("#alertToast").text("LABSAT");
          $("#iconToast").removeClass("fa fa-spinner fa-spin fa-fw").addClass("fa fa-check").css("color", "#0e4c66");
          this.toastBootstrap.show();
      });
  }

  setupUserLocationButton() {
      this.userLocationButton = L.easyButton({
          states: [
              {
                  icon: '<i id="user-location-button" class="fa fa-map-marker" aria-hidden="true"></i>',
                  title: "Localização do usuário",
                  onClick: () => {
                      this.map.locate({ setView: true, maxZoom: 16 });
                  },
              },
          ],
          position: "topright",
      }).addTo(this.map);

      this.map.on("locationfound", (e) => {
          L.marker(e.latlng).addTo(this.map).bindPopup("Você está aqui!").openPopup();
          this.map.setView(e.latlng, 16);
      });
  }

  setupLayersControl() {
    this.map.createPane("references-pane");
    this.map.getPane("references-pane").style.zIndex = 201;

    let countriesLayer = L.layerGroup();
    let statesLayer = L.layerGroup();

    fetch("./shapefiles/americas.geojson")
        .then((response) => response.json())
        .then((data) => {
            L.geoJSON(data, {
                style: function () {
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
                style: function () {
                    return {
                        fillOpacity: 0,
                        weight: 0.4,
                        opacity: 1,
                        color: "White",
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
            bounds: this.defaultBoundsRegions,
            pane: "references-pane",
        }
    );

    let overlayMaps = {
        "Lugares": cartoLabels,
        "Fronteiras": countriesLayer,
        "Estados Brasileiros": statesLayer,
    };

    this.map.addLayer(cartoLabels);
    this.map.addLayer(countriesLayer);
    this.map.addLayer(statesLayer);

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
                onClick: () => {
                    stateLayerControl = !stateLayerControl;
                    if (stateLayerControl) {
                        this.map.addControl(layerControl);
                    } else {
                        this.map.removeControl(layerControl);
                    }
                },
            },
        ],
        position: "topright",
    }).addTo(this.map);
  }

  changeLayer() {
      const selectedValue = document.getElementById("layerSelect").value;
      const cleanedValue = selectedValue.replace("ch", "");

      localStorage.setItem("product", selectedValue);

      const baseUrl = "https://plataforma.labsat.cpa.unicamp.br/dates/";
      const dateUrl = `${baseUrl}date_${cleanedValue}.json`;

      const request = new XMLHttpRequest();
      request.open("GET", dateUrl);
      request.responseType = "json";
      request.send();

      request.onload = () => {
          const dates = request.response.dates;
          this.map.timeDimension.setAvailableTimes(dates, "replace");
          this.setupDatePicker(dates);
          this.map.timeDimension.setCurrentTime(moment(dates[dates.length - 2]));
          this.getTiledLayer(selectedValue);

          if (this.colorbar) {
            this.changeColorbar();
          }
      };
  }

  addLogoControl() {
    const logoControl = L.control({ position: "bottomright" });

    logoControl.onAdd = function (map) {
      this._div = L.DomUtil.create("div", "logoCepagriPrint");
      this.update();
      return this._div;
    };
    logoControl.update = function (props) {
      this._div.innerHTML = '<img src="./images/logos/CEPAGRI-Logo.png" alt="Cepagri-Logo"/>;'
    };
    logoControl.addTo(this.map);
  }
  
  changeOverlayer() {
    const overlayName = document.getElementById("overlaySelect").value;

    if (this.overlayObj) {
      this.map.removeLayer(this.overlayObj);
      this.map.timeDimension.unregisterSyncedLayer(this.overlayObj);
    }
  
    if(overlayName) {
      const overlayTileLayer = L.tileLayer(`https://eris.cpa.unicamp.br/{d}/{h}{m}/${overlayName}/{z}/{x}/{y}.png`,
        {
          tms: true,
          noWrap: true,
          attribution: "",
          minNativeZoom: 4,
          maxNativeZoom: 6,
          bounds: this.defaultBounds,
          keepBuffer: 8
        }
      );
        
      const overlayLayerObj = L.timeDimension.layer.tileLayer.goes(overlayTileLayer, {});
      this.overlayObj = overlayLayerObj.addTo(this.map);
      this.map.timeDimension.registerSyncedLayer(this.overlayObj);
      
      this.setupOverlayColorbar();
    }
  }

  changeColorbar() {
    const selectedValue = document.getElementById("layerSelect").value;
    const imageSrc = selectedValue === "truecolor" 
        ? "./images/colorbars/ch13.png" 
        : `./images/colorbars/${selectedValue}.png`;

    if (this.colorbarImg) {
        this.colorbarImg.update = function () {
            this._div.innerHTML = `
                <img src="${imageSrc}" class="colorbar" alt="Cepagri-Logo"/>
                <i class="fa fa-times" id="colorbar-close-layer" aria-hidden="true"></i>
            `;
        };

        this.colorbarImg.update();
    }

    $("#colorbar-close-layer").on("click", () => {
        if (this.colorbarImg) {
            this.map.removeControl(this.colorbarImg);
            this.colorbarImg = null;
            this.colorbar.addTo(this.map);
        }
    });
  }

  openColorbar() {
      const selectedValue = document.getElementById("layerSelect").value;
      
      this.colorbarImg = L.control({position: "bottomright"});
    
      this.colorbarImg.onAdd = function () {
        this._div = L.DomUtil.create("div", "info");
        this.update();
        return this._div;
      };
    
      this.colorbarImg.update = function () {
        if (selectedValue == 'truecolor') {
          this._div.innerHTML = `<img src="./images/colorbars/ch13.png" class="colorbar" alt="Cepagri-Logo"/>` +
                                `<i class="fa fa-times" id="colorbar-close-layer" aria-hidden="true"></i>`;
        } else {
          this._div.innerHTML = `<img src="./images/colorbars/${selectedValue}.png" class="colorbar" alt="Cepagri-Logo"/>` +
                                `<i class="fa fa-times" id="colorbar-close-layer" aria-hidden="true"></i>`;
        }
      };

      this.colorbarImg.addTo(this.map);
      
      $("#colorbar-close-layer").on("click", () => {
        if (this.colorbarImg) {
          this.map.removeControl(this.colorbarImg);
          this.colorbarImg = null;
          this.setupColorbar();
        }
      });
  }

  setupColorbar() {
      this.colorbar = L.easyButton({
        states: [
          {
            stateName: "open-colorbar",
            icon: '<i class="fa fa-bar-chart" aria-hidden="true"></i>',
            title: "Abrir tabela de cores",
            onClick: () => {
              this.openColorbar();
              this.map.removeControl(this.colorbar);
            },
          },
        ],
        position: "bottomright",
      });

      this.colorbar.addTo(this.map);
  }

  openOverlayColorbar() {
      const selectedValue = document.getElementById("overlaySelect").value;
      this.overlayColorbarImg = L.control({position: "bottomright"});
    
      this.overlayColorbarImg.onAdd = function () {
        this._div = L.DomUtil.create("div", "info");
        this.update();
        return this._div;
      };
    
      this.overlayColorbarImg.update = function () {
        if (selectedValue) {
          this._div.innerHTML = `<img src="./images/colorbars/${selectedValue}.png" class="colorbar" alt="Cepagri-Logo"/>` +
                                `<i class="fa fa-times" id="colorbar-overlay-close" aria-hidden="true"></i>`;
        }
      };

      this.overlayColorbarImg.addTo(this.map);
      
      $("#colorbar-overlay-close").on("click", () => {
        if (this.overlayColorbarImg) {
          this.map.removeControl(this.overlayColorbarImg);
          this.overlayColorbarImg = null;
          this.setupOverlayColorbar();
        }
      });
  }

  setupOverlayColorbar() {
      if (this.overlayColorbarImg) {
        this.map.removeControl(this.overlayColorbarImg);
        this.overlayColorbarImg = null;
      }
      if (this.overlayColorbar)
        this.map.removeControl(this.overlayColorbar);


      this.overlayColorbar = L.easyButton({
        states: [
          {
            stateName: "open-colorbar",
            icon: '<i class="fa fa-bar-chart" aria-hidden="true"></i>',
            title: "Abrir tabela de cores",
            onClick: () => {
              this.openOverlayColorbar();
              this.map.removeControl(this.overlayColorbar);
            },
          },
        ],
        position: "bottomright",
      });
      if (document.getElementById("overlaySelect").value != '0') {
        this.overlayColorbar.addTo(this.map);
      }
  }
}

const mapApp = new MapApp();