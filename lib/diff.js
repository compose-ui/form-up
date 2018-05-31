var toolbox = require('compose-toolbox'),
    Event = toolbox.event

function diffForm(form) {
  form = form.currentTarget || form

  var diffs = [],
      diffEl = form.querySelector( '.form-diff' )

  if ( diffEl == null ) { return }

  var diffContainer = diffEl.querySelector( '.form-diff-container' )

  toolbox.each( form.querySelectorAll( 'label.input-changed' ), function( el ) {

    diffs.push( diffInput( el ) )

  })

  if ( diffs.length > 0 ) { diffEl.dataset.status = 'diffs'
    var diffHTML = "<p class='form-diff-description'>These changes will be applied when you submit this form.</p>"
    diffHTML    += "<table class='input-diffs ruled bordered'>"
    toolbox.each( diffs, function( diff ) {
      diffHTML += "<tr class='input-diff'>"

      diffHTML += `<td class='input-diff-label'><span>${diff.label}</span>`
      //if (diff.restart) {
        //diffHTML += " <span class='has-tooltip requires-restart' aria-label='Requires restart'>*</span>"
      //}
      diffHTML += "</td>"

      diffHTML += "<td class='input-diff-initial'><span>" + (diff.initial || 'null') + "</span></td>"
      diffHTML += "<td class='input-diff-marker'><span></span></td>"
      diffHTML += "<td class='input-diff-value'><span>" + diff.value + "</span></td>"
      diffHTML += "<td class='input-diff-undo'><span><button class='has-tooltip' type='button' aria-label='Reset input' data-reset-input='[data-unique-id=\""+diff.input.dataset.uniqueId+"\"]'>✕</button></span></td>"
      diffHTML += "</tr>"
    })
    diffHTML += "</table>"

    //if ( form.querySelector( '.requires-restart.input-changed' ) ) {
      //diffHTML += "<p class='form-diff-restart'>* Requires a database restart.</p>"
    //}

    if ( !diffContainer ) {
      diffContainer = diffEl
      diffHTML = "<div class='diff-container'>"+diffHTML+"</div>"
    }

    diffContainer.innerHTML = diffHTML
  } else {
    diffEl.dataset.status = 'empty'
    diffContainer.innerHTML = '';
  }

}

function diffInput( el ) {
  var input = el.querySelector( '.input' )
  var diff = { 
    input: input,
    restart: el.classList.contains('requires-restart')
  }

  // Try to get a text label from the most sensible sources
  // TODO: Make generic
  var label = el.querySelector( '.label-text, .placeholder-label-text' )

  input id="dog" label for="dog"

  if ( label ) {
    diff.label = label.firstChild.textContent.trim()
  } else {
    diff.label = input.getAttribute( 'placeholder' ) || input.getAttribute( 'name' )
  }
  
  // Slider Input use data-values if there
  if ( input.type == 'range' && input.dataset.values ) {
    diff.initial = input.dataset.values.split(',')[input.dataset.initialValue]
    diff.value = input.dataset.values.split(',')[input.value]
  } else {
    diff.initial = input.dataset.initialValue
    diff.value = input.value
  }

  if ( input.dataset.unit ){
    var unitSelect = el.querySelector('[data-unit-select]')
    diff.initial = diff.initial + ' ' + unitSelect.dataset.initialValue
    diff.value = diff.value + ' ' + unitSelect.value
  }

  return diff
}


Event.on( document, 'input', 'form', Event.debounce( diffForm, 100 ) )
