'use strict'

const url = require('url')
const merge = require('merge-stream')

class AdapterPicker {

  constructor() {
    this.adapters = new Map()
  }

  /**
  * Handle the given glob.
  * Internally it gets the associated adapter and call either `src` or `dest`.
  *
  * @protected
  * @param  {('src'|'dest')} type
  * @param  {string}         glob
  * @param  {object}         [options]
  * @return {stream}
  */
  _handle(type, glob, options) {
    const uri = parse(glob)
    const adapter = this.adapters.get(uri.protocol)

    if (!adapter) {
      throw new Error(`Unknown protocol: ${uri.protocol}`)
    }

    return adapter[type](uri.path, options)
  }

  /**
  * Create a stream of vinyl files given globs using the appropriate adapter.
  *
  * @param  {string|array} globs
  * @param  {object}       [options]
  * @return {stream}
  */
  src(globs, options) {
    if (Array.isArray(globs)) {
      const streams = globs.map(glob => this._handle('src', glob, options))
      return merge.apply(null, streams)
    }
    return this._handle('src', globs, options)
  }

  /**
  * Create a stream of vinyl files given an uri using the appropriate adapter.
  *
  * @param  {string} uri
  * @param  {object} [options]
  * @return {stream}
  */
  dest(uri, options) {
    return this._handle('dest', uri, options)
  }

  /**
  * Add a new adapter.
  *
  * @param {string|null} protocol
  * @param {object}      adapter
  */
  add(protocol, adapter) {
    this.adapters.set(protocol, adapter)
  }

  /**
   * Retrieve an adapter.
   *
   * @param {string}   protocol
   * @return {object}  adapter
   */
  get(protocol) {
    return this.adapters.get(protocol)
  }

  /**
  * Remove an adapter.
  *
  * @param {string|null} protocol
  */
  remove(protocol) {
    this.adapters.delete(protocol)
  }

  /**
  * Clear all registered adapters.
  */
  clear() {
    this.adapters.clear()
  }

}

/**
* Parse a string uri into an object uri.
*
* @protected
* @param  {string} uri
* @return {url}
*/
function parse(uri) {
  uri = url.parse(uri)

  // remove protocol trailing `:`
  if (uri.protocol) {
    uri.protocol = uri.protocol.slice(0, -1)
  }

  // remove leading slash if present
  if ('/' === uri.path[0]) {
    uri.path = uri.path.slice(1)
  }

  return uri
}

module.exports = new AdapterPicker()
module.exports.AdapterPicker = AdapterPicker
