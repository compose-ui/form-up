var toolbox = require( 'compose-toolbox' ),
    Event = toolbox.event,
    getLabel = require( './get-label'),
    inputChange = require( './input-change' ),
    Selector = require( './selector' )

function diffForm( event ) {
  var form = event.currentTarget

  var diffs = [],
      diffEl = document.querySelector( form.dataset.diffTarget )

  if ( diffEl == null ) { return }

  initDiffIds( form )

  toolbox.each( form.querySelectorAll( '.changed-value' ), function( el ) {
    var diff = diffInput( el )

    // Only show one input diff per label
    // If diffs already contains this label, do not add it.
    if ( !diffs.find( function(d) { return d.label == diff.label } ) ) diffs.push( diff )
  })

  if ( diffs.length == 0 ) 
    diffEl.innerHTML = ''
  else 
    diffEl.innerHTML = `<table class='input-diffs'>${ diffs.map( diffRow ).join('') }</table>`

  toggleDiffEls( form )
}

function toggleDiffEls( form ) {
  var diffEl = document.querySelector( form.dataset.diffTarget )
  if ( diffEl ) {

    var elementsToToggle = toolbox.slice( document.querySelectorAll( diffEl.dataset.hideWhenEmpty ))
    elementsToToggle.push( diffEl )

    toolbox.each( elementsToToggle, function( el) {
      el.classList.toggle( 'form-diff-hidden', diffEl.children.length == 0 )
    })
  }
}

// Create a diff table row
function diffRow ( diff ) {

  var row = `<tr class='input-diff ${diff['class'].join(' ')}' data-diff-name='${diff.name}'>`

    // Add label and diff note
    row += `<td class='input-diff-label'><span>${diff.label}</span>`
    if (diff.note.length > 0) row += ` <span class='diff-note'>${diff.note.join(' ')}</span>`
    row += "</td>"

    // Add initial value code cell
    row += diffCell( diff.initial, 'initial' )

    // Add arrow marker
    row += "<td class='input-diff-marker'><span>→</span></td>"

    // Add current value code cell
    row += diffCell( diff.value, 'value' )
    row += `<td class='input-diff-undo'><span><button class='form-diff-button' type='button' aria-label='Reset value' data-reset-input='${diff.selector}'>✕</button></span></td>`

  return row + "</tr>"
}

function diffCell (value, name) {
  var tdClass = `input-diff-${name}`
  if ( !value || value == 'no selection' ) tdClass += ' null-value'

  return `<td class='${tdClass}'><code>${( value || 'null' )}</code></td>`
}

// Add unique ids for each input in a form
function initDiffIds( form ) {
  if ( form.dataset.diffIds ) return

  toolbox.each( form.querySelectorAll( Selector ), function ( el, index ) {
    el.dataset.formDiffId = `form-diff-${randID()}-${index}`
  })

  form.dataset.diffIds = true
}

function randID () {
  return Math.random().toString(36).substring(3)
}

// Returns: { input: input element, initial: 'old value', value: 'new value' }
function diffInput( input ) {
  var diff = {
    initial:  [],
    value:    [],
    name:     [],
    class:    [],
    note:     [],
    selector: []
  },
    inputs

  var label = toolbox.getClosest( input, 'label' )
  var form = toolbox.getClosest( input, 'form' )

  if ( label ) {
    // Get text label from the first input in a label
    diff.label = getLabel.text( label.querySelector( Selector ) )

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

  diff.label = diff.label || getLabel.text( input ) || input.getAttribute( 'name' )

  toolbox.each( inputs, function ( input ) {

    if ( input.type == 'range' && input.dataset.values ) {
      diff.initial.push( input.dataset.values.split(',')[input.dataset.initialValue] )
      diff.value.push( input.dataset.values.split(',')[input.value] )

    // Get select label names (rather than values) if present
    } else if ( input.tagName == 'SELECT' ) {

      // Show option labels instead of values if present
      var options = {}
      toolbox.each(input.children, function ( o ) {
        options[o.value] = o.value ? o.text : 'no selection'
      })

      diff.initial.push( options[ input.dataset.initialValue ] || input.dataset.initialValue )
      diff.value.push( options[ input.value ] || input.value )

    // Get radio label names (rather than values) if present
    } else if ( input.type == 'radio' ) {

      diff.label = getLabel.legend( input ) || diff.label

      var radioInputs = form.querySelectorAll( `input[name="${input.name}"]` )
      var radioInitial, radioValue

      radioInputs.forEach( function( radio ) {
        if ( radio.dataset.initialValue == 'true' ) radioInitial = getLabel.text( radio )
        if ( radio.checked ) diff.value.push( getLabel.text( radio ) )
      })

      diff.initial.push( radioInitial || 'no selection' )

    // Track checked state for checkboxes (rather than value)
    } else if ( input.type == 'checkbox' ) {
      diff.initial.push( input.dataset.initialValue )
      diff.value.push( input.checked )
    } else {
      diff.initial.push( input.dataset.initialValue )
      diff.value.push( input.value )
    }

    if(input.dataset.diffNote) diff.note.push(input.dataset.diffNote)
    if(input.dataset.diffClass) diff['class'].push(input.dataset.diffClass)

    diff.name.push( input.name )
    diff.selector.push( input.dataset.formDiffId )
  })

  diff.initial = diff.initial.join(' ')
  diff.value = diff.value.join(' ')
  diff.name = diff.name.join(' ')
  diff.selector = diff.selector.map( function ( s ) { return `[data-form-diff-id="${s}"]` } ).join(', ')

  return diff
}


function watch () {
  Event.change( function() {
    inputChange.watch()
    Event.on( document, 'change', 'form[data-diff-target]', Event.debounce( diffForm, 100 ) )

    // Hide empty form-diffs
    toolbox.each( document.querySelectorAll( 'form[data-diff-target]' ), toggleDiffEls )

    if ( !document.querySelector( '#form-diff-hidden' ) )
      document.head.insertAdjacentHTML('beforeend', '<style id="form-diff-hidden">.form-diff-hidden{ display: none }</style>')
  })
}

module.exports = {
  watch: watch
}
