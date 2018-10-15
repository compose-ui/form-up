module.exports = function objectSize (object) {
  var length = 0; for(var i in object) { length++ }
  return length
}
