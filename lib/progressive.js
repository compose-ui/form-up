var toolbox  = require( 'compose-toolbox' ),
    Event    = toolbox.event,
    Callback = toolbox.event.callback,
    formSelector = 'form.progressive',
    watching = false,
    formCallbacks,
    registerdForms

// Remove any existing callbacks and registered forms
function reset () {

  formCallbacks = { next: [] }
  registerdForms = []

}

function newForm( form ) {

  if ( !form ) return

  var steps     = toolbox.slice( form.querySelectorAll( '.form-step' ) ),
      stepIndex = -1;

  if ( steps.length == 0 ) return

  steps.forEach( function( step ) { step.disabled = true })

  forward()

  function previousStep () { return steps[ stepIndex - 1] }
  function currentStep ()  { return steps[ stepIndex ] }
  function nextStep ()     { return steps[ stepIndex + 1] }
  function active ()       { return currentStep() && !currentStep().disabled }

  // Move to next fieldset
  function forward ( timer ) {

    // Hide current step before advancing to the next one
    if ( active() ) {
      return dismiss( function() { forward( timer ) } )
    }

    if ( nextStep() ) {
      stepIndex += 1

      if ( timer ) { Event.delay( show, timer ) }
      else { show() }
    }

  }

  // Move to previous fieldset // Show the current step again
  function back ( timer ) {

    if ( timer ) { Event.delay( show, timer ) }
    else { show() }

  }

  // Hide a completed step and move to the next
  function dismiss ( callback ) {

    currentStep().classList.remove( 'step-visited', 'arrived' )
    currentStep().classList.add( 'departed' )

    Event.afterAnimation( currentStep(), function() {
      disable()

      if ( typeof callback === 'function' ) callback()

    })

  }

  // Show the form-step
  function show () {

    currentStep().disabled = false
    currentStep().classList.add( 'arrived' )

    // focus on the first input
    var firstInput = currentStep().querySelector( 'input:not([hidden])' )
    if ( firstInput ) firstInput.focus()

  }

  // Disable a form step after it has been hidden
  function disable () {

    currentStep().disabled = true
    currentStep().classList.add( 'step-visited' )
    currentStep().classList.remove( 'departed', 'arrived' )

  }

  registerdForms.push( function( event ) {

    // Continue if submit was triggered on this form
    // and no invalid fields are found
    if ( form == event.target && !currentStep().querySelector( ':invalid' ) ) {

      // If a step remains, stop the form submission
      if ( nextStep() ) { event.preventDefault() }

      // Get the function which triggers callbacks
      var fireCallbacks = getCallbacks( form )

      if ( ! fireCallbacks ) { forward() }

      else {
        // Since there are callbacks, stop the submission event
        event.preventDefault()

        dismiss( function(){
          fireCallbacks( event, {
            fieldset: currentStep(),  // Valid fieldset element
            form:     form,           // Parent form element
            forward:  forward,        // Call forward() to move to the next fieldset
            back:     back,           // Call back() to revisit a fieldset ( perhaps because of an ajax error )
            complete: !!nextStep(),   // is this is the final form step?
            formData: toolbox.formData( currentStep() ) // pass FormData for current fieldset
          })
        })

      }
    }
  })
}

function fire ( event ) {
  registerdForms.forEach( function( fn ) { fn( event ) })
}


// Returns a function which triggers callbacks
function getCallbacks ( form, type ) {

  type = type || 'next'
  var callbacks = [], cb;

  formCallbacks[ type ].forEach( function( test ) {
     if ( cb = test( form ) ) {
       callbacks.push( cb )
     }
  })

  // Return a function which can trigger all callbacks
  // or returns fallse if none are called

  if ( callbacks.length )
    return function() {
      var args = toolbox.slice( arguments )

      callbacks.forEach( function( callback ) {
        callback.apply( callback, args ) }) }

  else return false
}

function next ( el, callback ) {
  on( el, 'next', callback )
}

function on ( el, event, callback ) {

  // Accept events list as an object e.g. { next: callback }
  if ( typeof event === 'object' ) {
    for ( type in event ) {
      on( el, type, event[ type ] )
    }
  }

  else if ( formCallbacks[ event ] ) {

    // Only allow access to a callback if the form matches
    var filter = function( form ) {
      if ( form == el ) return callback
    }

    // Add the test wrapper function to the callback list
    formCallbacks[ event ].push( filter )
  }
}

Event.ready( function(){
  reset()

  // Add bubbling so we can listen for submission
  Event.bubbleFormEvents()

  Event.on( document, 'submit', formSelector, fire )

  Event.change( function() {
    reset()

    toolbox.each( document.querySelectorAll( formSelector ), function( el ) {
      newForm( el )
    })
  })
})

module.exports = {
  next: next,
  new: newForm
}