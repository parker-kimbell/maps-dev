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

function transitionOutOfMeetingRoomSearch() {
  closeAllModals();
  hideAllPins();
  showMapAndButtonStage();
  hideAndClearSearch();
}

MapsApp.init("https://pwc.downstreamlabs.com");
