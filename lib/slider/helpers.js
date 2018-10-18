function getValues( min, max, values, step ) {
  var result = {}
  step = step || 1

  // If slider has data-value attribute else empty array
  if (values) values = split( values )
   
  // Add values between min and max, eg: 1,2,3,4,5…
  for ( var i = min; i <= max; i+=step ) { 
    if ( values ) {
      if ( values.length > 0 ) result[i] = values.shift()
    } else {
      result[i] = i
    }
  }

  return result
}

// Takes label data and cunstructs hashes keyed by slider value.
//
// Input:
// data-label='honey, bread, butter'
//
// Returns as: 
// data.labels['default] = ['honey', 'bread', 'butter']
// 
// Input:
// data-label-bread='rye,wheat,white'
// data-label-spread='jelly,jam,butter,honey'
//
// Returns as:
// data.labels['bread']  = { 0: 'rye', 1: 'wheat', 2: 'white' }
// data.labels['spread'] = { 0: 'jelly'l, 1: 'jam', 2: 'butter', 3: 'honey' }
//
function getLabels( labelData, data ) {
  var labels = {}

  // If labels have been turned off (data-label=false|none), return false
  if ( labelData.default && labelData.default.trim().match(/^false$|^none$/) ) return false

  // Unless labels have been disabed with data-label='false'
  for ( var key in labelData ) {

    // Ignore non-native methods injected by some wayward lib
    if ( !labelData.hasOwnProperty(key) ) { continue }

    // Split labels into an array.
    var splitLabels = split( labelData[key] )

    // Construct a labels object keyed by slider values
    var valueLabels = {}

    // Walk up the slider values by step size from min to max
    for ( var value = data.min; value <= data.max; value+=data.step ) { 
      valueLabels[value] = splitLabels.shift()
    }

    // Assign the new object to a label key e.g. labels['bread']
    labels[key] = valueLabels
  }

  return labels
}

// If lineLabels are present, this reaturns an array 
// with labels set for appropriate indexes
function getLineLabels ( lineLabels ){
  // Line labels may be in the following formats:
  // - 1:start,10:end              - index specified, comma separated
  // - first,second,third,10:last  - default to index for some labels
  // - 10,000;20,000;30,000        - semicolon separated
  //
  labels = {}
  if ( lineLabels ) {
    split(lineLabels).map( function( lines, index ){
      // Split on `:` to see if index is specified (example 1 above)
      var l = lines.split(':')

      // If split is successful, index has been specified eg, 1:start
      // set lineLabel index to index found in split
      if (l[1]) labels[l[0]] = l[1]

      // Else, use current index (+1 because this is 1 based)
      // to set LineLabel index
      // Since no split set value with l[0]
      else labels[index + 1] = l[0]
    })
  }

  return labels
}

function getInput(slider) {
  return scopeToForm(slider).querySelector('input[name="'+slider.dataset.input+'"], '+slider.dataset.input)
}

function split (string){ 
  var delimiter = string.match(/;/) ? ';' : ','
  return string.split(delimiter).map(trim)
}

function trim (value){ 
  return value.trim()
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
  getValues: getValues,
  getLabels: getLabels,
  getLineLabels: getLineLabels,
  getInput: getInput,
  scopeToForm: scopeToForm,
  split: split
}
