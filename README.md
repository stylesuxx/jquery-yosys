# jQuery yosysjs plugin
> A jQeury plugin to easily integrate [yosysjs](http://www.clifford.at/yosys/) into your page.

A live demo of the yosys jQuery plugin can be found [here](http://stylesuxx.github.io/jquery-yosys/).

## Features
* Add and deltet files
* Persist files between sessions
* Fullscreen mode
* Command history

## Structure
```HTML
<div id="yosys"></div>
```

After including the plugin in your project you can simply invoke:

```JS
var options = {}
$('#yosys').yosys(options);
```

## Events
A list of events that can be listened to with an *on* handler:

* yosysAfterInit: Fires after yosys init is done.

## Options
### yosys
Options to be passed to yosys directly, they may be *true* or *false* and default to false if not set:

* verbose
* logprint
* echo

## Examples
Check out the demo folder for an example of how to use this jQuery plugin.
