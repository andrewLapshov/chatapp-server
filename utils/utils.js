// functions to handle users connections/disconnections

const { USER_EXISTS } = require('../constants/constants');

const users = [];

const addUser = (name, room, id) => {
  const existingUser = users.find(
    (user) => user.name === name && user.room === room
  );

  if (existingUser) return { error: USER_EXISTS };

  const user = { name, room, id };
  users.push(user);

  return { user };
};

const getUserInfo = (socket) => users.find((user) => user.id === socket.id);

const removeUser = (socket) => {
  const userIndex = users.findIndex((user) => user.id === socket.id);
  if (userIndex !== -1) {
    users.splice(userIndex, 1);
  }
};

const getUsersInRoom = (room) => users.filter((user) => user.room === room);

module.exports = {
  addUser,
  getUserInfo,
  removeUser,
  getUsersInRoom,
};
