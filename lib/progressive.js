var toolbox  = require( 'compose-toolbox' ),
    Event    = toolbox.event,
    Callback = toolbox.event.callback,
    formSelector = 'form.progressive',
    watching = false,
    formCallbacks,
    registeredForms

// Remove any existing callbacks and registered forms
function reset () {

  formCallbacks = { next: [] }
  registeredForms = []

}

function newForm( form ) {

  if ( !form ) return

  var steps     = toolbox.slice( form.querySelectorAll( '.form-step' ) ),
      stepIndex = 0,
      navItems  = ''

  if ( steps.length == 0 ) return


  steps.forEach( function( step, index ) { 

    // disable all steps but the current step
    step.disabled     = step != currentStep()
    step.dataset.step = index

  })

  if ( form.dataset.nav ) {
    var nav = '<nav class="progressive-form-nav">'

    steps.forEach( function( step, index ) {
      nav += '<a href="#" class="progressive-form-nav-item" data-step="'+( index + 1 )+'">'
      nav += step.dataset.nav || "Step " + ( index + 1 )
      nav += '</a> '
    })

    nav += '</nav>'

    form.insertAdjacentHTML( 'afterbegin', nav )
  }

  show()

  function previousStep ()  { return steps[ stepIndex - 1] }
  function currentStep ()   { return steps[ stepIndex ] }
  function nextStep ()      { return steps[ stepIndex + 1] }
  function active ()        { return currentStep() && !currentStep().disabled }
 
  // Move to next fieldset
  function forward () {
    showStep( stepIndex + 1 )
  }

  // Move to next fieldset
  function back () {
    showStep( stepIndex - 1 )
  }

  // Accepts a step index
  function showStep ( index ) {

    index = Number( index )

    // Get the step from the index
    var step = steps[ index ]

    // Don't go to a non-existant step, or the current step
    if ( step && step != currentStep() ) {

      var direction = ( stepIndex < index ) ? 'forward' : 'reverse'

      // If a step is currently active
      // dismiss it before going to the specified step
      if ( active() ) {
        return dismiss( function() { showStep( index ) }, direction )
      }

      stepIndex = index

      show( direction )

    }
  }
  
  // Hide a completed step and move to the next
  function dismiss ( callback, direction ) {
    direction = direction || 'forward'

    currentStep().classList.remove( 'active', 'enter' )
    currentStep().classList.add( 'exit' )
    currentStep().dataset.direction = direction

    Event.afterAnimation( currentStep(), function() {
      disable()

      if ( typeof callback === 'function' ) callback()

    }, 20)

  }

  function revisit ( callback, direction ) {

    if ( !active() ) {
      direction = direction || 'reverse'

      currentStep().classList.remove( 'exit', 'completed' )
      currentStep().classList.add( 'active', 'enter' )
      currentStep().dataset.direction = direction

      disableOtherFieldsets()

      Event.afterAnimation( currentStep(), function() {
        if ( typeof callback === 'function' ) callback()
      }, 20)
    }
  }

  // Show the form-step
  function show ( direction ) {

    disableOtherFieldsets()
    currentStep().classList.remove( 'completed' )
    currentStep().dataset.direction = direction
    currentStep().classList.add( 'active', 'enter' )

    // focus on the first input
    var firstInput = currentStep().querySelector( 'input:not([hidden]), textarea, select' )
    if ( firstInput ) firstInput.focus()

    setNav()

  }

  // Disable a form step after it has been hidden
  function disable () {

    currentStep().disabled = true
    currentStep().classList.add( 'completed' )
    currentStep().classList.remove( 'enter', 'exit' )

  }

  function setNav () {
    toolbox.each( form.querySelectorAll( 'nav [data-step]' ), function ( nav ) {

      if ( nav.dataset.step < stepIndex + 1 ) {
        nav.classList.remove( 'here', 'next' )
        nav.classList.add( 'previous', 'completed' )
      }

      if ( nav.dataset.step == stepIndex + 1 ) {
        nav.classList.remove( 'previous', 'next' )
        nav.classList.add( 'here' )
      }

      if ( nav.dataset.step > stepIndex + 1 ) {
        nav.classList.remove( 'previous', 'here' )
        nav.classList.add( 'next' )
      }

    })
  }

  function enableFieldsets ( form ) {
    toolbox.each( form.querySelectorAll( 'fieldset.form-step[disabled]' ), function( fieldset ) {
      fieldset.disabled = false 
    })
  }

  function disableOtherFieldsets ( ) {
    steps.forEach( function( fieldset ) {
      fieldset.disabled = fieldset != currentStep() 
    })
  }

  registeredForms.push( function( event, trigger ) {
    var target = event.currentTarget

    if ( trigger === 'show-step' ) {
      event.preventDefault()

      if ( toolbox.matches( target, '.previous, .completed, .completed + a' ) )
        showStep( target.dataset.step - 1 )

    } else if ( trigger === 'next' ) {

      // Continue if submit was triggered on this form
      // and no invalid fields are found

      var formEl = ( target.tagName == "FORM" ) ? target : toolbox.getClosest( target, 'form')

      if ( form == formEl && !currentStep().querySelector( ':invalid' ) ) {

        // Get the function which triggers callbacks
        var fireCallbacks = getCallbacks( form )

        // This is the last stop, be sure all fieldsets are enabled!
        if ( !nextStep() ) enableFieldsets( form )
        else disableOtherFieldsets( form )

        // If there are callbacks, let them handle this!
        if ( fireCallbacks ) {

          // Since there are callbacks, stop the submission event
          event.preventDefault()

          fireCallbacks( event, {
            fieldset: currentStep(),  // Valid fieldset element
            form:     form,           // Parent form element
            forward:  forward,        // Call forward() to move to the next fieldset
            dismiss:  dismiss,        // Hide and disable current step
            revisit:  revisit,        // Revisit current disabled step
            showStep: showStep,       // Show a specific step by index (0 based)
            complete: !nextStep(),    // is this is the final form step?
            formData: toolbox.formData( currentStep() ) // pass FormData for current fieldset
          })
        }

        // No callbacks? If there's a next step, stop submission and proceed
        else if ( nextStep() ) {
          event.preventDefault() 
          forward()
        }
      }
    }
  })
}

function fire ( event, type ) {
  registeredForms.forEach( function( fn ) { fn( event, type ) })
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

  var nextSelector = formSelector + ' [type=submit], ' + formSelector + ' .next-step'
  var backSelector = formSelector + ' .back-step'
  var navSelector  = '.progressive-form-nav-item[data-step]'

  Event.on( document, 'click', nextSelector , fire, 'next' )
  Event.on( document, 'click', backSelector , fire, 'back' )
  Event.on( document, 'click', navSelector  , fire, 'show-step' )
// insert core styling for hiding disabled and completed form-steps
  document.head.insertAdjacentHTML( 'beforeend', "<style>\
.form-step[disabled], .form-step.completed {\
  position: absolute !important;\
  top:      -9999px  !important;\
  left:     -9999px  !important;\
  left:     0        !important;\
  right:    0        !important; }\
</style>" )

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
