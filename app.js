const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');

const { PORT } = require('./constants/config');

const {
  addUser,
  getUserInfo,
  removeUser,
  getUsersInRoom,
  getBroadcaster,
  toggleBroadcaster,
} = require('./utils/utils');
const getTime = require('./utils/getTime');

// const limiter = require('./middlewares/rateLimiter');
const router = require('./routes/router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
// let broadcaster;

// security headers
app.use(helmet());

// limit of users connections
// app.use(limiter);

// socket.io handlers
io.on('connection', (socket) => {
  socket.on('join', ({ name, room }, callback) => {
    const { user, error } = addUser(name, room, socket.id);

    if (error) {
      callback(error);
    } else {
      socket.join(user.room);

      const broadcaster = getBroadcaster(false, room);

      if (broadcaster) {
        io.to(socket.id).emit('broadcaster', broadcaster.name, broadcaster.id);
      }

      const usersInRoom = getUsersInRoom(room);

      io.to(room).emit('sendUsers', usersInRoom);
    }
  });

  socket.on('sendMessage', ({ message: msg, time }, callback) => {
    const currentUser = getUserInfo(socket);

    io.to(currentUser.room).emit('newMessage', {
      msg,
      name: currentUser.name,
      time,
    });
    callback();
  });

  // Video Stream Handlers
  socket.on('broadcaster', () => {
    const currentUser = toggleBroadcaster(socket);

    socket
      .to(currentUser.room)
      .broadcast.emit('broadcaster', currentUser.name, currentUser.id);

    io.to(currentUser.room).emit('newMessage', {
      msg: `${currentUser.name} начал прямую трансляцию.`,
      name: 'Admin',
      time: getTime(),
    });
  });
  socket.on('watcher', (id) => {
    socket.to(id).emit('watcher', socket.id);
  });
  socket.on('offer', (id, message) => {
    socket.to(id).emit('offer', socket.id, message);
  });
  socket.on('answer', (id, message) => {
    socket.to(id).emit('answer', socket.id, message);
  });
  socket.on('candidate', (id, message) => {
    socket.to(id).emit('candidate', socket.id, message);
  });

  socket.on('broadcastOff', () => {
    const currentUser = toggleBroadcaster(socket);
    io.to(currentUser.room).emit('broadcastOff');

    io.to(currentUser.room).emit('newMessage', {
      msg: `${currentUser.name} закончил прямую трансляцию.`,
      name: 'Admin',
      time: getTime(),
    });
  });

  socket.on('disconnect', () => {
    if (getUserInfo(socket)) {
      const { room } = getUserInfo(socket);

      removeUser(socket);
      const usersInRoom = getUsersInRoom(room);
      io.to(room).emit('sendUsers', usersInRoom);
    }
  });
});

app.use(cors());

app.use(router);

server.listen(PORT, () => console.log(`App listened on port ${PORT}`));
