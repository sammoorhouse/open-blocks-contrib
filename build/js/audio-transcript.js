$(function() {
  var target = $("#ob-audio-target");
  target.bind("timeupdate", function() {
    $(".verse").each(function() {
      var from = parseFloat($(this).attr("start"))
      var to = parseFloat($(this).attr("end"))
      var time = target[0].currentTime
      if ((from <= time) && (to > time)) {
        $(this).toggleClass("voice-active", true)
      } else {
        $(this).toggleClass("voice-active", false)
      }
    })
  })
  target.bind("canplay", function() {
    $(".verse").each(function() {
      var from = parseFloat($(this).attr("start"))
      $(this).bind("click", function() {
        target[0].currentTime = from;
      })
    })
  })
})
