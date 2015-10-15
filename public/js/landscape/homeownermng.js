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

  // var map;
  // function initMap() {
  //   map = new google.maps.Map(document.getElementById('mapcontainer'), {
  //     center: {lat: -34.397, lng: 150.644},
  //     zoom: 8
  //   });
  // }
  // initMap();
});