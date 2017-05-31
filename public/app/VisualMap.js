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
      newCell.on('click tap', function(event) {
        that.hideAllPins();
        pin.show();
        pinIcon.show();
        $('#active_search_input').val(pinData.Title);
        viewTransitions.prepareForMeetingRoomDisplay();
        that.setAmenitiesButtonTo(null);
        pin.fire('tap');
        event.stopPropagation();
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

  var offsetYouAreHereX = fontSize - (fontSize * 0.43);
  var offsetYouAreHereY = fontSize + (fontSize * 0.19);

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
      duration : 1250,
      complete : function() {
        $('#input_prevention').removeClass('block-input-while-animating');
      }
    });
  };

  imageObj.src = that.cmsUrl + nearby.MapImage.image;
  this.buildLayersModalForFloor(that.nearbyMapsPayload.layers, nearby.Map.NearbyPin);
  $.each(nearby.Map.NearbyPin, function(i, pinData) {
    if (pinData.IsBuilding) { // Case: this pin represents the location of a PwC building, so build out the special case that this represents
      var youAreHereIcon = new Image();
      youAreHereIcon.src = '/assets/you-are-here.png';
      youAreHereIcon.onload = function() {
        pin.draw();
        that.animateToPin(pin);
      };
      var pin = new Konva.Image({
        x: ((editorConfig.ResourcesWidth * scaleX)* pinData.PositionX) - offsetYouAreHereX,
        y: ((editorConfig.ResourcesHeight * scaleY)* pinData.PositionY) - offsetYouAreHereY,
        scaleX : fontSize / 90,
        scaleY : fontSize / 90,
        image : youAreHereIcon,
        stroke : 'white',
        strokeWidth : '3',
        strokeEnabled : false,
        icon : true,
        isBuilding : true
      });
      that.backgroundLayer.add(pin);
    } else { // Case: we have an image/text combo, so build out the associated logic
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
        $('.layer_name div').html(pinData.Title);
        $('.panel_body').html(pinData.Location + "<br/><br/>" + pinData.Body);
        that.openFloatingMenu();
      });
      that.backgroundLayer.add(pin);
      that.backgroundLayer.add(pinIcon);
    }
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
  if (!this.getNearbyBounds) return;
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
