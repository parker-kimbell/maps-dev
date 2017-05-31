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

function _transitionToNearbyView(callback) {
  $('.filter > ul').css('margin-top', '33%');
  $('.layer_name > img').addClass('close-modal-dark-bg');
  $('#location_select').removeClass('dropdown').addClass('nearby-dropdown');
  $('#floor').css({
    position: 'absolute'
  });
  _closeAllModals();
  $('.btn-amenities').css({
    top : '1.5%'
  });

  var rootDelay = 100;
  setTimeout(function() {
    var transitionNeedednElements = _getSharedElementTransition();
    $.Velocity.RunSequence(transitionNeedednElements);
  }, rootDelay);

  setTimeout(function() {
    $('.nearby-btn').removeClass('nearby-btn').addClass('nearby-btn-cancel');
    var transitionNearbyButton = _getNearbyToggleTransition();
    transitionNearbyButton[0].o.complete = callback;
    $.Velocity.RunSequence(transitionNearbyButton);
  }, rootDelay + 500);

  setTimeout(function() {
    var transitionUnneededElements = _getFloorElementTransition();
    $.Velocity.RunSequence(transitionUnneededElements);
  }, rootDelay + 500);

}

function _getSharedElementTransition(revert) {
  return [
    {
      e : $('#location_select'),
      p : {
        width: revert ? "100%" : '44%',
        height: revert ? "40%" : '8%',
        top : revert ? "" : '12%'
      },
      o : {
        complete : function() {
          if (revert) $('#location_select').css({
            top : "",
            height : "",
            width : ""
          });
          }
        }
    },
    {
      e : $('.btn-amenities'),
      p : {
        top: revert ? "" : '12%',
        height: revert ? "6%" : '8%'
      },
      o : {
        sequenceQueue : false
      }
    }
  ];
}

function _getNearbyToggleTransition(revert) {
  return [
    {
      e : $('#nearby_toggle'),
      p : {
        left : revert ? "" : '5%',
        'font-size': revert ? "1.0em" : '1.2em'
      },
      o : {
        duration : 400,
      }
    }
  ];
}

function _getFloorElementTransition(revert) {
   return [
    {
      e : $('#floor_select'),
      p : {
        'margin-left' : revert ? "" : "300%"
      },
      o : {
        duration : 'slow',
        sequenceQueue : false
      }
    },
    {
      e : $('#btn_search'),
      p : {
        'margin-left' : revert ? "5%" : "300%"
      },
      o : {
        duration : 'slow',
        sequenceQueue : false
      }
    },
    {
      e : $('#floor'),
      p : {
        left: revert ? "" : '100%'
      },
      o : {
        duration : 'slow',
        sequenceQueue : false,
      }
    }
  ];
}

function _transitionToFloorViewFromNearby(callback) {
  var REVERT = true;
  var AMEN_BUTTON = 1;
  var NEARBY_TOGGLE = 0;
  $('.filter > ul').css('margin-top', '');
  $('.layer_name > img').removeClass('close-modal-dark-bg');
  $('#location_select').removeClass('nearby-dropdown').addClass('dropdown');
  $('#floor').css({
    position: ''
  });
  /* move elements needed for floor view back on screen */
  var floorViewElemTrans = _getFloorElementTransition(REVERT);
  var sharedViewElemTrans = _getSharedElementTransition(REVERT);
  sharedViewElemTrans[AMEN_BUTTON].p['margin-top'] = "2%";
  sharedViewElemTrans[AMEN_BUTTON].o.complete = function() {
    $('#btn_amenities').css({
      'top' : "",
      'margin-top' : ""
    });
  };
  var nearbyToggleElemTrans = _getNearbyToggleTransition(REVERT);
  nearbyToggleElemTrans[NEARBY_TOGGLE].o.complete = function() {
    $('#nearby_toggle').css('left', "");

    $('#container').velocity({
      left: '300%'
    }, {
      duration : 1250
    });
    callback();
  }
  $.Velocity.RunSequence(floorViewElemTrans);
  $.Velocity.RunSequence(sharedViewElemTrans);
  $('#nearby_toggle').removeClass('nearby-btn-cancel').addClass('nearby-btn');
  $.Velocity.RunSequence(nearbyToggleElemTrans);
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
  transitionToNearbyView : _transitionToNearbyView,
  transitionToFloorViewFromNearby : _transitionToFloorViewFromNearby
};
