/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Bind to all network interfaces
const port = process.env.PORT || 3000; // Use Railway's PORT or default to 3000

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Matchmaking queues - separated by type (ranked/practice) and mode
const matchmakingQueue = {
  ranked: {
    speed: [],
    standard: []
  },
  practice: {
    speed: [],
    standard: []
  }
};

// Active matches
const activeMatches = new Map();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join matchmaking queue
    socket.on('join-queue', ({ mode, side, username, type = 'practice', elo = 0, icon = '👤', banner = '#3b82f6' }) => {
      console.log(`${username} (${elo} ELO) joined ${type} ${mode} queue (${side} side)`);
      
      const queue = matchmakingQueue[type][mode];
      
      // Check if there's someone waiting in the same type/mode with OPPOSITE side
      const opposingSide = side === 'for' ? 'against' : 'for';
      const opponentIndex = queue.findIndex(p => p.side === opposingSide);
      
      if (opponentIndex !== -1) {
        // Found an opponent with opposite side
        const opponent = queue.splice(opponentIndex, 1)[0];
        const matchId = `match-${Date.now()}`;
        
        // Generate a random topic index that both players will use
        const topicIndex = Math.floor(Math.random() * 1000000);
        
        // Create match
        const match = {
          id: matchId,
          mode,
          type,
          topicIndex,
          player1: { id: opponent.socketId, username: opponent.username, side: opponent.side },
          player2: { id: socket.id, username, side },
          currentTurn: opponent.side === 'for' ? opponent.socketId : socket.id,
          messages: [],
          scores: { [opponent.socketId]: 0, [socket.id]: 0 },
          round: 0
        };
        
        activeMatches.set(matchId, match);
        
        // Notify both players
        io.to(opponent.socketId).emit('match-found', {
          matchId,
          opponent: { username, elo, icon, banner },
          yourSide: opponent.side,
          opponentSide: side,
          goesFirst: opponent.side === 'for',
          topicIndex
        });
        
        io.to(socket.id).emit('match-found', {
          matchId,
          opponent: { username: opponent.username, elo: opponent.elo, icon: opponent.icon, banner: opponent.banner },
          yourSide: side,
          opponentSide: opponent.side,
          goesFirst: side === 'for',
          topicIndex
        });
        
        // Join both to match room
        socket.join(matchId);
        io.sockets.sockets.get(opponent.socketId)?.join(matchId);
        
        console.log(`${type} match created: ${matchId} - ${opponent.username} (${opponent.side}) vs ${username} (${side})`);
      } else {
        // Add to queue - no opponent with opposite side found yet
        queue.push({ socketId: socket.id, username, side, type, elo, icon, banner });
        socket.emit('queue-status', { position: queue.length });
      }
    });

    // Leave queue
    socket.on('leave-queue', ({ mode, type = 'practice' }) => {
      const queue = matchmakingQueue[type]?.[mode];
      if (queue) {
        const index = queue.findIndex(p => p.socketId === socket.id);
        if (index !== -1) {
          queue.splice(index, 1);
          console.log('User left queue:', socket.id);
        }
      }
    });

    // Send message in debate
    socket.on('send-message', ({ matchId, message, time }) => {
      const match = activeMatches.get(matchId);
      if (!match) return;
      
      // Verify it's this player's turn
      if (match.currentTurn !== socket.id) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }
      
      // Add message to match
      match.messages.push({
        sender: socket.id,
        text: message,
        time
      });
      
      // Switch turns
      match.currentTurn = socket.id === match.player1.id ? match.player2.id : match.player1.id;
      match.round++;
      
      // Broadcast message to both players
      io.to(matchId).emit('opponent-message', {
        text: message,
        time,
        round: match.round,
        senderId: socket.id
      });
      
      // Notify turn change
      io.to(matchId).emit('turn-change', {
        currentTurn: match.currentTurn
      });
    });

    // End debate
    socket.on('end-debate', ({ matchId }) => {
      const match = activeMatches.get(matchId);
      if (match) {
        io.to(matchId).emit('debate-ended');
        activeMatches.delete(matchId);
        console.log(`Match ended: ${matchId}`);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Remove from all queues (ranked and practice)
      Object.values(matchmakingQueue).forEach(typeQueues => {
        Object.values(typeQueues).forEach(queue => {
          const index = queue.findIndex(p => p.socketId === socket.id);
          if (index !== -1) queue.splice(index, 1);
        });
      });
      
      // Handle active matches
      activeMatches.forEach((match, matchId) => {
        if (match.player1.id === socket.id || match.player2.id === socket.id) {
          const opponentId = match.player1.id === socket.id ? match.player2.id : match.player1.id;
          io.to(opponentId).emit('opponent-disconnected');
          activeMatches.delete(matchId);
        }
      });
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
