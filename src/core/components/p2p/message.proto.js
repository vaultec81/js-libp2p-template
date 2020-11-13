module.exports = `
    message Message {
        optional string tid = 1;
        optional int32 type = 2;
        optional string cmd = 3;
        optional bytes payload = 4;
        optional int32 status = 5;
        optional int32 seq = 6;
        repeated int32 flags = 7;
    }
`;