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

  function mapToolOpUpdating (){
    // this is the clicked element
    var target_property = $(this).attr("data-operation");
    if (map_tool_register.get(target_property) === true){
      map_tool_register.set(target_property,false);
    } else {
      map_tool_register.clearAllStatus();
      map_tool_register.set(target_property, true);
    }
  }
  // map tool functioning populating
  $("#map-tool-editpolygon,#map-tool-editpurpose,#map-tool-area-pointer,#map-tool-hole").click(mapToolOpUpdating);
  $("#map-tool-cancel").click(function (){
    map_tool_register.clearAllStatus();
    temp_latlngs = [];
    for (var i = 0; i < polygons.length; i++){
      polygons[i].setMap(null);
    }
    polygons = [];
  });
  // preparing modal
  $("#savepurpose").click(function savepurpose (){
    var str = $("form#purpose").serialize();
    str = str.split("=");
    if (target_polygon !== null ){
      target_polygon[str[0]] = str[1];
      console.log(target_polygon[str[0]]);
      map_tool_register.renderPolygonProperly(target_polygon);
      target_polygon = null;
      $("#purpose-modal").modal("hide");
    } else{
      throw "target_polygon is null when savepurpose() is invoked";
    }
  });

  var gmap = mapcover.model.get("map");
  var temp_startmarker = new google.maps.Marker({
    icon:{
      path: google.maps.SymbolPath.CIRCLE,
      scale: 2,
      strokeColor:'#FF0000'
    }
  });  
  var temp_latlngs = [];
  var polygons = [];  
  var spherical = google.maps.geometry.spherical;
  var circle_symbol = { path:google.maps.SymbolPath.CIRCLE}; 
  var drawingPath = new google.maps.Polyline({
    path: temp_latlngs,
    geodesic: false,
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 2,
    icons:[{icon: circle_symbol , offset:"0%"}],
    map:gmap
  });
  var target_polygon = null;  // when drawing circle on certain polygon, this polygon will be filled with the polygon which is being operated

  function polygonClicked (event) {
    // "this" scope is set to the polygon 
    var this_polygon = this;
    if (map_tool_register.get("map_tool_holing") === true ) {
      target_polygon = this_polygon;
      temp_latlngs.push(event.latLng);
      drawingPath.setPath(temp_latlngs);

      if (temp_latlngs.length === 1){
        temp_startmarker.setPosition(temp_latlngs[0]);
        temp_startmarker.setMap(gmap);
      } else{
        temp_startmarker.setMap(null);
      }
    } else if  ( map_tool_register.get("map_tool_editpolygon") === true) {
      this_polygon.setEditable(true);
    } else if ( map_tool_register.get("map_tool_editpurpose") === true){
      target_polygon = this_polygon;
      // modal show, reset options 
      $("#purpose-modal").modal("show");

    }

    else {
      var paths = this_polygon.getPaths();
      var i = 0;
      var sum = 0
      for( i =0; i < paths.getLength(); i++){
        if (i ===0){
          sum = Math.abs(spherical.computeSignedArea(paths.getAt(i)) );
        }else {
          sum -= Math.abs(spherical.computeSignedArea(paths.getAt(i)) );
        }
        console.log( spherical.computeSignedArea(paths.getAt(i)) );  
      }
      console.log("shadowed area is: " + sum.toString() + " sqaure meter.");
    }
  }

  gmap.addListener('click', function mapClkCb (event){
    // console.log("at least clicked");
    if (map_tool_register.get("map_tool_area_drawing")){
      console.log("drawing something");
      temp_latlngs.push(event.latLng);
      drawingPath.setPath(temp_latlngs);

      if (temp_latlngs.length === 1){
        temp_startmarker.setPosition(temp_latlngs[0]);
        temp_startmarker.setMap(gmap);
      } else{
        temp_startmarker.setMap(null);
      }
    }
  });
  var map_tool_register = new (Backbone.Model.extend({
    defaults: {
      map_tool_area_drawing: false,
      map_tool_holing:false,
      map_tool_editpolygon:false
    },
    clearAllStatus:function(){
      var ClassRef = this;
      ClassRef.set({
        map_tool_area_drawing:false,
        map_tool_holing:false,
        map_tool_editpolygon:false,
        map_tool_editpurpose:false
      });
    },
    renderPolygonProperly: function( to_be_rendered_polygon){
      if (to_be_rendered_polygon.hasOwnProperty("landusage")){
        switch(to_be_rendered_polygon["landusage"]){
          case "housebuilding":
            to_be_rendered_polygon.setOptions({
              fillColor:"#0000FF"
            });
            break;
          case "lawnturf":
            to_be_rendered_polygon.setOptions({
              fillColor:"#FFFF00"
            });
            break;
          case "vegetablegarden":
            to_be_rendered_polygon.setOptions({
              fillColor:"#33CC33"
            });
            break;
          default:

        }
      }
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
              editable: false
            });
            temp_polygon.setMap(gmap);
            temp_polygon.addListener("click",  polygonClicked);
            polygons.push( temp_polygon);
          }
          // reseting
          temp_latlngs = [];
          drawingPath.setPath(temp_latlngs);
        }
      });
      this.on("change:map_tool_holing", function(){
        if (ClassRef.get("map_tool_holing") === true){
          $("#map-tool-hole").addClass("active");
        } else{
          $("#map-tool-hole").removeClass("active");
          if (temp_latlngs.length > 2){
            var paths = target_polygon.getPaths();
            var direction0  =  spherical.computeSignedArea(paths.getAt(0));
            var direction1 = spherical.computeSignedArea(temp_latlngs);
            if (direction1 * direction0 > 0) {
              var temp_latlngs2 = []
              while (temp_latlngs.length >0){
                temp_latlngs2.push(temp_latlngs.pop());
              }
              temp_latlngs = temp_latlngs2;
            }
            paths.push( new google.maps.MVCArray(temp_latlngs));
            target_polygon.setPaths(paths);
          }
          // reseting
          temp_latlngs = [];
          drawingPath.setPath(temp_latlngs);
        }
      });

      this.on("change:map_tool_editpolygon", function (){
        if (ClassRef.get("map_tool_editpolygon")  === true){
          $("#map-tool-editpolygon").addClass("active");
        } else {
          $("#map-tool-editpolygon").removeClass("active");
          polygons.forEach(function(el, index, ar){
            el.setEditable(false);
          });
        }
      });

      this.on("change:map_tool_editpurpose", function (){
        if (ClassRef.get("map_tool_editpurpose")  === true){
          $("#map-tool-editpurpose").addClass("active");
        } else {
          $("#map-tool-editpurpose").removeClass("active");
        }    
      });
    }
  }) ) ();  // initialize a new 



});