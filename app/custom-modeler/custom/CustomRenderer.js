'use strict';

var inherits = require('inherits');

var BaseRenderer = require('diagram-js/lib/draw/BaseRenderer');

//var componentsToPath = require('diagram-js/lib/util/RenderUtil').componentsToPath;


/**
 * A renderer that knows how to render custom elements.
 */
function CustomRenderer(eventBus, styles, pathMap, priority) {

    BaseRenderer.call(this, eventBus, priority);

    this._styles = styles;

    var self = this;

    var computeStyle = styles.computeStyle;

    this.handlers = {};
}

inherits(CustomRenderer, BaseRenderer);

module.exports = CustomRenderer;

CustomRenderer.$inject = ['eventBus', 'styles'];


CustomRenderer.prototype.canRender = function (element) {
    return /^custom\:/.test(element.type);
};

CustomRenderer.prototype.drawShape = function (visuals, element) {
    var type = element.type;
    var h = this.handlers[type];

    /* jshint -W040 */
    return h(visuals, element);
};

CustomRenderer.prototype.drawConnection = function (visuals, element) {
    var type = element.type;
    var h = this.handlers[type];

    /* jshint -W040 */
    return h(visuals, element);
};
//Our custom code
CustomRenderer.prototype.getShapePath = function (element) {
    var type = element.type.replace(/^custom\:/, '');

    var shapes = {
        //triangle: this.getTrianglePath,
        //circle: this.getCirclePath
    };

    return shapes[type](element);
};
