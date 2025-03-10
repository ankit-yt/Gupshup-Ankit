console.log("hi");

const socket = io();
socket.emit("joinRoom");

let roomName;
socket.on("joined", (room) => {
    document.querySelector(".nobody").classList.toggle("hidden");
    roomName = room;
});

console.log("hi");
document.querySelector(".form").addEventListener("submit", (e) => {
    e.preventDefault();
    const message = document.querySelector(".message").value;
    socket.emit("message", { roomName, message });
    console.log(message);
    addLocalMessage(message);
    document.querySelector(".message").value = "";
});

socket.on("message", (message) => {
    addRemoteMessage(message);
});

// -------------------WebRTC-------------





let localStream;
let remoteStream;
let peerConnection;
const rtcSettings = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

document.querySelector(".callBtn").addEventListener("click", ()=>{
    socket.emit("reqCall" , roomName)
    console.log("button clicked")
})

document.querySelector(".accept").addEventListener("click",()=>{
    socket.emit("acceptCall" , roomName)
})

document.querySelector(".reject").addEventListener("click",()=>{
    socket.emit("rejectCall" , roomName)
})

socket.on("callReq", ()=>{
   console.log("recieved on frotend")
    document.querySelector(".callNoti").classList.toggle("hidden")
})

socket.on("accept", ()=>{
    document.querySelector(".callNoti").classList.add("hidden")
    document.querySelector(".chatArea").classList.toggle("hidden")
    initialize()
})

socket.on("reject", ()=>{
    document.querySelector(".callNoti").classList.add("hidden")
})


document.querySelector("#cameraToggle").addEventListener("click", ()=>{
    localStream.getTracks().forEach((track) => {
        if (track.kind === "video") {
            track.enabled =!track.enabled;
        }
    });
})

document.querySelector("#micToggle").addEventListener("click" , ()=>{
    localStream.getTracks().forEach(track => {
        if(track.kind == "audio"){
            track.enabled = !track.enabled
        }
        
    });
})

console.log("wrtc")
const initialize = async () => {
    socket.on("signalingMessage", handleSignalingMessage);
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        console.log(localStream)
        document.querySelector(".localVideo").srcObject = localStream; // Assign stream to local video
        initiateOffer();
    } catch (error) {
        console.error("Error initializing stream", error);
    }
};

const initiateOffer = async () => {
    await createPeerConnection();
    try {
        let offer = await peerConnection.createOffer(); // Fixed typo
        await peerConnection.setLocalDescription(offer);
        socket.emit("signalingMessage", {
            roomName,
            message: JSON.stringify({
                type: "offer",
                offer
            })
        });
    } catch (error) {
        console.error("Error creating peer connection", error);
    }
};

const createPeerConnection = async () => {
    peerConnection = new RTCPeerConnection(rtcSettings);
    remoteStream = new MediaStream();

    document.querySelector(".remoteVideo").srcObject = remoteStream; // Fixed srcObj typo

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (e) => {
        e.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track);
        });
    };

    peerConnection.onicecandidate = (e) => {
        if (e.candidate) {
            socket.emit("signalingMessage", {
                roomName,
                message: JSON.stringify({
                    type: "candidate",
                    candidate: e.candidate
                })
            });
        }
    };
};

const handleSignalingMessage = async (message) => {
    const { type, offer, answer, candidate } = JSON.parse(message);
    if (type === "offer") await handleOffer(offer);
    if (type === "answer") await handleAnswer(answer);
    if (type === "candidate" && peerConnection) {
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate)); // Ensure proper handling
        } catch (e) {
            console.error("Error adding ICE candidate", e);
        }
    }
};

const handleOffer = async (offer) => {
    try {
        if (!peerConnection) await createPeerConnection(); // Ensure peerConnection exists
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("signalingMessage", {
            roomName,
            message: JSON.stringify({
                type: "answer",
                answer
            })
        });
    } catch (error) {
        console.error("Error handling offer", error);
    }
};

const handleAnswer = async (answer) => {
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
        console.error("Error handling answer", error);
    }
};


