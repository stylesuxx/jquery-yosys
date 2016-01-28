# jQuery yosysjs plugin
> A jQeury plugin to easily integrate [yosysjs](http://www.clifford.at/yosys/) into your page.

## Structure
The container has to have at least the following Structure:

```HTML
<div id="yosys">
  <nav class="yosys-navigation"></div>
  <textarea class="yosys-output"></textarea>
  <input class="yosys-input">
</div>
```

After including the plugin in your project you can simply invoke:

```JS
var options = {}
$('#yosys').yosys(options);
```

## Options
### done
Function to be called as soon as yosys is done with initialization.

### yosys
Options to be passed to yosys directly:

* verbose: true|false
* logprint: true|false
* echo: true|false

## Examples
Check out the demo folder for an example of how to use this jQuery plugin.
