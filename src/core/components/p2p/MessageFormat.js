const DagCbor = require('ipld-dag-cbor');
const Crypto = require('crypto');
const { message } = require('protons/src/compile');
const Flags = {
    Response_type_packet: 0x01,
    Response_type_stream: 0x02,
    Response_Iterable_end: 0x03,
    Response_Error: 0x04
}
class MessageFormat {
    /**
     * Retrieves the encased payload
     */
    getPayload() {
        return DagCbor.util.deserialize(this.payload);
    }
    /**
     * Sets the encased payload
     */
    setPayload(payload) {
        this.payload = DagCbor.util.serialize(payload);
    }
    static createEmpty({cmd, type, payload, status, seq, flags = []}) {
        console.log(cmd);
        if(!cmd) {
            throw new Error("Cmd is required argument")
        }
        var msg = new MessageFormat();
        msg.tid = Crypto.randomBytes(6).toString('base64');
        msg.type = type;
        msg.cmd = cmd;
        msg.payload = DagCbor.util.serialize(payload);
        msg.status = status;
        msg.seq = seq;
        msg.flags = flags;
        return msg;
    }
    static fromObj(obj) {
        var msg = new MessageFormat();
        msg.tid = obj.tid;
        msg.type = obj.type;
        msg.cmd = obj.cmd;
        msg.payload = obj.payload;
        msg.status = obj.status;
        msg.seq = obj.seq;
        msg.flags = obj.flags
        return msg;
    }
}
MessageFormat.flags = Flags;
module.exports = MessageFormat;