var roomSearch = require('./roomSearch.js');
var htmlGen = require('./htmlGenerators.js');

function _clearFloorOptions() {
  $('#floor_select option').remove();
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


module.exports = {
  closeFloatingMenu : _closeFloatingMenu,
  hideMapStage : _hideMapStage,
  closeAllModals : _closeAllModals,
  clearFloorOptions : _clearFloorOptions
}
