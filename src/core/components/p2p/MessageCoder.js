const protons = require('protons')
const pbm = protons(require('./message.proto'))

module.exports = {
    encode: async function* (source) {
        console.log(source)
        for await(var msg of source) {
            //console.log(msg)
            //console.log(pbm["Message"].encode(msg))
            yield pbm["Message"].encode(msg)
        }
    },
    decode: async function* (source) {
        for await(var msg of source) {
            try {
                //console.log(msg._bufs[0].toString())
                yield pbm["Message"].decode(Uint8Array.from(msg._bufs[0]))
            } catch(ex) {
                console.log(ex)
                yield null
            }
        }
    }
}