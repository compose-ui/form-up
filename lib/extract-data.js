module.exports = function extractData (el, pattern) {
  var data = {}

  for (var i = 0; i < el.attributes.length; i++){
    var name = el.attributes[i].nodeName

    if(new RegExp("^"+pattern).test(name)) {
      name = name.replace(pattern, '').replace(/^-/,'')
      data[name] = el.attributes[i].nodeValue
    }
  }
  return data
}
