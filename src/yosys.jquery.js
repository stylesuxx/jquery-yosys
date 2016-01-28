;(function($, window, document, undefined) {
  "use strict";

  var pluginName = "yosys",
  defaults = {
    done: null,
    yosis: {
      verbose: false,
      logger: false,
      echo: false
    },
    navigation: true
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
          navigation: $('.yosys-navigation', this.element),
          output: $('textarea.yosys-output', this.element),
          input: $('input.yosys-input', this.element),
        },
        history: []
      };

      if(this.yosys.elements.output.length < 1) {
        throw('Error: No textarea with yosys-output class found!');
      }
      if(this.yosys.elements.input.length < 1) {
        throw('Error: No input with yosys-input class found!');
      }
      if(this.yosys.elements.navigation.length < 1) {
        throw('Error: No container with yosys-navigation class found!');
      }

      this.initYosys(function() {
        this.attachInputHandler();
        this.initNavigation();
        this.settings.done(this.element);
      }.bind(this));
    },

    initNavigation() {
      var parent = this.element;
      var $resize = $('<div/>', { class: 'resize' })
        .append($('<a/>', { href: '#', class: 'fullscreen' })
          .append($('<span/>', { class: 'glyphicon glyphicon-resize-full' })))
        .append($('<a/>', { href: '#', class: 'smallscreen', style: 'display: none;' })
          .append($('<span/>', { class: 'glyphicon glyphicon-resize-small' })));

      $('.fullscreen', $resize).on('click', function() {
        $(this).hide();
        $('.smallscreen', $resize).show();
        $(parent).addClass('fullscreen');
      });

      $('.smallscreen', $resize).on('click', function() {
        $(this).hide();
        $('.fullscreen', $resize).show();
        $(parent).removeClass('fullscreen');
      });

      this.yosys.elements.navigation.append($resize);
    },

    initYosys(cb) {
      YosysJS.load_viz();
      var ys = YosysJS.create('ys_iframe', function() {
        this.yosys.elements.output.val(ys.print_buffer);
        cb();
      }.bind(this));

      ys.verbose = this.settings.yosys.verbose;
      ys.logprint= this.settings.yosys.logprint;
      ys.echo = this.settings.yosys.echo;
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
