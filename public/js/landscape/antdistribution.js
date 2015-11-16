$(document).ready(function onReady(){
  (function settingMapContainerHeight(){
    // The reason might because the nav bar gives padding 70,
    var mapcontainer_height = $(window).height() - 1.5 * $(".navbar").height();
    $("#mapcover").height(mapcontainer_height);
  })();  
  // logic begins
  //31.560112, -98.551199
  var mapcover = initMapCover( 'mapcover', 'mapcover-map' ,    { 
      draggingCursor:"move",
      draggableCursor:"auto",
      center: { lat: 31.560112, lng: -98.551199},
      zoom: 6,
      zoomControl:false,    //left side
      panControl:false,     //left top corner: 
      // mapTypeControl:false  //right top corner: "map|satellite"
      mapTypeControlOptions: {
        // style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT
      }
  });
  var gmap = mapcover.model.get("map");
  // counties_name_hash will be like <county_name:string, data.feature>
  // data.feature: https://developers.google.com/maps/documentation/javascript/reference#Data.Feature
  var counties_name_hash = {};
  var geojsons = [];
  gmap.data.loadGeoJson("/help-file/data/counties/tx_counties.geojson", null, function processFeature( feature_array){
    feature_array.forEach(function iteratee (element, index){
      counties_name_hash[element.getProperty("COUNTY")] = element;
      // console.log(counties_name_hash[element.getProperty("COUNTY")].getGeometry().getType());
      counties_name_hash[element.getProperty("COUNTY")].toGeoJson( function (geojson){
        geojsons.push(geojson.properties);
      }); 
    });

  });
  gmap.data.setStyle({
    fillColor:"rgba(0,0,0,0)",
    strokeColor:"rgba(0, 153, 0,0.3)",
    strokeWeight:2
  })

  
});