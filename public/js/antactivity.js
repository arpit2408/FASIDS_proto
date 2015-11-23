$(document).ready(function(){
  // following might take time
  console.log($("#weather-table-template").html().toString());
  console.log(document.getElementById("weather-table-template").innerHTML );

  $('#calendar').fullCalendar({
      // put your options and callbacks here
      eventClick:function(event, jsEvent, view){


        var target_modal_id = "";
        if ($(this).hasClass("activity-text-low")){
          target_modal_id  = "#antactivity-low-explain";
          $("#antactivity-low-explain").modal("show");
        }
        if ($(this).hasClass("activity-text-middle")){
          target_modal_id  = "#antactivity-middle-explain";
          $("#antactivity-middle-explain").modal("show");
        }
        if ($(this).hasClass("activity-text-high")){
          target_modal_id  = "#antactivity-high-explain";
          $("#antactivity-high-explain").modal("show");
        }
        $(target_modal_id).find(".weather-container").html("").prepend(JSON.stringify(forecast4_daysummary[event.index], null, "  "));
        $(target_modal_id).find(".weather-container").html("").prepend(helper_util.weather_template_complied({
          temp_avg: helper_util.kToF( forecast4_daysummary[event.index].temp_avg),
          humidity_avg: forecast4_daysummary[event.index].humidity_avg.toFixed(1) + " %"
        }));

      }
  });
  var crtDate = new Date();
  var forecast = {};
  var current = {};
  var forecast4_daysummary = []
  // knowledge snippets: 0 degree C = 273.15K
  var helper_util = {
    url:function(mode){
      if (mode === "weather" || mode === "forecast"){
        return "http://api.openweathermap.org/data/2.5/" + mode;      
      }
      else throw "mode parameter error";
    },
    // get_query is an object will be summitted to forcast url using GET
    get_query:{
      q:"college station,tx,us",
      mode:"json",
      appid:"64bb5bb6fbdeb48105b321b7c6ddae37"
    },
    makeQuery:function( mode){
      var scope = this;
      return scope.url(mode)+"?"+$.param(scope.get_query);
    },
    avg:function (one_list){
      if (typeof one_list === "undefined" || one_list.length === 0){
        return null;
      }
      var i = 0;
      var sum = 0;
      for (i =0; i < one_list.length; i++){
        sum += one_list[i];
      }
      sum = sum / one_list.length;
      return sum;
    },
    // I should have one function  function (TEMPERATURE, HUMIDITY), which return ANT_TIVITY 
    tell_activity: function(date_summary){
      if (date_summary.temp_avg >= 294.25 && date_summary.temp_avg <= 305.372){
        return "high";
      } else {
        return "low";
      }
    },
    map_main: function (date_list, attr){
      if (attr === "temp"){
        return  _.compact( _.map(date_list, function(period_data){
          var date_at_this_point =  new Date(period_data.dt * 1000);
          if ( date_at_this_point.getHours()>= 9 && date_at_this_point.getHours() <= 15){
            // alert("asd")
            return period_data.main[attr];
          } 
        }));
      } else{
        return _.map(date_list, function(period_data){
          return period_data.main[attr];
        });
      }
    },
    weather_template_complied:_.template($("#weather-table-template").html().toString()), 
    kToF:function ( kelvin_temp){
      return ((kelvin_temp-273.15) * 1.8 +32).toFixed(1) + " ºF"
    },
    refresh:function(){
      var scope = this;
      $.getJSON(scope.makeQuery("forecast"), function (data){
        if (data.cod){
          if (data.cod==="404"){
            alert("Invalid address");
            return;
          }
        }
        $('#calendar').fullCalendar('removeEvents');
        console.log(JSON.stringify(data,null,"  "));
        forecast = data;
        var i = 0 ;
        var day_from_today = 0;
        var forecast4 = [[],[],[],[],[],[]];
        data.list.forEach(function(element, index, ar){
          var tempDate = new Date(element.dt * 1000);
          day_from_today = tempDate.getDate() - crtDate.getDate();

          forecast4[day_from_today ].push(element);

        });

        forecast4 = forecast4.slice(0,5);
        //prepare forecast4_daysummary

        var forecast4_length = forecast4.length
        for (i= 0; i< forecast4_length; i ++){
          var temp_list = helper_util.map_main(forecast4[i], "temp");
          var humidity_list = helper_util.map_main(forecast4[i], "humidity");
          forecast4_daysummary[i] = {
            date: moment().add(i,'days').format('YYYY-MM-DD'),
            temp_avg:helper_util.avg(temp_list),
            temp_max: _.max( temp_list),
            temp_min: _.min( temp_list),
            humidity_avg: helper_util.avg(  humidity_list)
          };
          //console.log( JSON.stringify(forecast4_daysummary[i] ,null,"  "));
        }
        console.log(JSON.stringify(forecast4_daysummary, null, "  "))

        // adding event to forecast4_summary
        _.each(forecast4_daysummary, function(element, index, array){
          // serves as bg color
          if (!element.temp_avg){
            return;
          }
          // var date_event = {   // this is one event that is used to add background color
          //   start: moment().add(index, "days").format(),
          //   end: moment().add(index+1, "days").format(),
          //   allDay: true,
          //   rendering:'background',
          // };
          var display_text_event = {
            start: moment().add(index, "days").format(),
            end: moment().add(index+1, "days").format(),
            // color:"#66FF33",
            allDay:true,
            title:"Ant activity:",
            textColor:"#000000",
            backgroundColor:"rgba(255, 0, 0, 0.0)", // make this event div background transparent
            borderColor:"rgba(255,0,0,0.0)",
            className:"activity-text-" + helper_util.tell_activity(element),
            index:index
          };
          if (helper_util.tell_activity(element) === "high"){
            // date_event.backgroundColor= "rgba(255, 0, 0, 0.0)";
            display_text_event.textColor = "#FF0000";
            display_text_event.title += " high";
          }
          else if (helper_util.tell_activity(element) === "middle" ){
            // date_event.backgroundColor= "rgba(255, 0, 0, 0.0)";
            display_text_event.title += " middle";
          }
          else {
            // date_event.backgroundColor= "rgba(255, 0, 0, 0.0)";
            display_text_event.title += " low";
          }
          // $('#calendar').fullCalendar("renderEvent", date_event , true);
          $('#calendar').fullCalendar("renderEvent", display_text_event , true);
        });
      }); 

    }

  }; // end of helper_util
  helper_util.refresh();
  $("#refresh-btn").click(function refreshBtnClicked(){
    var $this = $(this);
    if ($("#query-place-ipt").val() ==""){
      helper_util.get_query.q = "college station,tx,us";
    } else{
      var q = $("#query-place-ipt").val().toLowerCase();
      helper_util.get_query.q = q;
    }

    helper_util.refresh();
    console.log("refresh-btn clicked");
  });
  $("#query-place-ipt").keyup(function (event){
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if (keycode  ===  13){
      if ($("#query-place-ipt").val() ==""){
        helper_util.get_query.q = "college station,tx,us";
      } else{
        var q = $("#query-place-ipt").val().toLowerCase();
        helper_util.get_query.q = q;
      }
      helper_util.refresh();
    }
  });

  // $(".activity-text-low,.activity-text-middle,.activity-text-high").click(function (){
  //   if ($(this).hasClass("activity-text-low")){
  //     console.log("low");
  //   }
  // });
});
