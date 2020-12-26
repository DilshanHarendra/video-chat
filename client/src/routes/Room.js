import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import Video from "../components/Video";








const Room = (props) => {
    const [peers, setPeers] = useState([]);
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const roomID = props.match.params.roomID;
    const [devices,setDevices]=useState([]);
    const [device,setDevice]=useState('');
    const [start,setStart]=useState(true);

    const videoConstraints={
        deviceId :{ exact: device }
    }
    useEffect(() => {
        if (device!==''){
            socketRef.current = io.connect("/");
            navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false, }).then(stream => {
                userVideo.current.srcObject = stream;
                socketRef.current.emit("join room", roomID);
                socketRef.current.on("all users", users => {
                    const peers = [];
                    users.forEach(userID => {
                        const peer = createPeer(userID, socketRef.current.id, stream);
                        peersRef.current.push({
                            peerID: userID,
                            peer,
                        })
                        peers.push(peer);
                    })
                    setPeers(peers);
                })

                socketRef.current.on("user joined", payload => {
                    const peer = addPeer(payload.signal, payload.callerID, stream);
                    peersRef.current.push({
                        peerID: payload.callerID,
                        peer,
                    })

                    setPeers(users => [...users, peer]);
                });

                socketRef.current.on("receiving returned signal", payload => {
                    const item = peersRef.current.find(p => p.peerID === payload.id);
                    item.peer.signal(payload.signal);
                });
            })

            setStart(false)
        }


    }, [device]);


    useEffect(()=>{
        getVideoDevices().then(res=>setDevices(res)).catch(err=>console.log(err))
    },[])

    function getVideoDevices(){
        let arr=[]
        return  new Promise((resolve, reject) =>{
            navigator.mediaDevices.enumerateDevices().then(media=>{
                media.forEach(d=>{
                    if (d.kind==='videoinput'){
                        arr.push(d)
                    }
                })
                resolve(arr)
            })
        } )


    }



    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
        })

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })

        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID })
        })

        peer.signal(incomingSignal);

        return peer;
    }

    return (
        <div className="container">

                <h1 className="text-center text-primary">Room {roomID}</h1>
                <div className="row">
                    <div className="col-md-6 mx-auto">
                        {start&&  <select className="form-select w-100 py-2" onChange={e=>setDevice(e.target.value)}>
                            <option value="">Select Camera</option>
                            {devices.map(d=>(

                                <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                            ))}

                        </select>}
                    </div>
                </div>

               <div className="row">
                   <div className="col-md-4 p-3"><video className="w-100" muted ref={userVideo} autoPlay playsInline /></div>
                   {peers.map((peer, index) => {
                       return (
                           <div className="col-md-4 p-3"><Video className="w-100" key={index} peer={peer} /></div>

                       );
                   })}
               </div>

            </div>

    );
};

export default Room;
