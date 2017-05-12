(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var viewTransitions = require('./viewTransitions');
var roomSearch = require('./roomSearch');
var htmlGen = require('./htmlGenerators.js');
var VisualMap = require('./VisualMap.js');

var MEETING_ROOMS = "Meeting Spaces";
var ELEVATORS = "Elevators";

var MapsApp = function() {
  VisualMap.call(this);
  this.lastLocation = null;
  this.lastTouchedPin = null;
  this.cmsUrl = null;
  this.elevatorsLayerId = null;
  this.meetingRoomLayerId = null;
}

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
          viewTransitions.closeAmenitiesModal();
        }
      });

      $('.filter').on('click tap', function(event) {
        if ($('.filter').is(':visible')) {
          event.stopPropagation();
          viewTransitions.closeAmenitiesModal();
        }
      });

      $('#btn_search').on('click tap', viewTransitions.transitionToSearch);

      $('.cancel-search, .active-search-bar-container div:last-child').on('click tap', function() {
        if ($('.dark-table').is(':visible')) {
          viewTransitions.transitionFromMeetingRoomSearch.call(that);
          that.hidePinsOf(that.meetingRoomLayerId);
        } else {
          viewTransitions.revertSearchDisplay();
          roomSearch.searchTable();
        }
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

function updateSelectionHash() {
  var selectedFloor = $("#floor_select option:selected");
  var selectedLocation = $("#location_select option:selected");
  document.location.href = '#' + selectedLocation.data('buildingid') + "." + $(selectedFloor).data('floorid');
}

function _setAmenitiesButtonTo(categoryId) {
  var that = this;
  // Always clear any existing amenities button icon before displaying a new one
  $('#btn_amenities .curr-amen-icon').remove();
  if (categoryId) { // Case: We're showing an amenity category
    $('#btn_amenities').addClass('showing-amenities');
    $('#btn_amenities').removeClass('no-amenities');
    $('#btn_amenities .icon').hide();
    $('#btn_amenities').prepend($(that.layerIcons[categoryId]).clone().addClass('curr-amen-icon'));
  } else { // Case: We're not showing an amenity categories
    $('#btn_amenities').addClass('no-amenities');
    $('#btn_amenities').removeClass('showing-amenities');
    $('#btn_amenities .icon').show();
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

function buildFloorSelect(floorData) {
  // TODO: Again for this code, it looks like the location is already known, so I've backed in the Brisbane
  // floor, but it will need to be derived at run-time, ultimately
  var floorSelect = $('#floor_select');
  $.each(floorData, function(i, floor) {
      floorSelect.append(htmlGen.buildFloorOption(floor));
  });
}

function _closeFloatingMenu() {
  viewTransitions.closeFloatingMenu();
  this.clearLastTouchedPin();
}

function _initMapsApp(mapsPayload) {
  var that = this;
  $(window).on('hashchange',function() {
    var payload = mapsPayload;

    var hash = location.hash.replace('#','');
    var parts = hash.split('.');

    var config = {
      location: Number(parts[0]),
      floor: (parts[1] == undefined ? 0 : Number(parts[1]))
    };
    if(!config.location) { // Case: we haven't been able to determine what location the visitor is in today, so ask them for app initialization
      $('.building-modal-background').show();
    } else {
      // Update the values for our location and floor select to match
      // the given hash value
      $('#location_select').val(config.location);
      $('#floor_select').val(config.floor);

      var locationFloorData = getFloorDataFromLocation(mapsPayload.building_data, config.location)
      if (!locationFloorData) throw new Error('In initMap. Could not find location in mapsPayload corresponding to given Id. Given Id: ' + config.location);
      if (that.lastLocation !== config.location) { // Case: our location has changed, so clear all floor data and build the floor data for the new location
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
          */
          // if (pinData.Id === config.pin) {
          //     pin.show();
          //     $('.layer_name div').html(pinData.Layer.Name);
          //     $('.panel_body').html(pinData.Body);
          //     $('#floatingmenu').addClass('open');
          // }
        }
      }); // end $.each floorData
    }
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
      that.setAmenitiesButtonTo(null); // Clear the amenities button
    } else { // Case: we're turning on an amenties category that wasn't on previously. Clear the map and amenities state, and apply the new amenities filter
      $('.category').parent().removeClass('on');
      that.hideAllPins();
      $(this).parent().addClass('on');
      var categoryId = $(this).data('categoryid');
      that.showPinsOf(categoryId);
      that.setAmenitiesButtonTo(categoryId);
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

function init(cmsUrl, givenHash) {
  this.cmsUrl = cmsUrl;
  var request = new XMLHttpRequest();
  var that = this;
  request.addEventListener("load", function() {
    var mapsPayload = JSON.parse(this.responseText);
    that.initLayerIcons(mapsPayload);
    buildLocationSelect(mapsPayload);
    that.setupEventHandlers(mapsPayload);
    that.initMapsApp(mapsPayload);
    $('#map, .buttons').show();
  });

  if (givenHash) {
    document.location.hash = givenHash;
  }
  //request.open("GET", cmsUrl + "/api/map");
  request.open("GET", 'https://e9affc90.ngrok.io/getMaps');
  request.setRequestHeader('Authorization', 'Bearer ff779ee219d7be0549c971d6ba2311d5');
  request.setRequestHeader('Content-Type', 'application/json');
  request.setRequestHeader('Accept', 'application/json');
  request.send();
}

MapsApp.prototype = Object.create(VisualMap.prototype);
MapsApp.prototype.constructor = MapsApp;
MapsApp.prototype.init = init;
MapsApp.prototype.initLayerIcons = _initLayerIcons;
MapsApp.prototype.initMapsApp = _initMapsApp;
MapsApp.prototype.setupEventHandlers = _setupEventHandlers;
MapsApp.prototype.closeFloatingMenu = _closeFloatingMenu;
MapsApp.prototype.buildLayersModalForFloor = _buildLayersModalForFloor;
MapsApp.prototype.setAmenitiesButtonTo = _setAmenitiesButtonTo;

module.exports = new MapsApp();

},{"./VisualMap.js":2,"./htmlGenerators.js":3,"./roomSearch":5,"./viewTransitions":6}],2:[function(require,module,exports){
var viewTransitions = require('./viewTransitions');

function VisualMap() {
  this.stage = null;
  this.pinLayer = null;
  this.backgroundLayer = null;
  this.layerIcons = {};
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

function _clearLastTouchedPin() {
  if (this.lastTouchedPin && this.backgroundLayer) { // Clear the highlighted appearance of the last touched pin
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
  // Clear any existing search data, as we'll be creating
  // new content for this floor
  var searchTable = $('.dark-table tbody');
  searchTable.children().remove();

  scaleX = width/floor.FloorImage.width;
  scaleY = scaleX;

  this.stage = new Konva.Stage({
    container: 'map',   // id of container <div id="#map">
    width: window.innerWidth,
    height: height
  });
  this.backgroundLayer = new Konva.Layer();
  this.pinLayer = new Konva.Layer();
  this.buildLayersModalForFloor(mapsPayload.layers, floor.Pin);

  var base = new Konva.Image({
      x: canvasPositionX,
      y: 0,
      width: floor.FloorImage.width*scaleX,
      height: floor.FloorImage.height*scaleY,
      stroke: 0
  });

  this.backgroundLayer.add(base);
  var imageObj = new Image();
  var that = this;

  // Obtain the current floor's image
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
      x: ((floor.FloorImage.width * scaleX)* pinData.PositionX) - offsetXImage + canvasPositionX,
      y: ((floor.FloorImage.height * scaleY)* pinData.PositionY) - offsetYImage,
      image: that.layerIcons[pinData.LayerId],
      scaleX : fontSize / 90,
      scaleY : fontSize / 90,
      icon : true
    });

    var offsetXPin = fontSize - (fontSize * 0.55);
    var offsetYPin = fontSize - (fontSize * 0.3);
    var pin = new Konva.Text({
        x: ((floor.FloorImage.width * scaleX)* pinData.PositionX) - offsetXPin + canvasPositionX,
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

    // Expose the pin data and highlight the pin on pin tap,
    // Also de-highlight the last pin
    pin.on('tap click', function(e) {
      var touchedPin = e.target;
      if (that.lastTouchedPin) that.lastTouchedPin.strokeEnabled(false);
      touchedPin.strokeEnabled(true);
      touchedPin.moveToTop();
      pinIcon.moveToTop();
      that.lastTouchedPin = touchedPin;
      that.backgroundLayer.draw();
      $('.layer_name div').html(pinData.Title + "text text text text text text text text text text text text text  text text text text text tex");
      $('.panel_body').html(pinData.Body + "text text text text text text text text text text text text text  t text text text text text  text text tex t text text text text text  text text tex  text text text text text text text text text text text text text text text text text text text text text text text text text ");
      $('#floatingmenu').addClass('open');
    });
    // Add this new pin to the Konva pinGroup, so that we can place them as one action
    pinGroup.add(pin);

    that.backgroundLayer.add(pin);
    that.backgroundLayer.add(pinIcon);
  }); // End pin each

  // close the panel if the map is tapped
  that.stage.on('tap click', function(e) {

      var node = e.target;
      if(node.className === 'Image' && !node.attrs.icon) {
          that.closeFloatingMenu();
      }

  });
  // TODO: don't think this pinLayer is getting added, daz prolly a bug
  that.pinLayer.add(pinGroup);

  that.stage.add(that.backgroundLayer);

  // Hide the pin by default
  //TODO: re-enable this,
  //hideAllPins();
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
    if (p.attrs.layerid === that.elevatorsLayerId) { // Case: we're dealing with an elevator pin. Elevator pins are always on so skip them;
      return;
    }
    p.hide();
    p.attrs.pinIcon.hide();
  });
  this.stage.draw();
}

VisualMap.prototype.hideAllPins = _hideAllPins;
VisualMap.prototype.hidePinsOf = _hidePinsOf;
VisualMap.prototype.showPinsOf = _showPinsOf;
VisualMap.prototype.clearLastTouchedPin = _clearLastTouchedPin;
VisualMap.prototype.drawMapForFloor = _drawMapForFloor;

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
}

},{}],4:[function(require,module,exports){
var MapsApp = require('./MapsApp.js');
// TODO: this will be the entry point for the app,
// inject JavaScript with the CMS URL and go
document.__MapsApp = MapsApp;
MapsApp.init("https://pwc.downstreamlabs.com", "#null.10");

},{"./MapsApp.js":1}],5:[function(require,module,exports){

// Handles informing the user that their meeting room search has filtered out all results.
function checkAndHandleNoResults() {
  var visibleRows = getVisibleRows();
  var firstVisibleRow = visibleRows[0];
  if (!firstVisibleRow) { // Case: we have no visible cells. Display that there are no valid results
    $('.dark-table').prepend("<tr id='no_results'><td>No results</td></tr>")
  } else if (visibleRows.length > 1) {
    $('#no_results').remove();
  } // else do nothing
}

function searchTable() {
  filteredSearch();
  applyPaddingFirstChild();
  removeBorderLastChild();
  checkAndHandleNoResults();
}

function getVisibleRows() {
  return $('.dark-table tr').filter(function() {
    return $(this).css('display') !== 'none';
  });
}

function applyPaddingFirstChild() {
  var visibleRows = getVisibleRows();
  $.each(visibleRows, function(i, row) {
    if (i === 0) { // We're viewing the first visible row
      $(row).find('td').css('padding-top', '20px');
    } else { // Otherwise we're not the first row, so set the padding top to default
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
}

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
  $('.dark-table').hide();
  $('.active-search-bar-container div:last-child').hide();
}

function _hideAndClearSearch() {
  $('.active-search-container').hide();
  $('#active_search_input').val("");
  roomSearch.searchTable(); // Revert data table to initial state
  $('.dark-table').show();
}

// Hide the single pin map and reveal the
function _revertSearchDisplay() {
  $('#map').css('visibility', 'hidden');
  $('.dark-table').show();
  $('.active-search-bar-container div:last-child').show();
  _closeFloatingMenu();
}

// Reveals the meeting room search bar.
function _showAndFocusSearch() {
  $('.active-search-container').show();
  $('#active_search_input').focus();
}

function _transitionFromMeetingRoomSearch() {
  _closeAllModals();
  _showMapAndButtonStage();
  _hideAndClearSearch();
}

function _transitionToSearch() {
  _closeAllModals();
  _hideMapStage();
  _showAndFocusSearch();
}

function _closeFloatingMenu() {
  $('#floatingmenu').removeClass('open');
}


module.exports = {
  closeFloatingMenu : _closeFloatingMenu,
  hideMapStage : _hideMapStage,
  closeAllModals : _closeAllModals,
  clearFloorOptions : _clearFloorOptions,
  closeAmenitiesModal : _closeAmenitiesModal,
  transitionToSearch : _transitionToSearch,
  transitionFromMeetingRoomSearch : _transitionFromMeetingRoomSearch,
  revertSearchDisplay : _revertSearchDisplay,
  prepareForMeetingRoomDisplay : _prepareForMeetingRoomDisplay
}

},{"./htmlGenerators.js":3,"./roomSearch.js":5}]},{},[1,2,3,4,5,6]);
