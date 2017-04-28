//TODO turn this into an IIFE so we know we're not conflictin

// TODO: This needs to be configurable
var CMS_URL = "https://pwc.downstreamlabs.com";
var stage;
var backgroundLayer;
var pinLayer;

var lastTouchedPin;
var layerIcons = {}; // Holds the images for different pin layers. Initialized at app launch when we get the data payload from the CMS

function initMapsApp(mapsPayload) {
  var width = window.innerWidth;
  var height = window.innerHeight;
  $(window).on('hashchange',function() {
    var payload = mapsPayload;

    console.log('Location hash', location.hash);
    var hash = location.hash.replace('#','');
    var parts = hash.split('.');

    var config = { floor: Number(parts[0]), pin: (parts[1] == undefined ? 0 : Number(parts[1]))  };
    $('#floor_select').val(config.floor);

    var scaleX = 0;
    var scaleY = 0;

    $('#map').empty();
    // TODO: At this point it's expected that we have the location (Melb, Brisbane, etc.) and
    // This loops over the floors for that location and finds the one extracted from the hash above.
    // So ultimately, get that data to this code, and remove the hardcoded value on the next line.
    var brisbaneFloorData = mapsPayload.building_data[0].Floor;
    $.each(brisbaneFloorData, function(i, floor) {
        console.log(floor.Id + ' ' + config.floor);
        var payload = mapsPayload;
        console.log('floor: ', floor);
        if(floor.Id === config.floor) {
            console.log(floor);

            $('#name').html(floor.Name);

            scaleX = width/floor.FloorImage.width;
            scaleY = scaleX;

            stage = new Konva.Stage({
              container: 'map',   // id of container <div>
              width: width,
              height: height
            });

            backgroundLayer = new Konva.Layer();
            pinLayer = new Konva.Layer();

            var base = new Konva.Image({
                x: 0,
                y: 0,
                width: floor.FloorImage.width*scaleX,
                height: floor.FloorImage.height*scaleY,
                stroke: 0
            });

            backgroundLayer.add(base);

            var imageObj = new Image();

            imageObj.onload = function() {
              base.image(imageObj);
              backgroundLayer.draw();
            };

            imageObj.src = CMS_URL + floor.FloorImage.image;


            var pinGroup = new Konva.Group({
                name: 'pingroup',
                x: 0,
                y: 0
            });

            // Loop through each pin that has been placed on the floor,
            // and places it in the appropriate spot on the floor map,
            // hiding each pin by default
            $.each(floor.Pin, function(i,pinData) {
              // Build the pin icon that we'll place on the Konva layer

              // These offset/scaling calculations try to scale the position of the icon based on its size, this will also be related to the original icon used, in this case \uf041
              // INCREASING / DECREASING ICON SIZE? Try just changing the fontSize value
              var fontSize = 80;


              var image = layerIcons[pinData.LayerId];
              var offsetXImage = fontSize - (fontSize * 0.61);
              var offsetYImage = fontSize - (fontSize * 0.4);
              var pinIcon = new Konva.Image({
                x: ((floor.FloorImage.width * scaleX)* pinData.PositionX) - offsetXImage,
                y: ((floor.FloorImage.height * scaleY)* pinData.PositionY) - offsetYImage,
                image: layerIcons[pinData.LayerId],
                scaleX : fontSize / 100,
                scaleY : fontSize / 100,
                icon : true
              });

              var offsetXPin = fontSize - (fontSize * 0.5);
              var offsetYPin = fontSize - (fontSize * 0.3);

              var pin = new Konva.Text({
                  x: ((floor.FloorImage.width * scaleX)* pinData.PositionX) - offsetXPin,
                  y: ((floor.FloorImage.height * scaleY)* pinData.PositionY) - offsetYPin,
                  fill: 'rgb(232,66,102)',
                  text: '\ue807',
                  stroke : 'white',
                  strokeWidth : '2',
                  strokeEnabled : false,
                  fontSize: fontSize,
                  fontFamily: 'pwcmobileappicons',
                  shadowColor: 'black',
                  shadowBlur: 10,
                  shadowOffset: {x : 5, y : 5},
                  shadowOpacity: 0.5,
                  pinIcon : pinIcon,
                  layerid: pinData.LayerId
              });



              pinIcon.on('tap click', function(event) {
                event.evt.stopPropagation();
                pin.fire(event.type, pin);
              });

              // Expose the pin data and highlight the pin on pin tap,
              // Also de-highlight the last pin
              pin.on('tap click', function(e) {
                var touchedPin = e.target;
                if (lastTouchedPin) lastTouchedPin.strokeEnabled(false);
                touchedPin.strokeEnabled(true);
                lastTouchedPin = touchedPin;
                backgroundLayer.draw();
                $('.layer_name').html(pinData.Title);
                $('.panel_body').html(pinData.Body);
                $('.panel_location').html(pinData.Location);
                $('#floatingmenu').addClass('open');
              });
              // Add this new pin to the Konva pinGroup, so that we can place them as one action
              pinGroup.add(pin);
              // Hide the pin by default
              //pin.hide();

              if (pinData.Id === config.pin) {
                  pin.show();
                  $('.layer_name').html(pinData.Layer.Name);
                  $('.panel_body').html(pinData.Body);
                  $('.panel_location').html(pinData.Location);
                  $('#floatingmenu').addClass('open');
              }

              backgroundLayer.add(pin);
              backgroundLayer.add(pinIcon);
            }); // End pin each

            // close the panel if the map is tapped
            stage.on('tap click', function(e) {

                var node = e.target;
                if(node.className === 'Image' && !node.attrs.icon) {
                    closeFloatingMenu();
                }

            });
            // TODO: don't think this pinLayer is getting added, daz prolly a bug
            pinLayer.add(pinGroup);

            stage.add(backgroundLayer);

        }
    }); // end $.each floorData

    // TODO: Might need to re-enable this
    // $('.category').each(function(i,ele) {
    //   if($(ele).parent().hasClass('on')) {
    //     var catid = $(ele).data('categoryid');
    //     var allpins = stage.find('Text');
    //     allpins.each(function(p) {
    //         if(p.attrs.layerid == catid) {
    //             p.show();
    //         }
    //     });
    //   }
    // });

  }).trigger('hashchange'); // $.onHashChange
}

