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
} = require('./utils/utils');

const limiter = require('./middlewares/rateLimiter');
const router = require('./routes/router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(helmet());
app.use(limiter);

io.on('connection', (socket) => {
  socket.on('join', ({ name, room }, callback) => {
    const { user, error } = addUser(name, room, socket.id);

    if (error) {
      callback(error);
    } else {
      socket.join(user.room);
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
