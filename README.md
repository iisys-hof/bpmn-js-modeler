# bpmn-js modeler

## About
This is a fully usable implementation of a BPMN 2.0 modeler using bpmn-js and further modules from [bpmn.io](https://github.com/bpmn-io). This modeler has a properties panel, embedded comments, uses element templates (for integration with our document management system) and has a integration with Camunda BPM to load and upload processes from and to the bpm engine.

This modeler is part of the project [Social Collaboration Hub](https://www.sc-hub.de).

## Install
* Download this git repository.
* You need npm. Get it here: https://nodejs.org/en/download/
* Install grunt and grunt-cli (globally)
```
npm install -g grunt grunt-cli
```
* Go to the root of the project and install
```
npm install
```

## Run
```
grunt auto-build
```

## Development
For production this app uses uglify to create a minified app.js. But if you use `grunt auto-build` and want to see live-changes, you have to load `<script src="./app.js"></script>` in app/index.html. Why? Because our grunt watcher doesn't use uglify for speed reasons. If you want to use uglify when auto-building, just add it in your Gruntfile (look for `watch`).

**Production environment**:

Don't forget to change the script src back in your app/index.html to use the minified version:
```
<script src="./app.min.js"></script>
```

## Modules we use
* [bpmn-js](https://github.com/bpmn-io/bpmn-js)
* [bpmn-js-properties-panel](https://github.com/bpmn-io/bpmn-js-properties-panel)
* [diagram-js](https://github.com/bpmn-io/diagram-js)
* [camunda-bpm-moddle](https://github.com/camunda/camunda-bpmn-moddle)
* [bpmn-js-embedded-comments](https://github.com/bpmn-io/bpmn-js-embedded-comments) (with our [fork](https://github.com/iisys-hof/bpmn-js-embedded-comments))

### bpmn-js with custom elements
We added ServiceTask and HumanTask to the palette.

The classes in app/custom-modeler/custom are responsible for these additional task elements.
To redo these changes and use the original Modeler instead, change app/app.js and use
```
Modeler = require('bpmn-js/lib/Modeler'),
```
instead of `CustomModeler = require('./custom-modeler')`.

### Element Templates
This app takes usage of the [element templates](https://blog.camunda.org/post/2016/05/camunda-modeler-element-templates/) from Camunda. You find the related templates in `resources > element-templates > template.json`. In this case our templates integrate our document management system Nuxeo.

## Update these Modules
* Find outdated modules:
```
npm outdated
```
* Change the versions in `package.json` to the new ones.
* Update versions (as administrator):
```
npm install
```
* Check everything. (even CSS classes)

### Special case: custom modeler

As we use our own changed version of the modeler, we have to update it partially manually afterwards.

Compare the files in `app > custom-modeler > custom` with their corresponding originals in node_modules:
* CustomPalette with node_modules/bpmn-js/lib/features/palette/PaletteProvider.js
* CustomRenderer with node_modules/diagram-js/lib/draw/DefaultRenderer.js

Sometimes you have to change parts of the custom files.

*For the future:*
Maybe there will be a better way to extend the modeler sometimes. Use it.
