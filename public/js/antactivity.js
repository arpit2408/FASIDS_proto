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
      if (date_summary.temp_avg >= 280 && date_summary.humidity_avg > 60){
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
    }

  };

  $.getJSON("http://api.openweathermap.org/data/2.5/forecast?q=London,us&mode=json&appid=64bb5bb6fbdeb48105b321b7c6ddae37", function (data){
    forecast = data;
    // get future 4 days
    var i =0 ;
    var forecast4 = [[],[],[],[],[],[]];
    data.list.forEach(function(element, index, ar){
      var tempDate = new Date(element.dt * 1000);
      forecast4[tempDate.getDate() - crtDate.getDate() ].push(element);
    });

    forecast4 = forecast4.slice(1,5);
    
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
      console.log(forecast4_daysummary[i]);
    }

    _.each(forecast4_daysummary, function(element, index, array){
      var date_event = {
        start: moment().add(index+1, "days").format("YYYY-MM-DD") + "T00:00:00-05:00",
        end:moment().add(index+2, "days").format("YYYY-MM-DD") + "T00:00:00-05:00",
        allDay: true,
        rendering:'background'
      };

      if (helper_util.tell_activity(element) === "high"){

        date_event.backgroundColor= "#FFB2B2";
      }
      if (helper_util.tell_activity(element) === "middle" ){

        date_event.backgroundColor= "#FFD699";
      }
      if (helper_util.tell_activity(element) === "low" ){

        date_event.backgroundColor= "#ADEBAD";
      }

      $('#calendar').fullCalendar("renderEvent", date_event , true);
    });

  }); 
  $('#calendar').fullCalendar({
      // put your options and callbacks here
      eventClick:function(event, element){
        console.log(element);
      }
  });

  // var date_event = {
  //   start: moment().add(1, "days").format("YYYY-MM-DD") + "T00:00:00-05:00",
  //   end:moment().add(2, "days").format("YYYY-MM-DD") + "T00:00:00-05:00",
  //   allDay: true,
  //   backgroundColor:"#FFD699",
  //   rendering:'background'
  // };
  // $('#calendar').fullCalendar("renderEvent", date_event );
  $.getJSON("http://api.openweathermap.org/data/2.5/weather?q=London,us&mode=json&appid=64bb5bb6fbdeb48105b321b7c6ddae37", function (data){
    current = data;

  });


});
