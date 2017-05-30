(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./VisualMap.js":2,"./htmlGenerators.js":3,"./roomSearch":5,"./viewTransitions":6}],2:[function(require,module,exports){
var viewTransitions = require('./viewTransitions');

/* Nearby viewport takes up .78 of the vertical viewport */
var VERTICAL_VIEWPORT_SCALE = 0.78;

function VisualMap() {
  this.stage = null;
  this.backgroundLayer = null;
  this.layerIcons = {};
  this.nearbyLayerIcons = {};
  this.inNearbyMaps = false;
  this.getNearbyBounds = null;
}

function _clearLastTouchedPin() {
  if (this.lastTouchedPin && this.backgroundLayer) { /* Clear the highlighted appearance of the last touched pin */
    this.lastTouchedPin.strokeEnabled(false);
    this.backgroundLayer.draw();
    this.lastTouchedPin = null;
  }
}

function _drawMapForFloor(floor, mapsPayload) {
  var width = window.innerWidth * .9;
  var height = window.innerHeight - $('.buttons').height();
  $('#map').empty();
  var canvasPositionX = window.innerWidth * .05;
  var canvasPositionY = window.innerHeight * .055;
  /*
    Clear any existing search data, as we'll be creating
    new content for this floor
  */
  var searchTable = $('.dark-table tbody');
  searchTable.children().remove();

  scaleX = width/floor.FloorImage.width;
  scaleY = scaleX;

  this.stage = new Konva.Stage({
    container: 'map',   /* id of container <div id="#map"> */
    width: window.innerWidth,
    height: height
  });
  this.backgroundLayer = new Konva.Layer();
  this.buildLayersModalForFloor(mapsPayload.layers, floor.Pin);

  var base = new Konva.Image({
      x: canvasPositionX,
      y: canvasPositionY,
      width: floor.FloorImage.width*scaleX,
      height: floor.FloorImage.height*scaleY,
      stroke: 0
  });

  this.backgroundLayer.add(base);
  var imageObj = new Image();
  var that = this;

  /* Obtain the current floor's image */
  imageObj.onload = function() {
    base.image(imageObj);
    that.backgroundLayer.draw();
  };
  imageObj.src = that.cmsUrl + floor.FloorImage.image;

  /* Loop through each pin that has been placed on the floor,
     and places it in the appropriate spot on the floor map,
     hiding each pin by default
  */
  $.each(floor.Pin, function(i,pinData) {
    /* Build the pin icon that we'll place on the Konva layer

     These offset/scaling calculations try to scale the position of the icon based on its size, this will also be related to the original icon used, in this case \uf041
     INCREASING / DECREASING ICON SIZE? Try just changing the fontSize value
    */
    var fontSize = 40;

    var offsetXImage = fontSize - (fontSize * 0.66);
    var offsetYImage = fontSize - (fontSize * 0.08);

    var pinIcon = new Konva.Image({
      x: ((floor.FloorImage.width * scaleX)* pinData.PositionX) - offsetXImage + canvasPositionX,
      y: ((floor.FloorImage.height * scaleY)* pinData.PositionY) - offsetYImage + canvasPositionY,
      image: that.layerIcons[pinData.LayerId],
      scaleX : fontSize / 90,
      scaleY : fontSize / 90,
      icon : true
    });

    var offsetXPin = fontSize - (fontSize * 0.60);
    var offsetYPin = fontSize - (fontSize * 0.02);
    var pin = new Konva.Text({
        x: ((floor.FloorImage.width * scaleX)* pinData.PositionX) - offsetXPin + canvasPositionX,
        y: ((floor.FloorImage.height * scaleY)* pinData.PositionY) - offsetYPin + canvasPositionY,
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
        that.hideAllPins();
        pin.show();
        pinIcon.show();
        $('#active_search_input').val(pinData.Title);
        viewTransitions.prepareForMeetingRoomDisplay();
        that.setAmenitiesButtonTo(null);
        pin.fire('tap');
      });
    }

    pinIcon.on('tap click', function(event) {
      event.evt.stopPropagation();
      pin.fire(event.type, pin);
    });

    /* Expose the pin data and highlight the pin on pin tap,
     Also de-highlight the last pin */
    pin.on('tap click', function(e) {
      var touchedPin = e.target;
      if (that.lastTouchedPin) that.lastTouchedPin.strokeEnabled(false);
      touchedPin.strokeEnabled(true);
      touchedPin.moveToTop();
      pinIcon.moveToTop();
      that.lastTouchedPin = touchedPin;
      that.backgroundLayer.draw();
      that.openFloatingMenu();
      $('.layer_name div').html(pinData.Title);
      $('.panel_body').html(pinData.Body);
      $('#floatingmenu').addClass('open');
      $('#floor_select').blur();
      $('#location_select').blur();
    });
    /* Add this new pin to the Konva pinGroup, so that we can place them as one action */
    that.backgroundLayer.add(pin);
    that.backgroundLayer.add(pinIcon);
  }); /* End pin each */
  /* close the panel if the map is tapped */
  that.stage.on('tap click', function(e) {

      var node = e.target;
      if(node.className === 'Image' && !node.attrs.icon) {
          that.closeFloatingMenu();
      }

  });

  this.stage.add(that.backgroundLayer);

  /* Hide pins by default */
  // this.hideAllPins();
}

