const ChatManagerLarge = require("./chat-manager-large")


class PeerManager {
    constructor(app, mod, room_code) {
        this.app = app;
        this.mod = mod
        this.peers = new Map();
        this.servers = [
            {
                urls: "stun:stun-sf.saito.io:3478"
            },
            {
                urls: "turn:stun-sf.saito.io:3478",
                username: "guest",
                credential: "somepassword",
            },
            {
                urls: "stun:stun-sg.saito.io:3478"
            },
            {
                urls: "turn:stun-sg.saito.io:3478",
                username: "guest",
                credential: "somepassword",
            },
            {
                urls: "stun:stun-de.saito.io:3478"
            },
            {
                urls: "turn:stun-de.saito.io:3478",
                username: "guest",
                credential: "somepassword",
            }
        ];
        this.videoEnabled = true;
        this.audioEnabled = true


        this.room_code = room_code;


        app.connection.on('stun-event-message', (data) => {
            if (data.room_code !== this.room_code) {
                return;
            }

            if (data.type === 'peer-joined') {
                this.createPeerConnection(data.public_key, 'offer');
            } else if (data.type === 'peer-left') {
                this.removePeerConnection(data.public_key);
            } else {
                let peerConnection = this.peers.get(data.public_key);
                if (!peerConnection) {
                    this.createPeerConnection(data.public_key);
                    peerConnection = this.peers.get(data.public_key);
                }

                if (peerConnection) {
                    this.handleSignalingMessage(peerConnection, data);
                }
            }
        })

        app.connection.on('stun-disconnect', () => {
            this.leave()
        })

        app.connection.on('stun-toggle-video', async () => {
            if (this.videoEnabled === true) {
                this.localStream.getVideoTracks()[0].enabled = false;
                this.app.connection.emit("mute", 'video', 'local');
                try {
                    this.peers.forEach(value => {
                        // for (let i in this.mod.peer_connections) {
                        //     this.mod.peer_connections[i].dc.send(JSON.stringify({ event: "mute", kind: 'video' }))
                        // }
                    })

                } catch (error) {

                }

                this.videoEnabled = false;
                document.querySelector('.video_control').classList.remove('fa-video')
                document.querySelector('.video_control').classList.add('fa-video-slash')
            } else {

                document.querySelector('.video_control').classList.add('fa-video')
                document.querySelector('.video_control').classList.remove('fa-video-slash')
                if (!this.localStream.getVideoTracks()[0]) {

                    const oldVideoTracks = this.localStream.getVideoTracks();
                    if (oldVideoTracks.length > 0) {
                        oldVideoTracks.forEach(track => {
                            this.localStream.removeTrack(track);
                        });
                    }
                    // start a video stream;
                    let localStream = await navigator.mediaDevices.getUserMedia({ video: true })

                    // Add new track to the local stream


                    this.app.connection.emit('render-local-stream-request', this.localStream, 'video');
                    let track = localStream.getVideoTracks()[0];
                    this.localStream.addTrack(track);

                    this.peers.forEach((peerConnection, key) => {
                        const videoSenders = peerConnection.getSenders().filter(sender => sender.track && sender.track.kind === 'video');
                        if (videoSenders.length > 0) {
                            videoSenders.forEach(sender => {
                                sender.replaceTrack(track);
                            })

                        } else {
                            peerConnection.addTrack(track);
                        }

                        this.renegotiate(key);
                    })
                    document.querySelector('.video_control').classList.add('fa-video')
                    this.videoEnabled = true;

                } else {
                    this.localStream.getVideoTracks()[0].enabled = true;
                    this.app.connection.emit("unmute", 'video', 'local');
                }
                try {
                    // for (let i in this.mod.peer_connections) {
                    //     this.mod.peer_connections[i].dc.send(JSON.stringify({ event: "unmute", kind: 'video' }))
                    // }
                } catch (error) {

                }
                this.videoEnabled = true;
            }
        })
        app.connection.on('stun-toggle-audio', async () => {
            // if video is enabled
            if (this.audioEnabled === true) {
                this.localStream.getAudioTracks()[0].enabled = false;
                this.app.connection.emit("mute", 'audio', 'local');
                try {
                    this.peers.forEach(value => {
                        // for (let i in this.mod.peer_connections) {
                        //     this.mod.peer_connections[i].dc.send(JSON.stringify({ event: "mute", kind: 'video' }))
                        // }
                    })

                } catch (error) {

                }
                this.audioEnabled = false;
                document.querySelector('.audio_control').classList.remove('fa-microphone')
                document.querySelector('.audio_control').classList.add('fa-microphone-slash')


            }

            else {
                this.localStream.getAudioTracks()[0].enabled = true;
                this.audioEnabled = true;
                document.querySelector('.audio_control').classList.add('fa-microphone')
                document.querySelector('.audio_control').classList.remove('fa-microphone-slash')
                // if (!this.localStream.getAudioTracks()[0]) {
                //     // start an audio stream
                //     let localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
                //     let track = localStream.getAudioTracks()[0];
                //     console.log(track, "these are the tracks")

                //     this.peers.forEach((peerConnection, key) => {
                //         const audioSenders = peerConnection.getSenders().filter(sender => sender.track && sender.track.kind === 'audio');
                //         console.log(audioSenders, 'senders');

                //         if (audioSenders.length > 0) {
                //             audioSenders.forEach(sender => {
                //                 sender.replaceTrack(track);
                //             })        
                //         } else {
                //             peerConnection.addTrack(track);
                //         }
                //         this.renegotiate(key);
                //     })

                //     document.querySelector('.audio_control').classList.add('fa-microphone')
                //     this.audioEnabled = true;

                // } else {
                //     this.localStream.getAudioTracks()[0].enabled = true;
                //     // this.app.connection.emit("unmute", 'video', 'local');
                //     this.audioEnabled = true;
                // }
                // try {
                //     // for (let i in this.mod.peer_connections) {
                //     //     this.mod.peer_connections[i].dc.send(JSON.stringify({ event: "unmute", kind: 'video' }))
                //     // }
                // } catch (error) {

                // }
                // this.videoEnabled = true;
            }
        })

        app.connection.on('show-chat-manager', async () => {
            console.log(this, "peer")
            await this.showChatManager();
            if (this.to_join) {
                this.join()
            }

            let sound = new Audio('/videocall/audio/enter-call.mp3');
            sound.play();
        })

        app.connection.on('update-media-preference', (kind, state) => {
            if (kind === "audio") {
                this.audioEnabled = state
            } else if (kind === "video") {
                this.videoEnabled = state
            }
        })
    }

