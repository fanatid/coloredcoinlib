var _ = require('lodash')

var errors = require('./errors')
var verify = require('./verify')


/**
 * @class ComposedTx
 * @param {OperationalTx} operationalTx
 */
function ComposedTx(operationalTx) {
  verify.OperationalTx(operationalTx)

  this.operationalTx = operationalTx
  this.txIns = []
  this.txOuts = []
}

/**
 * @typedef {Object} ComposedTx~Input
 * @property {string} txId
 * @property {number} outIndex
 * @property {number} [sequence]
 */

/**
 * @typedef {Object} ComposedTx~OutTarget
 * @property {ColorTarget} target
 */

/**
 * @typedef {Object} ComposedTx~OutScriptValue
 * @property {string} script
 * @property {number} value
 */

/**
 * @param {ComposedTx~Input} txIn
 */
ComposedTx.prototype.addTxIn = function (txIn) {
  this.addTxIns([txIn])
}

/**
 * @param {ComposedTx~Input[]} txIns
 */
ComposedTx.prototype.addTxIns = function (txIns) {
  var self = this

  verify.array(txIns)
  txIns.forEach(function (txIn) {
    verify.object(txIn)
    verify.txId(txIn.txId)
    verify.number(txIn.outIndex)

    self.txIns.push({txId: txIn.txId, outIndex: txIn.outIndex})

    if (!_.isUndefined(txIn.sequence)) {
      verify.number(txIn.sequence)
      _.last(self.txIns).sequence = txIn.sequence
    }
  })
}

/**
 * @param {number} index
 * @param {number} sequence
 * @throws {RangeError}
 */
ComposedTx.prototype.setTxInSequence = function (index, sequence) {
  verify.number(index)
  verify.number(sequence)

  if (index < 0 || index >= this.txIns.length) {
    throw new RangeError('TxIn for index not found')
  }

  this.txIns[index].sequence = sequence
}

/**
 * @return {ComposedTx~Input[]}
 */
ComposedTx.prototype.getTxIns = function () {
  return _.cloneDeep(this.txIns)
}

/**
 * @param {(ComposedTx~OutTarget|ComposedTx~OutScriptValue)} out
 * @throws {VerifyTypeError} If target represent not uncolored target
 */
ComposedTx.prototype.addTxOut = function (out) {
  this.addTxOuts([out])
}

/**
 * @param {Array.<(ComposedTx~OutTarget|ComposedTx~OutScriptValue)>} outs
 * @throws {VerifyTypeError} If target represent not uncolored target
 */
ComposedTx.prototype.addTxOuts = function (outs) {
  var self = this

  verify.array(outs)
  outs.forEach(function (out) {
    var txOut = {}

    if (_.isUndefined(out.target)) {
      txOut.script = out.script
      txOut.value = out.value

    } else {
      verify.ColorTarget(out.target)
      if (out.target.isUncolored() === false) {
        throw new errors.VerifyTypeError('')
      }

      txOut.script = out.target.getScript()
      txOut.value = out.target.getValue()

    }

    verify.hexString(txOut.script)
    verify.number(txOut.value)

    self.txOuts.push(txOut)
  })
}

/**
 * @return {Array.<ComposedTx~OutScriptValue>}
 */
ComposedTx.prototype.getTxOuts = function () {
  return _.cloneDeep(this.txOuts)
}

/**
 * Estimate transaction size
 *
 * @param {Object} extra
 * @param {number} [extra.txIns=0]
 * @param {number} [extra.txOuts=0]
 * @param {number} [extra.bytes=0]
 */
ComposedTx.prototype.estimateSize = function (extra) {
  extra = _.extend({
    txIns:  0,
    txOuts: 0,
    bytes:  0
  }, extra)

  verify.object(extra)
  verify.number(extra.txIns)
  verify.number(extra.txOuts)
  verify.number(extra.bytes)

  var size = (181 * (this.txIns.length + extra.txIns) +
              34 * (this.txOuts.length + extra.txOuts) +
              10 + extra.bytes)

  return size
}

/**
 * Estimate required fee for current transaction
 *
 * @param {Object} extra
 * @param {number} [extra.txIns=0]
 * @param {number} [extra.txOuts=1]
 * @param {number} [extra.bytes=0]
 * @return {number}
 */
ComposedTx.prototype.estimateRequiredFee = function (extra) {
  extra = _.extend({
    txIns:  0,
    txOuts: 1,
    bytes:  0
  }, extra)

  verify.object(extra)
  verify.number(extra.txIns)
  verify.number(extra.txOuts)
  verify.number(extra.bytes)

  var size = this.estimateSize(extra)
  var fee = this.operationalTx.getRequiredFee(size)

  return fee
}


module.exports = ComposedTx
