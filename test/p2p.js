const P2P = require('../src/core/components/p2p')
const assert = require('assert')
describe("P2P", function () {
    let inc;
    this.beforeAll(async () => {
        inc = new P2P();
        await inc.start();
    })
    it("Dialer - call packet", async () => {
        var result = await inc.dialer.call("/ip4/127.0.0.1/tcp/65479/p2p/" + inc.libp2p.peerId._idB58String, "cmdlist")
        console.log(result)
        assert.notStrictEqual(result, ['cmdlist'])
    })
    it("Dialer - call packet with error", async () => {
        //Register abstract command that throws an error.
        inc.listener.registerCmd("cmdlist.error", async function () {
            throw "An Abstract Error Occurred"
        })
        try {
            //Execute
            await inc.dialer.call("/ip4/127.0.0.1/tcp/65479/p2p/" + inc.libp2p.peerId._idB58String, "cmdlist.error")
        } catch (ex) {
            assert.strictEqual(ex, "An Abstract Error Occurred")
        }
    })
    it("Dialer - call iterable", async () => {
        var out = ["a", "b", "c"];
        //Register abstract command that throws an error.
        inc.listener.registerCmd("iterable", async function* () {
            for (var value of out) {
                yield value;
            }
        })

        //Execute
        var stream = await inc.dialer.call("/ip4/127.0.0.1/tcp/65479/p2p/" + inc.libp2p.peerId._idB58String, "iterable");
        assert.strictEqual(typeof stream[Symbol.asyncIterator], "function")
        for await (var e of stream) {
            console.log(`Answer is ${e}`)
            assert.strictEqual(out.includes(e), true);
        }

    })
    it("Dialer - call iterable with error", async () => {
        //Register abstract command that throws an error.
        inc.listener.registerCmd("iterable.error", async function* () {
            throw "An Abstract Error Occurred";
        })
        try {
            //Execute
            await inc.dialer.call("/ip4/127.0.0.1/tcp/65479/p2p/" + inc.libp2p.peerId._idB58String, "iterable.error");
        } catch (ex) {
            assert.strictEqual(ex, "An Abstract Error Occurred")
        }
    })
    this.afterAll(async () => {
        await inc.stop();
    })
})