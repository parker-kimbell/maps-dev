var VisualMap = require('./VisualMap.js');
var roomSearch = require('./roomSearch.js');

function MapActions(stage) {
  VisualMap.call(this);
  this.layerIcons = {};
}

function _clearFloorOptions() {
  $('#floor_select option').remove();
}

function buildFloorOption(floor) {
  return $([
    "<option value=" + floor.Id + " data-locationid=" + floor.LocationId + " data-floorid=" + floor.Id + ">" + floor.Name,
    "</option>"
  ].join("\n"));
}

function _buildFloorSelect(floorData) {
  // TODO: Again for this code, it looks like the location is already known, so I've backed in the Brisbane
  // floor, but it will need to be derived at run-time, ultimately
  var floorSelect = $('#floor_select');
  $.each(floorData, function(i, floor) {
      floorSelect.append(buildFloorOption(floor));
  });
}

function closeAmenitiesModal() {
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
  closeAmenitiesModal();
}

function _hideMapStage() {
  $('.buttons').css('visibility', 'hidden');
  $('#map').css('visibility', 'hidden');
}

function showMapAndButtonStage() {
  $('.buttons').css('visibility', 'visible');
  $('#map').css('visibility', 'visible');
}

function prepareForMeetingRoomDisplay() {
  $('#map').css('visibility', 'visible');
  // hideAndClearSearch();
  // $('.cancel-search div').toggle({ effect: "scale", direction: "vertical" });
  setAmenitiesButtonTo(null);
  $('.dark-table').hide();
}

function hideAndClearSearch() {
  $('.active-search-container').hide();
  $('#active_search_input').val("");
  roomSearch.searchTable(); // Revert data table to initial state
  $('.dark-table').show();
}

// Reveals the meeting room search bar.
function showAndFocusSearch() {
  $('.active-search-container').show();
  $('#active_search_input').focus();
}

function transitionOutOfMeetingRoomSearch() {
  _closeAllModals();
  this.hideAllPins();
  showMapAndButtonStage();
  hideAndClearSearch();
}


function _closeFloatingMenu() {
  $('#floatingmenu').removeClass('open');
  // TODO : renable this. Disabled while considering how to handlers
  // the state of it
  //this.clearLastTouchedPin();
}

MapActions.prototype = Object.create(VisualMap.prototype);
MapActions.closeFloatingMenu = _closeFloatingMenu;
MapActions.hideMapStage = _hideMapStage;
MapActions.closeAllModals = _closeAllModals;
MapActions.clearFloorOptions = _clearFloorOptions;
MapActions.buildFloorSelect = _buildFloorSelect;
module.exports = MapActions;
