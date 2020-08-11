const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const {addUser, removeUser, getUser, getUserInRomm} = require('./users.js')
const PORT = process.env.PORT || 8080;
const router = require('./router')
const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
    console.log("We have a new connection!!!");

    socket.on('join', ({name, room}, callback) => {
        const {error, user} = addUser({ id: socket.id, name, room});

        if(error){
            return callback(error);
        }

        console.log("user from join", user, "Err", error)
        socket.emit('message', { user: 'admin', text: `${user.name} welcome to the room ${user.room}`});
        socket.broadcast.to(user.room).emit('message',{user: 'admin', text: `${user.name}, has joined!`})
        socket.join(user.room);

        io.to(user.room).emit('roomData',{room : user.room, users : getUserInRomm(user.room)})

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
       console.log("socket id", socket.id)
        const user = getUser(socket.id);
        console.log("user details", user)
        io.to(user.room).emit('message', { user: user.name, text: message});
        io.to(user.room).emit('roomData', { room: user.room, users : getUserInRomm(user.room)});


        callback();
    });
    socket.on('disconnect', () => {
        console.log("USER HAD LEFT")
        const user = removeUser(socket.id);

        if(user){
            io.to(user.room).emit('message', {user: 'admin', text: `${user.name} has left`})
        }
    })
})


app.use(router)
server.listen(PORT, () => console.log(`Serve has started on port ${PORT}`))