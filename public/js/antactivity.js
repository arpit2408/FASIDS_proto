$(document).ready(function(){
  // following might take time
  $('#calendar').fullCalendar({
      // put your options and callbacks here
      eventClick:function(event, element){
        console.log(element);
      }
  });


  var crtDate = new Date();
  var forecast = {};
  var current = {};
  
  var helper_util = {
    url:function(mode){
      if (mode === "weather" || mode === "forecast"){
        return "http://api.openweathermap.org/data/2.5/" + mode;      
      }
      else throw "mode parameter error";
    },
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
      if (date_summary.temp_avg >= 290 && date_summary.humidity_avg > 30){
        return "high";
      } else if (date_summary.temp_avg >= 270 && date_summary.temp_avg < 280 ) {
        return "middle";
      } else if ( date_summary.temp_avg < 270){
        return "low";
      }
    },
    map_main: function (date_list, attr){
      return _.map(date_list, function(period_data){
        return period_data.main[attr];
      });
    },
    refresh:function(){


      var scope = this;
      $.getJSON(scope.makeQuery("forecast"), function (data){
        $('#calendar').fullCalendar('removeEvents');
        forecast = data;
        // get future 4 days
        var i =0 ;
        var forecast4 = [[],[],[],[],[],[]];
        data.list.forEach(function(element, index, ar){
          var tempDate = new Date(element.dt * 1000);
          forecast4[tempDate.getDate() - crtDate.getDate() ].push(element);
        });

        forecast4 = forecast4.slice(1,5);
        
        //prepare forecast4_daysummary
        var forecast4_daysummary = [];
        for (i= 0; i<forecast4.length; i ++){
          //console.log(forecast4[i], null, "  ");
          var temp_list = helper_util.map_main(forecast4[i], "temp");
          var humidity_list = helper_util.map_main(forecast4[i], "humidity");
          forecast4_daysummary[i] = {
            date: moment().add(i+1,'days').format('YYYY-MM-DD') ,
            temp_avg:helper_util.avg(temp_list),
            temp_max: _.max( temp_list),
            temp_min: _.min( temp_list),
            humidity_avg: helper_util.avg(  humidity_list )
          };
          console.log( JSON.stringify(forecast4_daysummary[i] ,null,"  "));
        }

        // adding event to forecast4_summary
        _.each(forecast4_daysummary, function(element, index, array){
          // serves as bg color
          var date_event = {
            start: moment().add(index+1, "days").format("YYYY-MM-DD") + "T00:00:00-05:00",
            end:moment().add(index+2, "days").format("YYYY-MM-DD") + "T00:00:00-05:00",
            allDay: true,
            rendering:'background'
          };
          var display_text_event = {
            start: moment().add(index+1, "days").format("YYYY-MM-DD") + "T00:00:00-05:00",
            end: moment().add(index+2, "days").format("YYYY-MM-DD") + "T00:00:00-05:00",
            // color:"#66FF33",
            allDay:true,
            title:"Ant Activity:",
            textColor:"#000000",
            backgroundColor:"rgba(255, 0, 0, 0.0)",
            borderColor:"rgba(255,0,0,0.0)",
            className:"activity-text"
          }
          if (helper_util.tell_activity(element) === "high"){
            date_event.backgroundColor= "#FFB2B2";
            display_text_event.textColor = "#FF0000";
            display_text_event.title += " high";
          }
          else if (helper_util.tell_activity(element) === "middle" ){
            date_event.backgroundColor= "#FFD699";
            display_text_event.title += " middle";
          }
          else {
            date_event.backgroundColor= "#ADEBAD";
            display_text_event.title += " low";
          }
          $('#calendar').fullCalendar("renderEvent", date_event , true);


          $('#calendar').fullCalendar("renderEvent", display_text_event , true);

        });

      }); 

      $.getJSON(scope.makeQuery("weather"), function (data){
        current = data;

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
      console.log("haha");
      if ($("#query-place-ipt").val() ==""){
        helper_util.get_query.q = "college station,tx,us";
      } else{
        var q = $("#query-place-ipt").val().toLowerCase();
        helper_util.get_query.q = q;
      }

      helper_util.refresh();

    }
  });
  
});
