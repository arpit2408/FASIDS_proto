$(document).ready(function(){
  var glblprefix = $("#homeownermng-src").data("glblprefix");
  (function settingMapContainerHeight(){
    // The reason might because the nav bar gives padding 70,
    $("#mapcover").height($(window).height() - 1 * $(".navbar").height());
  })();    
  google.maps.Polygon.prototype.my_getBounds=function(){
      var bounds = new google.maps.LatLngBounds();
      this.getPath().forEach(function(element,index){
        // console.log("DEBUGG:" + element.toString());
        bounds.extend(element);
      })
      if (bounds.isEmpty()){alert("FK")}
      // console.log(bounds.toString());
      // console.log(bounds.getCenter().toString());
      return bounds;
  }
  var page_status = JSON.parse($("meta[name=\"page_status\"]").attr("content"));

  // map_tool_register state updated by map tool panel buttons 
  $("#map-tools-box .btn:not(:last)").click( function mapToolOpUpdating(){
    var target_property = $(this).attr("data-operation");
    if (map_tool_register.get(target_property) === true){
      map_tool_register.set(target_property,false);
    } else {
      map_tool_register.clearAllStatus();
      map_tool_register.set(target_property, true);
    }
  });
  $("#map-tool-cancel").click(function mapToolCanceling (){
    map_tool_register.clearAllStatus();
    drawingPath.setPath([]);
    for (var i = 0; i < polygons.length; i++){
      polygons[i].setMap(null);
    }
    polygons = [];
  });  

  /*beginning of normal file */
  var mapcover = initMapCover( 'mapcover', 'mapcover-map' ,    { 
      draggingCursor:"move",
      draggableCursor:"auto",
      center: {lat: 30.62060000, lng: -96.32621},
      zoom: 14,
      zoomControl:false,    //left side
      panControl:false,     //left top corner: 
      tilt:0,
      // mapTypeControl:false  //right top corner: "map|satellite"
      mapTypeControlOptions: {
        // style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT
      }
  });


  // preparing modal
  // The preparation modal is one ng app, I do not know why there is loading error when initing angularAPPs
  // ( function (){
  //   var preparationModal = angular.module("preparationModal",['ngRoute']);
  //   preparationModal.controller("preparationModalCtrl", function ($scope){
  //     $scope.title  = "test";
  //   });

  // })();


  $("#save-prepared-treatment").click(function savePreparedTreatment(){
    var target_polygon = window.target_polygon;
    var formdata = $("form#purpose").serializeArray();
    console.log(JSON.stringify(formdata));
    var data = {};
    _.each(formdata, function(element){
      var value = _.values(element);
      if ( value[1].match(/^\d+(\.\d+)*$/g ) ){ value[1] = Number(value[1]); } // whole string match number pattern can be casted into string, otherwise, keep string
      data[value[0]] = value[1];
    });
    if (data['mound_number']) delete data['mound_number'];
    console.log(data);
    if (target_polygon !== null ){
      _.extendOwn(target_polygon.properties, data);
      map_tool_register.renderPolygonProperly(target_polygon);
      target_polygon = null;
      window.target_polygon = null;
      $("#purpose-modal").modal("hide");
    } else{
      throw "target_polygon is null when savePreparedTreatment() is invoked";
    }
  });

  var gmap = mapcover.model.get("map");
  var geocoder = new google.maps.Geocoder();
  var temp_startmarker = new google.maps.Marker({  // used to mark head of path drawing
    icon:{
      path: google.maps.SymbolPath.CIRCLE,
      scale: 3,
      strokeColor:'#FF0000'
    }
  });
  // by clicking starting-marker, finish drawing of polygon or holes inside polygons
  temp_startmarker.addListener('click',function onTempStartMarkerClicked(){
    if ( map_tool_register.get("map_tool_area_drawing") === true ) {
      map_tool_register.set("map_tool_area_drawing",false);
    } else if ( map_tool_register.get("map_tool_holing") === true ) {
      map_tool_register.set("map_tool_holing",false);
    }
  });
  var polygons = [];
  var saved_polygons = [];
  var spherical = google.maps.geometry.spherical;  // computing library
  var drawingPath = new google.maps.Polyline({
    path: [],
    geodesic: false,
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 2,
    map:gmap
  });
  window.target_polygon = null;  // when drawing circle on certain polygon, this polygon will be the polygon which is being operated
  var deleteMenu = new DeleteMenu();  // DeleteMenu is defined in DeleteMenu.js
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
    var target_polygon = this_polygon;
    window.target_polygon = this_polygon;
    if (map_tool_register.get("map_tool_holing") === true ) {
      target_polygon = this_polygon;
      drawingPath.getPath().push(event.latLng);
      if ( drawingPath.getPath().getLength() === 1){
        temp_startmarker.setPosition(event.latLng);
        temp_startmarker.setMap(gmap);
      }
    } else if  ( map_tool_register.get("map_tool_editpolygon") === true) {
      this_polygon.setEditable(true);
    } else if ( map_tool_register.get("map_tool_setproperties") === true){
      // target_polygon = this_polygon;
      // modal show, reset options 
      map_tool_register.fillForm($('form#purpose'), target_polygon);
      $("#purpose-modal").modal("show");
    } else if ( map_tool_register.get("map_tool_genresult") === true){
      if(!page_status.isAuthenticated){
        return alert("Please sign in before submit this polygon to server\n I will make this alert look nicer in future");
      }
      if (page_status.model_op==="patch"){
        location.href = glblprefix + "/landscape/treatment/" + this_polygon._id;
        return;
      }
      var geoJsonPolygon = map_tool_helper.geoJsonize( this_polygon,"polygon");
      $('input#geojson').val(JSON.stringify(geoJsonPolygon));
      if (this_polygon.saved === true){
        return alert("This polygon has already been saved, please go to your profile to check");
      }
      this_polygon.saved = true;
      $('form#treatment').submit(); // commit it for for dubug
    } else if (map_tool_register.get("map_tool_save") === true){
      var geoJsonPolygon = map_tool_helper.geoJsonize( this_polygon,"polygon");
      $('form#patch input').val(JSON.stringify(geoJsonPolygon) );
      console.log(JSON.stringify(geoJsonPolygon)  );
      $('form#patch').submit();
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
      map_tool_setproperties:false,
      map_tool_genresult:false,
      map_tool_save:false
    },
    clearAllStatus:function(){
      var ClassRef = this;
      // ClassRef.keys() return an array: ["map_tool_area_drawing", "map_tool_holing", "map_tool_editpolygon", "map_tool_setproperties", "map_tool_genresult"]
      _.each(ClassRef.keys(), function iteratee(element, index, list){
        ClassRef.set(element, false);
      });
    },

    renderPolygonProperly: function( to_be_rendered_polygon){
      if (to_be_rendered_polygon.properties.hasOwnProperty("landusage")){
        switch(to_be_rendered_polygon.properties["landusage"]){
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
      console.log(to_be_rendered_polygon.properties);
      if (to_be_rendered_polygon.properties.environment_map){
        var environment_map = to_be_rendered_polygon.properties.environment_map;
        console.log("setting");
        gmap.setTilt(environment_map.tilt);
        gmap.setMapTypeId(environment_map.MapTypeId);
      }
    },

    fillForm: function(jq_modal_form, target_polygon){
      var ClassRef = this;
      jq_modal_form.find("input[type=radio]").prop("checked",false);
      jq_modal_form.find("input[type=number], input[type=text], textarea").val("");
      if (target_polygon.properties.landusage){
        $('input[name=landusage][value='+ target_polygon.properties.landusage+']').prop("checked", true);
      } 
      if (target_polygon.properties.treatment){
        $('input[name=treatment][value='+ target_polygon.properties.treatment+']').prop("checked", true);
      }

      var omitted_properties = _.omit(target_polygon.properties, ["landusage","treatment"]);
      _.each(omitted_properties, function (value, key, obj){
        if (key==="mound_density") {
          if ($('input[name='+key+']')){
            $('input[name='+key+']').val(value / 10.763910); 
            $('#mound-number-input').val(map_tool_helper.getTotalAreaOf(target_polygon) * value );
            return;
          }
        }
        if ($('input[name='+key+']')){
          $('input[name='+key+']').val(value);
        }
        if ( $('textarea[name='+key+']') ){
          $('textarea[name='+key+']').val(value);
        }
      });
      if($('#broadcast-radio').is(":checked")){
        $("#mound-density-input").prop('disabled', true);
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
            temp_polygon.properties = {};
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
            var paths = window.target_polygon.getPaths();
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

      this.on("change:map_tool_setproperties", function (){
        if (ClassRef.get("map_tool_setproperties")  === true){
          $("#map-tool-setproperties").addClass("active");
        } else {
          $("#map-tool-setproperties").removeClass("active");
        }    
      });

      this.on("change:map_tool_genresult", function (){
        if (ClassRef.get("map_tool_genresult")  === true){
          $("#map-tool-genresult").addClass("active");
        } else {
          $("#map-tool-genresult").removeClass("active");
        }    
      });
      this.on("change:map_tool_save", function (){
        if (ClassRef.get("map_tool_save")  === true){
          $("#map-tool-save").addClass("active");
        } else {
          $("#map-tool-save").removeClass("active");
        }    
      });

    }
  } ) ) ();  // initialize a new 

  var map_tool_helper = {
    codeAddress :function ( address) {
      geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          try{
            gmap.fitBounds(results[0].geometry.viewport);

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

    /*I want to write it in a more beautiful way*/
    convertToMVCArray : function (array, index_at_parent, parent_array){
      var ClassRef = this;
      if ( !Array.isArray(array[0]) ){
          parent_array[index_at_parent] = ClassRef.geoLatLngToGoogleLatLng(array);
      }
      else{
        // var len = array[0][0]
        array.forEach( function (element, index, ar){
          ClassRef.convertToMVCArray(element, index, ar);
          if (typeof ar[0].lat === 'function'){
            if (typeof index_at_parent !== 'undefined' && index === array.length -1){
              parent_array[index_at_parent] = new google.maps.MVCArray(ar.slice(0,index));
            }
          } else {
            if (typeof index_at_parent !== 'undefined' && index === array.length -1){
              parent_array[index_at_parent] = new google.maps.MVCArray(ar);
            }
          }
        });
      }
      if (typeof index_at_parent !== 'undefined')
        return array;
      else{
        var to_be_return = new google.maps.MVCArray();
        array.forEach( function(el, index, ar){
          to_be_return.push(el);
        });
        // console.log(to_be_return);
        return to_be_return;
      }
    },
  
    convertPaths:function(MVCArray, tbr_a){
      var ClassRef = this;
      // console.log("asdf");
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
    geoLatLngToGoogleLatLng: function (geoLatLngArray){
     
      var tmpLatLng = new google.maps.LatLng( geoLatLngArray[1], geoLatLngArray[0] );
      // console.log(tmpLatLng.toString());
      return tmpLatLng;
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
                  "coordinates":[]
               },
               "properties":{
               }
            };
        tempGeoJPolygon.geometry.coordinates = ClassRef.convertPaths(googleMapShapeObject.getPaths(), []);

        tempGeoJPolygon.properties.total_area =  ClassRef.getTotalAreaOf(googleMapShapeObject);

        var temp_bounds = googleMapShapeObject.my_getBounds();
        tempGeoJPolygon.properties.bounds ={  
          sw:{ lat:temp_bounds.getSouthWest().lat(), lng: temp_bounds.getSouthWest().lng()},
          ne:{ lat:temp_bounds.getNorthEast().lat(), lng: temp_bounds.getNorthEast().lng()}
        };
        _.extendOwn(tempGeoJPolygon.properties, googleMapShapeObject.properties);
        tempGeoJPolygon.properties.environment_map = {};
        tempGeoJPolygon.properties.environment_map.tilt = gmap.getTilt();
        tempGeoJPolygon.properties.environment_map.MapTypeId = gmap.getMapTypeId();
        return tempGeoJPolygon;
      }
    },
    deGeoJsonize:function( Geojson_string){
      var temp_geojson = JSON.parse(Geojson_string);

      // Key step is covert JS Geojson latlng array into MVCArray instance
      var ClassRef = this; // map_tool_helper
      var temp_MVCArray = ClassRef.convertToMVCArray(temp_geojson.geometry.coordinates);
      

      var temp_polygon = new google.maps.Polygon({
        paths:temp_MVCArray,
        geodesic: false,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
        editable: false
      });
      temp_polygon.properties = {};
      _.extendOwn(temp_polygon.properties, temp_geojson.properties);
      temp_polygon.setMap(gmap);
      temp_polygon.addListener("click",  polygonClicked);
      temp_polygon.addListener("rightclick", polygonRightClicked);
      temp_polygon._id = temp_geojson._id;
      polygons.push( temp_polygon);
      map_tool_register.renderPolygonProperly(temp_polygon);
      var bounds = new google.maps.LatLngBounds(temp_polygon.properties.bounds.sw, temp_polygon.properties.bounds.ne);
      gmap.fitBounds(bounds);
    }

  }; // end of map_tool_helper

  if (page_status.model_op === "patch")
    map_tool_helper.deGeoJsonize( $('meta[name="target-polygon"]').attr("content") );

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



  $('#broadcast-radio, #imt-radio').change(function(){
    if($('#broadcast-radio').is(":checked")){
      $("#mound-density-input").prop('disabled', true);
      $("#mound-number-input").prop('disabled', true);
    } else {
      $("#mound-density-input").prop('disabled', false);
      $("#mound-number-input").prop('disabled', false);
    }
  });
  $('#mound-density-input').keyup(function (){
    $('#mound-number-input').val( $('#mound-density-input').val() * 10.76391045 *  map_tool_helper.getTotalAreaOf( window.target_polygon) );
  });
  $('#mound-number-input').keyup(function (){
    $('#mound-density-input').val( $('#mound-number-input').val() / 10.76391045 /  map_tool_helper.getTotalAreaOf( window.target_polygon) );
  });
});

