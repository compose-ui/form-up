
var assert    = require( 'chai' ).assert,
    formUp    = require( '../' ),
    utils     = require( './_utils' ),
    isValid   = utils.isValid,
    isInvalid = utils.isInvalid,
    setValue  = utils.setValue,
    selectOption  = utils.selectOption,
    Event     = require( 'compose-event' )

describe( 'formup', function() {

  var form = utils.injectHTML( utils.container(), '<form class="progressive"></form>' )
  form.innerHTML = '<button type="submit">Submit</button>\
    <fieldset id="fieldsetOne" class="form-step"></fieldset>\
    <fieldset id="fieldsetTwo" class="form-step"></fieldset>\
    <fieldset class="form-step"></fieldset>'

  var fieldsetOne = form.querySelector('#fieldsetOne')
  var fieldsetTwo = form.querySelector('#fieldsetTwo')

  Event.fire( document, 'DOMContentLoaded' )
  Event.fire( document, 'page:change' )

  describe( 'validate', function() {

    it( 'styles valid and invalid inputs', function() {

      var input = utils.addInput( fieldsetOne )

      setValue( input, '' )
      isInvalid( input )

      setValue( input, 'test' )
      isValid( input )

      fieldsetOne.removeChild( fieldsetOne.lastChild )
    })

    it( 'tests invalid values', function() {

      var input = utils.addInput( fieldsetOne, { 'data-invalid-value': 'nope@nope.com' })

      setValue( input, 'nope@nope.com' )
      isInvalid( input )
      formUp.validate( form )
      assert.equal( input.parentNode.textContent, "Value 'nope@nope.com' is not permitted" )

      input.dataset.invalidValueMessage = 'Email address already registered'
      formUp.validate( form )
      assert.equal( input.parentNode.textContent, "Email address already registered" )

      setValue( input, 'foo@bar.com' )
      isValid( input )

      fieldsetOne.removeChild( fieldsetOne.lastChild )

    })

    it( 'tests maximum words', function() {

      var input = utils.addInput( fieldsetOne, { 'data-max-words': '3' })

      setValue( input, 'two words' )
      isValid( input )

      setValue( input, 'too many words here' )
      isInvalid( input )

      fieldsetOne.removeChild( fieldsetOne.lastChild )

    })

    it( 'tests minimum words', function() {

      var input = utils.addInput( fieldsetOne, { 'data-min-words': '3' })

      setValue( input, 'two words' )
      isInvalid( input )

      setValue( input, 'three words here' )
      isValid( input )

      fieldsetOne.removeChild( fieldsetOne.lastChild )

    })

    it( 'sets custom validation messages', function() {

      var input = utils.addInput( fieldsetOne, { 'data-min-words': '3' })

      setValue( input, 'two words' )
      formUp.validate( form )

      // Check custom validation message
      assert.equal( input.parentNode.textContent, 'Please write at least 3 words.' )

      setValue( input, 'here are three' )

      // Check that messages are hidden when input is valid
      assert.equal( input.parentNode.textContent, '' )

      fieldsetOne.removeChild( fieldsetOne.lastChild )

    })

    it( 'traps form submissions', function() {

      var input = utils.addInput( fieldsetOne, { 'data-min-words': '3' })

      setValue( input, 'two words' )
      utils.submit( form )

      assert.equal( input.parentNode.textContent, 'Please write at least 3 words.' )

      fieldsetOne.removeChild( fieldsetOne.lastChild )
    })

    it( 'tests select elements', function() {
      var select = utils.addInput( fieldsetOne, {}, '<select><option value="">Select something</option><option value="1">Something</option></select>')
      
      utils.submit( form )
      isInvalid( select )

      selectOption( select, 1 )

      isValid( select )

      fieldsetOne.removeChild( fieldsetOne.lastChild )
    })

  })

  describe( 'progressive form', function() {

    formUp.next( form, function( event, step ) {

      // Manufacture a reason to go back
      if ( step.fieldset.classList.contains('back') ) 
        step.back()
      else 
        step.forward()

    })

    it( 'hides all but the first fieldset', function() {

      assert.isTrue( !fieldsetOne.disabled )
      assert.isTrue( fieldsetTwo.disabled )

    })

    it( 'does not progress if an input is invalid', function() {

      // Add an invalid input (no value)
      var input = utils.addInput( fieldsetOne )

      utils.submit( form )

      assert.isTrue( !fieldsetOne.disabled )
      assert.isTrue( fieldsetTwo.disabled )

      fieldsetOne.removeChild( fieldsetOne.lastChild )

    })

    it( 'progresses if an input is valid', function( ) {

      // Add a valid input
      var input = utils.addInput( fieldsetOne, { value: 'true' } )

      utils.submit( form )

      assert.isTrue( fieldsetOne.disabled )
      assert.isTrue( !fieldsetTwo.disabled )

      fieldsetOne.removeChild( fieldsetOne.lastChild )

    })

    it( 'can step back', function( ) {
      // Add a valid input
      var input = utils.addInput( fieldsetTwo, { value: 'true' } )
      fieldsetTwo.classList.add( 'back' )

      utils.submit( form )

      assert.isTrue( !fieldsetTwo.disabled )

    })

  })

})
