var MapsApp = require('./init.js');
//TODO turn this into an IIFE so we know we're not conflictin


var lastTouchedPin;
var layerIcons = {}; // Holds the images for different pin layers. Initialized at app launch when we get the data payload from the CMS

var lastLocation;

/*
TODO SCAFFOLDING: ultimately we'll receive the meeting payload from a PwC endpoint (I think)
in the meantime we derive the data from what's on the CMS now, and build the necessary code against that
*/
var meetingRoomData = {};

// TODO: this will probably change depending on the order layers were added. Need to find this dynamically.

// TODO: need to do this for Location -> Floor whenever that changes
var MEETING_LAYERID;
var ELEVATORS_LAYERID;

function closeFloatingMenu() {
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

function transitionOutOfMeetingRoomSearch() {
  closeAllModals();
  hideAllPins();
  showMapAndButtonStage();
  hideAndClearSearch();
}

function prepareForMeetingRoomDisplay() {
  $('#map').css('visibility', 'visible');
  // hideAndClearSearch();
  // $('.cancel-search div').toggle({ effect: "scale", direction: "vertical" });
  setAmenitiesButtonTo(null);
  $('.dark-table').hide();
}

function revertSearchDisplay() {
  $('#map').css('visibility', 'hidden');
  $('.dark-table').show();
  // $('.cancel-search div').toggle({ effect: "scale", direction: "vertical" });
  closeFloatingMenu();
}

function closeAllModals() {
  closeFloatingMenu();
  closeAmenitiesModal();
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

function hideMapStage() {
  $('.buttons').css('visibility', 'hidden');
  $('#map').css('visibility', 'hidden');
}

function showMapAndButtonStage() {
  $('.buttons').css('visibility', 'visible');
  $('#map').css('visibility', 'visible');
}

function hideAndClearSearch() {
  $('.active-search-container').hide();
  $('#active_search_input').val("");
  searchTable(); // Revert data table to initial state
  $('.dark-table').show();
}

// Reveals the meeting room search bar.
function showAndFocusSearch() {
  $('.active-search-container').show();
  $('#active_search_input').focus();
}

// Handles informing the user that their meeting room search has filtered out all results.
function checkAndHandleNoResults() {
  var visibleCells = $('.dark-table tr').filter(function() {
    return $(this).css('display') !== 'none';}
  );
  var firstVisibleCell = visibleCells[0];
  if (!firstVisibleCell) { // Case: we have no visible cells. Display that there are no valid results
    $('.dark-table').prepend("<tr id='no_results'><td>No results</td></tr>")
  } else if (visibleCells.length > 1) {
    $('#no_results').remove();
  } // else do nothing
}

function searchTable() {
  filteredSearch();
  checkAndHandleNoResults();
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

MapsApp.init("https://pwc.downstreamlabs.com");
