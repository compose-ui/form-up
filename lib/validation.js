// Dependencies
var toolbox    = require( 'compose-toolbox' ),
    Event      = toolbox.event,
    getClosest = toolbox.getClosest,
    wordCount  = toolbox.wordCount,
    textSelectors = '[required]';

// Does this browser support HTML5 validation?
function supported () {

  return typeof document.createElement( 'input' ).checkValidity === 'function'

}

var invalidHandler = Event.callback.new( function( event ) { 
  event.preventDefault() 
  event.stopPropagation() 
})

// Watch for events ( if validation is suported )
Event.ready( function(){

  if ( supported() ) { 

    Event.bubbleFormEvents()

    document.addEventListener( 'invalid', invalidHandler, true )

    Event.on( document.body, 'click', '[type=submit]', submit )

    Event.on( document, 'validate', 'form', function( event ) { 
      validateForm( event.target )
    })

    // Ensure all required inputs have aria-requrired attributes
    toolbox.slice( document.querySelectorAll( '[required]' ) ).forEach( function( element ) { 
      element.setAttribute( 'aria-required', true )
    })

    // Watch input events
    Event.on( document, 'blur', '[required]', checkValidation )
    Event.on( document, 'keydown', '[required]', Event.debounce( checkValidation, 200 ) )
    Event.on( document, 'input', 'select[required]', Event.debounce( checkValidation, 200 ) )

  }
})

function validateForm ( form ) {

  // Scoped variables
  var inputs = form.querySelectorAll( '[required]' ),
      invalidInput;

  toolbox.slice( inputs ).some( function( input ) {

    // if invalid
    if ( !getClosest( input, '[disabled]' ) && !checkInput( input ) ) {
      invalidInput = input
      return true
    }
  })

  if ( invalidInput ) { 

    // Show validation message
    focus( invalidInput )
    showMessage( invalidInput )

    return false
  }

  // The form is valid, skip it
  else { 
    return true 
  }

}

// Handler for validation events
var checkValidation = Event.callback.new( function( event ) {

  if ( checkInput( event.target, event.type ) ) {

    // Remove any pre-existing validation message
    hideMessage( event.target )
  }

})


function checkInput ( input, event ) {

  var el       = statusEl( input ),
      valid    = isValid( input ),
      neutral  = event == 'keydown' && !valid;

  // Don't trigger invalid style while typing
  if ( neutral && input == document.activeElement ) {

    el.classList.remove( 'invalid', 'valid' )
    input.setAttribute( 'aria-invalid', false )

  } else {

    el.classList.toggle( 'invalid', !valid )
    el.classList.toggle( 'valid', valid )
    input.setAttribute( 'aria-invalid', valid )

  }

  return valid

}

// Is an input valid?
function isValid ( input ) {

  // If element only contains whitespace, strip value
  if ( !input.value.replace( /\s/g, '' ).length )
    input.value = ''

  // Set a custom validation message for word count
  var message = checkValue( input ) || checkLength( input ) || ''
  input.setCustomValidity( message )

  var valid = input.checkValidity()

  return valid

}


function checkValue( input ) {
  if ( input.dataset.invalidValue ) {

    // Does input value == invalid value? (case insensitive)
    var regexp = escapedRegex( input.dataset.invalidValue, 'i' )

    if ( input.value.match( regexp ) ) {

      // Remove any standard custom message
      input.dataset.cachedMessage = input.dataset.message
      input.dataset.message = ''

      return input.dataset.invalidValueMessage || "Value '"+input.value+"' is not permitted"

    // If not invalid value reset standard validation message
    } else if ( input.dataset.cachedMessage ) {

      input.dataset.message = input.dataset.cachedMessage
      input.dataset.cachedMessage = ''

    }
  }
}

function escapedRegex( input, options ) {
  var str = input.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  return new RegExp( "^" + str + '$', options )
}

function checkLength ( input ) {
  return checkCount( input, 'min' )
      || checkCount( input, 'max' )
}

// Test custom validation for maximum or minimum words present
function checkCount ( input, limit ) {

  var goal = input.dataset[ limit + 'Words' ]

  if ( goal ) {

    var lessThanGoal = wordCount( input.value ) < goal
        phrasing     = ( limit == 'min' ) ? 'at least ' : 'no more than ',
        valid        = ( limit == 'min' ) ? !lessThanGoal : lessThanGoal

    // Return a custom error message
    if ( input.value && !valid )
      return 'Please write ' + phrasing + goal + ' words.'
  }


}

// If input is nested in a label, treat the label as the
// target for assigning status (class names and messages).
function statusEl ( input ) {

  return getClosest( input, 'label' ) || input

}

// Focus() if invalid element is not hidden
// or Focus its immediate sibling (mostly used for upload buttons)
function focus ( el ) {

  el = ( el.style.display !== 'none' ) ? el : el.nextSibling
  el.focus()

}

// Submission validation handler function
function submit ( event ) {

  var form = ( event.target.tagName == "FORM" ) ? event.target : getClosest( event.target, 'form')

  // Skip validation if no invalid inputs found
  if ( !validateForm( form ) ) {

    // Pause keydown/blur triggers for the next second to avoid neutral empty style
    checkValidation.stop()
    Event.delay( checkValidation.start, 500 )

    // Stop the submission event
    event.preventDefault()
    event.stopImmediatePropagation()

  }

}

function invalidateField ( el, message ) {
  if ( el && el.value ) {
    el.dataset.invalidValue = el.value
    if ( message )
      el.dataset.invalidValueMessage = message
  }
}

function hideMessage ( el ) {

  var form = getClosest( el, 'form' ),
      msg = form.querySelector( '.validation-message' )

  if ( msg ) msg.parentNode.removeChild( msg )

}


// Validation message handler function
function showMessage ( el ) {

  //hideMessage( el )

  var label = getClosest( el, 'label' ),
      message = el.dataset.message || el.validationMessage

  if ( label ) {
    var existingMessage = label.querySelector( '.validation-message-text' )

    if ( !existingMessage ) {
      label.insertAdjacentHTML( 'beforeend',  '<span class="validation-message"><span class="validation-message-text" role="alert">' + message + '</span></span>' )

    } else if ( existingMessage.textContent != message ) {
      existingMessage.innerHTML = message
    }
  }

}

// Public API
module.exports = {
  validate: validateForm,
  invalidateField: invalidateField
}
