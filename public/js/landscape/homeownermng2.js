// completely use angularJS to refactor this JS application
var polygonManagerApp = angular.module("polygonManagerApp", []);
// pmaDefaultCtrl means "polygonManagerApp Default Controller"
var pmaDefaultCtrl = polygonManagerApp.controller("pmaDefaultCtrl", function ($scope) {
  // some default javascript I put them here



});


$(document).ready(function(){

  console.log("default controller");
  (function settingMapContainerHeight(){
    // The reason might because the nav bar gives padding 70,
    $("#mapcover").height($(window).height() - 1 * $(".navbar").height());
  })();

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
  
});