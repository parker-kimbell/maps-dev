// var bundle = function() {
//   require('./public/bundle/bundle.js');
// }
//var mapsHtml = require('./public/index.html');
var fs = require('graceful-fs');

var mapsHtml = fs.readFileSync('./public/index.html', 'utf8');
//
// module.exports = {
//   MapsApp : bundle,
// };
module.exports = {
  mapsHtml : mapsHtml
};
