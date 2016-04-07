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
      $rootScope.$applyAsync();  // changed from $apply() to $applyAsync()
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

polygonManagerApp.controller("pmaToolPanelCtrl", 
  function(
    $scope, $rootScope, 
    stateService,mapRelatedService, 
    mapRelatedFunctionsService) {
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
      case "treatmentsetting":
        break;
    }  // close switch (oldStatus)

    switch(newStatus) {
      case "shapeediting":
        if (mapRelatedService.isOnlyOnePolygon()) {
          mapRelatedService.activePolygon = mapRelatedService.polygons[0];
        }
        if (mapRelatedService.activePolygon) {
          mapRelatedService.activePolygon.setEditable(true);
        } 
        break;
      case "treatmentsetting":
        if (mapRelatedService.isOnlyOnePolygon()) {
          mapRelatedService.activePolygon = mapRelatedService.polygons[0];
        }
        if (mapRelatedService.activePolygon) {
          $rootScope.$broadcast('shouldOpenTreatment', {
            content: "hehe"
          });
        }
        break;
      default:
    }
  });  // end of $watch();

  // polylineFinishing event is triggerred at handlerFn of temp_startmarker.addListener('click', handlerFn)
  $scope.$on('polylineFinishing', function(event) {
    switch(stateService.getStatus()){
      case "polygondrawing":
        mapRelatedFunctionsService.transformPolylineIntoPolygon(mapRelatedService, stateService);
        break;
      case "arearemoving":
        mapRelatedFunctionsService.transformPolylineIntoRemovedArea(mapRelatedService, stateService);
        break;
    }
  });
});

polygonManagerApp.controller("pmaModalsCtrl", function($scope, stateService, mapRelatedService, mapRelatedFunctionsService){
  console.log("pmaModalsCtrl init()");
  var $treatmentModal = $("#treatment-modal");
  $scope.treatment = {
    polygon_name: null,
    address: null,
    notes: null,
    
    // total_area, // will be filled at saveAndGenResult()
    mound_density: null,
    mound_number: null,

    type_of_use: "home",
    control_method: null,
    usage: null,  // the usage here means the desired usage of fire ant product
    is_outdoor_land: null,
    need_organic: null,
    need_safe_for_pets: null

    // environment_map: null,
    // bounds,
    // owner,         // this field will be generated when posted to server
  };
  $scope.openTreatmentModal = function() {
    $treatmentModal.modal('show');
  };

  // user clicked 'x' of Treatment modal
  $scope.saveTreatmentAndPolygonLocally = function () {
    // no need to hide modal, since 'x' has data-dismiss attribute
    console.log("save treatment and polygon locally");
  }

  // user clicked 
  $scope.saveTreatmentAndPolygonToServer = function() {
    console.log( "save treatment to server.");

    var geoJsonPolygon = mapRelatedFunctionsService.saveAndGenResult( 
      mapRelatedService.activePolygon, 
      mapRelatedService
    );

    angular.extend(geoJsonPolygon.properties, $scope.treatment);
    console.log(JSON.stringify(geoJsonPolygon));
    $treatmentModal.modal('hide');
    if (mapRelatedService.isOnlyOnePolygon()) {
      stateService.setStatus(null);
    }
    // TODO: Ajax post
    mapRelatedFunctionsService.renderPolygonProperly(mapRelatedService.activePolygon, mapRelatedService);
  };

  $scope.fillTreatmentForm = function(googleMVCObjectPolygon) {  //TODO
    console.log("I am going to fill the form");
    console.log(googleMVCObjectPolygon.properties);
  };

  // shouldOpenTreatment event is broadcasted at two places:
  // (1) TODO: to write comment here
  // (2) TODO: to wirte comment here
  $scope.$on('shouldOpenTreatment', function(event, args) {
    $scope.openTreatmentModal();
  });

  //fillTreatmentForm event will be broadcasted at pmaServices.run callback
  $scope.$on('fillTreatmentForm', function(event, args) {
    $scope.fillTreatmentForm(args.targetPolygon);
  });
});

