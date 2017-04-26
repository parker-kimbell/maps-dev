//TODO turn this into an IFFE so we know we're not conflictin

function initMapsApp(mapsPayload) {
  var width = window.innerWidth;
  var height = window.innerHeight;
  var stage;
  $(window).on('hashchange',function() {
    var payload = mapsPayload;

    console.log('Location hash, sucka', location.hash);
    var hash = location.hash.replace('#','');
    var parts = hash.split('.');

    var config = { floor: Number(parts[0]), pin: (parts[1] == undefined ? 0 : Number(parts[1]))  };
    debugger;
    $('#floor_select').val(config.floor);

    var scaleX = 0;
    var scaleY = 0;

    $('#map').empty();

    $.each(mapsPayload.layers, function(i, floor) {
        //console.log(floor.Id + ' ' + config.floor);
        var payload = mapsPayload;
        console.log('floor: ', floor);
        if(floor.Id === config.floor) {
            //console.log(floor);

            $('#name').html(floor.Name);

            scaleX = width/floor.FloorImage.width;
            scaleY = scaleX;

            stage = new Konva.Stage({
              container: 'map',   // id of container <div>
              width: width,
              height: height
            });

            backgroundLayer = new Konva.Layer({

            });
            pinLayer = new Konva.Layer();

            var base = new Konva.Image({
                x: 0,
                y: 0,
                width: floor.FloorImage.width*scaleX,
                height: floor.FloorImage.height*scaleY,
                stroke: 0
            });

            backgroundLayer.add(base);

            var imageObj = new Image();

            imageObj.onload = function() {
              base.image(imageObj);
              backgroundLayer.draw();
            };

            imageObj.src = '/repository/resources/'+floor.FloorImage.image;


            var pinGroup = new Konva.Group({
                name: 'pingroup',
                x: 0,
                y: 0
            });


            $.each(floor.Pin, function(i,v) {
              var pin = new Konva.Text({
                  x: ((floor.FloorImage.width * scaleX)* v.PositionX) - 5,
                  y: ((floor.FloorImage.height * scaleY)* v.PositionY) - 25,
                  fill: 'rgb(232,66,102)',
                  text: '\uf041',
                  fontSize: 30,
                  fontFamily: 'FontAwesome',
                  shadowColor: 'black',
                  shadowBlur: 10,
                  shadowOffset: {x : 5, y : 5},
                  shadowOpacity: 0.5,
                  layerid: v.LayerId
              });
              pin.on('tap click', function(e) {
                  var p = e.target;
                  $('.layer_name').html(v.Layer.Name);
                  $('.panel_body').html(v.Body);
                  $('.panel_location').html(v.Location);
                  $('#floatingmenu').addClass('open');
              });
              pinGroup.add(pin);
              pin.hide();

              if(v.Id === config.pin) {
                  pin.show();
                  $('.layer_name').html(v.Layer.Name);
                  $('.panel_body').html(v.Body);
                  $('.panel_location').html(v.Location);
                  $('#floatingmenu').addClass('open');
              }

              backgroundLayer.add(pin);
            });

            // close the panel if the map is tapped
            stage.on('tap click', function(e) {

                var node = e.target;
                if(node.className === 'Image') {
                    $('#floatingmenu').removeClass('open');
                }

            });

            pinLayer.add(pinGroup);

            stage.add(backgroundLayer);

        }
    }); // end $.each
  }); // $.onHashChange
}

function init() {
  var request = new XMLHttpRequest();
  request.addEventListener("load", function() {
    var mapsPayload = JSON.parse(this.responseText);
    initMapsApp(mapsPayload);
  });
  request.open("GET", "http://localhost:3000/getMaps");
  request.setRequestHeader('Authorization', 'Bearer ff779ee219d7be0549c971d6ba2311d5');
  request.setRequestHeader('Content-Type', 'application/json');
  request.setRequestHeader('Accept', 'application/json');
  request.send();
}

init();
