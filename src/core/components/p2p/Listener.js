const MessageCoder = require('./MessageCoder');
const MessageFormat = require('./MessageFormat');
const pipe = require('it-pipe')
const pushable = require('it-pushable')
/**
 * Listener class
 */
class Listener {
    constructor(p2p) {
        this.p2p = p2p;
        this.handlers = {};
        this.handler = this.handler.bind(this);
        this.cmdList = this.cmdList.bind(this)
    }
    registerCmd(cmdName, handler) {
        this.handlers[cmdName] = handler;
    }
    unregisterCmd(cmdName) {
        this.handlers[cmdName] = handler;
    }
    /**
     * Internal reference command to signal to other nodes what commands are supported.
     * @param {Object|AsyncIterable} input payload passed from handler parent code. Ultimately coming from the client.
     * @returns {Object|AsyncIterable} Return object for packet based response (one request one reply) or AsyncIterable for a streamed response.
     */
    async cmdList(input) {
        return Object.keys(this.handlers)
    }
    async handler({ connection, stream, protocol }) {
        console.log('Listener received connection')
        pipe(stream.source, MessageCoder.decode, source => (() => {
            //console.log(source.next)
            const sink = pushable();
            /**
             * Response handling for iterable type commands
             */
            var responseCycle = async (result, chunk) => {
                var seq = 1;
                let error;
                try {
                    for await(var res of result) {
                        var msg = MessageFormat.fromObj(chunk);
                        seq++; msg.seq = seq;
                        msg.type = 2; //Response
                        msg.flags = [MessageFormat.flags.Response_type_stream]
                        msg.setPayload(res)
                        sink.push(msg);
                    }
                } catch (ex) {
                    error = ex;
                }
                var msg = MessageFormat.fromObj(chunk);
                seq++; msg.seq = seq;
                msg.setPayload(null);
                msg.flags = [
                    MessageFormat.flags.Response_type_stream,
                    MessageFormat.flags.Response_Iterable_end
                ];
                if(error) {
                    msg.flags.push(MessageFormat.flags.Response_Error)
                }
                sink.push(msg);
            }
            var func = (async () => {
                for await (const chunk of source) {
                    console.log(`Listener incoming is ${JSON.stringify(chunk)}`)
                    if(this.handlers[chunk.cmd]) {
                        var result = this.handlers[chunk.cmd](chunk.payload);
                        console.log(result)
                        if(result instanceof Promise) {
                            result.then(result => {
                                var msg = MessageFormat.fromObj(chunk);
                                msg.seq = 2;
                                msg.setPayload(result);
                                msg.flags = [
                                    MessageFormat.flags.Response_type_packet
                                ];
                                sink.push(msg);
                            })
                            result.catch(error => {
                                var msg = MessageFormat.fromObj(chunk);
                                msg.seq = 2;
                                msg.setPayload(error);
                                msg.flags = [
                                    MessageFormat.flags.Response_Error
                                ];
                                sink.push(msg);
                            })
                        } else if(typeof result[Symbol.asyncIterator] === "function") {
                            //Handle async iterator
                            responseCycle(result, chunk);
                        }
                    }
                }
            });
            
            func();
            return sink;
        })(), MessageCoder.encode, stream.sink);
    }
    async start() {
        this.p2p.libp2p.handle(["/template/server/1.0.0"], this.handler)
        this.registerCmd("cmdlist", this.cmdList)
    }
    async stop() {
        this.p2p.libp2p.unhandle(["/template/server/1.0.0"])
    }
}
module.exports = Listener;