function _showPinsOf(category) {
  var allpins = this.stage.find('Text');
  allpins.each(function(p) {
    if(p.attrs.layerid === category) {
        p.show();
        p.attrs.pinIcon.show();
    }
  });
  this.stage.draw();
}

function _hidePinsOf(category) {
  var allpins = this.stage.find('Text');
  allpins.each(function(p) {
      if(p.attrs.layerid === category) {
        p.hide();
        p.attrs.pinIcon.hide();
      }
  });
  this.stage.draw();
}

function _hideAllPins() {
  var that = this;
  var allpins = this.stage.find('Text');
  allpins.each(function(p) {
    p.hide();
    p.attrs.pinIcon.hide();
  });
  this.stage.draw();
}

var lastDist = 0;
var startScale = 1;
function getDistance(p1, p2) {
    return Math.sqrt(Math.pow((p2.x - p1.x), 2) + Math.pow((p2.y - p1.y), 2));
}


/*
  Returns the function used to control the scroll area for the current map image
*/
function _generateNearbyBoundFunc(mapImageWidth, mapImageHeight, offsetXPin, offsetYPin) {

  var nearbyViewportWidth = window.innerWidth;
  /*
    Explanation for:
    nearbyViewportHeight = window.innerHeight * .78;

    Because our nearby viewport needs to accomodate the height
    of the user menu at the top of the screen,
    our styles for #container set the "top" value for the #container element
    at 22%, thus, to compute our actual viewport height,
    1.00 - .22 = .78 (the magic number on the next line),
    and .78, being the actual percentage height our viewport takes up,
    when multiplied by the total viewport height will give us our
    viewport height.
  */
  var nearbyViewportHeight = window.innerHeight * VERTICAL_VIEWPORT_SCALE;

  return function(pos) {
    if ($('#floatingmenu').hasClass('open')) { // Case: we are viewing pin information, allow scrolling to wherever
      return {
        x : pos.x,
        y : pos.y
      };
    } else { // Case: we are viewing pin information, allow scrolling to wherever
      var currY = pos.y;
      var currX = pos.x;

      var newY;
      var newX;
      /*
        Explanation for
          mapImageHeight - nearbyViewportHeight
        and
          mapImageWidth - nearbyViewportWidth

        tl;dr
          mapImageWidth - nearbyViewportWidth === the width dims of the map that renders offscreen
          mapImageHeight - nearbyViewportHeight === the height dims of the map that renders offscreen

        The intent of this bounding function is to only allow the user to scroll
        within the bounds of the image.

        Because our viewport dimensions are dynamic per device, we compute then subtract those dimensions
        from the raw image height and width, giving us the remaining amount of map that renders
        offscreen. The user is then not allowed to scroll to dimensions that exceed that overflow value.
      */
      if (currY < -(mapImageHeight - nearbyViewportHeight)) { // Case: viewport width exceeds the top most bounds of base map image
        newY = -(mapImageHeight - nearbyViewportHeight);
      } else if (currY > offsetYPin) { // Case: viewport width exceeds the bottom most bounds of base map image
        newY = offsetYPin;
      } else { // Case: Y coordinate is within acceptable bounds of base map image
        newY = currY;
      }

      if (currX < -(mapImageWidth - nearbyViewportWidth)) { // Case: viewport width exceeds the right most bounds of base map image
        newX = -(mapImageWidth - nearbyViewportWidth);
      } else if (currX > offsetXPin) { // Case: viewport width exceeds the left most bounds of base map image
        newX = offsetXPin;
      } else { // Case: X coordinate is within acceptable bounds of base map image
        newX = currX;
      }

      return {
        x: newX,
        y: newY
      };
    }
  }
}

