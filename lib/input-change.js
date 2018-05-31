var toolbox = require( 'compose-toolbox' ),
    Event = toolbox.event,
    getLabel = require( './get-label' )
    inputSelectors = 'textarea, select, input:not([type=hidden]):not([type=submit]):not([type=image]):not([type=reset])'

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

  var form = toolbox.getClosest( input, 'form' )
  if ( form ) {
    Event.fire( form, 'change' )
  }
}

function changeClasses( input, recursive ) {
  var changed

  if ( input.type == 'radio' && !recursive ) {
    return Array.prototype.forEach.call( document.querySelectorAll( `[name='${input.name}']` ), e => {
      changeClasses( e, true )
    })
  } else if ( input.type == 'checkbox' || input.type == 'radio' ) {
    changed = String( input.checked ) != input.dataset.initialValue
  } else {
    changed = input.value != input.dataset.initialValue
  }

  input.classList.toggle( 'input-changed', changed )

  var label = getLabel( input )
  if ( label ) {
    label.classList.toggle( 'input-changed', input.classList.contains('input-changed') )
  }
}

module.exports = {
  watch: function () {
    // Initialize input state
    Event.change( function() {
      toolbox.each( document.querySelectorAll( inputSelectors ), inputInit )
    })

    // Set input state on input
    Event.on( document, 'input', inputSelectors, inputChange )
  }
}
