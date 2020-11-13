const P2P = require('../src/core/components/p2p')
const assert = require('assert')
describe("P2P" , function() {
    let inc;
    this.beforeAll(async () => {
        inc = new P2P();
        await inc.start();
    })
    it("Dialer - call packet", async () => {
        var result = await inc.dialer.call("/ip4/127.0.0.1/tcp/65479/p2p/" + inc.libp2p.peerId._idB58String, "cmdlist")
        console.log(result)
        assert.notStrictEqual(result, [ 'cmdlist' ])
    })
    it("Dialer - call packet with error", async () => {
        //Register abstract command that throws an error.
        inc.listener.registerCmd("cmdlist.error" , async function () {
            throw "An Abstract Error Occurred"
        })
        try {
            //Execute
            await inc.dialer.call("/ip4/127.0.0.1/tcp/65479/p2p/" + inc.libp2p.peerId._idB58String, "cmdlist.error")
        } catch (ex) {
            assert.strictEqual(ex, "An Abstract Error Occurred")
        }
    })
})