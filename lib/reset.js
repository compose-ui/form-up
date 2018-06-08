var Event = require( 'compose-event' ),
    toolbox = require( 'compose-toolbox' )

function setValue(input, value) {

  // Trigger event watchers that the input was changed.
  if ( input.value != value ) {
    input.value = value
    Event.fire( input, 'input' )

    var form = toolbox.getClosest( input, 'form' )
    Event.fire( form, 'change' )
  }
}

function restoreDefault( event ) {
  var targets = document.querySelectorAll( event.currentTarget.dataset.restoreDefault )

  toolbox.each( targets, el => {

    // Restore to default a single element
    if ( el.dataset.default ) {
      setDefault( el )
    } else if ( el.children.length > 0 ) {

      // Restore all inputs to default when
      // data-restore-default points to a parent element
      toolbox.each( el.querySelectorAll( '[data-default]' ), setDefault )
    }
  })
}

function setDefault( el ) {
  if ( el.type == 'radio' || el.type == 'checkbox' ) {
    el.checked = true
    Event.fire( el, 'input' )
  } else {
    setValue( el, el.dataset.default )
  }
}

function resetValue( event ) {
  var inputs = document.querySelectorAll( event.currentTarget.dataset.resetInput )

  toolbox.each( inputs, i => {
    setValue( i, i.dataset.initialValue )
  })
}

function resetForm(event) {
  var form = toolbox.getClosest( event.target, 'form' )
  Event.delay( function() {
    toolbox.each( form.querySelectorAll( '.changed-value' ), function( el ) {
      Event.fire( el, 'input' )
    })
  }, 100)
}

Event.on( document, 'click', '[data-reset-input]', resetValue )
Event.on( document, 'click', '[type=reset]', resetForm )
Event.on( document, 'click', '[data-restore-default]', restoreDefault )