    showSetting(to_join) {
        this.to_join = to_join
        this.app.connection.emit('show-chat-setting', this.room_code);
    }


    async showChatManager() {
        // emit events to show chatmanager;
        // get local stream;
        console.log('video enableddd?', this.videoEnabled)

        this.localStream = await navigator.mediaDevices.getUserMedia({ video: this.videoEnabled, audio: true });
        this.localStream.getAudioTracks()[0].enabled = this.audioEnabled;
        // this.localStream.getAudioTracks()[0].enabled = this.audioEnabled;

        this.app.connection.emit('show-video-chat-request', this.app, this.mod, 'video', this.room_code, this.videoEnabled, this.audioEnabled);

        this.app.connection.emit('stun-remove-loader')
        this.app.connection.emit('render-local-stream-request', this.localStream, 'video');
        this.app.connection.emit('remove-overlay-request');
    }

    handleSignalingMessage(peerConnection, data) {
        const { type, sdp, candidate, targetPeerId, public_key } = data;
        if (type === 'renegotiate-offer' || type === 'offer') {
            peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }))

                .then(() => {

                    return peerConnection.createAnswer();
                })
                .then((answer) => {
                    return peerConnection.setLocalDescription(answer);
                })
                .then(() => {
                    let data = {
                        room_code: this.room_code,
                        type: 'renegotiate-answer',
                        sdp: peerConnection.localDescription.sdp,
                        targetPeerId: public_key,
                    }
                    this.app.connection.emit('stun-send-message-to-server', data);
                })
                .catch((error) => {
                    console.error('Error handling offer:', error);
                });
        } else if (type === 'renegotiate-answer' || type === 'answer') {
            peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp })).then(answer => {

            }).catch((error) => {
                console.error('Error handling answer:', error);
            });
        } else if (type === 'candidate') {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                .catch((error) => {
                    console.error('Error adding remote candidate:', error);
                });
        }
    }


    createPeerConnection(peerId, type) {
        const peerConnection = new RTCPeerConnection({
            iceServers: this.servers,
        });

        this.peers.set(peerId, peerConnection);
        // Implement the creation of a new RTCPeerConnection and its event handlers

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                let data = {
                    room_code: this.room_code,
                    type: 'candidate',
                    candidate: event.candidate,
                    targetPeerId: peerId,
                }
                this.app.connection.emit('stun-send-message-to-server', data);

            }
        }



        const remoteStream = new MediaStream();
        peerConnection.addEventListener('track', (event) => {
            console.log("trackss", event.track, "stream :", event.streams);
            if (event.streams.length === 0) {
                remoteStream.addTrack(event.track);
            } else {
                event.streams[0].getTracks().forEach(track => {
                    remoteStream.addTrack(track);
                });
            }


            this.app.connection.emit('add-remote-stream-request', peerId, remoteStream, peerConnection)

        });



        this.localStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, this.localStream);
            console.log('track local ', track)
        });


        peerConnection.addEventListener('connectionstatechange', () => {
            if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
                
                    setTimeout(() => {
                        console.log('sending offer');
                        this.reconnect(peerId, type);
                    }, 10000);

            }
            if(peerConnection.connectionState === "connected"){
                let sound = new Audio('/videocall/audio/enter-call.mp3');
                sound.play();
            }
            // if(peerConnection.connectionState === "disconnected"){
              
            // }
          

            this.app.connection.emit('stun-update-connection-message', this.room_code, peerId, peerConnection.connectionState);
        });

        if (type === "offer") {
            this.renegotiate(peerId);
        }

    }

    reconnect(peerId, type) {
        const maxRetries = 2;
        const retryDelay = 10000;

        const attemptReconnect = (currentRetry) => {

            const peerConnection = this.peers.get(peerId);
            if (currentRetry === maxRetries) {
                if (peerConnection && peerConnection.connectionState !== 'connected') {
                    console.log('Reached maximum number of reconnection attempts, giving up');
                    this.removePeerConnection(peerId);
                }
                return;
            }




            if (peerConnection && peerConnection.connectionState === 'connected') {
                console.log('Reconnection successful');
                return;
            }

            if (peerConnection && peerConnection.connectionState !== 'connected') {
                this.removePeerConnection(peerId);
                if (type === "offer") {
                    this.createPeerConnection(peerId, 'offer');
                }
            }


            setTimeout(() => {
                console.log(`Reconnection attempt ${currentRetry + 1}/${maxRetries}`);
                attemptReconnect(currentRetry + 1);
            }, retryDelay);
        };

        attemptReconnect(0);
    }

    removePeerConnection(peerId) {
        const peerConnection = this.peers.get(peerId);
        if (peerConnection) {
            peerConnection.close();
            this.peers.delete(peerId);
        }

        let sound = new Audio('/videocall/audio/end-call.mp3');
        sound.play();
        this.app.connection.emit('video-box-remove', peerId, 'disconnection');

    }

    renegotiate(peerId, retryCount = 0) {
        const maxRetries = 4;
        const retryDelay = 3000;

        const peerConnection = this.peers.get(peerId);
        if (!peerConnection) {
            return;
        }

        console.log('signalling state, ', peerConnection.signalingState)
        if (peerConnection.signalingState !== 'stable') {
            if (retryCount < maxRetries) {
                console.log(`Signaling state is not stable, will retry in ${retryDelay} ms (attempt ${retryCount + 1}/${maxRetries})`);
                setTimeout(() => {
                    this.renegotiate(peerId, retryCount + 1);
                }, retryDelay);
            } else {
                console.log('Reached maximum number of renegotiation attempts, giving up');
            }
            return;
        }

        const offerOptions = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        };

        peerConnection.createOffer(offerOptions)
            .then((offer) => {
                return peerConnection.setLocalDescription(offer);
            })
            .then(() => {
                let data = {
                    room_code: this.room_code,
                    type: 'renegotiate-offer',
                    sdp: peerConnection.localDescription.sdp,
                    targetPeerId: peerId
                }
                this.app.connection.emit('stun-send-message-to-server', data);
            })
            .catch((error) => {
                console.error('Error creating offer:', error);
            });

        // Implement renegotiation logic for reconnections and media stream restarts
    }

    join() {
        console.log('joining mesh network');

        this.app.connection.emit('stun-send-message-to-server', { type: 'peer-joined', room_code: this.room_code });
    }

    leave() {
        this.localStream.getTracks().forEach(track => {
            track.stop();
            console.log(track);
            console.log('stopping track');
        })
        this.peers.forEach((peerConnections, key) => {
            peerConnections.close();
        })

        let data = {
            room_code: this.room_code,
            type: 'peer-left',
        }

        this.app.connection.emit('stun-send-message-to-server', data);
    }

    signalingChannel(event, data) {

    }
}


module.exports = PeerManager;