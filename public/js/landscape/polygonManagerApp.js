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

// This one will be run first
polygonManagerApp.service("stateService", function($rootScope) {
  console.log("running stateService singleton constructor callback");
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
      }
      if (mapRelatedService.activePolygon) {
        mapRelatedService.activePolygon.setEditable(true);
      } 
      break;
    default:
    }

  });  // end of $watch();

});

