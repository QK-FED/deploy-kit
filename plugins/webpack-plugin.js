const crypto = require('crypto')

function md5(content) {
  return crypto.createHash('md5').update(content).digest('hex')
}

const cacheStore = {}
var workType = 'YES';

function DeployPlugin(options) {
  workType = (options.hasContinual ? 'YES' : 'NO') || 'YES';
}

DeployPlugin.prototype.apply = function(compiler) {
  const self = this
  var eventName = { YES: 'emit', NO: 'done' }

  compiler.plugin(eventName[workType], function(abs, callback) {
    const files = []
    const hasContinual = workType === 'YES'
    const assets = hasContinual ? abs.assets : abs.compilation.assets

    Object.keys(assets).forEach(function(filename) {
      const file = assets[filename]
      const size = file.size()
      const source = file.source()
      const hash = md5(source)
      const cache = cacheStore[filename]
      if (cache !== hash) {
        files.push({
          size: size,
          filename: filename,
          content: new Buffer(source, 'utf-8'),
          stats: {}
        })
        cacheStore[filename] = hash
      }
    })

    self.client.exec(files, hasContinual)
    if (hasContinual) callback()
  })
}

module.exports = DeployPlugin
