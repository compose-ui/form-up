var validation = require( './lib/validation' )
var progressive = require( './lib/progressive' )
var getLabel = require( './lib/get-label' )
var diff = require( './lib/diff' )
var inputChange = require( './lib/input-change' )
var steppedNumberInput = require( './lib/stepped-number-input' )
var externalLabels = require( './lib/external-labels' )
require( './lib/reset' )

module.exports = {
  validate: validation.validate,
  invalidateField: validation.invalidateField,
  next: progressive.next,
  getLabel: getLabel,
  diff: diff,
  inputChange: inputChange,
  steppedNumberInput: steppedNumberInput,
  externalLabels: externalLabels
}
