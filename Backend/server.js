const http = require('http');
const app = require('./app');
const port = 4005;

const server = http.createServer(app);
const { initSocket } = require('./services/socket.service');
initSocket(server);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});