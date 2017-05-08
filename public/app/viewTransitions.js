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
  _closeFloatingMenu();
}

// Reveals the meeting room search bar.
function _showAndFocusSearch() {
  $('.active-search-container').show();
  $('#active_search_input').focus();
}

function _transitionFromMeetingRoomSearch() {
  _closeAllModals();
  this.hideAllPins();
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
