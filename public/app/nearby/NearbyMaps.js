function initNearby() {
  var hasMap = false;

  if (map.hasOwnProperty('MapImage')) {
    var editorConfig = { ResourcesWidth: map.MapImage.ResourcesWidth, ResourcesHeight: map.MapImage.ResourcesHeight };
    var scaleX = 700/editorConfig.ResourcesWidth;
    var scaleY = 700/editorConfig.ResourcesHeight;
    hasMap = true;
  }

}
