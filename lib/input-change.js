var toolbox = require( 'compose-toolbox' ),
    Event = toolbox.event,
    getLabel = require( './get-label' ),
    inputSelectors = require( './selector' ),
    watching = false

function inputInit( input ) {
  input.classList.toggle( 'empty', !input.value.trim().length )
  if ( input.type == 'radio' || input.type == 'checkbox' ) {
    input.dataset.initialValue = input.checked
  } else {
    input.dataset.initialValue = input.value
  }
}

function inputChange( input ) {
  // Allow calling from event handler
  var input = ( input.target || input )

  // If element is empty (or contains only whitespace)
  // Add empty class
  input.classList.toggle( 'empty', !input.value.trim().length )

  changeClasses( input )
  trackState( input )

  var form = toolbox.getClosest( input, 'form' )
  if ( form ) {
    Event.fire( form, 'change' )
  }
}

// Add 'increased', 'decreased', and 'initial' states to input parent
// or elements set up to track input state
function trackState( input ) {
  if ( input.type.match(/range|number/) ) {
    change = getChange( Number(input.dataset.initialValue), Number(input.value) )

    input.dataset.inputState = change

    var label = toolbox.getClosest( input, 'label' )
    if ( label ) label.dataset.inputState = change

    var stateElements = document.querySelectorAll( '[data-track-input-state="#'+input.id+'"]' )
    toolbox.each( stateElements, function(el) {
      el.dataset.inputState = change
    })

  }
}

function changeClasses( input, recursive ) {
  var changed
  var defaulted

  if ( input.type == 'radio' && !recursive ) {
    var form = toolbox.getClosest( input, 'form' )
    if ( form ) {
      return Array.prototype.forEach.call( form.querySelectorAll( `[name='${input.name}']` ), function ( e ) {
        changeClasses( e, true )
      })
    } 
  } else if ( input.type == 'checkbox' || input.type == 'radio' ) {
    changed = String( input.checked ) != input.dataset.initialValue
  } else {
    changed = input.value != input.dataset.initialValue
  }

  input.classList.toggle( 'changed-value', changed )
  
  // Remove all defaulted value classnames on an input change
  input.classList.remove( 'defaulted-value' )

  var label = getLabel( input )

  if ( label ) {
    var hasChangedInputs = label.querySelector( '.changed-value' ) || input.classList.contains( 'changed-value' )
    label.classList.toggle( 'input-changed-value', hasChangedInputs )

    // Remove all defaulted value classnames on an input change
    toolbox.each( label.querySelectorAll( '.defaulted-value' ), function ( el ) { el.classList.remove( 'defaulted-value' ) } )
    label.classList.remove( 'input-defaulted-value' )
  }
}

function checkRadioLabel ( input ) {
  var input = ( input.target || input )
  var inputName = input.name
  var radioGroup = document.querySelectorAll('input[name=' + inputName + ']') 
  
  radioGroup.forEach(function(radioInput) {
  
    var label = getLabel( radioInput )
    return (radioInput.checked === true ? label.classList.add('checked-radio') : label.classList.remove('checked-radio'));
  
  })
}

function watch () {
  if ( watching ) { return }
  // Initialize input state
  Event.change( function() {
    toolbox.each( document.querySelectorAll( inputSelectors ), inputInit )
    toolbox.each( document.querySelectorAll('input[type=range],input[type=number]'), trackState )
    toolbox.each( document.querySelectorAll('input[type=radio]'), checkRadioLabel )
  })

  // Set input state on input
  Event.on( document, 'input', inputSelectors, inputChange )
  Event.on( document, 'input', 'input[type=radio]', checkRadioLabel )

  // Form.reset() doesn't fire input events. This ensures those events are fired.
  Event.on( document, 'click', '[type=reset]', resetForm )

  watching = true
}

// Return string 'increased', 'decreased', or 'initial'
// depending on the difference between 
// current value and initial
function getChange( initial, value ) {
  var initial = Number(initial)

  if ( initial < value ) {
    return "increased"
  } else if ( value < initial ) {
    return "decreased"
  } else {
    return "initial"
  }
}

function resetForm(event) {
  var form = toolbox.getClosest(event.target, 'form')

  Event.delay( function() {
    toolbox.each(form.querySelectorAll('input.input-changed, select.input-changed, textarea.input-changed '), function( el ) {
      Event.fire( el, 'input' )
    })
  }, 100 )
}

module.exports = {
  watch: watch
}
