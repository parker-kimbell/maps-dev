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
