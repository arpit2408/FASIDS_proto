// completely use angularJS to refactor this JS application
var polygonManagerApp = angular.module("polygonManagerApp", ["pmaServices"]);

polygonManagerApp.directive("toolButton", function factoryFn(stateService){
  // the scope shoudl be scope of pmaDefaultCtrl
  return function linkFn(scope, element, attrs) {
    var targetStatus = attrs["targetStatus"];
    element.on("click", function (e) {
      stateService.setStatus(targetStatus !== stateService.getStatus() ? targetStatus : null );
    });
    scope.$watch(
      function (scope){
        return stateService.getStatus() === targetStatus;
      }, 
      function (isActive, oldValue){
        if (isActive) {
          element.addClass("active");
        } else {
          element.removeClass("active");
        }
      }
    );
  }
});

// pmaDefaultCtrl means "polygonManagerApp Default Controller"
polygonManagerApp.controller("pmaDefaultCtrl", function ($scope) {
  // some default javascript I put them here
  console.log("running block of default controller.");

});
polygonManagerApp.service("stateService", function($rootScope) {
  var ss = this;
  var panelStatusOptions = ["polygondrawing", "arearemoving", "shapeediting", 
  "treatmentsetting", "productlisting", "resetting"];
  var panelStatus = null;
  ss.setStatus =  function(toBeSetStatus) {
    if (toBeSetStatus === null) {
      panelStatus = null;
      $rootScope.$apply();
      return;
    }
    toBeSetStatus = toBeSetStatus.toLowerCase();
    if (panelStatusOptions.indexOf(toBeSetStatus) <0 ) {
      console.error("cannot set panel into status other statuses mentioned in panelStatusOptions array.");
      return ;
    }
    panelStatus = toBeSetStatus;
    $rootScope.$apply();
    console.log("stateService._panelStatus: " + panelStatus);
    return;  
  };
  ss.getStatus = function() {
    console.log("getStatus(): " + panelStatus);
    return panelStatus;
  };
});

polygonManagerApp.controller("pmaToolPanelCtrl", function($scope, stateService,mapRelatedService, mapRelatedFunctionsService) {
  console.log("loading pmaToolPanelCtrl.");
  $scope.$watch(
    function() {
      return stateService.getStatus();
    }, 
    function (newStatus, oldStatus) {
    switch (oldStatus){
    case "polygondrawing":
      // status changed from polygondrawing to something else
      mapRelatedFunctionsService.transformPolylineIntoPolygon(mapRelatedService, stateService);
      break;
    case "arearemoving":
      mapRelatedFunctionsService.transformPolylineIntoRemovedArea(mapRelatedService, stateService);
      break;

    case "shapeediting":
      if (mapRelatedService.activePolygon) {
        mapRelatedService.activePolygon.setEditable(false);
      }
      break;
    }  // switch (oldStatus)

    switch(newStatus) {
    case "shapeediting":
      if (mapRelatedService.isOnlyOnePolygon()) {
        mapRelatedService.activePolygon = mapRelatedService.polygons[0];
      } else {
        // Possibly I need to promise
      }
      mapRelatedService.activePolygon.setEditable(true);
      break;
    default:
    }

  });  // end of $watch();

});



































//////////////////////SERVICE MODULE///////////////////////////////////////////////////////////////////////

// pmaServices module
var pmaServices = angular.module("pmaServices", ['polygonManagerApp']).factory("mapRelatedService", function pmaServiceFactoryFn(stateService){
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
      var statusReserved = stateService.getStatus();
      stateService.setStatus(null);
      stateService.setStatus(statusReserved);
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
.factory("mapRelatedFunctionsService", function (){
  function polygonLeftClickedCB (event, mapRelatedService, stateService) {
    var this_polygon = this;  // save this reference
    mapRelatedService.activePolygon = this;
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
  return {
    polygonLeftClickedCB: polygonLeftClickedCB,
    transformPolylineIntoPolygon: transformPolylineIntoPolygon,
    transformPolylineIntoRemovedArea: transformPolylineIntoRemovedArea
  };
});


pmaServices.run(function (mapRelatedService){
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
});