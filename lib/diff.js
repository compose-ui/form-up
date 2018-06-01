var toolbox = require( 'compose-toolbox' ),
    Event = toolbox.event,
    getLabel = require( './get-label')

function diffForm( form ) {
  // TODO: Still need this?
  form = form.currentTarget || form

  var diffs = [],
      diffEl = document.querySelector( form.dataset.diffTarget )

  if ( diffEl == null ) { return }

  toolbox.each( form.querySelectorAll( '.changed-value' ), function( el ) {

    diffs.push( diffInput( el ) )

  })

  var empty = diffs.length == 0

  var options = toolbox.merge( {
    description: "These changes will be applied when you submit this form."
  }, diffEl.dataset )

  // Add a way to hide or show a diff top level container
  diffEl.classList.toggle( 'empty', empty )

  Array.prototype.forEach.call( document.querySelectorAll( diffEl.dataset.hideWhenEmpty ), el => {
    el.classList.toggle( 'empty', empty )
  })


  if ( emtpy ) {

    diffEl.innerHTML = ''
    
  } else { 

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
      diffHTML += "<td class='input-diff-undo'><span><button class='has-tooltip' type='button' aria-label='Reset input' data-reset-input='[data-unique-id=\""+diff.input.dataset.uniqueId+"\"]'>✕</button></span></td>"
      diffHTML += "</tr>"
    })
    diffHTML += "</table>"

    //if ( form.querySelector( '.requires-restart.input-changed' ) ) {
      //diffHTML += "<p class='form-diff-restart'>* Requires a database restart.</p>"
    //}

    diffEl.innerHTML = diffHTML
  }

}

// Returns: { input: input element, initial: 'old value', value: 'new value' }
function diffInput( input ) {
  var diff = { 
    input: input
  }

  if ( toolbox.matches( input, '[data-unit-select]' ) ) {
    var label = toolbox.closest( input, 'label' )
    diff.input = input = label.querySelector( 'input:not([type=hidden]), select' )
  }

  diff.label = getLabel.text( input ) || input.getAttribute( 'name' )

  // Slider Input use data-values if there
  if ( input.type == 'range' && input.dataset.values ) {
    diff.initial = input.dataset.values.split(',')[input.dataset.initialValue]
    diff.value = input.dataset.values.split(',')[input.value]
  } else {
    diff.initial = input.dataset.initialValue
    diff.value = input.value
  }

  if ( input.dataset.unit ){
    var unitSelect = el.querySelector( '[data-unit-select]' )
    diff.initial = diff.initial + ' ' + unitSelect.dataset.initialValue
    diff.value = diff.value + ' ' + unitSelect.value
  }

  return diff
}


Event.on( document, 'change', 'form', Event.debounce( diffForm, 100 ) )
