var formUp    = require( '../' ),
    utils     = require( './_utils' ),
    isValid   = utils.isValid,
    isInvalid = utils.isInvalid,
    setValue  = utils.setValue,
    selectOption  = utils.selectOption,
    Event     = require( 'compose-toolbox' ).event

var form = utils.injectHTML( utils.container(), '<form class="progressive" data-nav="true"></form>' )
form.innerHTML = '<button type="submit">Submit</button>\
  <fieldset id="fieldsetOne" class="form-step"></fieldset>\
  <fieldset id="fieldsetTwo" class="form-step" data-nav="Step Two"></fieldset>\
  <fieldset class="form-step"></fieldset>'

var fieldsetOne = form.querySelector('#fieldsetOne')
var fieldsetTwo = form.querySelector('#fieldsetTwo')

Event.ready.fire()
Event.change.fire()

test( 'styles valid and invalid inputs', ()=> {

  var input = utils.addInput( fieldsetOne )

  setValue( input, '' )
  isInvalid( input )

  setValue( input, 'test' )
  isValid( input )

  fieldsetOne.removeChild( fieldsetOne.lastChild )
})

test( 'tests invalid values', ()=> {

  var input = utils.addInput( fieldsetOne )

  setValue( input, 'nope@nope.com' )
  formUp.invalidateField( input )


  formUp.validate( form )
  isInvalid( input )
  expect( input.parentNode.textContent ).toBe( "Value 'nope@nope.com' is not permitted" )

  formUp.invalidateField( input, 'Email address already registered' )
  formUp.validate( form )
  expect( input.parentNode.textContent ).toBe( "Email address already registered" )

  setValue( input, 'foo@bar.com' )
  isValid( input )

  fieldsetOne.removeChild( fieldsetOne.lastChild )

})

test( 'tests maximum words', ()=> {

  var input = utils.addInput( fieldsetOne, { 'data-max-words': '3' })

  setValue( input, 'two words' )
  isValid( input )

  setValue( input, 'too many words here' )
  isInvalid( input )

  fieldsetOne.removeChild( fieldsetOne.lastChild )

})

test( 'tests minimum words', ()=> {

  var input = utils.addInput( fieldsetOne, { 'data-min-words': '3' })

  setValue( input, 'two words' )
  isInvalid( input )

  setValue( input, 'three words here' )
  isValid( input )

  fieldsetOne.removeChild( fieldsetOne.lastChild )

})

test( 'sets custom validation messages', ()=> {

  var input = utils.addInput( fieldsetOne, { 'data-min-words': '3' })

  setValue( input, 'two words' )
  formUp.validate( form )

  // Check custom validation message
  expect( input.parentNode.textContent ).toBe( 'Please write at least 3 words.' )

  setValue( input, 'here are three' )

  // Check that messages are hidden when input is valid
  expect( input.parentNode.textContent ).toBe( '' )

  fieldsetOne.removeChild( fieldsetOne.lastChild )

})

test( 'traps form submissions', ()=> {

  var input = utils.addInput( fieldsetOne, { 'data-min-words': '3' })

  setValue( input, 'two words' )
  utils.submit( form )

  expect( input.parentNode.textContent ).toBe( 'Please write at least 3 words.' )

  fieldsetOne.removeChild( fieldsetOne.lastChild )
})

test( 'tests select elements', ()=> {
  var select = utils.addInput( fieldsetOne, {}, '<select><option value="">Select something</option><option value="1">Something</option></select>')
  
  utils.submit( form )
  isInvalid( select )

  selectOption( select, 1 )

  isValid( select )

  fieldsetOne.removeChild( fieldsetOne.lastChild )
})

test( 'can generate form navigation', ( )=> {
  expect( form.querySelector( '.progressive-form-nav' ) ).toBeDefined()
})

test( 'customizes nav labels for form navigation', ( )=> {
  var step = form.querySelector( '.progressive-form-nav-item[data-step="2"]' )
  expect( step.textContent ).toBe( 'Step Two' )
})

test( 'disables all but the first fieldset', ()=> {

  expect( fieldsetOne.disabled ).toBeFalsy()
  expect( fieldsetTwo.disabled ).toBeTruthy()

})

test( 'does not progress if an input is invalid', ()=> {

  // Add an invalid input (no value)
  var input = utils.addInput( fieldsetOne )

  utils.submit( form )

  expect( fieldsetOne.disabled ).toBeFalsy()
  expect( fieldsetTwo.disabled ).toBeTruthy()

  fieldsetOne.removeChild( fieldsetOne.lastChild )

})

test( 'progresses if an input is valid', ( )=> {

  // Add a valid input
  var input = utils.addInput( fieldsetOne, { value: 'true' } )

  utils.submit( form )

  expect( fieldsetOne.disabled ).toBeTruthy()
  expect( !fieldsetTwo.disabled ).toBeTruthy()

  fieldsetOne.removeChild( fieldsetOne.lastChild )

})

test( 'can revisit a fieldset after submission', ( )=> {
  // Add a valid input
  var input = utils.addInput( fieldsetTwo, { value: 'true' } )
  form.classList.add( 'fake-error' )

  utils.submit( form )

  expect( fieldsetTwo.disabled ).toBeFalsy()
  expect( fieldsetTwo.classList.contains( 'active' ) ).toBeTruthy()

})

test( 'can go to a specific step', ( )=> {

  expect( fieldsetOne.disabled ).toBeTruthy()
  var nav = document.querySelector( 'nav' )
  
  Event.fire( nav.firstChild, 'click' )
  expect( fieldsetOne.disabled ).toBeFalsy()
  expect( fieldsetTwo.disabled ).toBeTruthy()

  Event.fire( nav.querySelector( '[data-step="2"]' ), 'click' )
  expect( fieldsetOne.disabled ).toBeTruthy()
  expect( fieldsetTwo.disabled ).toBeFalsy()
})