function _drawNearbyView(nearby) {
  var editorConfig = {
    ResourcesWidth: nearby.MapImage.width,
    ResourcesHeight: nearby.MapImage.height
  };

  var contentWidth = 700;
  var contentHeight = 700;

  var scaleX = contentWidth/editorConfig.ResourcesWidth;
  var scaleY = contentHeight/editorConfig.ResourcesHeight;
  // Intialize layout
  var container = document.getElementById("container");
  var content = document.getElementById("content");
  var clientWidth = 0;
  var clientHeight = 0;
  var that = this;

  that.stage = new Konva.Stage({
    container: 'nearby',   // id of container <div>
    width: contentWidth,
    height: contentHeight,
  });

  var mapImageWidth = editorConfig.ResourcesWidth*scaleX;
  var mapImageHeight = editorConfig.ResourcesHeight*scaleY;

  var fontSize = 40;

  var offsetXImage = fontSize - (fontSize * 0.66);
  var offsetYImage = fontSize - (fontSize * 0.08);

  var offsetXPin = fontSize - (fontSize * 0.60);
  var offsetYPin = fontSize - (fontSize * 0.02);

  that.getNearbyBounds = _generateNearbyBoundFunc(mapImageWidth, mapImageHeight, offsetXPin, offsetYPin);
  that.backgroundLayer = new Konva.Layer({
    draggable : true,
    x : 0,
    y : 0,
    dragBoundFunc: that.getNearbyBounds
  });


  var pinLayer = new Konva.Layer();
  var base = new Konva.Image({
      x: 0,
      y: 0,
      width: mapImageWidth,
      height: mapImageHeight,
      stroke: 0,
      listening: true,
  });

  that.backgroundLayer.add(base);

  var imageObj = new Image();

  imageObj.onload = function() {
    base.image(imageObj);
    that.backgroundLayer.draw();
    $('#container').velocity({
      left : '0px',
      right : '0px'
    }, {
      duration : 1250
    });
  };

  imageObj.src = that.cmsUrl + nearby.MapImage.image;

  $.each(nearby.Map.NearbyPin, function(i, pinData) {
    var pinIcon = new Konva.Image({
      x: ((editorConfig.ResourcesWidth * scaleX)* pinData.PositionX) - offsetXImage,
      y: ((editorConfig.ResourcesHeight * scaleY)* pinData.PositionY) - offsetYImage,
      image: that.nearbyLayerIcons[pinData.LayerId],
      scaleX : fontSize / 90,
      scaleY : fontSize / 90,
      icon : true
    });

    var pinX = ((editorConfig.ResourcesWidth * scaleX)* pinData.PositionX) - offsetXPin;
    var pinY = ((editorConfig.ResourcesHeight * scaleY)* pinData.PositionY) - offsetYPin;
    var pin = new Konva.Text({
      x: pinX,
      y: pinY,
      fill: 'rgb(232,66,102)',
      text: '\ue807',
      fontSize: 40,
      stroke : 'white',
      strokeWidth : '3',
      strokeEnabled : false,
      fontFamily: 'pwcmobileappicons',
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOffset: {x : 5, y : 5},
      shadowOpacity: 0.5,
      layerid: pinData.LayerId,
      pinIcon: pinIcon
    });

    pinIcon.on('tap click', function(event) {
      event.evt.stopPropagation();
      pin.fire(event.type, pin);
    });

    pin.on('tap click', function(event) {
      if (event.evt) event.evt.stopPropagation();
      var touchedPin = event.target;
      if (that.lastTouchedPin) {
        that.lastTouchedPin.strokeEnabled(false);
        that.lastTouchedPin.draw(); // Update stroke on last touched pin
        that.lastTouchedPin.attrs.pinIcon.draw();
      }
      that.animateToPin(touchedPin);
      /* Redraw the pin that has been touched to show the user that
        is what they're looking at */
      touchedPin.strokeEnabled(true);
      touchedPin.moveToTop();
      pinIcon.moveToTop();
      that.lastTouchedPin = touchedPin;
      touchedPin.draw();
      touchedPin.attrs.pinIcon.draw();

      /* TODO: figure out what this is doing */
      // $('.layer_name').html(pinData.NearbyLayer.Name);
      $('.layer_name div').html(pinData.Title);
      // $('.panel_body').html(pinData.Body);
      $('.panel_body').html(pinData.Location + "<br/><br/>" + pinData.Body);
      // $('.panel_location').html(pinData.Location);
      that.openFloatingMenu();
    });
    that.backgroundLayer.add(pin);
    that.backgroundLayer.add(pinIcon);
  });

  /* close the panel if the map is tapped */
  that.stage.on('tap click dragmove', function(e) {
      var node = e.target;
      if ((node.className === 'Image' && !node.attrs.icon) || node.nodeType === "Layer") {
          that.closeFloatingMenu();
      }

  });

  that.stage.add(that.backgroundLayer);

  /* setup zoom */
  // that.stage.getContent().addEventListener('touchmove', function(evt) {
  //   var touch1 = evt.touches[0];
  //   var touch2 = evt.touches[1];
  //   if(touch1 && touch2) {
  //      var dist = getDistance({
  //          x: touch1.clientX,
  //          y: touch1.clientY
  //      }, {
  //          x: touch2.clientX,
  //          y: touch2.clientY
  //      });
  //      if(!lastDist) {
  //          lastDist = dist;
  //      }
  //      var scale = that.stage.getScaleX() * dist / lastDist;
  //      that.stage.scaleX(scale);
  //      that.stage.scaleY(scale);
  //      that.stage.draw();
  //      lastDist = dist;
  //   }
  //  }, false);
  //
  // that.stage.getContent().addEventListener('touchend', function() {
  //   lastDist = 0;
  // }, false);
}