function buildLayersModal(layers) {
  var category_list = $('.category_list');
  $.each(layers, function(i, layer) {
    category_list.append(buildLayerIcon(layer))
  });
}

function buildLayerIcon(layer) {
  return $([
    "<li>",
    "  <div class='category' data-categoryid=" + layer.Id + " style='background: url(" + layer.Icon + ") no-repeat; background-position: 50% 20%; background-size: 70%;'",
    "  <p>" + layer.Name,
    "  </p>",
    "  </div>",
    "</li>"
  ].join("\n"));
}
//TODO: this was blowing up when building icons, needs to be fixed background: url(" + layer.Icon.getDownloadUrl() + ")

function closeFloatingMenu() {
  debugger;
  $('#floatingmenu').removeClass('open');
  clearLastTouchedPin();
}

function clearLastTouchedPin() {
  if (lastTouchedPin && backgroundLayer) { // Clear the highlighted appearance of the last touched pin
    lastTouchedPin.strokeEnabled(false);
    backgroundLayer.draw();
    lastTouchedPin = false;
  }
}

function setupEventHandlers(mapsPayload) {
  $(function () {

      if(location.hash.length === 0) {
          if(mapsPayload.length > 0) {
              window.location.hash = '#'+mapsPayload[0].Id;
          }
      }

      $('.filter_close').on('click', function() {
          $('.filter').velocity({
              opacity: 0
          }, {
              display: 'none',
              delay: 500,
              duration: 200
          });
      });

      $('.panel_close').on('click', function() {
        closeFloatingMenu();
      });

      $('#floor_select').on('change', function() {
          var optionSelected = $("option:selected", this);
          // TODO: removed this since we don't know our route yet but it will need to be put back in '/mobile/building/' + $(optionSelected).data('locationid') +
          document.location.href = '#' + $(optionSelected).data('floorid');
      });

      $('#btn_amenities').on('click', function() {
          closeFloatingMenu();
          $('.filter').velocity({
              opacity: 1
          }, {
              display: 'block',
              delay: 250,
              duration: 200
          });
      });

      $('.category').on('click', function() {
          //console.log( $(this).data('categoryid') );
          if( $(this).parent().hasClass('on') ) { // We're
              $(this).parent().removeClass('on');
              var category = $(this).data('categoryid');
              hidePinsOf(category);
          } else {
              $(this).parent().addClass('on');
              var category = $(this).data('categoryid');
              showPinsOf(category);
          }
      });
  });
}

function hidePinsOf(category) {
  var allpins = stage.find('Text');
  allpins.each(function(p) {
      if(p.attrs.layerid === category) {
          p.hide();
          p.attrs.pinIcon.hide();
      }
  });
  stage.draw();
}

function showPinsOf(category) {
  var allpins = stage.find('Text');
  allpins.each(function(p) {
      if(p.attrs.layerid === category) {
          p.show();
          p.attrs.pinIcon.show();
      }
  });
  stage.draw();
}

function buildFloorSelect(mapsPayload) {
  // TODO: Again for this code, it looks like the location is already known, so I've backed in the Brisbane
  // floor, but it will need to be derived at run-time, ultimately
  var brisbaneFloorData = mapsPayload.building_data[0].Floor;
  var floorSelect = $('#floor_select');
  $.each(brisbaneFloorData, function(i, floor) {
      floorSelect.append(buildFloorOption(floor));
  });
}

function buildFloorOption(floor) {
  return $([
    "<option value=" + floor.Id + " data-locationid=" + floor.LocationId + " data-floorid=" + floor.Id + ">" + floor.Name,
    "</option>"
  ].join("\n"));
}

function initLayerIcons(layers) {
  $.each(layers, function(i, layer) {
    layerIcons[layer.Id] = new Image();
    layerIcons[layer.Id].src = layer.Icon;
  });
}

function init() {
  var request = new XMLHttpRequest();
  request.addEventListener("load", function() {
    var mapsPayload = JSON.parse(this.responseText);
    initLayerIcons(mapsPayload.layers);
    buildLayersModal(mapsPayload.layers);
    buildFloorSelect(mapsPayload)
    setupEventHandlers(mapsPayload)
    initMapsApp(mapsPayload);
  });
  request.open("GET", "http://localhost:3000/getMaps");
  request.setRequestHeader('Authorization', 'Bearer ff779ee219d7be0549c971d6ba2311d5');
  request.setRequestHeader('Content-Type', 'application/json');
  request.setRequestHeader('Accept', 'application/json');
  request.send();
}

init();
