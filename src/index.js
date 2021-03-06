'use strict'
var ReadStream = require('./read-stream')

module.exports = BlobSlicer

function BlobSlicer (blob) {
  if (!(this instanceof BlobSlicer)) return new BlobSlicer(blob)

  if (!(
    blob instanceof Blob ||
    ['[object Blob]', '[object File]'].indexOf(Object.prototype.toString.call(blob)) !== -1
  )) throw new TypeError('"blob" argument must be an instance of Blob or File')

  this._blob = blob
}

BlobSlicer.prototype.read = function (start, end, cb) {
  if (typeof start === 'function') cb = start
  else if (typeof end === 'function') {
    cb = end
    end = this._blob.size
  }
  if (typeof cb !== 'function') throw new TypeError('"callback" argument must be a function')

  start = ~~start
  end = end === undefined ? this._blob.size : ~~end

  var reader = new FileReader()
  reader.addEventListener('loadend', function onLoadend () {
    this.removeEventListener('loadend', onLoadend)
    cb(this.error, this.result ? Buffer.from(this.result) : null)
  })
  reader.readAsArrayBuffer(this._blob.slice(start, end))
}

BlobSlicer.prototype.createReadStream = function (options) {
  return new ReadStream(this._blob, options)
}
