$(document).ready(function(){
  (function settingMapContainerHeight(){
    // The reason might because the nav bar gives padding 70,
    var mapcontainer_height = $(window).height() - 1.5 * $(".navbar").height();
    $("#mapcover").height(mapcontainer_height);
  })();
  
  var mapcover = initMapCover( 'mapcover', 'mapcover-map' ,    { 
      draggingCursor:"move",
      draggableCursor:"auto",
      center: { lat: 30.62060000, lng: -96.32621},
      zoom: 14,
      zoomControl:false,    //left side
      panControl:false,     //left top corner: 
      mapTypeControl:false  //right top corner: "map|satellite"
  });

  $("#map-tool-hole").click(function(){
    map_tool_register.clearAllStatus();
    map_tool_register.set("map_tool_holing", !map_tool_register.get("map_tool_holing"));
  });

  $("#map-tool-area-pointer").click(function(){
    map_tool_register.clearAllStatus();
    map_tool_register.set("map_tool_area_drawing", !map_tool_register.get("map_tool_area_drawing"));
  });
  $("#map-tool-cancel").click(function (){
    map_tool_register.clearAllStatus();
  })
  var temp_latlngs = [];
  var circle_latlngs = [];
  var polygons = [];
  var gmap = mapcover.model.get("map");
  var spherical = google.maps.geometry.spherical;
  var flightPath = new google.maps.Polyline({
    path: temp_latlngs,
    geodesic: false,
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 2
  });

  flightPath.setMap(gmap);

  function polygonClicked (event) {
    // "this" scope is set to the polygon 
    var this_polygon = this;
    if (map_tool_register.get("map_tool_holing") === true){
      circle_latlngs.push(event.latLng);
      this.setPaths([this_polygon.getPath(), circle_latlngs ]);
    }
    else {
      if (this.getPaths().length > 1){
        var paths = this_polygon.getPaths();
        console.log(paths);
        console.log(spherical.computeSignedArea( this_polygon.getPaths().getAt(0)) );
        console.log(spherical.computeSignedArea( this_polygon.getPaths().getAt(1)) );
        // console.log(  )
      }
      else{
        alert(spherical.computeSignedArea(this_polygon.getPath()));
      }
    }
  }

  gmap.addListener('click', function mapClkCb (event){
    // console.log("at least clicked");
    if (map_tool_register.get("map_tool_area_drawing")){
      console.log("drawing something");
      if (temp_latlngs.length === 0){

      }
      temp_latlngs.push(event.latLng);
      flightPath.setPath(temp_latlngs);
    }
  });
  var map_tool_register = new (Backbone.Model.extend({
    defaults: {
      map_tool_area_drawing: false,
      map_tool_holing:false
      
    },
    clearAllStatus:function(){
      var ClassRef = this;
      ClassRef.set({
        map_tool_area_drawing:false,
        map_tool_holing:false
      });
    },
    initialize: function (){
      var ClassRef = this;

      this.on("change:map_tool_area_drawing", function (){
        if (ClassRef.get("map_tool_area_drawing") === true){
          $("#map-tool-area-pointer").addClass("active");
        } else{
          $("#map-tool-area-pointer").removeClass("active");
          // turn current area into polygon
          if (temp_latlngs.length > 2){
            var temp_polygon = new google.maps.Polygon({
              path: temp_latlngs,
              geodesic: false,
              strokeColor: '#FF0000',
              strokeOpacity: 1.0,
              strokeWeight: 2,
            });
            temp_polygon.setMap(gmap);
            temp_polygon.addListener("click",  polygonClicked);
            polygons.push( temp_polygon);
          }
          // reseting
          temp_latlngs = [];
          flightPath.setPath(temp_latlngs);
        }
      });
      this.on("change:map_tool_holing", function(){

        if (ClassRef.get("map_tool_holing") === true){
          $("#map-tool-hole").addClass("active");
        } else{
          $("#map-tool-hole").removeClass("active");
          // turn current area into polygon
          // reseting
          circle_latlngs = [];
        }
      });
    }
  }))();



});