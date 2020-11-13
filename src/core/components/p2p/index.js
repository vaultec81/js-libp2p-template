// Libp2p Core
const Libp2p = require('libp2p')
// Transports
const TCP = require('libp2p-tcp')
const WebRTCStar = require('libp2p-webrtc-star')
const wrtc = require('wrtc')
// Stream Muxer
const Mplex = require('libp2p-mplex')
// Connection Encryption
const { NOISE } = require('libp2p-noise')
const Bootstrap = require('libp2p-bootstrap')
const MDNS = require('libp2p-mdns')
const KadDHT = require('libp2p-kad-dht')
// Gossipsub
const Gossipsub = require('libp2p-gossipsub');
//CID
const CID = require('cids')

const Dialer = require('./Dialer')
const Listener = require('./Listener')

class p2p {
    constructor() {
    }
    async start() {
        this.libp2p = await Libp2p.create({
            addresses: {
                listen: [
                    '/ip4/0.0.0.0/tcp/65479',
                    '/ip4/0.0.0.0/tcp/0/ws'
                ]
            },
            modules: {
                transport: [TCP],
                streamMuxer: [Mplex],
                connEncryption: [NOISE],
                peerDiscovery: [],
                dht: KadDHT,
                pubsub: Gossipsub
            },
            config: {
                transport: {
                    [WebRTCStar.prototype[Symbol.toStringTag]]: {
                        wrtc
                    }
                },
                peerDiscovery: {
                    bootstrap: {
                        list: [
                            '/ip6/202:d0ca:a9d7:b4e8:bd3c:ffde:5c89:a3d7/tcp/4001/p2p/QmZEiPvrfZHapq4uiyTDEcR2szCUhDnjdS4q3Uv2b1Uh88',
                            "/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
                            "/ip4/209.222.98.165/tcp/4001/p2p/12D3KooWAH9FypmaduofuBTtubSHVJghxW35aykce23vDHjfhiAd",
                            '/ip6/200:bcad:2a6a:5fd7:fd7:94f:b03:e248/tcp/4001/p2p/QmddmHu29PUDkLV6RJwGJRsZRJqBx73ynvxoTwqb6H9cpp',
                            '/ip6/200:c499:dd38:846d:a221:3b4e:5f5b:45f6/tcp/4001/p2p/Qmb85gn5UJF1syoET8rNpVWGKnt3J49TUFVURLzfp9Rd6a',
                            '/ip6/200:e2e7:56f4:40db:f9a5:ec46:9ed:942c/tcp/4001/p2p/QmWRNnAHCASDdRAo724PfgCnXeB2bFh4uqBn1eKnMPdueT',
                            '/ip6/200:ff25:ff10:16e6:f95a:48c5:7f9a:935a/tcp/4001/p2p/QmX7c1hQrUecoR46JV7PuGptALrG9SjKyxC7g6fugeqC3E',
                            '/ip6/201:12b7:c078:3c7e:3735:816b:46af:e51a/tcp/4001/p2p/QmYAesHYTymfXyXitPBaHLBrC3dfVrRESFd28gfnbyjo7e',
                            '/ip6/201:4af7:3ae5:2ed9:dced:d3c0:6bb:9a3a/tcp/4001/p2p/12D3KooWQw8kUseRsfG2AYNLo7g1C4TZNFht7dsbY9pq8VveEMc5',
                            '/ip6/201:5cea:1028:c9c6:b753:12aa:db32:affc/tcp/4001/p2p/Qmdzib6UfRXpBoB1fjPBhJysdScxysRc5FUuRm3HqjpVPn',
                            '/ip6/201:a434:84d2:eefc:c555:cd4:ab24:211d/tcp/4001/p2p/QmbXqYJTYmHHYPtRsVF5WLX8TBkarkvpacvmYsFE7Rhy6H',
                            '/ip6/201:ee6e:972d:8784:17ec:54da:3f90:bba8/tcp/4001/p2p/QmQHzQqXe5npsyRfRFrSbjDHTKKRz1cULajerNZrJLAMsK',
                            '/ip6/202:72a5:b6f1:e626:ad2c:d2f:c90b:d556/tcp/4001/p2p/QmRkKTDwAxub9abBkGbhxNLuAG4i7CP4vHMcSTKD6AzB1R',
                            '/ip6/202:b334:91ed:aacb:7057:bf8e:9cf1:471c/tcp/4001/p2p/QmSb5LGwyVTCSgi5etuBnKhkEgH68cDxfwp3rtc94Fegv4',
                            '/ip6/203:6059:f625:fbac:e417:638e:31b:2bb2/tcp/4001/p2p/QmamWhrh3qqaRzbjcZ1Si9k8V2ytoJhhPDzVGyzEAtdUCc'
                        ]
                    }
                },
                dht: {
                    kBucketSize: 20,
                    enabled: true,
                    randomWalk: {
                        enabled: true,
                        interval: 300e3,
                        timeout: 10e3
                    }
                }
            }
        });
        //Start libp2p
        await this.libp2p.start();
        this.dialer = new Dialer(this);
        this.listener = new Listener(this);
        await this.listener.start();
    }
    async stop() {
        await this.listener.stop();
        await this.libp2p.stop();
    }
}
module.exports = p2p;