var validation = require( './lib/validation' )
var progressive = require( './lib/progressive' )
var getLabel = require( './lib/get-label' )

module.exports = {

  validate: validation.validate,
  invalidateField: validation.invalidateField,
  next: progressive.next,
  getLabel: getLabel

}
