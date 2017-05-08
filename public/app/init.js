var MapActions = require('./mapActions');
var roomSearch = require('./roomSearch');
var htmlGen = require('./htmlGenerators.js');

var MEETING_ROOMS = "Meeting Spaces";
var ELEVATORS = "Elevators";

var MapsApp = function() {
  MapActions.call(this);
  this.lastLocation = null;
  this.lastTouchedPin = null;
  this.cmsUrl = null;
  this.elevatorsLayerId = null;
  this.meetingRoomLayerId = null;
}

function setupEventHandlers(mapsPayload) {
  $(function () {
      if(location.hash.length === 0) {
          if(mapsPayload.length > 0) {
              window.location.hash = '#' + mapsPayload[0].Id;
          }
      }

      $('#floor_select').on('change', function() {
        $(this).blur();
        updateSelectionHash();
      });

      $('#location_select').on('change', function() {
        $(this).blur();
        updateSelectionHash();
      });

      $('.amenities-modal-close').on('tap click', function(event) {
        event.stopPropagation();
        closeAmenitiesModal();
      });

      $('.cancel-meeting-room').on('tap click', function(event) {
        revertSearchDisplay();
      });

      $('#btn_amenities').on('click tap', function(event) {
        MapActions.closeFloatingMenu();
        if (!$('.filter').is(':visible')) { // Case: our amenities menu is not already open.
          $('.amenities-modal-close').show();
          $('.filter').velocity({
              opacity: 1
          }, {
              display: 'block',
              delay: 250,
              duration: 200
          });
        }
      });

      $('body').on('click tap', function(event) {
        if ($('.filter').is(':visible')) {
          event.stopPropagation();
          closeAmenitiesModal();
        }
      });

      $('.filter').on('click tap', function(event) {
        if ($('.filter').is(':visible')) {
          event.stopPropagation();
          closeAmenitiesModal();
        }
      });

      $('#btn_search').on('click tap', function() {
        MapActions.closeAllModals();
        MapActions.hideMapStage();
        showAndFocusSearch();
      });

      $('.cancel-search').on('click tap', function() {
        if ($('.dark-table').is(':visible')) {
          MapActions.transitionOutOfMeetingRoomSearch();
        } else {
          roomSearch.revertSearchDisplay();
          roomSearch.searchTable();
        }
      });

      $('#active_search_input').on('input', function() {
        roomSearch.revertSearchDisplay();
        roomSearch.searchTable();
      });

      $('.layer_name i').on('click tap', function() {
        closeFloatingMenu();
      });
  });
}

function updateSelectionHash() {
  var selectedFloor = $("#floor_select option:selected");
  var selectedLocation = $("#location_select option:selected");
  document.location.href = '#' + selectedLocation.data('buildingid') + "." + $(selectedFloor).data('floorid');
}

function setAmenitiesButtonTo(categoryId) {
  // Always clear any existing amenities button icon before displaying a new one
  $('#btn_amenities .curr-amen-icon').remove();
  if (categoryId) { // Case: We're showing an amenity category
    $('#btn_amenities').addClass('showing-amenities');
    $('#btn_amenities').removeClass('no-amenities');
    $('.amn-icon').hide();
    $('#btn_amenities').prepend($(this.layerIcons[categoryId]).clone().addClass('curr-amen-icon'));
  } else { // Case: We're not showing an amenity categories
    $('#btn_amenities').addClass('no-amenities');
    $('#btn_amenities').removeClass('showing-amenities');
    $('.amn-icon').show();
  }
}

// Loops through all the pins for a given floor.
// If any pin matches the given layer, return true indicating that we should give
// that amenity option.
// Else return false, indicating that that layer/amenity button should not be constructed
function floorHasThisLayer(floorPins, layer) {
  for (var i = 0; i < floorPins.length; i++) {
    var pin = floorPins[i];
    if (pin.LayerId === layer.Id) { // Case: the current floor has a pin corresponding to the given amenity/layer , return true
      return true;
    }
  }
  return false;
}

function _initLayerIcons(mapsPayload) {
  var layers = mapsPayload.layers;
  var that = this;
  $.each(layers, function(i, layer) {
    that.layerIcons[layer.Id] = new Image();
    that.layerIcons[layer.Id].src = layer.Icon;
  });
}

function buildLocationSelect(mapsPayload) {
  // TODO: Again for this code, it looks like the location is already known, so I've backed in the Brisbane
  // floor, but it will need to be derived at run-time, ultimately
  var buildingData = mapsPayload.building_data;
  var buildingSelect = $('#location_select');
  $.each(buildingData, function(i, building) {
      buildingSelect.append(buildLocationOption(building));
  });
}

