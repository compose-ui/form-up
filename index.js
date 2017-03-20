var validation = require( './lib/validation' )
var progressive = require( './lib/progressive' )

module.exports = {

  validate: validation.validate,
  invalidateField: validation.invalidateField,
  next: progressive.next,

}
