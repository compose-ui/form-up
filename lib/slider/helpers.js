function getValues( min, max, values ) {

  // If slider has data-value attribute
  if (values) values = split(values)
   
  // Add values between min and max, eg: 1,2,3,4,5…
  else { 
    var values = []
    for (var i = min; i <= max; i++ ) { values.push(i) }
  }

  return values
}

// Returns:
// data-label='honey, bread, butter'
//
// as
// data.labels['default] = ['honey', 'bread', 'butter']
// 
// Returns:
// data-label-bread='rye,wheat,white'
// data-label-spread='jelly,jam,butter,honey'
//
// as
// data.labels['bread'] = ['rye','wheat','white']
// data.labels['spread'] = ['jelly','jam','butter','honey']
//
function getLabels( data ) {
  var labels = {}

  // Unless labels have been disabed with data-label='false'
  for (var key in data) {
    // Ignore non-native methods injected by some wayward lib
    if (!data.hasOwnProperty(key)) { continue }
    // Match properties: label, label-bread, external-label-id
    // Some labels may include commas, allow semicolons as an alternate separator
    //
    var splitLabels = split(data[key])

    // data-label
    if (key == '') {
      labels.default = ( splitLabels.join('').match(/^false$|^none$/) ? false : splitLabels )
    } else {
      labels[key] = splitLabels
    }
  }

  if ( labels.default === false ) labels = false

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
  labels = []
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


function split (string){ 
  var delimiter = string.match(/;/) ? ';' : ','
  return string.split(delimiter).map(trim)
}

function trim (value){ 
  return value.trim()
}

module.exports = {
  getValues: getValues,
  getLabels: getLabels,
  getLineLabels: getLineLabels,
  split: split
}
