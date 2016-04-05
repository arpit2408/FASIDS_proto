// completely use angularJS to refactor this JS application
var polygonManagerApp = angular.module("polygonManagerApp", ["pmaServices"]);

polygonManagerApp.directive("toolButton", function factoryFn(){
  // the scope shoudl be scope of pmaDefaultCtrl
  return function linkFn(scope, element, attrs) {
    var targetStatus = attrs["targetStatus"];
    element.on("click", function (e) {

      scope.setStatus(targetStatus !== scope.panelStatus ? targetStatus : null );
    });
    scope.$watch(
      function (scope){
        return scope.panelStatus === targetStatus;
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

polygonManagerApp.controller("pmaToolPanelCtrl", function($scope, mapRelatedService, mapRelatedFunctionsService) {
  console.log("loading pmaToolPanelCtrl.");
  // can only set current status of panel at following state
  var panelStatusOptions = ["polygondrawing", "arearemoving", "shapeediting", "treatmentsetting", "productlisting", "resetting"];
  $scope.panelStatus = null;
  // boolean function, will return true if successfully set panel status, otherwise, return false
  $scope.setStatus = function(toBeSetStatus) {
    if (toBeSetStatus === null) {
      $scope.panelStatus = toBeSetStatus;
      $scope.$digest();
      console.log("cancel panelStatus");
      return true;
    }
    toBeSetStatus = toBeSetStatus.toLowerCase();
    if (panelStatusOptions.indexOf(toBeSetStatus) <0 ) {
      console.log("cannot set panel into status other statuses mentioned in panelStatusOptions array.");
      return false;
    }
    $scope.panelStatus = toBeSetStatus;
    $scope.$digest();  // I have to this function myself
    console.log("$scope.panelStatus:" + $scope.panelStatus);
    return true;
  };

  $scope.$watch("panelStatus", function (newStatus, oldStatus) {
    switch (oldStatus){
    case "polygondrawing":
      // status changed from polygondrawing to something else
      // turn current area into polygon
      if (mapRelatedService.drawingPath.getPath().getLength() > 2){
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
          mapRelatedFunctionsService.polygonLeftClickedCB.call(this,event, mapRelatedService, $scope); // 
        });
        temp_polygon.addListener("rightclick", function () { 
          alert("right clicked");
        });
        temp_polygon.properties = {};
        mapRelatedService.polygons.push(temp_polygon);
      }
      // reseting
      mapRelatedService.drawingPath.setPath([]);
      mapRelatedService.temp_startmarker.setMap(null);
      break;
    case "arearemoving":
      var drawingPath = mapRelatedService.drawingPath;
      if (drawingPath.getPath().getLength() > 2){
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
      }
      // reseting
      drawingPath.setPath([]);
      mapRelatedService.temp_startmarker.setMap(null);

      break;
    }

    if (oldStatus === "polygondrawing") {}

  });  // end of $watch();

  // handling polygon drawing
  mapRelatedService.gmap.addListener('click', function mapClkCb (event){
    if ($scope.panelStatus === "polygondrawing"){
      mapRelatedService.drawingPath.getPath().push(event.latLng)
      if (mapRelatedService.drawingPath.getPath().getLength() === 1){
        mapRelatedService.temp_startmarker.setPosition(event.latLng);
        mapRelatedService.temp_startmarker.setMap(mapRelatedService.gmap);
      }
    }
  });
});

polygonManagerApp.run(function ( mapRelatedService){
  console.log("polygonManagerApp run callback");
});


//////////////////////SERVICE MODULE///////////////////////////////////////////////////////////////////////

// pmaServices module
var pmaServices = angular.module("pmaServices", []).factory("mapRelatedService", function pmaServiceFactoryFn(){
  /*beginning of normal file */
  var mapcover = initMapCover( 'mapcover', 'mapcover-map' ,{
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
  return {
    mapcover: mapcover,
    gmap: gmap,
    geocoder: new google.maps.Geocoder(),
    temp_startmarker: temp_startmarker,
    drawingPath: drawingPath,
    spherical: google.maps.geometry.spherical,
    activePolygon: null,
    saved_polygons: [],
    polygons:[]
  };
})
.factory("mapRelatedFunctionsService", function (){
  function polygonLeftClickedCB (event, mapRelatedService, pmaToolPanelCtrlScope) {
    var this_polygon = this;  // save this reference
    mapRelatedService['activePolygon'] = this;
    // console.log("polygon is left clicked");
    // console.log(this_polygon);
    if (pmaToolPanelCtrlScope.panelStatus === "arearemoving") {
      mapRelatedService.drawingPath.getPath().push(event.latLng);
      if ( mapRelatedService.drawingPath.getPath().getLength() === 1){
        mapRelatedService.temp_startmarker.setPosition(event.latLng);
        mapRelatedService.temp_startmarker.setMap(mapRelatedService.gmap);
      }
    }
  }
  return {
    polygonLeftClickedCB: polygonLeftClickedCB
  };
});


pmaServices.run(function (mapRelatedService){
  console.log("pmaServices run callback, just make sure mapRelatedService run first");
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