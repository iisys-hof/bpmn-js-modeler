module.exports = {
    __init__: ['customRenderer', 'paletteProvider'],
    customRenderer: ['type', require('./CustomRenderer')],
    paletteProvider: ['type', require('./CustomPalette')],
};
