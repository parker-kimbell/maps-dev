function initNearby() {
  var hasMap = false;
  if (map.hasOwnProperty('MapImage')) {
    var editorConfig = { ResourcesWidth: map.MapImage.ResourcesWidth, ResourcesHeight: map.MapImage.ResourcesHeight };
    var scaleX = 700/editorConfig.ResourcesWidth;
    var scaleY = 700/editorConfig.ResourcesHeight;
    hasMap = true;
  }

  var stage;

  // Intialize layout
  var container = document.getElementById("container");
  var content = document.getElementById("content");
  var clientWidth = 0;
  var clientHeight = 0;

  var contentWidth = 700;
  var contentHeight = 700;

  var scroller;

  $(function () {

        $('#location_select').on('change', function() {
            var optionSelected = $("option:selected", this);
            document.location.href = '/mobile/nearby/' + $(optionSelected).data('locationid');
        });

        $('.filter_close').on('click', function() {
            $('.filter').velocity({
                opacity: 0
            }, {
                display: 'none',
                delay: 500,
                duration: 200
            });
        });

        $('.panel_close').on('click', function() {
          $('#floatingmenu').removeClass('open');
        });

        if(!hasMap) {
          return;
        }

        stage = new Konva.Stage({
          container: 'map',   // id of container <div>
          width: 700,
          height: 700
        });

        backgroundLayer = new Konva.Layer({

        });
        pinLayer = new Konva.Layer();

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

        imageObj.src = '/repository/resources/'+map.MapImage.ResourcesFileName;

        var pinGroup = new Konva.Group({
            name: 'pingroup',
            x: 0,
            y: 0
        });


        $.each(pins, function(i,v) {
            var pin = new Konva.Text({
                x: ((editorConfig.ResourcesWidth * scaleX)* v.PositionX) - 10,
                y: ((editorConfig.ResourcesHeight * scaleY)* v.PositionY) - 35,
                fill: 'rgb(232,66,102)',
                text: '\uf041',
                fontSize: 40,
                fontFamily: 'FontAwesome',
                shadowColor: 'black',
                shadowBlur: 10,
                shadowOffset: {x : 5, y : 5},
                shadowOpacity: 0.5,
                layerid: v.LayerId
            });
            pin.on('tap click', function(e) {
                var p = e.target;
                $('.layer_name').html(v.NearbyLayer.Name);
                $('.panel_title').html(v.Title);
                $('.panel_body').html(v.Body);
                $('.panel_location').html(v.Location);
                $('#floatingmenu').addClass('open');
            });
            pinGroup.add(pin);
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

        /* TODO: Integrate this with existing btn_amen logic */

        // $('#btn_amenities').on('click', function() {
        //     $('.filter').velocity({
        //         opacity: 1
        //     }, {
        //         display: 'block',
        //         delay: 250,
        //         duration: 200
        //     });
        // });

        /* TODO: integrate this with the existing amenities window */

        // $('.category').on('click', function() {
        //     //console.log( $(this).data('categoryid') );
        //     if( $(this).parent().hasClass('on') ) {
        //         $(this).parent().removeClass('on');
        //         var catid = $(this).data('categoryid');
        //         //var allpins = stage.find('Circle');
        //         var allpins = stage.find('Text');
        //         allpins.each(function(p) {
        //             if(p.attrs.layerid == catid) {
        //                 p.hide();
        //             }
        //         });
        //         stage.draw();
        //     } else {
        //         $(this).parent().addClass('on');
        //         var catid = $(this).data('categoryid');
        //         //var allpins = stage.find('Circle');
        //         var allpins = stage.find('Text');
        //         allpins.each(function(p) {
        //             if(p.attrs.layerid == catid) {
        //                 p.show();
        //             }
        //         });
        //         stage.draw();
        //     }
        // });

        // Initialize Scroller
        scroller = new Scroller(render, {
        	zooming: false
        });

        var rect = container.getBoundingClientRect();
        //scroller.setPosition(rect.left + container.clientLeft, rect.top + container.clientTop);
        //scroller.zoomBy(0.75);


        // Reflow handling
        var reflow = function() {
        	clientWidth = container.clientWidth;
        	clientHeight = container.clientHeight;
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

    });

}
