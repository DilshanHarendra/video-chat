import React, {useEffect, useRef} from "react";

function Video(props){
    console.log(props)
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);

    return (
        <video className="w-100" playsInline autoPlay ref={ref} controls/>
    );
}export default Video;