function buildLocationOption(building) {
  return $([
    "<option value=" + building.Id + " data-buildingid=" + building.Id + ">" + building.Name,
    "</option>"
  ].join("\n"));
}

function _initMapsApp(mapsPayload) {
  var width = window.innerWidth;
  var height = window.innerHeight - $('.buttons').height();
  var that = this;
  $(window).on('hashchange',function() {
    var payload = mapsPayload;

    var hash = location.hash.replace('#','');
    var parts = hash.split('.');

    var config = {
      location: Number(parts[0]),
      floor: (parts[1] == undefined ? 0 : Number(parts[1]))
    };

    $('#location_select').val(config.location);
    $('#floor_select').val(config.floor);

    var locationFloorData = getFloorDataFromLocation(mapsPayload.building_data, config.location)
    if (!locationFloorData) throw new Error('In initMap. Could not find location in mapsPayload corresponding to given Id. Given Id: ' + config.location);
    if (that.lastLocation !== config.location) { // Case: our location has changed, so clear all floor data and build the floor data for the new location
      MapActions.clearFloorOptions();
      MapActions.buildFloorSelect(locationFloorData);
      $('#floor_select').trigger('change');
    }
    that.lastLocation = config.location;
    var scaleX = 0;
    var scaleY = 0;
    setAmenitiesButtonTo(null);
    MapActions.closeAllModals();
    $('#map').empty();

    $.each(locationFloorData, function(i, floor) {
        var payload = mapsPayload;
        if(floor.Id === config.floor) {
          // Clear any existing search data, as we'll be creating
          // new content for this floor
            var searchTable = $('.dark-table tbody');
            searchTable.children().remove();
            $('#name').html(floor.Name);

            scaleX = width/floor.FloorImage.width;
            scaleY = scaleX;

            that.stage = new Konva.Stage({
              container: 'map',   // id of container <div>
              width: width,
              height: height
            });

            that.backgroundLayer = new Konva.Layer();
            that.pinLayer = new Konva.Layer();

            var base = new Konva.Image({
                x: 0,
                y: 0,
                width: floor.FloorImage.width*scaleX,
                height: floor.FloorImage.height*scaleY,
                stroke: 0
            });

            that.backgroundLayer.add(base);

            var imageObj = new Image();

            imageObj.onload = function() {
              base.image(imageObj);
              that.backgroundLayer.draw();
            };
            imageObj.src = that.cmsUrl + floor.FloorImage.image;


            var pinGroup = new Konva.Group({
                name: 'pingroup',
                x: 0,
                y: 0
            });

            _buildLayersModalForFloor(mapsPayload.layers, floor.Pin);

            // Loop through each pin that has been placed on the floor,
            // and places it in the appropriate spot on the floor map,
            // hiding each pin by default
            $.each(floor.Pin, function(i,pinData) {
              // Build the pin icon that we'll place on the Konva layer

              // These offset/scaling calculations try to scale the position of the icon based on its size, this will also be related to the original icon used, in this case \uf041
              // INCREASING / DECREASING ICON SIZE? Try just changing the fontSize value
              var fontSize = 40;

              var image = that.layerIcons[pinData.LayerId];
              var offsetXImage = fontSize - (fontSize * 0.61);
              var offsetYImage = fontSize - (fontSize * 0.4);

              var pinIcon = new Konva.Image({
                x: ((floor.FloorImage.width * scaleX)* pinData.PositionX) - offsetXImage,
                y: ((floor.FloorImage.height * scaleY)* pinData.PositionY) - offsetYImage,
                image: that.layerIcons[pinData.LayerId],
                scaleX : fontSize / 90,
                scaleY : fontSize / 90,
                icon : true
              });

              var offsetXPin = fontSize - (fontSize * 0.55);
              var offsetYPin = fontSize - (fontSize * 0.3);

              var pin = new Konva.Text({
                  x: ((floor.FloorImage.width * scaleX)* pinData.PositionX) - offsetXPin,
                  y: ((floor.FloorImage.height * scaleY)* pinData.PositionY) - offsetYPin,
                  fill: 'rgb(232,66,102)',
                  text: '\ue807',
                  stroke : 'white',
                  strokeWidth : '3',
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
              if (pinData.LayerId === that.meetingRoomLayerId) {
                newCell = $('<tr><td><div>' + pinData.Title + '</div></td></tr>');
                searchTable.append(newCell);
                newCell.on('click tap', function() {
                  hideAllPins();
                  pin.show();
                  pinIcon.show();
                  that.backgroundLayer.draw();
                  $('#active_search_input').val(pinData.Title);
                  prepareForMeetingRoomDisplay();
                  pin.fire('tap');
                });
              }

              pinIcon.on('tap click', function(event) {
                event.evt.stopPropagation();
                pin.fire(event.type, pin);
              });

              // Expose the pin data and highlight the pin on pin tap,
              // Also de-highlight the last pin
              pin.on('tap click', function(e) {
                var touchedPin = e.target;
                if (that.lastTouchedPin) that.lastTouchedPin.strokeEnabled(false);
                touchedPin.strokeEnabled(true);
                that.lastTouchedPin = touchedPin;
                that.backgroundLayer.draw();
                $('.layer_name div').html(pinData.Title + "text text text text text text text text text text text text text  text text text text text tex");
                $('.panel_body').html(pinData.Body + "text text text text text text text text text text text text text  t text text text text text  text text tex t text text text text text  text text tex  text text text text text text text text text text text text text text text text text text text text text text text text text ");
                $('#floatingmenu').addClass('open');
              });
              // Add this new pin to the Konva pinGroup, so that we can place them as one action
              pinGroup.add(pin);

              if (pinData.Id === config.pin) {
                  pin.show();
                  $('.layer_name div').html(pinData.Layer.Name);
                  $('.panel_body').html(pinData.Body);
                  $('#floatingmenu').addClass('open');
              }

              that.backgroundLayer.add(pin);
              that.backgroundLayer.add(pinIcon);
            }); // End pin each

            // close the panel if the map is tapped
            that.stage.on('tap click', function(e) {

                var node = e.target;
                if(node.className === 'Image' && !node.attrs.icon) {
                    MapActions.closeFloatingMenu();
                }

            });
            // TODO: don't think this pinLayer is getting added, daz prolly a bug
            that.pinLayer.add(pinGroup);

            that.stage.add(that.backgroundLayer);

            // Hide the pin by default
            //TODO: re-enable this,
            //hideAllPins();

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

function _buildLayersModalForFloor(layers, floorPins) {
  var category_list = $('.category_list');
  var that = this;
  $('.category_list li').remove(); // Since we're changing floors, or init'ing the app, clear all previous amenity buttons

  $.each(layers, function(i, layer) {
    if (layer.Name === ELEVATORS) {
      that.elevatorsLayerId = layer.Id;
      return; // Do not add elevators to the amenity menu, as they are always on
    }
    if (layer.Name === MEETING_ROOMS) {
      that.meetingRoomLayerId = layer.Id;
      return; // Do not add meeting rooms to the amenity selections. These are accessed exclusively through search
    }
    if (floorHasThisLayer(floorPins, layer)) { // Case: this floor has a pin corresponding to the given/layer amenity, build that layer button
      category_list.append(htmlGen.buildLayerIcon(layer));
    }
  });

  // Initialize click handlers for category buttons
  $('.category').on('click tap', function(event) {
    event.stopPropagation();
    if ($(this).parent().hasClass('on')) { // Case: we're turning off all amenities
      $(this).parent().removeClass('on');
      var categoryId = $(this).data('categoryid');
      that.hidePinsOf(categoryId);
      setAmenitiesButtonTo(null); // Clear the amenities button
    } else { // Case: we're turning on an amenties category that wasn't on previously. Clear the map and amenities state, and apply the new amenities filter
      $('.category').parent().removeClass('on');
      that.hideAllPins();
      $(this).parent().addClass('on');
      var categoryId = $(this).data('categoryid');
      that.showPinsOf(categoryId);
      setAmenitiesButtonTo(categoryId);
    }
  });
}

// Loop through all available locations and return
// the one that corresponds to the given Id.
// Returns false if we couldn't find the the location given
function getFloorDataFromLocation(locationData, locationId) {
  for (var i = 0; i < locationData.length; i++) {
    var location = locationData[i];
    if (location.Id === locationId) { // Case: we've found the building that corresponds to our given Id, return it
      return location.Floor;
    }
  }
  return false;
}

function init(cmsUrl) {
  this.cmsUrl = cmsUrl;
  var request = new XMLHttpRequest();
  var that = this;
  request.addEventListener("load", function() {
    var mapsPayload = JSON.parse(this.responseText);
    that.initLayerIcons(mapsPayload);
    buildLocationSelect(mapsPayload);
    setupEventHandlers(mapsPayload);
    that.initMapsApp(mapsPayload);
  });
  request.open("GET", "https://e9affc90.ngrok.io/getMaps");
  request.setRequestHeader('Authorization', 'Bearer ff779ee219d7be0549c971d6ba2311d5');
  request.setRequestHeader('Content-Type', 'application/json');
  request.setRequestHeader('Accept', 'application/json');
  request.send();
}

MapsApp.prototype = Object.create(MapActions.prototype);
MapsApp.prototype.constructor = MapsApp;
MapsApp.prototype.init = init;

MapsApp.prototype.initLayerIcons = _initLayerIcons;
MapsApp.prototype.initMapsApp = _initMapsApp;

module.exports = new MapsApp();
