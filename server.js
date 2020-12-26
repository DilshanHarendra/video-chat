require('dotenv').config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

const users = {};

const socketToRoom = {};

io.on('connection', socket => {
    socket.on("join-room", roomID => {
        console.log(socket.id,roomID,users[roomID])
        if (users[roomID]) { // check user object if room  create
            const length = users[roomID].length;
            if (length === 4) {
                socket.emit("room full");
                return;
            }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id]; //room not create create room and assign socket id as array
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id); // get all other users

        socket.emit("all-users", usersInThisRoom);// send all other users
    });

    socket.on("sending-signal", payload => {
        io.to(payload.userToSignal).emit('user-joined', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning-signal", payload => {
        io.to(payload.callerID).emit('receiving-returned-signal', { signal: payload.signal, id: socket.id });
    });

    socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }
        socket.emit("all-users", room);// send all other users
    });

});

server.listen(process.env.PORT || 8000, () => console.log('server is running on port 8000'));


