var toolbox   = require( 'compose-toolbox' ),
    extractData = require( '../extract-data' ),
    objectSize  = require( '../object-size' ),
    helpers     = require( './helpers' ),
    stepIndex   = require( '../step-index' ),
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

  // Don't update hidden sliders
  if ( slider.offsetParent !== null ) {
    setInput( slider )
    setLabels( slider )
    setFill( slider )
  }
}

function getData ( slider ) {
  if (typeof slider != 'string' && slider.dataset)
    slider = slider.dataset.sliderId

  return sliders[slider]
}

function setInput ( slider ) {
  var data = getData( slider )
  
  var value = data.values[ slider.value ]
  var input = helpers.getInput( slider )

  if(input) {
    input.value = value
    if (input.type != 'hidden') Event.fire( input, 'input' )
  }
}

function setFill ( slider ) {
  var data = getData( slider )
  var wrapper = '#slider-input-'+slider.dataset.sliderId+'-wrapper'
  var segments = document.querySelectorAll( wrapper + ' .slider-segment')
  var fills = document.querySelectorAll( wrapper + ' .slider-fill')
  var index = stepIndex( slider )
  
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

  // If hidden slider or no labels set, don't update
  if ( data.labels ) {

    for ( var key in data.labels ) {
      var labelEls = document.querySelectorAll('#slider-input-'+slider.dataset.sliderId+'-wrapper [data-slider-label='+key+'] .label-content')
      var labels = labelAtIndex( data.labels, slider.value )

      toolbox.each( labelEls, function( el ) {
        el.innerHTML = labels[key]
        el.parentElement.classList.toggle('empty-label', labels[key] === '')
      })
    }
  }
}

// Find labels which have an entry for slider value
function labelAtIndex( labels, value ) {
  var set = {}
  for (var key in labels) {
    set[key] = labels[key][value]
  }
  return set
}

function cache ( slider ) {
  var data = {
    // Assign an incremental ID to track this slider with its data
    id:   sliders.length,
    min:  Number( slider.min )  || 0,
    max:  Number( slider.max )  || 100,
    step: Number( slider.step ) || 1
  }

  // Set dataset.sliderId for easy cache lookups later
  // Using setattribute because it forces a change to the element's tag
  slider.setAttribute('data-slider-id', data.id)

  // Get all attributes which start with `data-`
  data = toolbox.merge( data, extractData(slider, 'data-') )

  data.values   = helpers.getValues( data.min, data.max, data.values, data.step )
  data.segments = objectSize(data.values)
  data.max      = data.min + ((data.segments - 1) * data.step)

  if ( data.mark ) data.mark = helpers.split(data.mark).map(Number)

  data.lineLabels = helpers.getLineLabels( data['line-labels'] )

  // Get labels (or create them if none exist)
  data.labels = getLabels( slider, data )
  if ( objectSize( data.labels ) == 0) data.labels.default = data.values

  // If user happens to use data-label='a,b,c' and data-label-two='d,e,f'
  // remove default label (they're using it wrongly)
  else if ( objectSize( data.labels ) > 1 ) delete data.labels.default

  // Set data-input name based on slider name (if unset)
  // data-input will be used to create a hidden input which will contain
  // slider's custom values
  data.input      = data.input || slider.name
  slider.dataset.input = data.input
  // Remove name so that form submission doesn't include values for slider
  slider.removeAttribute('name')

  // Is there already an input in the DOM?
  var input = helpers.getInput( slider )
  // If so set flag so template will not create a hidden input
  if ( input ) data.inputExists = true

  sliders.push(data)
  return data
}

function getLabels( slider, data ) {
  // Returns an object all `data-label*` attributes
  var labels = extractData( slider, 'data-label' )

  // Since extraction starts after `data-label`, 
  // `data-label='foo'` will be keyed by '' e.g. object['']='foo'
  // This corrects that oddity such that `object['default']='foo'`
  if (labels['']) {
    labels['default'] = labels['']
    delete labels['']
  }
  return helpers.getLabels( labels, data )
}

module.exports = {
  cache: cache,
  watch: watch,
  change: change,
  getData: getData
}
