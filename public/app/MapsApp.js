var viewTransitions = require('./viewTransitions');
var roomSearch = require('./roomSearch');
var htmlGen = require('./htmlGenerators.js');
var VisualMap = require('./VisualMap.js');

var MEETING_ROOMS = "Meeting Spaces";

var MapsApp = function() {
  VisualMap.call(this);
  this.lastLocation = null;
  this.lastTouchedPin = null;
  this.cmsUrl = null;
  this.meetingRoomLayerId = null;
  this.mapsPayload = null;
  this.nearbyMapsPayload = null;
};

function _setupEventHandlers(mapsPayload) {
  var that = this;
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
        viewTransitions.closeAmenitiesModal();
      });

      $('.cancel-meeting-room').on('tap click', function(event) {
        viewTransitions.revertSearchDisplay();
      });

      $('#btn_amenities').on('click tap', function(event) {
        that.closeFloatingMenu();
        viewTransitions.toggleAmenitiesModal();
      });

      $('body').on('click tap', function(event) {
        if ($('.filter').css('display') !== 'none') {
          event.stopPropagation();
          viewTransitions.closeAmenitiesModal();
        }
      });

      $('.filter').on('click tap', function(event) {
        if ($('.filter').css('display') !== 'none') {
          event.stopPropagation();
          viewTransitions.closeAmenitiesModal();
        }
      });

      $('#btn_search').on('click tap', viewTransitions.transitionToSearch);

      $('.cancel-search, .active-search-bar-container div:last-child').on('click tap', function() {
        if ($('.dark-table').css('display') !== 'none') {
          viewTransitions.transitionFromMeetingRoomSearch.call(that);
          that.hidePinsOf(that.meetingRoomLayerId);
        } else {
          viewTransitions.revertSearchDisplay();
          roomSearch.searchTable();
        }
      });

      $('.app').on('click tap', function() {
        that.closeFloatingMenu();
      });

      $('#floatingmenu').on('click tap', function(event) {
        event.stopPropagation();
      });

      $('.nearby-btn').on('click tap', function() {
        that.inNearbyMaps = true;
        viewTransitions.transitionToNearbyView();
        var nearby = that.extractNearbyPayload(_extractHashComponents());
        that.drawNearbyView(nearby);
      });

      $('#active_search_input').on('input', function() {
        viewTransitions.revertSearchDisplay();
        roomSearch.searchTable();
      });

      $('.layer_name img').on('click tap', function() {
        that.closeFloatingMenu();
      });
  });
}

function _extractNearbyPayload(config) {
  var nearbyMapsPayload = this.nearbyMapsPayload;
  var currentBuildingId = config.location;
  var allBuildings = nearbyMapsPayload.building_data;

  for (var i = 0; i < allBuildings.length; i++) {
    var building = allBuildings[i];
    if (building.Id === currentBuildingId) { /* Case: we've found the building that corresponds to our given Id, return it */
      return building;
    }
  }
  return false;
}

function updateSelectionHash() {
  var selectedFloor = $('#floor_select option').not(function(){
    return !this.selected;
  });
  var selectedLocation = $('#location_select option').not(function(){
    return !this.selected;
  });
  document.location.href = '#' + selectedLocation.data('buildingid') + "." + $(selectedFloor).data('floorid') || 0;
}

function _setAmenitiesButtonTo(categoryId) {
  var that = this;
  /* Always clear any existing amenities button icon before displaying a new one */
  $('#btn_amenities .curr-amen-icon').remove();
  if (categoryId) { /* Case: We're showing an amenity category */
    $('#btn_amenities').addClass('showing-amenities');
    $('#btn_amenities').removeClass('no-amenities');
    $('#btn_amenities .icon').hide();
    $('#btn_amenities').prepend($(that.layerIcons[categoryId]).clone().addClass('curr-amen-icon'));
  } else { /* Case: We're not showing an amenity categories */
    $('#btn_amenities').addClass('no-amenities');
    $('#btn_amenities').removeClass('showing-amenities');
    $('#btn_amenities .icon').show();
  }
}

/* Loops through all the pins for a given floor.
 If any pin matches the given layer, return true indicating that we should give
 that amenity option.
 Else return false, indicating that that layer/amenity button should not be constructed
 */
