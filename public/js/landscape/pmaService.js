//////////////////////SERVICE MODULE///////////////////////////////////////////////////////////////////////
// pmaServices module
var pmaServices = angular.module("pmaServices", ['polygonManagerApp']).factory("mapRelatedService", function pmaServiceFactoryFn(stateService, $rootScope){
  /*beginning of normal file */
  var mapcover = initMapCover( 'mapcover', 'mapcover-map' ,{
    draggingCursor:"move",
    draggableCursor:"auto",
    center: {lat: 30.62060000, lng: -96.32621},
    zoom: 16,
    zoomControl:false,    //left side
    panControl:false,     //left top corner: 
    tilt:0,
    // mapTypeControl:false  //right top corner: "map|satellite"
    mapTypeControlOptions: {
      // style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.TOP_RIGHT
    }
  });
  var temp_startmarker = new google.maps.Marker({  // used to mark head of path drawing
    icon:{
      path: google.maps.SymbolPath.CIRCLE,
      scale: 3,
      strokeColor:'#FF0000'
    }
  });
  var gmap = mapcover.model.get("map");

  var drawingPath = new google.maps.Polyline({
    path: [],
    geodesic: false,
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 2,
    map: gmap
  });
  // handling polygon drawing
  gmap.addListener('click', function mapClkCb (event){
    if (stateService.getStatus() === "polygondrawing"){
      drawingPath.getPath().push(event.latLng)
      if (drawingPath.getPath().getLength() === 1){
        temp_startmarker.setPosition(event.latLng);
        temp_startmarker.setMap(gmap);
      }
    }
  });

  temp_startmarker.addListener('click',function onTempStartMarkerClicked(){
    if ( stateService.getStatus() === 'polygondrawing' || stateService.getStatus() === 'arearemoving') {
      // following event is listened at pmaToolPanelCtrl, because pmaToolPanelCtrl has context of mapRelatedService and mapRelatedFunctionsService
      $rootScope.$broadcast('polylineFinishing');
    }
  });
  return {
    mapcover: mapcover,
    gmap: gmap,
    geocoder: new google.maps.Geocoder(),
    temp_startmarker: temp_startmarker,
    drawingPath: drawingPath,
    spherical: google.maps.geometry.spherical,
    activePolygon: null,
    saved_polygons: [],
    polygons:[],
    isOnlyOnePolygon: function() {
      return this.polygons.length === 1;
    }
  };
})
.factory("mapRelatedFunctionsService", function ($rootScope){
  function setActive(toBeActivatedPolygon, mapRelatedService, stateService) {
    mapRelatedService.activePolygon = toBeActivatedPolygon;
    var currentStatus = stateService.getStatus();
    switch(currentStatus) {
      case "shapeediting":
        if (!toBeActivatedPolygon.getEditable()) {
          angular.forEach(mapRelatedService.polygons, function(polygon) {
            polygon.setEditable(false);
          });
          mapRelatedService.activePolygon.setEditable(true);
        }
        break;
      case "treatmentsetting":
        // pmaModalsCtrl is listening to this method
        $rootScope.$broadcast('shouldOpenTreatment', {
          content: "hehe"
        });
        break;
      default:

    } 
  }

  function polygonLeftClickedCB (event, mapRelatedService, stateService) {
    var this_polygon = this;  // save this reference
    setActive(this_polygon, mapRelatedService, stateService);  // gurantee current polygon is active and in correct mode
    // console.log("polygon is left clicked");
    // console.log(this_polygon);
    if ( stateService.getStatus() === "arearemoving") {
      mapRelatedService.drawingPath.getPath().push(event.latLng);
      if ( mapRelatedService.drawingPath.getPath().getLength() === 1){
        mapRelatedService.temp_startmarker.setPosition(event.latLng);
        mapRelatedService.temp_startmarker.setMap(mapRelatedService.gmap);
      }
    } 
  }

  function transformPolylineIntoPolygon (mapRelatedService, stateService){
    if (mapRelatedService.drawingPath.getPath().getLength() < 3){
      console.log("to be transformed drawingPath has less than 3 vertice, cannot transform.");
      return;
    }
    var temp_polygon = new google.maps.Polygon({
      path: mapRelatedService.drawingPath.getPath(),
      geodesic: false,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2,
      editable: false
    });
    temp_polygon.setMap(mapRelatedService.gmap);
    temp_polygon.addListener("click",  function ( event ){
      polygonLeftClickedCB.call(this, event, mapRelatedService, stateService); // 
    });
    temp_polygon.addListener("rightclick", function () { 
      alert("right clicked");
    });
    temp_polygon.properties = {};
    // reset polyline
    mapRelatedService.drawingPath.setPath([]);
    mapRelatedService.temp_startmarker.setMap(null);
    mapRelatedService.activePolygon = temp_polygon; // byDefault the newest generated polygon is the active polygon
    mapRelatedService.polygons.push(temp_polygon);
  }

  function transformPolylineIntoRemovedArea(mapRelatedService, stateService){
    var drawingPath = mapRelatedService.drawingPath;
    if (drawingPath.getPath().getLength() < 3){
      console.log("to be transformed drawingPath has less than 3 vertice, cannot transform.");
    }
    var paths = mapRelatedService.activePolygon.getPaths();
    var direction0  =  mapRelatedService.spherical.computeSignedArea(paths.getAt(0));
    var direction1 = mapRelatedService.spherical.computeSignedArea( drawingPath.getPath() );
    if (direction1 * direction0 > 0) {
      var temp_latlngs2 = []
      while (drawingPath.getPath().getLength() >0){
        temp_latlngs2.push(drawingPath.getPath().pop());
      }
      drawingPath.setPath(temp_latlngs2);
    }
    paths.push( drawingPath.getPath());
    // reseting
    drawingPath.setPath([]);
    mapRelatedService.temp_startmarker.setMap(null);
  }
  // dependency fufilled
  function getTotalAreaOf(googleMapPolygon, mapRelatedService) {
    var paths = googleMapPolygon.getPaths();
    var i = 0;
    var sum = 0;
    var pathslen = paths.getLength();
    for( i = 0; i < pathslen; i++){
      if (i === 0){
        sum = Math.abs(mapRelatedService.spherical.computeSignedArea(paths.getAt(i)) );
      }else {
        sum -= Math.abs(mapRelatedService.spherical.computeSignedArea(paths.getAt(i)) );
      }
    }
    // console.log(sum);
    return sum;
  }
  // dependency fufilled
  function convertGoogleLatLngToGeoJLonLat( googleLatLng) {
    return [Number(googleLatLng.lng().toFixed(6)), Number(googleLatLng.lat().toFixed(6))];
  }
  // dependency fufilled
  function geoLatLngToGoogleLatLng(geoLatLngArray) {
    var tmpLatLng = new google.maps.LatLng( geoLatLngArray[1], geoLatLngArray[0] );
    return tmpLatLng;
  }

  function convertToMVCArray(array, index_at_parent, parent_array) {
    var ClassRef = this;
    if ( !Array.isArray(array[0]) ) {
      parent_array[index_at_parent] = geoLatLngToGoogleLatLng(array);
    } else { // var len = array[0][0]
      array.forEach( function (element, index, ar){
        convertToMVCArray(element, index, ar);
        if (typeof ar[0].lat === 'function') {
          if (typeof index_at_parent !== 'undefined' && index === array.length - 1){
            parent_array[index_at_parent] = new google.maps.MVCArray(ar.slice(0,index));
          }
        } else {
          if (typeof index_at_parent !== 'undefined' && index === array.length - 1){
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
      return to_be_return;
    }
  }
  // dependency fufilled
  function convertPaths(MVCArray, tbr_a) {
    if ( MVCArray.getAt(0).hasOwnProperty("lat")  ){
      // arrived deepest Array level
      MVCArray.forEach(function (element, index){
        tbr_a.push( convertGoogleLatLngToGeoJLonLat(MVCArray.getAt(index)));
      });
      // assuming above forEach is blocking
      tbr_a.push( convertGoogleLatLngToGeoJLonLat(MVCArray.getAt(0))  );
    }
    else{
      MVCArray.forEach( function (element, index){
        tbr_a[index] = [];
        convertPaths(element, tbr_a[index]);
      });
    }
    return tbr_a;
  }
  // dependency fufilled
  function geoJsonize(googleMapShapeObject, type, mapRelatedService) {
    if (type && typeof type !== "string") {
      throw "type should be supplied as string";
      return null;
    }
    if ( !mapRelatedService) {
      throw "mapRelatedService should be supplied";
      return null;
    }
    if (type.toLowerCase() != "polygon") {
      console.error("cannot convert non polygon typed MVCObject");
      return null;
    }
    var tempGeoJPolygon =  {
      "type":"Feature",
      "geometry":{
      "type":"Polygon",
      "coordinates":[]
      },
      "properties":{
      }
    };
    tempGeoJPolygon.geometry.coordinates = convertPaths(googleMapShapeObject.getPaths(), []);
    var temp_bounds = googleMapShapeObject.my_getBounds();
    angular.extend(tempGeoJPolygon.properties, googleMapShapeObject.properties);
    tempGeoJPolygon.properties.bounds ={  
      sw:{ lat:temp_bounds.getSouthWest().lat(), lng: temp_bounds.getSouthWest().lng()},
      ne:{ lat:temp_bounds.getNorthEast().lat(), lng: temp_bounds.getNorthEast().lng()}
    };
    tempGeoJPolygon.properties.total_area =  getTotalAreaOf(googleMapShapeObject, mapRelatedService);
    tempGeoJPolygon.properties.environment_map = {};
    tempGeoJPolygon.properties.environment_map.tilt = mapRelatedService.gmap.getTilt();
    tempGeoJPolygon.properties.environment_map.MapTypeId = mapRelatedService.gmap.getMapTypeId();
    return tempGeoJPolygon;
  }

  function deGeoJsonize( Geojson_string, mapRelatedService) {
    var gmap = mapRelatedService.gmap;
    var temp_geojson = JSON.parse(Geojson_string);
    // Key step is covert JS Geojson latlng array into MVCArray instance
    var temp_MVCArray = convertToMVCArray(temp_geojson.geometry.coordinates);
    var temp_polygon = new google.maps.Polygon({
      paths:temp_MVCArray,
      geodesic: false,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2,
      editable: false
    });
    temp_polygon.properties = {};
    angular.extend(temp_polygon.properties, temp_geojson.properties);
    temp_polygon.setMap(gmap);
    // temp_polygon.addListener("click",  polygonClicked);  // TODO
    // temp_polygon.addListener("rightclick", polygonRightClicked); //TODO
    temp_polygon._id = temp_geojson._id;
    mapRelatedService.polygons.push(temp_polygon);
    var bounds = new google.maps.LatLngBounds(temp_polygon.properties.bounds.sw, temp_polygon.properties.bounds.ne);
    gmap.fitBounds(bounds);
    return temp_polygon;
  }
  function saveAndGenResult(this_polygon, mapRelatedService) {
    var geoJsonPolygon = geoJsonize(this_polygon,"polygon", mapRelatedService);
    $('input#geojson').val(JSON.stringify(geoJsonPolygon));
    if (this_polygon.saved === true){
      return alert("This polygon has already been saved, please go to your user dashboard to check");
    }
    return geoJsonPolygon;
    // this_polygon.saved = true;
    // var $tempForm = $('form#treatment');
    // $.ajax({
    //   type: "POST",
    //   url: $tempForm.attr('action'),
    //   data: $tempForm.serialize(),
    //   success: function(creationApiResult){
    //     // location.href = creationApiResult.treatmentUrl;
    //   },
    //   error: function(jqXHR, textStatus, errorThrown){
    //     alert(errorThrown);
    //   }
    // });
  }

  function renderPolygonProperly(to_be_rendered_polygon, mapRelatedService) {
    console.log("render properly");
    var gmap = mapRelatedService.gmap;
    if (to_be_rendered_polygon.properties.hasOwnProperty("type_of_use")){
      switch(to_be_rendered_polygon.properties["type_of_use"]){
        case "agricultural":
        to_be_rendered_polygon.setOptions({
          fillColor:"#0000FF"
        });
        break;
        case "home":
        to_be_rendered_polygon.setOptions({
          fillColor:"#FFFF00"
        });
        break;
        case "professional":
        to_be_rendered_polygon.setOptions({
          fillColor:"#33CC33"
        });
        break;
        default:

      }
    }
    // console.log(to_be_rendered_polygon.properties);
    if (to_be_rendered_polygon.properties.environment_map) {
      var environment_map = to_be_rendered_polygon.properties.environment_map;
      gmap.setTilt(environment_map.tilt);
      gmap.setMapTypeId(environment_map.MapTypeId);
    }
  }

  return {
    polygonLeftClickedCB: polygonLeftClickedCB,
    transformPolylineIntoPolygon: transformPolylineIntoPolygon,
    transformPolylineIntoRemovedArea: transformPolylineIntoRemovedArea,
    getTotalAreaOf: getTotalAreaOf,
    convertGoogleLatLngToGeoJLonLat: convertGoogleLatLngToGeoJLonLat,
    geoLatLngToGoogleLatLng: geoLatLngToGoogleLatLng,
    convertPaths: convertPaths,
    geoJsonize: geoJsonize, 
    saveAndGenResult: saveAndGenResult,
    deGeoJsonize: deGeoJsonize,
    renderPolygonProperly: renderPolygonProperly
  };
});


pmaServices.run(function (mapRelatedService, mapRelatedFunctionsService){
  console.log("pmaServices run callback, just make sure mapRelatedService run first, so I declred dependency on mapRelatedService");
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
    if (bounds.isEmpty()){
      alert("bounds should not be empty")
    }
    return bounds;
  }

  var initialGeoJsonStr = $("meta[name=target-polygon]").attr("content");
  if (initialGeoJsonStr && initialGeoJsonStr.search("Feature") >= 0 ) {
    mapRelatedFunctionsService.renderPolygonProperly(
      mapRelatedFunctionsService.deGeoJsonize(initialGeoJsonStr, mapRelatedService), 
      mapRelatedService
    );
  }
  // google.maps.Polygon.prototype
});