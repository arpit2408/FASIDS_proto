$(document).ready(function(){
  (function settingMapContainerHeight(){
    // The reason might because the nav bar gives padding 70,
    var mapcontainer_height = $(window).height() - 1.5 * $(".navbar").height();
    $("#mapcover").height(mapcontainer_height);
  })();  
  
  google.maps.Polygon.prototype.my_getBounds=function(){
      var bounds = new google.maps.LatLngBounds();
      this.getPath().forEach(function(element,index){
        console.log("DEBUGG:" + element.toString());
        bounds.extend(element);
      })
      if (bounds.isEmpty()){alert("FK")}
      console.log(bounds.toString());
      console.log(bounds.getCenter().toString());
      return bounds;
  }

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
  $("#map-tool-editpolygon,#map-tool-settreatment,#map-tool-area-pointer,#map-tool-hole, #map-tool-genresult").click(mapToolOpUpdating);
  $("#map-tool-cancel").click(function (){
    map_tool_register.clearAllStatus();
    drawingPath.setPath([]);
    for (var i = 0; i < polygons.length; i++){
      polygons[i].setMap(null);
    }
    polygons = [];
  });

  // preparing modal
  $("#save-prepared-treatment").click(function savePreparedTreatment(){

    var formdata = $("form#purpose").serializeArray();
    var data = {};
    _.each(formdata, function(element){
    // Return all of the values of the object's properties.
      var value = _.values(element);
    // name : value 
      data[value[0]] = value[1];
    });
    // console.log(data);
    if (target_polygon !== null ){
      _.keys(data).forEach(function(keyname,index, arr) {
        target_polygon[keyname] = data[keyname];
        console.log("target_polygon."+keyname+" : " + target_polygon[keyname]);
      });
      
      map_tool_register.renderPolygonProperly(target_polygon);
      target_polygon = null;
      $("#purpose-modal").modal("hide");
    } else{
      throw "target_polygon is null when savePreparedTreatment() is invoked";
    }
  });

  var gmap = mapcover.model.get("map");
  var geocoder = new google.maps.Geocoder();
  var temp_startmarker = new google.maps.Marker({
    icon:{
      path: google.maps.SymbolPath.CIRCLE,
      scale: 3,
      strokeColor:'#FF0000'
    }
  });  
  temp_startmarker.addListener('click',function onTempStartMarkerClicked(){
    console.log("onTempStartMarkerClicking() invoked");
    if ( map_tool_register.get("map_tool_area_drawing") === true ) {
      map_tool_register.set("map_tool_area_drawing",false);
    } else if ( map_tool_register.get("map_tool_holing") === true ) {
      map_tool_register.set("map_tool_holing",false);
    }
  });
  var polygons = [];  
  var spherical = google.maps.geometry.spherical;
  var drawingPath = new google.maps.Polyline({
    path: [],
    geodesic: false,
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 2,
    map:gmap
  });
  var target_polygon = null;  // when drawing circle on certain polygon, this polygon will be filled with the polygon which is being operated
  var deleteMenu = new DeleteMenu();

  function polygonRightClicked (event){
    var this_polygon = this;
    if (event.vertex == undefined || event.path == undefined){
      return;
    }
    deleteMenu.open(gmap, this_polygon.getPaths().getAt(event.path) ,event.vertex);
  }
  function polygonClicked (event) {
    // "this" scope is set to the polygon 
    var this_polygon = this;
    if (map_tool_register.get("map_tool_holing") === true ) {
      target_polygon = this_polygon;
      drawingPath.getPath().push(event.latLng);
      if ( drawingPath.getPath().getLength() === 1){
        temp_startmarker.setPosition(event.latLng);
        temp_startmarker.setMap(gmap);
      }
    } else if  ( map_tool_register.get("map_tool_editpolygon") === true) {
      this_polygon.setEditable(true);
    } else if ( map_tool_register.get("map_tool_settreatment") === true){
      target_polygon = this_polygon;
      // modal show, reset options 
      $("#purpose-modal").modal("show");

    } else if ( map_tool_register.get("map_tool_genresult") === true){
      var geoJsonPolygon = map_tool_helper.geoJsonize( this_polygon,"polygon");
      geoJsonPolygon.properties.total_area =  map_tool_helper.getTotalAreaOf(this_polygon);

      // This is just temporary quick fix, Bowei pay attention here
      if (geoJsonPolygon.properties.treatment === "imt"){
        geoJsonPolygon.properties.mound_density = 1;
      }
      var temp_bounds = this_polygon.my_getBounds();
      geoJsonPolygon.properties.bounds ={  
        sw:{ lat:temp_bounds.getSouthWest().lat(), lng: temp_bounds.getSouthWest().lng()},
        ne:{ lat:temp_bounds.getNorthEast().lat(), lng: temp_bounds.getNorthEast().lng()}
      };
      $('input#geojson').val(JSON.stringify(geoJsonPolygon));
      
      console.log( JSON.stringify(geoJsonPolygon) );
      $('form#treatment').submit();
    }

    else {
      

    }
  }

  gmap.addListener('click', function mapClkCb (event){
    // console.log("at least clicked");
    if (map_tool_register.get("map_tool_area_drawing")){

      drawingPath.getPath().push(event.latLng)

      if (drawingPath.getPath().getLength() === 1){
        temp_startmarker.setPosition(event.latLng);
        temp_startmarker.setMap(gmap);
      }
    }
  });


  var map_tool_register = new (Backbone.Model.extend({
    defaults: {
      map_tool_area_drawing: false,
      map_tool_holing:false,
      map_tool_editpolygon:false,
      map_tool_settreatment:false,
      map_tool_genresult:false
    },
    clearAllStatus:function(){
      var ClassRef = this;
      // ClassRef.keys() return an array: ["map_tool_area_drawing", "map_tool_holing", "map_tool_editpolygon", "map_tool_settreatment", "map_tool_genresult"]
      _.each(ClassRef.keys(), function iteratee(element, index, list){
        ClassRef.set(element, false);
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
          if (drawingPath.getPath().getLength() > 2){
            var temp_polygon = new google.maps.Polygon({
              path: drawingPath.getPath(),
              geodesic: false,
              strokeColor: '#FF0000',
              strokeOpacity: 1.0,
              strokeWeight: 2,
              editable: false
            });
            temp_polygon.setMap(gmap);
            temp_polygon.addListener("click",  polygonClicked);
            temp_polygon.addListener("rightclick", polygonRightClicked);
            polygons.push( temp_polygon);
          }
          // reseting
          drawingPath.setPath([]);
          temp_startmarker.setMap(null);
        }
      });
      this.on("change:map_tool_holing", function(){
        if (ClassRef.get("map_tool_holing") === true){
          $("#map-tool-hole").addClass("active");
        } else{
          $("#map-tool-hole").removeClass("active");
          if (drawingPath.getPath().getLength() > 2){
            var paths = target_polygon.getPaths();
            var direction0  =  spherical.computeSignedArea(paths.getAt(0));
            var direction1 = spherical.computeSignedArea( drawingPath.getPath() );
            if (direction1 * direction0 > 0) {
              var temp_latlngs2 = []
              while (drawingPath.getPath().getLength() >0){
                temp_latlngs2.push(drawingPath.getPath().pop());
              }
              drawingPath.setPath(temp_latlngs2);
            }
            paths.push( drawingPath.getPath());
            // target_polygon.setPaths(paths);
          }
          // reseting
          drawingPath.setPath([]);
          temp_startmarker.setMap(null);
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

      this.on("change:map_tool_settreatment", function (){
        if (ClassRef.get("map_tool_settreatment")  === true){
          $("#map-tool-settreatment").addClass("active");
        } else {
          $("#map-tool-settreatment").removeClass("active");
        }    
      });

      this.on("change:map_tool_genresult", function (){
        if (ClassRef.get("map_tool_genresult")  === true){
          $("#map-tool-genresult").addClass("active");
        } else {
          $("#map-tool-genresult").removeClass("active");
        }    
      });
    }
  }) ) ();  // initialize a new 

  var map_tool_helper = {


    codeAddress :function ( address) {
      geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          try{
            gmap.fitBounds(results[0].geometry.bounds);

          } catch(e){  // possibly there is not bounds
            console.error(e);
            gmap.setCenter(results[0].geometry.location);
          }
        } else {
          // alert("Geocode was not successful for the following reason: " + status);
          $(".errormessage-container").removeClass("hidden");
          $(".errormessage-container").find(".alert-danger.alert").text("Failure in searching: \"" + address +"\", "+ status);
        }
      });
    },

    convertPaths:function(MVCArray, tbr_a){
      var ClassRef = this;
      console.log("asdf");
      if ( MVCArray.getAt(0).hasOwnProperty("lat")  ){
        // arrived deepest Array level
        MVCArray.forEach(function (element, index){
          tbr_a.push( ClassRef.convertGoogleLatLngToGeoJLonLat(MVCArray.getAt(index)));
        });
        // assuming above forEach is blocking
        tbr_a.push( ClassRef.convertGoogleLatLngToGeoJLonLat(MVCArray.getAt(0))  );
      }
      else{
        MVCArray.forEach( function (element, index){
          tbr_a[index] = [];
          ClassRef.convertPaths(element, tbr_a[index]);
        });
      }
      return tbr_a;
    },
    convertGoogleLatLngToGeoJLonLat: function ( googleLatLng){
      return [Number(googleLatLng.lng().toFixed(6)), Number(googleLatLng.lat().toFixed(6))];
    },

    getTotalAreaOf: function (googleMapPolygon){
      var paths = googleMapPolygon.getPaths();
      var i = 0;
      var sum = 0;
      for( i =0; i < paths.getLength(); i++){
        if (i ===0){
          sum = Math.abs(spherical.computeSignedArea(paths.getAt(i)) );
        }else {
          sum -= Math.abs(spherical.computeSignedArea(paths.getAt(i)) );
        }
      }
      return sum;
    },
    geoJsonize:function(googleMapShapeObject , type){
      // type can be "polygon"
      var ClassRef = this;
      if (type === "polygon")
      {
        var tempGeoJPolygon = 
            {
               "type":"Feature",
               "geometry":{
                  "type":"Polygon",
                  "coordinates":[
                     [
                        [100.0,0.0],
                        [101.0,0.0],
                        [101.0,1.0],
                        [100.0,1.0],
                        [100.0,0.0]
                     ],
                     [
                        [100.2,0.2],
                        [100.5,0.0],
                        [100.5,1.0],
                        [100.2,0.2]
                     ]
                  ]
               },
               "properties":{
               }
            };

        tempGeoJPolygon.geometry.coordinates = ClassRef.convertPaths(googleMapShapeObject.getPaths(), []);
        if (googleMapShapeObject.landusage)
          tempGeoJPolygon.properties.landusage = googleMapShapeObject.landusage;
        if (googleMapShapeObject.treatment)
          tempGeoJPolygon.properties.treatment = googleMapShapeObject.treatment;
        // console.log(JSON.stringify(tempGeoJPolygon));
        return tempGeoJPolygon;
      }
    }

  }; // end of map_tool_helper




  /*geosearch processing*/
  $("#map-input-geosearch").keyup(function(e){
    var code = e.which; // recommended to use e.which, it's normalized across browsers
    if(code===13)e.preventDefault();
    if(code===13){
      console.log("enter");
      $("#map-input-geosearch-btn").click();
    } 
  });
  $("#map-input-geosearch-btn").click(function (){
    $(".errormessage-container").addClass("hidden");
    var input = $("#map-input-geosearch").val();
    if (!input){
      return;
    }
    map_tool_helper.codeAddress(input);

  });


});