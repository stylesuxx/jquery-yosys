;(function($, window, document, undefined) {
  "use strict";

  function Input($input, commandCB) {
    this.$input = $input;
    this.history = [];
    this.index = history.length;
    this.commandCB = commandCB;

    this.registerHandlers = function() {
      this.$input.keydown(function(e) {
        switch(e.which) {
          case 13: this.enterHandler(); break;
          case 38: this.upHandler(); break;
          case 40: this.downHandler(); break;
        }
      }.bind(this));
    };

    this.enterHandler = function() {
      var command = this.$input.val();
      if(command == '') return;

      this.history.push(command);
      this.index = this.history.length - 1;
      this.$input.val('');
      this.commandCB(command);
    }

    this.upHandler = function() {
      if(this.index > -1) {
        this.$input.val(this.history[this.index]);
        this.index = (this.index > 0) ? --this.index : 0;
      }
    }

    this.downHandler = function() {
      var command = '';
      if(this.index < (this.history.length - 1)) {
        command = this.history[++this.index];
      }
      this.$input.val(command);
    }

    this.registerHandlers();
  }

  function Output($output, text) {
    this.$output = $output;
    this.$output.val(text);

    this.append = function(text) {
      var current = this.$output.val();
      current +=  '\n\n' + text.trim();
      this.$output.val(current);

      var scrollTo = this.$output[0].scrollHeight - this.$output.height();
      this.$output.scrollTop(scrollTo);
    };

    this.clear = function() {
      this.$output.val('');
    }
  }

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
        history: [],
        files: {}
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

      this.initYosys(function(ys) {
        var ys = ys;
        var output = new Output(this.yosys.elements.output, ys.print_buffer);
        var input = new Input(this.yosys.elements.input, function(command) {
          output.append(ys.run(command));
        });
        this.initNavigation();
        this.settings.done(this.element);
      }.bind(this));
    },

    initNavigation() {
      var that = this;
      var parent = this.element;
      var $newFile = $('<div/>', { class: 'resize' })
        .append($('<a/>', { href: '#', class: 'new-file' })
          .append($('<span/>', { class: 'glyphicon glyphicon-plus' })));

      var $resize = $('<div/>', { class: 'resize' })
        .append($('<a/>', { href: '#', class: 'fullscreen' })
          .append($('<span/>', { class: 'glyphicon glyphicon-resize-full' })))
        .append($('<a/>', { href: '#', class: 'smallscreen', style: 'display: none;' })
          .append($('<span/>', { class: 'glyphicon glyphicon-resize-small' })));

      $('.new-file', $newFile).on('click', function() {
        if($('.add-file', parent).length > 0) return;

        var $addFile = $('<div/>', { class: 'add-file'} )
          .append($('<input/>', { placeholder: 'filename [ENTER]' }))
        $(parent).append($addFile);
        $('input', $addFile).focus();

        $('input', $addFile).keydown(function(e) {
          if(e.which == 13) {
            var name = $('input', $addFile).val();
            if(name != "") {
              that.addFile(name, function() {
                $addFile.remove();
              });
            }
            return false;
          }
        });
      });

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

      this.yosys.elements.navigation.append($newFile);
      this.yosys.elements.navigation.append($resize);
    },

    addFile(name, cb) {
      var that = this;
      var ys = this.yosys.ys;
      var parent = this.element;
      var files = this.yosys.files;
      var navigation = this.yosys.elements.navigation;

      if(!files[name]) {
        files[name] = true;
        ys.write_file(name, '');
        var $file = $('<div/>', { class: 'file'})
          .append($('<a/>', { href: '#', file: name, text: name }));
        navigation.prepend($file);

        $('a', $file).on('click', function(e) {
          var file = $(this).attr('file');
          var text = that.loadFile(file);
          var $editor = $('<div/>', { class: 'editor' })
            .append($('<textarea/>').val(text)).hide();

          $(parent).append($editor);
          $editor.fadeIn('fast');
          $('textarea', $editor).focus();
          $('textarea', $editor).on('click', function() {
            return false;
          });
          $editor.on('click', function() {
            $editor.fadeOut('fast', function() {
              var text = $('textarea', $editor).val();
              that.saveFile(file, text)
              $editor.remove();
            });
          })
        });
        cb();
      }

      $('a', $file).click();
    },

    saveFile(name, content) {
      var ys = this.yosys.ys;
      ys.write_file(name, content);

      if(localStorage) {
        var files =  localStorage.getItem('files') ? JSON.parse(localStorage.getItem('files')) : {};
        files[name] = content;
        localStorage.setItem('files', JSON.stringify(files));
      }
    },

    loadFile(name) {
      var ys = this.yosys.ys;
      return ys.read_file(name);
    },

    loadSavedFiles() {
      if(localStorage) {
        // Load from local store
        var files = localStorage.getItem('files') ? JSON.parse(localStorage.getItem('files')) : {};

        // Write to yosys fs
        // Append menu item
      }
    },

    deleteFile(name) {

    },

    initYosys(cb) {
      YosysJS.load_viz();
      var ys = YosysJS.create('ys_iframe', function() {
        cb(ys);
      }.bind(this));

      ys.verbose = this.settings.yosys.verbose;
      ys.logprint= this.settings.yosys.logprint;
      ys.echo = this.settings.yosys.echo;
      this.yosys.ys = ys;
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