/*
  centers a tapped pin in nearby maps view
*/
function _animateToPin(pin) {
  var backgroundLayer = this.backgroundLayer;
  var pinX = pin.getX();
  var pinY = pin.getY();
  var centeredPinX = -pinX + (window.innerWidth / 2);
  var centeredPinY = -pinY + ((window.innerHeight * VERTICAL_VIEWPORT_SCALE) / 3);
  var anim = new Konva.Tween({
    node: this.backgroundLayer,
    x : centeredPinX,
    y : centeredPinY,
    duration : 0.6, // seconds
    easing : Konva.Easings.EaseOut
  });
  anim.play();
}

/*
  sets a nearby map to within legal bounds if set there by centering a pin
*/
function _animateToWithinMapBounds() {
  var legalBounds = this.getNearbyBounds({
    x : this.backgroundLayer.getX(),
    y : this.backgroundLayer.getY()
  });
  var anim = new Konva.Tween({
    node: this.backgroundLayer,
    x : legalBounds.x,
    y : legalBounds.y,
    duration : 0.6, // seconds
    easing : Konva.Easings.EaseOut
  });
  anim.play();
}

VisualMap.prototype.hideAllPins = _hideAllPins;
VisualMap.prototype.hidePinsOf = _hidePinsOf;
VisualMap.prototype.showPinsOf = _showPinsOf;
VisualMap.prototype.clearLastTouchedPin = _clearLastTouchedPin;
VisualMap.prototype.drawMapForFloor = _drawMapForFloor;
VisualMap.prototype.drawNearbyView = _drawNearbyView;
VisualMap.prototype.animateToPin = _animateToPin;
VisualMap.prototype.animateToWithinMapBounds = _animateToWithinMapBounds;


