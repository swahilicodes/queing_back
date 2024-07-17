const socketSetup = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });

    // Example socket event
    socket.on('new_post', (data) => {
      console.log('New post received:', data);
      // Broadcast new post to all connected clients
      socket.broadcast.emit('new_post', data);
    });
  });
};

module.exports = socketSetup
