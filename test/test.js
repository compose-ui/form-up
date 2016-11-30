var assert = require( 'chai' ).assert
var validateForms = require( '../' )
var utils = require( './_utils' )
var isValid = utils.isValid
var isInvalid = utils.isInvalid
var setValue = utils.setValue

validateForms.run()

describe( 'validate', function() {

  var form = utils.injectHTML( document.body, '<form></form>' )

  beforeEach( function() {
    form.innerHTML = ""
  })

  it( 'required inputs', function() {

    var input = utils.addInput( form, {})

    setValue( input, '' )
    isInvalid( input )

    setValue( input, 'test' )
    isValid( input )

  })

  it( 'maximum words', function() {

    var input = utils.addInput( form, { 'data-max-words': '3' })

    setValue( input, 'test this' )
    isValid( input )

  })

  it( 'minimum words', function() {

    var input = utils.addInput( form, { 'data-min-words': '3' })

    setValue( input, 'test this' )
    isInvalid( input )

    validateForms.showMessage( input )

  })

  it( 'sets custom validation messages', function() {

    var input = utils.addInput( form, { 'data-min-words': '3' })

    setValue( input, 'test this' )
    validateForms.showMessage( input )

    // Check custom validation message
    assert.equal( input.parentNode.textContent, 'Please write at least 3 words.' )

    setValue( input, 'here are three' )

    // Check that messages are hidden when input is valid
    assert.equal( input.parentNode.textContent, '' )

  })
})
