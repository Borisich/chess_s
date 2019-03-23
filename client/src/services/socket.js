var io = require("socket.io-client");

const HOST_URL = process.env.HOST_URL;

var socket = io(HOST_URL);

module.exports = socket;
