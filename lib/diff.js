var toolbox = require( 'compose-toolbox' ),
    Event = toolbox.event,
    getLabel = require( './get-label'),
    inputChange = require( './input-change' ),
    Selector = require( './selector' )

function diffForm( form ) {
  // TODO: Still need this?
  form = form.currentTarget || form

  var diffs = [],
      diffEl = document.querySelector( form.dataset.diffTarget )

  if ( diffEl == null ) { return }

  initDiffIds( form )

  toolbox.each( form.querySelectorAll( '.changed-value' ), function( el ) {

    diffs.push( diffInput( el ) )

  })

  var empty = ( diffs.length == 0 )

  // Add a way to hide or show a diff top level container
  diffEl.classList.toggle( 'empty', empty )

  Array.prototype.forEach.call( document.querySelectorAll( diffEl.dataset.hideWhenEmpty ), el => {
    el.classList.toggle( 'empty', empty )
  })


  if ( empty ) {

    diffEl.innerHTML = ''
    
  } else { 

    var options = toolbox.merge( {
      description: "These changes will be applied when you submit this form."
    }, diffEl.dataset )


    var diffHTML = `<p class='form-diff-description'>${options.description}</p>`
    diffHTML    += "<table class='input-diffs ruled bordered'>"

    toolbox.each( diffs, function( diff ) {
      diffHTML += "<tr class='input-diff'>"

      diffHTML += `<td class='input-diff-label'><span>${diff.label}</span>`
      //if (diff.restart) {
        //diffHTML += " <span class='has-tooltip requires-restart' aria-label='Requires restart'>*</span>"
      //}
      diffHTML += "</td>"

      diffHTML += "<td class='input-diff-initial'><span>" + ( diff.initial || 'null' ) + "</span></td>"
      diffHTML += "<td class='input-diff-marker'><span></span></td>"
      diffHTML += "<td class='input-diff-value'><span>" + diff.value + "</span></td>"
      diffHTML += "<td class='input-diff-undo'><span><button class='has-tooltip' type='button' aria-label='Reset input' data-reset-input='"+diff.selector+"'>✕</button></span></td>"
      diffHTML += "</tr>"
    })
    diffHTML += "</table>"

    //if ( form.querySelector( '.requires-restart.input-changed' ) ) {
      //diffHTML += "<p class='form-diff-restart'>* Requires a database restart.</p>"
    //}

    diffEl.innerHTML = diffHTML
  }

}

// Add unique ids for each input in a form
function initDiffIds( form ) {
  if ( form.dataset.diffIds ) return

  toolbox.each( form.querySelectorAll( Selector ), ( el, index ) => {
    el.dataset.formDiffId = randID() + '-form-diff-' + index
  })

  form.dataset.diffIds = true
}

function randID () {
  return Math.random().toString(36).substring(3)
}

// Returns: { input: input element, initial: 'old value', value: 'new value' }
function diffInput( input ) {
  var diff = {
    initial: [],
    value: [],
    selector: [],
  },
    inputs

  var label = toolbox.getClosest( input, 'label' )

  if ( label ) {
    // When there are multiple inputs under a single label
    // Group those input values in the form diff and treat
    // them as a single value
    var labelInputs = toolbox.slice( label.querySelectorAll( Selector ) )

    // If multiple inputs are under a single label, use those
    // otherwise use input as an array (to simplify this)
    inputs = ( labelInputs.length > 0 ) ? labelInputs : [ input ]
  } else {
    inputs = [ input ]
  }

  diff.label = getLabel.text( input ) || input.getAttribute( 'name' )

  toolbox.each( inputs, input => {

    if ( input.type == 'range' && input.dataset.values ) {
      diff.initial.push( input.dataset.values.split(',')[input.dataset.initialValue] )
      diff.value.push( input.dataset.values.split(',')[input.value] )
    } else {
      diff.initial.push( input.initialValue )
      diff.value.push( input.value )
    }

    diff.selector.push( input.dataset.formDiffId )
  })

  diff.initial = diff.initial.join(' ')
  diff.value = diff.value.join(' ')
  diff.selector = diff.selector.map( s => `[data-form-diff-id="${s}"]` ).join(', ')

  return diff
}


function watch () {
  inputChange.watch()
  Event.on( document, 'change', 'form', Event.debounce( diffForm, 100 ) )
}


module.exports = {
  watch: watch
}
