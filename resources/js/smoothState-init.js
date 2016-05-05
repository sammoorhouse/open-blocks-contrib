;(function ($) {
  'use strict';
  var content  = $('body').smoothState({
        // onStart runs as soon as link has been activated
        onStart : {

          // Set the duration of our animation
          duration: 250,

          // Alterations to the page
          render: function () {

            // Quickly toggles a class and restarts css animations
            content.toggleAnimationClass('is-exiting');
          }
        }
      }).data('smoothState'); // makes public methods available
})(jQuery);

;(function ($) {
  'use strict';
  var $body    = $('html, body'), // Define jQuery collection
      content  = $('body').smoothState({
        onStart : {
          duration: 250,
          render: function () {
            content.toggleAnimationClass('is-exiting');

            // Scroll user to the top
            $body.animate({ 'scrollTop': 0 });

          }
        }
      }).data('smoothState');
})(jQuery);
