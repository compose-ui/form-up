var Event = require( 'compose-event' ),
    toolbox = require( 'compose-toolbox' )

function setValue(input, value) {

  // Trigger event watchers that the input was changed.
  if ( input.value != value ) {
    input.value = value
    Event.fire( input, 'input' )
  }
}

function restoreDefault( event ) {
  var targets = document.querySelectorAll( event.currentTarget.dataset.restoreDefault )

  toolbox.each( targets, el => {

    // Restore to default a single element
    if ( el.dataset.default ) {
        if ( el.type = 'radio' ) {
          el.checked = true
          Event.fire( el, 'input' )
        } else {
          setValue( el, el.dataset.default )
        }
    } else if ( el.children.length > 0 ) {

      // Restore all inputs to default when
      // data-restore-default points to a parent element
      toolbox.each( el.querySelectorAll( '[data-default]' ), child =>{
        if ( child.type = 'radio' ) {
          child.checked = true
          Event.fire( child, 'input' )
        } else {
          setValue( child, child.dataset.default )
        }
      })
    }
  })
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
    toolbox.each( form.querySelectorAll( 'input, select, textarea' ), function( el ) {
      Event.fire( el, 'input' )
    })
  }, 100)
}

Event.on( document, 'click', '[data-reset-input]', resetValue )
Event.on( document, 'click', '[type=reset]', resetForm )
