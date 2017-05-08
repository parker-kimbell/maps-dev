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

function _hidePinsOf(category) {
  debugger;
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
  debugger;
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

module.exports = VisualMap;
