import http from 'http';
import { app } from './app.js';
import createDebug from 'debug';
import { dbConnect } from './db/db.connect.js';
import { Server } from 'socket.io';
const debug = createDebug('FinalMeme:Server');

const PORT = process.env.PORT || 4444;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
});

app.locals.io = io;

io.on('connection', (socket) => {
  debug('New client connected');
  socket.on('disconnect', () => {
    debug('Client disconnected');
  });
});

dbConnect()
  .then((mongoose) => {
    server.listen(PORT);
    debug('Connected to db : ' + mongoose.connection.db.databaseName);
  })
  .catch((error) => {
    server.emit('error', error);
  });

server.on('listening', () => {
  debug('Listening on port ' + PORT);
});
