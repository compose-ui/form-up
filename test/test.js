var assert    = require( 'chai' ).assert
var formUp    = require( '../' )
var utils     = require( './_utils' )
var isValid   = utils.isValid
var isInvalid = utils.isInvalid
var setValue  = utils.setValue

formUp.watch()

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

    setValue( input, 'two words' )
    isValid( input )

  })

  it( 'minimum words', function() {

    var input = utils.addInput( form, { 'data-min-words': '3' })

    setValue( input, 'two words' )
    isInvalid( input )

  })

  it( 'sets custom validation messages', function() {

    var input = utils.addInput( form, { 'data-min-words': '3' })

    setValue( input, 'two words' )
    formUp.validate( form )

    // Check custom validation message
    assert.equal( input.parentNode.textContent, 'Please write at least 3 words.' )

    setValue( input, 'here are three' )

    // Check that messages are hidden when input is valid
    assert.equal( input.parentNode.textContent, '' )

  })

  it( 'traps form submissions', function() {

    var input = utils.addInput( form, { 'data-min-words': '3' })

    setValue( input, 'two words' )
    utils.submit( form )

    assert.equal( input.parentNode.textContent, 'Please write at least 3 words.' )
  })
})
