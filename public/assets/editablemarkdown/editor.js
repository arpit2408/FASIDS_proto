jQuery(document).ready(function() {
  // Enable Hallo editor
  jQuery('.editable').hallo({
    editable:false,
    plugins: {
      'halloformat': {},
      'halloheadings': {},
      'hallolists': {},
      'halloreundo': {}
    },
    toolbar: 'halloToolbarFixed'
  });

  var markdownize = function(content) {
    var html = content.split("\n").map($.trim).filter(function(line) { 
      return line != "";
    }).join("\n");
    return toMarkdown(html);
  };

  var converter = new Showdown.converter();
  var htmlize = function(content) {
    return converter.makeHtml(content);
  };

  // Method that converts the HTML contents to Markdown
  var showSource = function(content) {
    var markdown = markdownize(content);
    if (jQuery('#source').get(0).value == markdown) {
      return;
    }
    jQuery('#source').get(0).value = markdown;
  };


  var updateHtml = function(content) {
    if (markdownize(jQuery('.editable').html()) == content) {
      return;
    }
    jQuery('.editable').html(htmlize(content)); 
  };

  // Update Markdown every time content is modified
  jQuery('.editable').bind('hallomodified', function(event, data) {
    showSource(data.content);
  });

  jQuery('#source').bind('keyup', function() {
    updateHtml(this.value);
  });
  
  // initialize
  if ($('#source').val() === "")showSource(jQuery('.editable').html());   
  else  updateHtml($('#source').val());
  

  // a very simple verification, might change verification into augularJS
  $("#blogpost-form").submit( function onSubmit(event) {
    if ( $("input[name=post_title]").val() == ""  ){
      alert("title cannot be null");
      event.preventDefault();
      return;
    }
    if ( $("textarea[name=content]").val() == "") {
      alert("content cannot be null");
      event.preventDefault();
      return;
    }
  })

}); 