function floorHasThisLayer(floorPins, layer) {
  for (var i = 0; i < floorPins.length; i++) {
    var pin = floorPins[i];
    if (pin.LayerId === layer.Id) { /* Case: the current floor has a pin corresponding to the given amenity/layer , return true */
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

function _initNearbyLayerIcons(nearbyMapsPayload) {
  var layers = nearbyMapsPayload.layers;
  var that = this;
  $.each(layers, function(i, layer) {
    that.nearbyLayerIcons[layer.Id] = new Image();
    that.nearbyLayerIcons[layer.Id].src = layer.Icon;
  });
}

/*
  Constructs the location/building selector used after app init,
  and the initial modal presented to the user that allows them to select their location
*/
function buildLocationSelect(mapsPayload) {
  var buildingData = mapsPayload.building_data;
  var buildingSelect = $('#location_select');
  var buildingSelectModal = $('.building-modal');
  $.each(buildingData, function(i, building) {
    var selectOption = $(htmlGen.buildLocationOption(building));
    buildingSelect.append(selectOption);
    var modalDiv = htmlGen.buildLocationDiv(building);
    modalDiv.on('tap click', function() {
      buildingSelect.val((selectOption.val())).change();
      $('.building-modal-background').hide();
    });
    buildingSelectModal.append(modalDiv);
  });
}

/*
  Constructs the floor select options extracted from the given floor data
*/
function buildFloorSelect(floorData) {
  var floorSelect = $('#floor_select');
  $.each(floorData, function(i, floor) {
      floorSelect.append(htmlGen.buildFloorOption(floor));
  });
}

function _openFloatingMenu() {
  viewTransitions.openFloatingMenu();
  if (this.inNearbyMaps) { // Case: if we are within the "nearby" view and we're closing out of an information modal, make sure we end within the scrollable map bounds
    this.backgroundLayer.setDraggable(false);
  }
}

function _closeFloatingMenu() {
  viewTransitions.closeFloatingMenu();
  this.clearLastTouchedPin();
  if (this.inNearbyMaps) { // Case: if we are within the "nearby" view and we're closing out of an information modal, make sure we end within the scrollable map bounds
    this.animateToWithinMapBounds();
    this.backgroundLayer.setDraggable(true);
  }

}

function _extractHashComponents() {
  var hash = location.hash.replace('#','');
  var parts = hash.split('.');

  return {
    location: Number(parts[0]),
    floor: (parts[1] == undefined ? 0 : Number(parts[1]))
  };
}

function _initMapsApp(mapsPayload) {
  var that = this;
  $(window).on('hashchange',function() {
    var payload = mapsPayload;

    var config = _extractHashComponents();

    if(!config.location) { /* Case: we haven't been able to determine what location the visitor is in today, so ask them for app initialization */
      $('.building-modal-background').show();
      $('#map, .buttons').hide();
    } else if (that.inNearbyMaps) {
      var nearby = that.extractNearbyPayload(_extractHashComponents());
      that.setAmenitiesButtonTo(null);
      that.drawNearbyView(nearby);
    } else {
      /* Update the values for our location and floor select to match
       the given hash value */
      $('#map, .buttons').show();
      $('#location_select').val(config.location);
      $('#floor_select').val(config.floor);

      var locationFloorData = getFloorDataFromLocation(mapsPayload.building_data, config.location);
      if (!locationFloorData) throw new Error('In initMap. Could not find location in mapsPayload corresponding to given Id. Given Id: ' + config.location);
      if (that.lastLocation !== config.location) { /* Case: our location has changed, so clear all floor data and build the floor data for the new location */
        viewTransitions.clearFloorOptions();
        buildFloorSelect(locationFloorData);
        $('#floor_select').trigger('change');
      }
      that.lastLocation = config.location;
      var scaleX = 0;
      var scaleY = 0;
      that.setAmenitiesButtonTo(null);
      viewTransitions.closeAllModals();

      $.each(locationFloorData, function(i, floor) {
        var payload = mapsPayload;
        if(floor.Id === config.floor) {
          that.drawMapForFloor(floor, mapsPayload);
          /* TODO: this controls drawing a given pin. Should be re-enabled ultimately to
              handle the case of the maps app being called with a given meeting room

          if (pinData.Id === config.pin) {
              pin.show();
              $('.layer_name div').html(pinData.Layer.Name);
              $('.panel_body').html(pinData.Body);
              $('#floatingmenu').addClass('open');
          }
          */
        }
      });
    }
  }).trigger('hashchange');
}

function _buildLayersModalForFloor(layers, floorPins) {
  var category_list = $('.category_list');
  var that = this;
  $('.category_list li').remove(); /* Since we're changing floors, or init'ing the app, clear all previous amenity buttons */

  $.each(layers, function(i, layer) {
    if (layer.Name === MEETING_ROOMS) {
      that.meetingRoomLayerId = layer.Id;
      return; /* Do not add meeting rooms to the amenity selections. These are accessed exclusively through search */
    }
    if (floorHasThisLayer(floorPins, layer)) { /* Case: this floor has a pin corresponding to the given/layer amenity, build that layer button */
      category_list.append(htmlGen.buildLayerIcon(layer));
    }
  });

  /* Initialize click handlers for category buttons */
  $('.category').on('click tap', function(event) {
    event.stopPropagation();
    if ($(this).parent().hasClass('on')) { /* Case: we're turning off all amenities */
      $(this).parent().removeClass('on');
      var categoryId = $(this).data('categoryid');
      that.hidePinsOf(categoryId);
      that.setAmenitiesButtonTo(null); /* Clear the amenities button */
    } else { /* Case: we're turning on an amenties category that wasn't on previously. Clear the map and amenities state, and apply the new amenities filter */
      $('.category').parent().removeClass('on');
      that.hideAllPins();
      $(this).parent().addClass('on');
      var categoryId = $(this).data('categoryid');
      that.showPinsOf(categoryId);
      that.setAmenitiesButtonTo(categoryId);
    }
  });
}

/* Loop through all available locations and return
 the one that corresponds to the given Id.
 Returns false if we couldn't find the the location given */
function getFloorDataFromLocation(locationData, locationId) {
  for (var i = 0; i < locationData.length; i++) {
    var location = locationData[i];
    if (location.Id === locationId) { /* Case: we've found the building that corresponds to our given Id, return it */
      return location.Floor;
    }
  }
  return false;
}

function _retrieveNearbyMaps() {
  var request = new XMLHttpRequest();
  var that = this;
  request.addEventListener("load", function() {
    var nearbyMapsPayload = JSON.parse(this.responseText);
    that.nearbyMapsPayload = nearbyMapsPayload;
    that.initNearbyLayerIcons(nearbyMapsPayload);
  });
  //request.open("GET", cmsUrl + "/api/map/nearby");
  request.open("GET", 'https://7e899108.ngrok.io/getMapsNearby');
  request.setRequestHeader('Authorization', 'Bearer ff779ee219d7be0549c971d6ba2311d5');
  request.send();
}

function init(cmsUrl, givenHash) {
  this.cmsUrl = cmsUrl;
  var request = new XMLHttpRequest();
  var that = this;
  request.addEventListener("load", function() {
    var mapsPayload = JSON.parse(this.responseText);
    that.mapsPayload = mapsPayload;
    that.initLayerIcons(mapsPayload);
    buildLocationSelect(mapsPayload);
    that.setupEventHandlers(mapsPayload);
    that.initMapsApp(mapsPayload);
  });
  if (givenHash) {
    document.location.hash = givenHash;
  }
  //request.open("GET", cmsUrl + "/api/map");
  request.open("GET", 'https://7e899108.ngrok.io/getMaps');
  request.setRequestHeader('Authorization', 'Bearer ff779ee219d7be0549c971d6ba2311d5');
  request.send();
  this.retrieveNearbyMaps();
}

MapsApp.prototype = Object.create(VisualMap.prototype);
MapsApp.prototype.constructor = MapsApp;
MapsApp.prototype.init = init;
MapsApp.prototype.initLayerIcons = _initLayerIcons;
MapsApp.prototype.initMapsApp = _initMapsApp;
MapsApp.prototype.setupEventHandlers = _setupEventHandlers;
MapsApp.prototype.closeFloatingMenu = _closeFloatingMenu;
MapsApp.prototype.openFloatingMenu = _openFloatingMenu;
MapsApp.prototype.buildLayersModalForFloor = _buildLayersModalForFloor;
MapsApp.prototype.setAmenitiesButtonTo = _setAmenitiesButtonTo;
MapsApp.prototype.extractNearbyPayload = _extractNearbyPayload;
MapsApp.prototype.retrieveNearbyMaps = _retrieveNearbyMaps;
MapsApp.prototype.initNearbyLayerIcons = _initNearbyLayerIcons;

module.exports = new MapsApp();
