$(document).ready(function onReady(){
  (function settingMapContainerHeight(){
    // The reason might because the nav bar gives padding 70,
    var mapcontainer_height = $(window).height() - 1.5 * $(".navbar").height();
    $("#mapcover").height(mapcontainer_height);
  })();  
  // logic begins
  //31.560112, -98.551199
  var genus_species = JSON.parse($("meta[name=genus-species-index]").attr("content"));

  var mapcover = initMapCover( 'mapcover', 'mapcover-map' ,    { 
      draggingCursor:"move",
      draggableCursor:"auto",
      center: { lat: 31.560112, lng: -98.551199},
      zoom: 6,
      zoomControl:false,    //left side
      panControl:false,     //left top corner: 
      // mapTypeControl:false  //right top corner: "map|satellite"
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      mapTypeControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT
      }
  });
  var gmap = mapcover.model.get("map");
  var infowindow = new google.maps.InfoWindow({
    // map:gmap
  });

  // counties_hash will be like <county_name:string, data.feature>
  // data.feature: https://developers.google.com/maps/documentation/javascript/reference#Data.Feature
  var counties_hash = {};
  // var geojsons = [];
  function featureOnClick(event){
    infowindow.setOptions({
      position: event.latLng,
      content: genus_species_core.get("compiled_infowindow_content")({
        county: event.feature.getProperty("COUNTY"),
        genus: genus_species_core.get("genus"),
        specie: genus_species_core.get("specie"),
        observations: genus_species_core.get("observation_map")[event.feature.getProperty("FIPS")]
      })
    });
    infowindow.open(gmap);
  }

  gmap.data.loadGeoJson("/node/fasids/help-file/data/counties/tx_counties.geojson", null, function processFeature( feature_array){
    feature_array.forEach(function iteratee (element, index){
      counties_hash[element.getProperty("COUNTY")] = element;
      counties_hash[element.getProperty("FIPS")]   = element;
      // console.log(counties_hash[element.getProperty("COUNTY")].getGeometry().getType());
      // counties_hash[element.getProperty("COUNTY")].toGeoJson( function (geojson){
      //   geojsons.push(geojson.properties);
      // }); 
    });

  });
  gmap.data.setStyle({
    fillColor:"rgba(0,0,0,0)",
    fillOpacity:1,
    strokeColor:"rgba(0, 153, 0,0.5)",
    strokeWeight:2
  });

  gmap.data.addListener('click', featureOnClick);


  var GenusSpeciesPanel = Backbone.View.extend({
    
    el: document.getElementById("genus-species-panel"),


    expandTill:function (section){
      // console.log("expandTill");
      var ClassRef = this;
      switch(section){
        case "genus":
          ClassRef.$el.find(".genus-ul li").addClass("hidden");
          ClassRef.$el.find(".col-xs-5.genus-list").show(100);
          ClassRef.$el.find(".col-xs-5.species-list").hide(100);
        break;
        case "species":
          ClassRef.$el.find(".species-list ul").addClass("hidden");

          ClassRef.$el.find(".col-xs-5.species-list").show(100);
        break;
        default:
      }
    },
    test: function (){
      var ClassRef = this;
      this.$el.hide();
      // console.log("asdf");
    },
    render: function (){
      // console.log("render: " + this.model.get("genus") + " ," + this.model.get("specie"));

      var ClassRef = this;
      var mapped = _.omit( {genus: genus_species_core.get("genus"), specie: genus_species_core.get("specie")}, function (val, key){
        return !val;
      });
      ClassRef.$el.find("li").removeClass("active");
      // console.log("/landscape/antdistribution_lookup?"+ $.param(mapped));
      $.get("/node/fasids/landscape/antdistribution_lookup" , mapped, function (data){
        ClassRef.model.set("observation_map", data);
        console.log(data);
        _.each(ClassRef.model.get("revert_style_cache"), function (fips, array_index, ar){
          gmap.data.overrideStyle(counties_hash[fips], {
            fillColor:"rgba(0, 0, 0,0)"
          });
        });
        //http://stackoverflow.com/questions/1232040/how-do-i-empty-an-array-in-javascript
        ClassRef.model.get("revert_style_cache").length = 0;
        _.each(data, function (number_observation, fips, data){
          ClassRef.model.get("revert_style_cache").push(fips);
          gmap.data.overrideStyle(counties_hash[fips], {
            fillColor:"rgba(255, 153, 51,0.7)"
          });
        });
      });
      // show active Init Character, Genus, and Species
      //.character-A,  genus specie
      if (!mapped.specie){
        mapped.specie = "undefined";
      }
      // console.log(".character-" + mapped.genus[0] + ", ." + mapped.genus+ ", ." + mapped.specie.replace(" ", "SpacE") );
      $(".character-" + mapped.genus[0] + ", ." + mapped.genus+ ", ." + mapped.specie.replace(" ", "SpacE") ).addClass("active");

    },
    initialize:function(){
      var ClassRef = this;
      ClassRef.$el.find(".col-xs-5.genus-list,.col-xs-5.species-list").hide();
      ClassRef.listenTo(ClassRef.model, 'change', ClassRef.render );
      $('.collapse-button').click(function (event){
        $(this).parent().hide(100)
      })
    }
  });
  var genus_species_core = new Backbone.Model({
    compiled_infowindow_content: _.template($('#info-window-template').html()),
    observation_map:{},
    genus:null,
    specie:null,
    revert_style_cache:[]
  })
  var genus_species_panel = new GenusSpeciesPanel({model:genus_species_core});
  $("li.initial-character").click( function onClick(){
    var $this = $(this);
    genus_species_panel.expandTill("genus");
    $(".genus-inichar-"+ $this.text()).removeClass("hidden");
  });

  $(".col-xs-5.genus-list li").click(function onClick(){
    var $this = $(this);
    genus_species_panel.expandTill("species");
    $("ul.species-list-"+$this.data("genus")).removeClass("hidden");
    genus_species_core.set("genus", $this.data("genus"));
    genus_species_core.set("specie", null);
  });

  $(".col-xs-5.species-list ul li").click( function onClick(){
    var $this = $(this);
    genus_species_core.set("specie", $this.text());
  });

});