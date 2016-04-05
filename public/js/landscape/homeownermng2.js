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
polygonManagerApp.controller("pmaDefaultCtrl", function ($scope, mapcoverService) {
  // some default javascript I put them here
  console.log("running block of default controller.");
  (function settingMapContainerHeight(){
    // The reason might because the nav bar gives padding 70,
    $("#mapcover").height($(window).height() - 1 * $(".navbar").height());
  })();
});

polygonManagerApp.controller("pmaToolPanelCtrl", function($scope) {
  console.log("loading pmaToolPanelCtrl.");
  // can only set current status of panel at following state
  var panelStatusOptions = ["polygondrawing", "shapeediting", "treatmentsetting", "productlisting", "resetting"];
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
});



// pmaServices module
var pmaServices = angular.module("pmaServices", []).factory("mapcoverService", function pmaServiceFactoryFn(){
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
  return mapcover;
});