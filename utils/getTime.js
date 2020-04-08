module.exports = () =>
  `${new Date().getHours()}:${
    new Date().getMinutes() < 10 ? '0' : ''
  }${new Date().getMinutes()}`;
