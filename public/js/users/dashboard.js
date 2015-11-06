$(document).ready(function onDocReady(){
  $("a.http-action-link").click(function(event){
    $this = $(this);
    event.stopPropagation();
    event.preventDefault();
    $.ajax($this.attr("href"),{
      type:$this.attr("data-http-method"),
      success:function(data, textStatus){
        location.reload();
      },
      error : function (jqXHR, textStatus, errorThrown){
        console.log(textStatus);
      }


    });
  });
});