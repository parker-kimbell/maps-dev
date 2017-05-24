var viewTransitions = require('./viewTransitions');

function VisualMap() {
  this.stage = null;
  this.backgroundLayer = null;
  this.layerIcons = {};
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

    var image = that.layerIcons[pinData.LayerId];
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

function _drawNearbyView(nearby) {
  debugger;
  var editorConfig = {
    ResourcesWidth: nearby.MapImage.ResourcesWidth,
    ResourcesHeight: nearby.MapImage.ResourcesHeight
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

  var scroller;

  var that = this;

  $(function () {

    // $('#location_select').on('change', function() {
    //     var optionSelected = $("option:selected", this);
    //     document.location.href = '/mobile/nearby/' + $(optionSelected).data('locationid');
    // });
    //
    // $('.filter_close').on('click', function() {
    //     $('.filter').velocity({
    //         opacity: 0
    //     }, {
    //         display: 'none',
    //         delay: 500,
    //         duration: 200
    //     });
    // });
    //
    // $('.panel_close').on('click', function() {
    //   $('#floatingmenu').removeClass('open');
    // });

    that.stage = new Konva.Stage({
      container: 'nearby',   // id of container <div>
      width: contentWidth,
      height: contentHeight
    });

    var backgroundLayer = new Konva.Layer({});

    var pinLayer = new Konva.Layer();

    var base = new Konva.Image({
        x: 0,
        y: 0,
        width: editorConfig.ResourcesWidth*scaleX,
        height: editorConfig.ResourcesHeight*scaleY,
        stroke: 0,
        listening: true
    });

    backgroundLayer.add(base);

    var imageObj = new Image();

    imageObj.onload = function() {
      base.image(imageObj);
      backgroundLayer.draw();
    };

    imageObj.src = that.cmsUrl + nearby.MapImage.image;

    that.stage.add(backgroundLayer);

    //_initializeScroller(contentWidth, contentHeight);

  });
}

function _initializeScroller(contentWidth, contentHeight) {
  var container = document.getElementById("container");

  var scroller = new Scroller(render, {
    zooming: false
  });

  var rect = container.getBoundingClientRect();

  // Reflow handling
  var reflow = function() {
    var clientWidth = container.clientWidth;
    var clientHeight = container.clientHeight;
    scroller.setDimensions(clientWidth, clientHeight, contentWidth, contentHeight);
  };

  window.addEventListener("resize", reflow, false);
  reflow();
  if ('ontouchstart' in window) {

    container.addEventListener("touchstart", function(e) {
      // Don't react if initial down happens on a form element
      if (e.touches[0] && e.touches[0].target && e.touches[0].target.tagName.match(/input|textarea|select/i)) {
        return;
      }

      scroller.doTouchStart(e.touches, e.timeStamp);
      e.preventDefault();
    }, false);

    document.addEventListener("touchmove", function(e) {
      scroller.doTouchMove(e.touches, e.timeStamp, e.scale);
    }, false);

    document.addEventListener("touchend", function(e) {
      scroller.doTouchEnd(e.timeStamp);
    }, false);

    document.addEventListener("touchcancel", function(e) {
      scroller.doTouchEnd(e.timeStamp);
    }, false);

  } else {

    var mousedown = false;

    container.addEventListener("mousedown", function(e) {
      if (e.target.tagName.match(/input|textarea|select/i)) {
        return;
      }

      scroller.doTouchStart([{
        pageX: e.pageX,
        pageY: e.pageY
      }], e.timeStamp);

      mousedown = true;
    }, false);

    document.addEventListener("mousemove", function(e) {
      if (!mousedown) {
        return;
      }

      scroller.doTouchMove([{
        pageX: e.pageX,
        pageY: e.pageY
      }], e.timeStamp);

      mousedown = true;
    }, false);

    document.addEventListener("mouseup", function(e) {
      if (!mousedown) {
        return;
      }

      scroller.doTouchEnd(e.timeStamp);

      mousedown = false;
    }, false);

  }

  scroller.scrollBy(150, 150, true);
}

VisualMap.prototype.hideAllPins = _hideAllPins;
VisualMap.prototype.hidePinsOf = _hidePinsOf;
VisualMap.prototype.showPinsOf = _showPinsOf;
VisualMap.prototype.clearLastTouchedPin = _clearLastTouchedPin;
VisualMap.prototype.drawMapForFloor = _drawMapForFloor;
VisualMap.prototype.drawNearbyView = _drawNearbyView;

module.exports = VisualMap;
