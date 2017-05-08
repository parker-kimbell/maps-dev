var MEETING_ROOMS = "Meeting Spaces";
var ELEVATORS = "Elevators";

function MapActions(stage) {
  this.stage = null;
  this.layerIcons = {};
  this.pinLayer = null;
  this.backgroundLayer = null;
}

function _clearFloorOptions() {
  $('#floor_select option').remove();
}

function showPinsOf(category) {
  var allpins = stage.find('Text');
  allpins.each(function(p) {
      if(p.attrs.layerid === category) {
          p.show();
          p.attrs.pinIcon.show();
      }
  });
  stage.draw();
}

function hideAllPins() {
  var allpins = stage.find('Text');
  allpins.each(function(p) {
    if (p.attrs.layerid === ELEVATORS_LAYERID) { // Case: we're dealing with an elevator pin. Elevator pins are always on so skip them;
      return;
    }
    p.hide();
    p.attrs.pinIcon.hide();
  });
  stage.draw();
}

function hidePinsOf(category) {
  var allpins = stage.find('Text');
  allpins.each(function(p) {
      if(p.attrs.layerid === category) {
          p.hide();
          p.attrs.pinIcon.hide();
      }
  });
  stage.draw();
}

function _updateSelectionHash() {
  var selectedFloor = $("#floor_select option:selected");
  var selectedLocation = $("#location_select option:selected");
  setAmenitiesButtonTo(null);
  document.location.href = '#' + selectedLocation.data('buildingid') + "." + $(selectedFloor).data('floorid');
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

function buildLayerIcon(layer) {
  return $([
    "<li>",
    "  <div class='category' data-categoryid=" + layer.Id + " style='background: url(" + layer.Icon + ") no-repeat; background-position: 50% 20%; background-size: 70%;'>",
    "  <p>" + layer.Name,
    "  </p>",
    "  </div>",
    "</li>"
  ].join("\n"));
}

function _buildLayersModalForFloor(layers, floorPins) {
  var category_list = $('.category_list');

  $('.category_list li').remove(); // Since we're changing floors, or init'ing the app, clear all previous amenity buttons

  $.each(layers, function(i, layer) {
    if (layer.Name === ELEVATORS) {
      ELEVATORS_LAYERID = layer.Id;
      return; // Do not add elevators to the amenity menu, as they are always on
    }
    if (layer.Name === MEETING_ROOMS) {
      MEETING_LAYERID = layer.Id;
      return; // Do not add meeting rooms to the amenity selections. These are accessed exclusively through search
    }
    if (floorHasThisLayer(floorPins, layer)) { // Case: this floor has a pin corresponding to the given/layer amenity, build that layer button
      category_list.append(buildLayerIcon(layer));
    }
  });

  // Initialize click handlers for category buttons
  $('.category').on('click tap', function(event) {
    event.stopPropagation();
    if ($(this).parent().hasClass('on')) { // Case: we're turning off all amenities
      $(this).parent().removeClass('on');
      var categoryId = $(this).data('categoryid');
      hidePinsOf(categoryId);
      setAmenitiesButtonTo(null); // Clear the amenities button
    } else { // Case: we're turning on an amenties category that wasn't on previously. Clear the map and amenities state, and apply the new amenities filter
      $('.category').parent().removeClass('on');
      hideAllPins();
      $(this).parent().addClass('on');
      var categoryId = $(this).data('categoryid');
      showPinsOf(categoryId);
      setAmenitiesButtonTo(categoryId);
    }
  });
}


MapActions.clearFloorOptions = _clearFloorOptions;
MapActions.buildFloorSelect = _buildFloorSelect;
MapActions.updateSelectionHash = _updateSelectionHash;
MapActions.buildLayersModalForFloor = _buildLayersModalForFloor;
module.exports = MapActions;
