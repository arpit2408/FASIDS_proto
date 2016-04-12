// treatment.js for treatment, I do not need to import mapcover

$(document).ready(function onDocReady(){

  var glblprefix = location.href.search('fasids.tamu.edu') >= 0 ? "/node/fasids" : "";
  function colorOf (type_of_use ){
    var fillColor = "#000000";
    switch(type_of_use){
      case "agricultural":
        fillColor ="#0000FF";
        break;
      case "home":
        fillColor="#FFFF00";
        break;
      case "professional":
        fillColor="#33CC33";
        break;
      default:
        fillColor="#000000";
    }
    return fillColor;
  }



  var gmap = new google.maps.Map( document.getElementById("mapcontainer"), {
    scrollwheel: false,
    draggingCursor:"move",
    draggableCursor:"auto",
    center: { lat: 20.62060000, lng: -96.32621},
    zoom: 15,
    zoomControl:false,    //left side
    panControl:false,     //left top corner: 
    mapTypeControl:false  //right top corner: "map|satellite"
  });
  var target_geojson = {};
  try {
    var target_geojson =  JSON.parse($("#target-polygon").attr("content"));
  } catch (e){
    alert("JSON.parse failure at target_geojson initialization");
  }
  var bounds = new google.maps.LatLngBounds(target_geojson.properties.bounds.sw, target_geojson.properties.bounds.ne);
  gmap.fitBounds(bounds);

  // var target_geojson_gfeature = new google.maps.Data.Feature(target_geojson);

  gmap.data.addGeoJson(target_geojson);

  gmap.data.setStyle(function featureStyleFor(feature){
    return ({
      fillColor: colorOf(feature.getProperty("type_of_use") ),
      strokeColor: "#FF0000",
      strokeWeight:2
    });
  });
  gmap.data.addListener('click', function (event){
    location.href = glblprefix + "/landscape/homeownermng/" + target_geojson._id;
  });
});

// For events supported in google map
//https://developers.google.com/maps/documentation/javascript/3.exp/reference#MouseEvent