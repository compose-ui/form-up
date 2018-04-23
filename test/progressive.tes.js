var formUp    = require( '../' ),
    utils     = require( './_utils' ),
    isValid   = utils.isValid,
    isInvalid = utils.isInvalid,
    setValue  = utils.setValue,
    selectOption  = utils.selectOption,
    Event     = require( 'compose-toolbox' ).event

formUp.next( form, function( event, step ) {

  // Manufacture a reason to prevent moving forward
  if ( !form.classList.contains('fake-error') ) 
    step.forward()

})

var form = utils.injectHTML( utils.container(), '<form class="progressive" data-nav="true"></form>' )
form.innerHTML = '<button type="submit">Submit</button>\
  <fieldset id="fieldsetOne" class="form-step"></fieldset>\
  <fieldset id="fieldsetTwo" class="form-step" data-nav="Step Two"></fieldset>\
  <fieldset class="form-step"></fieldset>'

var fieldsetOne = form.querySelector('#fieldsetOne')
var fieldsetTwo = form.querySelector('#fieldsetTwo')

Event.ready.fire()
Event.change.fire()

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
