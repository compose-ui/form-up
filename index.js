var validation   = require( './lib/validation' ),
    progressive  = require( './lib/progressive' ),
    getLabel     = require( './lib/get-label' ),
    diff         = require( './lib/diff' ),
    inputChange  = require( './lib/input-change' ),
    steppedInput = require( './lib/stepped-number-input' ),
    stepLabels   = require( './lib/step-labels' ),
    slider       = require( './lib/slider/input' )

require( './lib/reset' )

module.exports = {
  validate: validation.validate,
  invalidateField: validation.invalidateField,
  next: progressive.next,
  getLabel: getLabel,
  diff: diff,
  inputChange: inputChange,
  steppedNumberInput: steppedInput,
  stepLabels: stepLabels,
  slider: slider
}
