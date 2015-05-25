var inherits = require('util').inherits

var MemoryProvider = require('../providers/memory')
var AbstractSyncColorDefinitionStorage = require('./abstractsync')

/**
 * @class ColorDefinitionMemoryStorage
 * @extends AbstractSyncColorDefinitionStorage
 */
function ColorDefinitionMemoryStorage () {
  var provider = new MemoryProvider()
  AbstractSyncColorDefinitionStorage.call(this, provider)
}

inherits(ColorDefinitionMemoryStorage, AbstractSyncColorDefinitionStorage)

ColorDefinitionMemoryStorage.isAvailable = MemoryProvider.isAvailable

module.exports = ColorDefinitionMemoryStorage