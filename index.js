// Dependencies
var toolbox    = require( 'compose-toolbox' ),
    Event      = toolbox.event,
    matches    = toolbox.matches,
    getClosest = toolbox.getClosest,
    wordCount  = toolbox.wordCount,
    textSelectors = '[required]';

// Does this browser support HTML5 validation?
function supported() {

  return typeof document.createElement( 'input' ).checkValidity === 'function'

}


// Watch for events ( if validation is suported )
function watch() {

  if ( !supported() ) { return false }

  Event.bubbleFormEvents()

  Event.on( document.body, {
    invalid: function( event ) { event.preventDefault() },  // Suppress default message bubbles
    submit: submit
  })

  // Watch input events
  Event.on( document, 'blur', '[required]', checkValidation )
  Event.on( document, 'keydown', '[required]', Event.debounce( checkValidation, 200 ) )

}

function validateForm( form ) {

  // Scoped variables
  var invalidInput = form.querySelector( 'input:invalid, textarea:invalid' )

  // The form is valid, skip it
  if ( !invalidInput ) { 

    return true

  }

  else {

    // Set validity state on element
    checkInput( invalidInput )

    // Show validation message
    showMessage( invalidInput )
    focus( invalidInput )

    return false

  }

}

// Handler for validation events
var checkValidation = Event.callback.new( function( event ) {

  // Remove any pre-existing validation message
  hideMessage( event.target )

  checkInput( event.target, event.type )

})


function checkInput( input, event ) {

  var el       = statusEl( input ),
      valid    = isValid( input ),
      neutral  = !valid && event == 'keydown';

  // Don't trigger invalid style while typing
  if ( neutral && input == document.activeElement ) {

    el.classList.remove( 'invalid', 'valid' )

  } else {

    el.classList.toggle( 'invalid', !valid )
    el.classList.toggle( 'valid', valid )

  }

}

// Is an input valid?
function isValid( input ) {

  // If element only contains whitespace, strip value
  if ( !input.value.replace( /\s/g, '' ).length )
    input.value = ''

  // Set a custom validation message for word count
  if ( input.dataset.minWords ) checkCount( input, 'min' )
  if ( input.dataset.maxWords ) checkCount( input, 'max' )

  return input.checkValidity()

}

// Test custom validation for maximum or minimum words present
function checkCount( input, limit ) {

  var goal         = input.dataset[ limit + 'Words' ],
      lessThanGoal = wordCount( input.value ) < goal

  var phrasing     = ( limit == 'min' ) ? 'at least ' : 'no more than ',
      valid        = ( limit == 'min' ) ? !lessThanGoal : lessThanGoal,
      message      = '';

  // Set a custom error message
  if ( input.value && !valid )
    message = 'Please write ' + phrasing + goal + ' words.'

  input.setCustomValidity( message )

}

// If input is nested in a label, treat the label as the
// target for assigning status (class names and messages).
function statusEl( input ) {

  return getClosest( input, 'label' ) || input

}

// Focus() if invalid element is not hidden
// or Focus its immediate sibling (mostly used for upload buttons)
function focus( el ) {

  el = ( el.style.display !== 'none' ) ? el : el.nextSibling
  el.focus()

}

// Submission validation handler function
function submit( event ) {

  // Skip validation if no invalid inputs found
  if ( !validateForm( event.target ) ) {

    // Pause keydown/blur triggers for the next second to avoid neutral empty style
    checkValidation.stop()
    Event.delay( checkValidation.start, 1000 )

    // Stop the submission event
    event.preventDefault()

  }


}

function hideMessage( el ) {

  var form = getClosest( el, 'form' ),
      msg = form.querySelector( '.validation-message' )

  if (msg ) msg.parentNode.removeChild( msg )

}


// Validation message handler function
function showMessage( el ) {

  hideMessage( el )

  var label = getClosest( el, 'label' ),
      message = el.dataset.message || el.validationMessage

  if ( label )
    label.insertAdjacentHTML( 'beforeend',  '<aside class="validation-message"><p>' + message + '</p></aside>' )

}

// Public API
module.exports = {
  watch: watch,
  test: validateForm
}

