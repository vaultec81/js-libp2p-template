const multiaddr = require('multiaddr')
const pipe = require('it-pipe')
const pushable = require('it-pushable')
const MessageFormat = require('./MessageFormat')
const MessageCoder = require('./MessageCoder')
/**
 * Dialer interface. This class is where you specify all request based operations.
 */
class Dialer {
    constructor(p2p) {
        this.p2p = p2p;
        this.streams = {};
        this.callbacks = {};
        this.p2p.libp2p.on("peer:disconnect", (connection) => {
            this.streams[connection.id].pushStream.end();
            delete this.streams[connection.id];
        });
    }
    /**
     * Handles client receiving data
     * @param {*} stream 
     * @param {String} peerId 
     */
    _handleStream(stream, peerId) {
        //Receiving stream handling
        pipe(stream, MessageCoder.decode, (source) => (() => {
            var pushStream = pushable();
            //Creates pushable stream for later use.
            this.streams[peerId].pushStream = pushStream;
            var func = async () => {
                for await (var ret of source) {
                    console.log(`Incoming data is ${JSON.stringify(ret)}`);
                    console.log(`Incoming data is ${JSON.stringify(MessageFormat.fromObj(ret).getPayload())}`);
                    var msg = MessageFormat.fromObj(ret);
                    if (!this.callbacks[ret.tid]) {
                        continue;
                    }
                    let out;
                    if (msg.flags.includes(MessageFormat.flags.Response_type_stream)) {
                        //Packet type is iterable
                        if(typeof this.callbacks[ret.tid] === "function") {
                            //Data type is iterable
                            if(msg.flags.includes(MessageFormat.flags.Response_Error)) {
                                //Handle error on initial connection.
                                this.callbacks[ret.tid](msg.getPayload(), null);
                                delete this.callbacks[ret.tid];
                            } else {
                                out = pushable();
                                out.push(msg.getPayload());
                                this.callbacks[ret.tid](null, out);
                                this.callbacks[ret.tid] = out; //Set callback to pushable for future use
                            }
                        } else {
                            //Presume type is pushable
                            if(msg.flags.includes(MessageFormat.flags.Response_Iterable_end)) {
                                if(msg.flags.includes(MessageFormat.flags.Response_Error)) {
                                    this.callbacks[ret.tid].end(msg.getPayload()); //Responds with error
                                } else {
                                    this.callbacks[ret.tid].end();
                                }
                                delete this.callbacks[ret.tid];
                            } else {
                                this.callbacks[ret.tid].push(msg.getPayload());
                            }
                        }
                    } else {
                        if(msg.flags.includes(MessageFormat.flags.Response_Error)) {
                            //Data type is assumed to be packet / single request, single response
                            out = msg.getPayload();
                            this.callbacks[ret.tid](out, null);
                            delete this.callbacks[ret.tid]; //Clean up old callbacks.
                        } else {
                            //Data type is assumed to be packet / single request, single response
                            out = msg.getPayload();
                            this.callbacks[ret.tid](null, out);
                            delete this.callbacks[ret.tid]; //Clean up old callbacks.
                        }
                    }
                }
            }
            func();
            return pushStream;
        })(), MessageCoder.encode, stream.sink)
    }
    /**
     * 
     * @param {Multiaddr} peerAddr 
     * @param {String} cmd 
     * @param {*} payload 
     */
    async call(peerAddr, cmd, payload = {}) {
        var peerId = multiaddr(peerAddr).getPeerId()
        let stream;
        if (this.streams[peerId]) {
            stream = this.streams[peerId].stream;
        } else {
            var result = await this.p2p.libp2p.dialProtocol(peerAddr, ["/template/server/1.0.0"]);
            var { connection } = result;
            stream = result.stream;
            this.streams[peerId] = { connection, stream };
            this._handleStream(stream, peerId);
        }
        var msg = MessageFormat.createEmpty({
            cmd,
            payload,
            type: 1, //Req
            flags: [

            ],
            seq: 1
        });
        //Retrieve pushStream from the peer connection
        var { pushStream } = this.streams[peerId];
        pushStream.push(msg);
        var response = new Promise((resolve, reject) => {
            this.callbacks[msg.tid] = (err, response) => {
                if (err) return reject(err);
                return resolve(response);
            }
        })
        if(response[Symbol.asyncIterator] === "function") {
            //Handle Duplex stream
            /*return async function* (inputStream) {
                //Handle input
                for await(var message of inputStream) {
                    //Wrap message and send off to pushStream
                }

            }*/
            //For now return only the single plex stream
            return response;
        } else {
            return await response;
        }
    }
    dialPeer() {

    }
    async stop() {
        for(var key of this.streams) {
            this.streams[key].pushStream.end();
            delete this.streams[key];
        }
    }
}
module.exports = Dialer;