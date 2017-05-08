function VisualMap() {
  this.stage = null;
  this.pinLayer = null;
  this.backgroundLayer = null;
}

function _showPinsOf(category) {
  var allpins = stage.find('Text');
  allpins.each(function(p) {
      if(p.attrs.layerid === category) {
          p.show();
          p.attrs.pinIcon.show();
      }
  });
  stage.draw();
}

function _clearLastTouchedPin() {
  if (lastTouchedPin && this.backgroundLayer) { // Clear the highlighted appearance of the last touched pin
    lastTouchedPin.strokeEnabled(false);
    backgroundLayer.draw();
    lastTouchedPin = false;
  }
}

function _hidePinsOf(category) {
  var allpins = stage.find('Text');
  allpins.each(function(p) {
      if(p.attrs.layerid === category) {
          p.hide();
          p.attrs.pinIcon.hide();
      }
  });
  stage.draw();
}

function _hideAllPins() {
  var that = this;
  var allpins = stage.find('Text');
  allpins.each(function(p) {
    if (p.attrs.layerid === that.elevatorsLayerId) { // Case: we're dealing with an elevator pin. Elevator pins are always on so skip them;
      return;
    }
    p.hide();
    p.attrs.pinIcon.hide();
  });
  stage.draw();
}

VisualMap.prototype.hideAllPins = _hideAllPins;
VisualMap.prototype.hidePinsOf = _hidePinsOf;
VisualMap.prototype.showPinsOf = _showPinsOf;
VisualMap.prototype.clearLastTouchedPin = _clearLastTouchedPin;

module.exports = VisualMap;
