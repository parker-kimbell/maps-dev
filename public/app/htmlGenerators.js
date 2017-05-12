function _buildLayerIcon(layer) {
  return $([
    "<li>",
    "  <div class='category' data-categoryid=" + layer.Id + " style='background: url(" + layer.Icon + ") no-repeat; background-position: 50% 20%; background-size: 70%;'>",
    "  <p>" + layer.Name,
    "  </p>",
    "  </div>",
    "</li>"
  ].join("\n"));
}

function _buildFloorOption(floor) {
  return $([
    "<option value=" + floor.Id + " data-locationid=" + floor.LocationId + " data-floorid=" + floor.Id + ">" + floor.Name,
    "</option>"
  ].join("\n"));
}

function _buildLocationOption(building) {
  return $([
    "<option value=" + building.Id + " data-buildingid=" + building.Id + ">" + building.Name,
    "</option>"
  ].join("\n"));
}

function _buildLocationDiv(building) {
  return $([
    "<div data-buildingid=" + building.Id + ">" + building.Name,
    "</div>"
  ].join("\n"));
}

module.exports = {
  buildLayerIcon : _buildLayerIcon,
  buildFloorOption : _buildFloorOption,
  buildLocationOption : _buildLocationOption,
  buildLocationDiv : _buildLocationDiv
}
