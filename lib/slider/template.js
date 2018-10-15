function html( data, sliderHTML ) {
  var html = '<div class="' + getClasses( data ) + '" id="slider' + data.id + '">'
      html += "<div class='slider-input-container'>" + sliderHTML + getTrack( data ) + "</div>"
      html += addLabels( data )
      html += addInput( data )
      html += '</div>'
  return html
}

function getClasses( data ) {
  var classes = ['slider-container']
  if (data.lineLabels.length > 0) classes.push('line-labels')
  classes.push((data.labels) ? 'with-label' : 'without-label')
  return classes.join(' ')
}

function getTrack ( data ) {
  var track = ''

  // If data has been marked, or if there are line labels
  // this will add those labels to the track
  if (data.mark || data.lineLabels) {
    for(var index = 1; index <= data.segments; index++) {
      
      track += "<div class='slider-segment'><span class='slider-segment-content'>"
      track += addMark( data.mark, index )
      track += addLineLabel( data.lineLabels, index )
      track += "</span></div>"
    }
  }

  track = "<div class='slider-track'>" + track + "</div>"
  return track + addFills( data.segments )
}

function addMark(marks, index) {
  // If mark (an array) has an item in its index
  if (marks && marks.indexOf(index) != -1)
    return "<span class='slider-segment-mark' data-index='"+index+"'></span>"
  else
    return ""
}

function addLineLabel( lineLabels, index ) {
  if (lineLabels && lineLabels[index]) 
    return "<span class='slider-line-label'>"+lineLabels[index]+"</span>"
  else
    return ""
}

// Get fills for each segment except the last.
// There is no fill for the last item 
// because it's at the end of the slider
function addFills(count) {
  var fills = ''
  for(var i = 1; i < count; i++) {
    fills += "<span class='slider-fill' data-index='"+i+"'></span>"
  }
  return "<div class='slider-fills'>" + fills + "</div>"

}

// { labels: { default: [1,2,3] }}
function addLabels ( data ){
  var html = ''
  if (data.labels == false) { return html }

  for(var key in data.labels){
    html += '<span class="slider-label-'+key+' internal-label" data-slider-label="'+key+'">'
    html += labelHTML(data, key)
    html += '</span>'
  }

  if (html.length > 0) {
    html = "<div class='slider-label align-"+(data['position-label'] || 'right')+"'>" + html + "</div>"
  }

  return html
}

function labelHTML(data, key, label) {
  return labelMeta(data, key, 'before')
  + "<span class='label-content'>" + (label || '') + "</span>"
  + labelMeta(data, key, 'after')
}

function labelMeta (data, key, position) {
  var altKey = 'label-'+key
  var meta = data[position+'-'+altKey] || data[position+'-label']
  if (meta)
    return "<span class='"+position+"-label'>"+meta+"</span>"
  else
    return ''
}

function addInput( data ) {
  return ( data.inputExists ) ? '' : "<input type='hidden' data-initial-value='"+data.values[ data.initialValue ]+"' name='"+data.input+"' value=''>"
}

module.exports = {
  html: html,
  getTrack: getTrack,
  addFills: addFills,
  addLabels: addLabels,
  labelHTML: labelHTML,
  addMark: addMark,
  addLineLabel: addLineLabel
}