module.exports = VisualMap;

},{"./viewTransitions":6}],3:[function(require,module,exports){
function _buildLayerIcon(layer) {
  return $([
    "<li>",
    "  <div class='category' data-categoryid=" + layer.Id + " style='background: url(" + layer.Icon + ") no-repeat; background-position: 50% 20%; background-size: 70%;'>",
    "  <p>" + layer.Name,
    "  </p>",
    "  </div>",
    "</li>"
  ].join("\n"));
}

function _buildFloorOption(floor) {
  return $([
    "<option value=" + floor.Id + " data-locationid=" + floor.LocationId + " data-floorid=" + floor.Id + ">" + floor.Name,
    "</option>"
  ].join("\n"));
}

function _buildLocationOption(building) {
  return $([
    "<option value=" + building.Id + " data-buildingid=" + building.Id + ">" + building.Name,
    "</option>"
  ].join("\n"));
}

function _buildLocationDiv(building) {
  return $([
    "<div data-buildingid=" + building.Id + ">" + building.Name,
    "</div>"
  ].join("\n"));
}

module.exports = {
  buildLayerIcon : _buildLayerIcon,
  buildFloorOption : _buildFloorOption,
  buildLocationOption : _buildLocationOption,
  buildLocationDiv : _buildLocationDiv
};

},{}],4:[function(require,module,exports){
var MapsApp = require('./MapsApp.js');
document.__MapsApp = MapsApp;
MapsApp.init("https://pwc.downstreamlabs.com", "#1.10");

},{"./MapsApp.js":1}],5:[function(require,module,exports){

/* Handles informing the user that their meeting room search has filtered out all results. */
function checkAndHandleNoResults() {
  var visibleRows = getVisibleRows();
  var firstVisibleRow = visibleRows[0];
  if (!firstVisibleRow) { /* Case: we have no visible cells. Display that there are no valid results */
    $('.dark-table').prepend("<tr id='no_results'><td>No results</td></tr>")
  } else if (visibleRows.length > 1) {
    $('#no_results').remove();
  } /* else do nothing */
}

function searchTable() {
  filteredSearch();
  checkAndHandleNoResults();
  applyPaddingFirstChild();
  removeBorderLastChild();
}

function getVisibleRows() {
  return $('.dark-table tr').filter(function() {
    return $(this).css('display') !== 'none';
  });
}

function applyPaddingFirstChild() {
  var visibleRows = getVisibleRows();
  $.each(visibleRows, function(i, row) {
    if (i === 0) { /* We're viewing the first visible row */
      $(row).find('td').css('padding-top', '20px');
    } else { /* Otherwise we're not the first row, so set the padding top to default */
      $(row).find('td').css('padding-top', '8px');
    }
  });
}

/*
  keeps the border state for the table such that the last visible row never has
  a bottom border
*/
function removeBorderLastChild() {
  var visibleRows = getVisibleRows();
  $.each(visibleRows, function(i, row) {
    if (i !== visibleRows.length - 1) {
      $(row).find('td div').css('border-bottom', '1px solid #979797');
    } else {
      $(row).find('td div').css('border-bottom', 'none');
    }
  });
}

function filteredSearch() {
  var currVal = $('#active_search_input').val().toUpperCase();
  var searchTableCells = $('.dark-table tr td div');

  for (var i = 0; i < searchTableCells.length; i++) {
    var cell = $(searchTableCells[i]);
    if (cell.html().toUpperCase().indexOf(currVal) > -1) {
      cell.closest('tr').show();
    } else {
      cell.closest('tr').hide();
    }
  }
}

module.exports = {
  filteredSearch : filteredSearch,
  searchTable : searchTable
};

},{}],6:[function(require,module,exports){
var roomSearch = require('./roomSearch.js');
var htmlGen = require('./htmlGenerators.js');

function _clearFloorOptions() {
  $('#floor_select option').remove();
}

function _closeAmenitiesModal() {
  $('.amenities-modal-close').hide();
  $('.filter').velocity({
      opacity: 0
  }, {
      display: 'none',
      delay: 0,
      duration: 200
  });
}

function _closeAllModals() {
  _closeFloatingMenu();
  _closeAmenitiesModal();
}

function _hideMapStage() {
  $('.buttons').css('visibility', 'hidden');
  $('#map').css('visibility', 'hidden');
}

function _showMapAndButtonStage() {
  $('.buttons').css('visibility', 'visible');
  $('#map').css('visibility', 'visible');
}

function _prepareForMeetingRoomDisplay() {
  $('#map').css('visibility', 'visible');
  $('.buttons').css('visibility', 'visible');
  _setSelectInactive();
  $('.dark-table').hide();
  $('.active-search-bar-container div:last-child').hide();
  $('.category_list li.on').removeClass('on');
}

function _hideAndClearSearch() {
  $('.active-search-container').hide();
  $('#active_search_input').val("");
  roomSearch.searchTable(); /* Revert data table to initial state */
  $('.dark-table').show();
}

function _toggleAmenitiesModal() {
  if ($('.filter').css('display') === 'none') { /* Case: our amenities menu is not already open. */
    $('.amenities-modal-close').show();
    $('.filter').velocity({
        opacity: 1
    }, {
        display: 'block',
        duration: 200
    });
  }
}

function _setSelectActive() {
  $('#floor_select').removeClass('inactive-dropdown');
  $('#location_select').removeClass('inactive-dropdown');
}

function _setSelectInactive() {
  $('#floor_select').addClass('inactive-dropdown');
  $('#location_select').addClass('inactive-dropdown');
}

/* Hide the single pin map and reveal the */
function _revertSearchDisplay() {
  $('#map').css('visibility', 'hidden');
  $('.buttons').css('visibility', 'hidden');
  $('.dark-table').show();
  $('.active-search-bar-container div:last-child').show();
  _closeFloatingMenu();
}

/* Reveals the meeting room search bar. */
function _showAndFocusSearch() {
  $('.active-search-container').show();
  $('#active_search_input').focus();
}

function _transitionFromMeetingRoomSearch() {
  _closeAllModals();
  _showMapAndButtonStage();
  _hideAndClearSearch();
  _setSelectActive();
}

function _transitionToSearch() {
  _closeAllModals();
  _hideMapStage();
  _showAndFocusSearch();
}

function _closeFloatingMenu() {
  $('#floatingmenu').removeClass('open');
}

function _openFloatingMenu() {
  $('#floatingmenu').addClass('open');
  $('#floor_select').blur();
  $('#location_select').blur();
}

/* Transitions for Nearby */

function _transitionToNearbyView() {
  $('.filter > ul').css('margin-top', '33%');
  $('.layer_name > img').addClass('close-modal-dark-bg');
  _closeAllModals();
  $('#location_select').removeClass('dropdown').addClass('nearby-dropdown');
  $('#floor').css({
    position: 'absolute'
  });
  $('.btn-amenities').css({
    top : '1.5%'
  });
  /* Begin anims */

  var rootDelay = 100;
  /* Move needed components to necessary positions */
  $('#location_select').velocity({
    width: '44%',
    height: '8%',
    top : '12%'
  }, {
    delay : rootDelay
  });
  $('.btn-amenities').velocity({
    top: '12%',
    height: '8%',
  }, {
    delay : rootDelay + 100
  });
  setTimeout(function() {
    $('.nearby-btn').removeClass('nearby-btn').addClass('nearby-btn-cancel');
    $('.nearby-btn-cancel').velocity({
      left : '5%',
      'font-size': '1.2em'
    });
  }, rootDelay + 300);
  setTimeout(function() {
    /* Move unneeded components offscreen */
    $('#floor_select').velocity({
      'margin-left' : "300%",
    }, {
      easing : 'easeInSine',
      duration : 'slow',
    });
    $('#btn_search').velocity({
      'margin-left' : "300%",
    }, {
      easing : 'easeInSine',
      duration : 'slow'
    });
    $('#floor').velocity({
      left: '100%'
    });
  }, rootDelay + 500);
}


module.exports = {
  closeFloatingMenu : _closeFloatingMenu,
  openFloatingMenu : _openFloatingMenu,
  hideMapStage : _hideMapStage,
  closeAllModals : _closeAllModals,
  clearFloorOptions : _clearFloorOptions,
  closeAmenitiesModal : _closeAmenitiesModal,
  transitionToSearch : _transitionToSearch,
  transitionFromMeetingRoomSearch : _transitionFromMeetingRoomSearch,
  revertSearchDisplay : _revertSearchDisplay,
  prepareForMeetingRoomDisplay : _prepareForMeetingRoomDisplay,
  toggleAmenitiesModal : _toggleAmenitiesModal,
  transitionToNearbyView : _transitionToNearbyView
};

},{"./htmlGenerators.js":3,"./roomSearch.js":5}]},{},[1,2,3,4,5,6]);
