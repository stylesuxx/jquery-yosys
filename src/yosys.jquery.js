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

  function Editor(ys) {
    var that = this;
    this.ys = ys;
    this.files = {};
    this.storage = (localStorage) ? true : false;

    this.getFileNames = function() {
      var names = [];
      for(name in this.files) {
        names.push(name);
      }

      return names;
    }

    this.loadFile = function(name) {
      var file = this.files[name];
      return file.load();
    }

    this.saveFile = function(name, content) {
      var file = this.files[name];
      file.save(content);
      if(this.storage) {
        this.saveFiles();
      }
    }

    this.addFile = function(name) {
      var file = new File(name, this.ys);
      this.files[name] = file;

      if(this.storage) {
        this.saveFiles();
      }
    };

    this.deleteFile = function(name) {
      delete this.files[name];

      if(this.storage) {
        this.saveFiles();
      }
    };

    this.loadFiles = function() {
      if(localStorage.getItem('files')) {
        var files =  JSON.parse(localStorage.getItem('files'));
        for(name in files) {
          var file = new File(name, ys);
          file.save(files[name]);
          this.files[name] = file;
        }
      }
    };

    this.saveFiles = function() {
      var files = {};
      for(name in this.files) {
        files[name] = this.files[name].load();
      }
      localStorage.setItem('files', JSON.stringify(files));
    };

    if(this.storage) {
      this.loadFiles();
    }
  }

  function File(name, ys) {
    this.name = name;
    this.ys = ys;

    this.save = function(content) {
      this.ys.write_file(this.name, content);
    };

    this.load = function() {
      return this.ys.read_file(this.name);
    };

    this.save('');
  }

  function Navigation($parent, $navigation, editor) {
    var that = this;
    this.renderNavigation = function() {
      $navigation.append(this.buildFileList());
      $navigation.append(this.buildNewFile());
      $navigation.append(this.buildResize());
    };

    this.buildFileList = function() {
      var $files = $('<div/>', { class: 'file-list' });
      var files = editor.getFileNames();
      for(var i in files) {
        var name = files[i];
        var $file = $('<div/>', { class: 'file'})
          .append($('<a/>', { href: '#', class: 'open', file: name, text: name }))
          .append($('<a/>', { href: '#', class: 'delete glyphicon glyphicon-trash', file: name }));

        that.registerFileHandlers($file);
        $files.append($file);
      };

      return $files
    };

    this.registerFileHandlers = function($file) {
      $('a.open', $file).on('click', function(e) {
        var file = $(this).attr('file');
        var text = editor.loadFile(file);
        var $editor = $('<div/>', { class: 'editor' })
          .append($('<textarea/>').val(text)).hide();

        $parent.append($editor);
        $editor.fadeIn('fast');
        $('textarea', $editor).focus();

        $('textarea', $editor).on('click', function() {
          return false;
        });

        $editor.on('click', function() {
          $editor.fadeOut('fast', function() {
            var text = $('textarea', $editor).val();
            editor.saveFile(file, text)
            $editor.remove();
          });
        })
      });

      $('a.delete', $file).on('click', function(e) {
        var file = $(this).attr('file');

        editor.deleteFile(file);
        $('.file-list', $navigation).remove();
        $navigation.prepend(that.buildFileList());
      });
    };

    this.buildNewFile = function() {
      var $newFile = $('<div/>', { class: 'resize' })
        .append($('<a/>', { href: '#', class: 'new-file' })
          .append($('<span/>', { class: 'glyphicon glyphicon-plus' })))
        .append($('<div/>', { class: 'add-file', style: 'display: none;' })
          .append($('<input/>', { placeholder: 'filename [ENTER]' })));

      this.registerNewFileHandlers($newFile);

      return $newFile;
    };

    this.registerNewFileHandlers = function($element) {
      var buildFileList = this.buildFileList;
      $('.new-file', $element).on('click', function() {
        $('.add-file', $element).show();
        $('.add-file input', $element).focus();
      });

      $('.add-file input', $element).keydown(function(e) {
        if(e.which == 13) {
          var name = $(this).val();
          if(name != '' && editor.getFileNames().indexOf(name) < 0) {
            $('.add-file', $element).hide();
            $('.add-file input', $element).val('');

            editor.addFile(name);
            $('.file-list', $navigation).remove();
            $navigation.prepend(that.buildFileList());
            $('a.open[file="' + name + '"]', $navigation).click();
          }

          return false;
        }
      });
    };

    this.buildResize = function() {
      var $resize = $('<div/>', { class: 'resize' })
        .append($('<a/>', { href: '#', class: 'fullscreen' })
          .append($('<span/>', { class: 'glyphicon glyphicon-resize-full' })))
        .append($('<a/>', { href: '#', class: 'smallscreen', style: 'display: none;' })
          .append($('<span/>', { class: 'glyphicon glyphicon-resize-small' })));

      this.registerResizeHandlers($resize);

      return $resize;
    };

    this.registerResizeHandlers = function($element) {
      $('.fullscreen', $element).on('click', function() {
        $(this).hide();
        $('.smallscreen', $element).show();
        $parent.addClass('fullscreen');
      });

      $('.smallscreen', $element).on('click', function() {
        $(this).hide();
        $('.fullscreen', $element).show();
        $parent.removeClass('fullscreen');
      });
    }

    this.renderNavigation();
  }

  var pluginName = "yosys",
  defaults = {
    yosis: {
      verbose: false,
      logger: false,
      echo: false
    }
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
      var $parent = $(this.element);
      $parent.append(this.buildDom());

      this.initYosys(function(ys) {
        var $navigation = $('.yosys-navigation', $parent);
        var $output = $('textarea.yosys-output', $parent);
        var $input = $('input.yosys-input', $parent);

        var editor = new Editor(ys);
        var navigation = new Navigation($parent, $navigation, editor);
        var output = new Output($output, ys.print_buffer);
        var input = new Input($input, function(command) {
          output.append(ys.run(command));
        });

        $parent.trigger('yosysAfterInit');
      }.bind(this));
    },

    /*
      <div id="input-wrapper" class="col-md12">
        <div class="left"><p>yosys &gt;</p></div>
        <div class="right"><input class="yosys-input" type="text"></div>
      </div>
      */
    buildDom() {
      var $wrapper = $('<div>')
        .append($('<nav/>', { class: 'yosys-navigation' }))
        .append($('<div>', { class: 'output-wrapper'})
          .append($('<textarea/>', { class: 'yosys-output', readonly: 'readonly' })))
        .append($('<div/>', { class: 'input-wrapper' })
          .append($('<div/>', { class: 'left', text: 'yosys >' }))
          .append($('<div/>', { class: 'right' })
            .append($('<input/>', { class: 'yosys-input', type: 'text' }))));

      return $wrapper.html();
    },

    initYosys(cb) {
      YosysJS.load_viz();
      var ys = YosysJS.create('ys_iframe', function() {
        cb(ys);
      }.bind(this));

      ys.verbose = this.settings.yosys.verbose;
      ys.logprint= this.settings.yosys.logprint;
      ys.echo = this.settings.yosys.echo;
      //this.yosys.ys = ys;
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
