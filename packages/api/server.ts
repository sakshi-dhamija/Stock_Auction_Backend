import app from './src/app';
import { SocketService } from './src/services/SocketService';
import { initMarket } from './src/util/Methods';
import { createServer } from 'http';

const server = createServer(app);
const socketService = new SocketService(server);

initMarket(socketService);

server.listen(3000);