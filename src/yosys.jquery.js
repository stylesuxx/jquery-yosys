/*
var ys = null;
$.md.stage('all_ready').subscribe(function(done) {
  var location = window.location.href.split('/');
  var page = location[location.length - 1];

  if(page === 'yosys.md') {
    var initNavigation = function($navigation) {
      $('a.fullscreen', $navigation).on('click', function(e) {
        e.preventDefault();
        $(this).hide();
        $(this).siblings('.smallscreen').show();

        $yosys = $(this).closest('#yosys-wrapper');
        $yosys.addClass('fullscreen');

        var height = $(window).height() - $('#input-wrapper', $yosys).height();
        $('textarea#yosys-output', $yosys).height(height);
        $('#input-wrapper input', $yosys).focus();
      });

      $('a.smallscreen', $navigation).on('click', function(e) {
        e.preventDefault();
        $(this).hide();
        $(this).siblings('.fullscreen').show();

        $yosys = $(this).closest('#yosys-wrapper');
        $yosys.removeClass('fullscreen');

        $('textarea#yosys-output', $yosys).height(480);
        $('#input-wrapper input', $yosys).focus();
      });
    }

    var appendOutput = function (output) {
      var $output = $('textarea#yosys-output');
      var text = $output.val();
      text += '\n\n' + output.trim();
      $output.val(text);

      $output.scrollTop($output[0].scrollHeight - $output.height());
    }
  }

  done();
});
*/

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function($, window, document, undefined) {
  "use strict";

  var pluginName = "yosys",
  defaults = {
    done: null,
    propertyName: "value"
  };

  function Plugin(element, options) {
    this.element = element;
    this.settings = $.extend( {}, defaults, options );
    this._defaults = defaults;
    this._name = pluginName;
    this.init();
  }

  $.extend(Plugin.prototype, {
    init: function() {
      this.yosys = {
        elements: {
          output: $('textarea.yosys-output', this.element),
          input: $('input.yosys-input', this.element)
        },
        history: []
      };

      if(this.yosys.elements.output.length < 1) {
        throw('Error: No textarea with yosys-output class found!');
      }
      if(this.yosys.elements.input.length < 1) {
        throw('Error: No input with yosys-input class found!');
      }

      this.initYosys(function() {
        this.attachInputHandler();
        this.settings.done(this.element);
      }.bind(this));
    },
    initYosys(cb) {
      YosysJS.load_viz();
      var ys = YosysJS.create('ys_iframe', function() {
        this.appendOutput(ys.print_buffer);
        cb();
      }.bind(this));

      ys.verbose = this.settings.yosys.verbose | false;
      ys.logprint= this.settings.yosys.logprint | false;
      ys.echo = this.settings.yosys.echo | false;
      this.yosys.ys = ys;
    },
    appendOutput(buffer) {
      var output = this.yosys.elements.output;
      var current = output.val();
      current += '\n\n' + buffer.trim();
      output.val(current);

      output.scrollTop(output[0].scrollHeight - output.height());
    },
    attachInputHandler() {
      var yosys = this.yosys;
      var input = yosys.elements.input;

      var index = 0;
      var enterHandler = function() {
        var command = input.val();
        if(command == '') return;

        yosys.history.push(command);
        index = yosys.history.length;
        input.val('');
        var buffer = yosys.ys.run(command)
        this.appendOutput(buffer);
      }.bind(this);

      var upHandler = function() {
        if(index > 0) {
          index--;
        }
        input.val(yosys.history[index]);
      }

      var downHandler = function() {
        if(index < (yosys.history.length - 1)) {
          index++;
          input.val(yosys.history[index]);
        }
        else {
          input.val('');
        }
      }

      input.keydown(function(e) {
        switch(e.which) {
          case 13: enterHandler(); break;
          case 38: upHandler(); break;
          case 40: downHandler(); break;
        }
      });
    }
  });

  $.fn[pluginName] = function(options) {
    return this.each(function() {
      if(!$.data(this, "plugin_" + pluginName)) {
        $.data(this, "plugin_" + pluginName, new Plugin(this, options));
      }
    });
  };
})(jQuery, window, document);
