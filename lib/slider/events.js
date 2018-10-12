var toolbox   = require( 'compose-toolbox' ),
    extractData = require( '../extract-data' ),
    objectSize  = require( '../object-size' ),
    helpers     = require( './helpers' ),
    Event     = toolbox.event,
    sliders   = [],
    listening = false

function watch () {
  if ( !listening ) {
    listening = true

    Event.on(document, "input toggler:show", "[type=range]", change, { useCapture: true })
    Event.on(document, "click change input", "[type=range]", focus, { useCapture: true })
  }
}

function focus ( event ) {
  // Do not focus on "artificially triggered" events
  if ( event.isTrusted ) { event.currentTarget.focus() }
}

function change ( event ) {
  // Allows you to pass slider directly to change()
  var slider = event.currentTarget || event
  setInput( slider )
  setLabels( slider )
  setFill( slider )
}

function getData ( slider ) {
  if (typeof slider != 'string' && slider.dataset)
    slider = slider.dataset.sliderId

  return sliders[slider]
}

function setInput ( slider ) {
  var data = getData( slider )
  
  // Don't update hidden sliders
  if (slider.offsetParent === null) { return }

  var value = data.values[ sliderIndex(slider) ]
  var inputs = scopeToForm( slider ).querySelectorAll( "."+data.inputClass )

  Array.prototype.forEach.call(inputs, function(input){
    input.value = value
  })
}

function setFill ( slider ) {
  var data = getData( slider )
  var segments = document.querySelectorAll('#'+slider.id+' .slider-segment')
  var fills = document.querySelectorAll('#'+slider.id+' .slider-fill')
  var index = sliderIndex( slider )
  
  toolbox.each( fills, function( fill, elIndex ){
    
    // compare current index to fill element index: <span class='slider-fill' data-index='1'>
    if ( fill.dataset.index <= index ) {
      fill.classList.add( 'filled' )

      // Rather than jump through the DOM twice, use the index to set
      // fills for track segments too (for filling in color on slider marks)
      if ( segments[elIndex] ) segments[elIndex].classList.add( 'filled' )
    } else {

      // Remove fills
      fill.classList.remove('filled')
      if(segments[elIndex]) segments[elIndex].classList.remove('filled')
    }
  })
}

function setLabels ( slider ) {
  var data = getData(slider)
  var index = sliderIndex(slider)

  // If hidden slider or no labels set, don't update
  if (slider.offsetParent === null || !data.labels) { return }

  for ( var key in data.labels ) {
    var labelEls = document.querySelectorAll('#'+slider.id+' [data-slider-label='+key+'] .label-content')
    var labels = labelAtIndex( data.labels, index )

    toolbox.each( labelEls, function( el ) {
      el.innerHTML = labels[key]
      el.parentElement.classList.toggle('empty-label', labels[key] === '')
    })
  }
}

// Normalize the slider value by the minimum value
// If the min is not zero, the index needs to be shifted accordingly
function sliderIndex( slider ){
  return Number( slider.value ) - Number( slider.getAttribute('min') )
}

function labelAtIndex( labels, index ) {
  var set = {}
  for (var key in labels) {
    set[key] = labels[key][index]
  }
  return set
}

function cache ( slider ) {
  var data = {
    // Assign an incremental ID to track this slider with its data
    id: sliders.length,
    min: Number(slider.getAttribute('min')) || 0,
    max: Number(slider.getAttribute('max')) || 100
  }

  data = toolbox.merge( data, extractData(slider, 'data-') )

  data.values   = helpers.getValues( data.min, data.max, data.values )
  data.segments = data.values.length
  data.max      = (data.min + data.values.length) - 1

  if ( data.mark ) data.mark = helpers.split(data.mark).map(Number)

  data.lineLabels = helpers.getLineLabels( data['line-labels'] )

  // Get labels (or create them if none exist)
  //
  data.labels = helpers.getLabels( extractData( slider, 'data-label' ) )
  if ( objectSize( data.labels ) == 0) data.labels.default = data.values

  // If user happens to use data-label='a,b,c' and data-label-two='d,e,f'
  // remove default label (they're using it wrongly)
  else if ( objectSize( data.labels ) > 1 ) delete data.labels.default

  // Set dataset.sliderId for easy cache lookups later
  slider.dataset.sliderId = data.id

  // Set data-input name based on slider name (if unset)
  // Remove name so that form submission doesn't include values for slider
  // data-input will be used to create a hidden input which will contain
  // slider's custom values
  data.input      = data.input || slider.getAttribute( 'name' )
  data.inputClass = data.input.replace(/\W/g,'-')+'-'+data.id
  slider.removeAttribute('name')

  // Find input and add class for queries later when updating value
  var input = scopeToForm(slider).querySelector('input[name="'+data.input+'"]')

  // `!!` is an easy way to convert a value to boolean
  // example: !!domobject == true, !!undefined == false
  if ( !!input ) {
    input.classList.add( data.inputClass )
    data.inputExists = true
  }

  sliders.push(data)
  return data
}

// scopeToForm selector to current form
// Avoids modifying content in other forms
function scopeToForm(slider) {
  var el = slider

  // walk up until you find a form
  while (el && el.tagName != "FORM") { el = el.parentNode }

  return el || document
}

module.exports = {
  cache: cache,
  watch: watch,
  change: change
}
