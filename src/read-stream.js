'use strict'
var Readable = require('readable-stream').Readable

module.exports = ReadStream

function ReadStream (blob, options) {
  if (!options) options = {}
  if (options.highWaterMark === undefined) options.highWaterMark = 64 * 1024
  Readable.call(this, options)

  var start = ~~options.start
  var end = options.end === undefined ? blob.size : ~~options.end

  this._blob = blob.slice(start, end)
  this._end = this._blob.size
  this._pos = 0
  this._reader = new FileReader()

  var self = this
  this._loadendListener = function () {
    if (this.error) {
      self.destroy(this.error)
      return
    }

    self._pos += this.result.byteLength
    self.push(Buffer.from(this.result))
  }
  this._reader.addEventListener('loadend', this._loadendListener)

  this.on('end', function () { this.destroy() })
}
ReadStream.prototype = Object.create(Readable.prototype)
ReadStream.prototype.constructor = ReadStream

Object.defineProperties(ReadStream.prototype, {
  readableLength: {
    get: function () { return this._readableState.length }
  },
  ended: {
    get: function () { return this._pos >= this._end }
  }
})

ReadStream.prototype._read = function (n) {
  if (this.destroyed) return

  if (this.ended) {
    this.push(null)
    return
  }

  this._reader.readAsArrayBuffer(this._blob.slice(this._pos, this._pos + n))
}

ReadStream.prototype._destroy = function (err, cb) {
  cb(err)
  if (this._reader.readyState === FileReader.LOADING) this._reader.abort()
  this._reader.removeEventListener('loadend', this._loadendListener)
  this._reader = null
}
