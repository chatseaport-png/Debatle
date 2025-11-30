/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Bind to all network interfaces
const port = process.env.PORT || 3000; // Use Railway's PORT or default to 3000
const TOTAL_ROUNDS = 5;

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
const privateLobbies = new Map();

const generateLobbyCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
};

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
          round: 1,
          totalRounds: TOTAL_ROUNDS,
          messagesPlayed: 0
        };
        
        activeMatches.set(matchId, match);
        
        // Notify both players
        io.to(opponent.socketId).emit('match-found', {
          matchId,
          opponent: { username, elo, icon, banner },
          yourSide: opponent.side,
          opponentSide: side,
          goesFirst: opponent.side === 'for',
          topicIndex,
          mode,
          type
        });
        
        io.to(socket.id).emit('match-found', {
          matchId,
          opponent: { username: opponent.username, elo: opponent.elo, icon: opponent.icon, banner: opponent.banner },
          yourSide: side,
          opponentSide: opponent.side,
          goesFirst: side === 'for',
          topicIndex,
          mode,
          type
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

    socket.on('create-private-lobby', ({
      mode = 'standard',
      side = 'for',
      username = 'Player',
      elo = 0,
      icon = '👤',
      banner = '#3b82f6'
    } = {}) => {
      const normalizedMode = mode === 'speed' ? 'speed' : 'standard';
      const normalizedSide = side === 'against' ? 'against' : 'for';

      for (const [code, lobby] of privateLobbies.entries()) {
        if (lobby.hostSocketId === socket.id) {
          privateLobbies.delete(code);
          socket.emit('private-lobby-cancelled', { code, reason: 'Replaced by a new lobby.' });
        }
      }

      let code = generateLobbyCode();
      while (privateLobbies.has(code)) {
        code = generateLobbyCode();
      }

      privateLobbies.set(code, {
        code,
        mode: normalizedMode,
        hostSide: normalizedSide,
        hostSocketId: socket.id,
        host: { username, elo, icon, banner },
        createdAt: Date.now()
      });

      console.log(`Private lobby created by ${username || 'Unknown'} (${socket.id}) with code ${code}`);

      socket.emit('private-lobby-created', {
        code,
        mode: normalizedMode,
        side: normalizedSide
      });
    });

    socket.on('cancel-private-lobby', ({ code }) => {
      if (typeof code !== 'string') return;

      const normalizedCode = code.trim().toUpperCase();
      const lobby = privateLobbies.get(normalizedCode);

      if (lobby && lobby.hostSocketId === socket.id) {
        privateLobbies.delete(normalizedCode);
        console.log(`Private lobby ${normalizedCode} cancelled by host ${socket.id}`);
        socket.emit('private-lobby-cancelled', { code: normalizedCode, reason: 'Cancelled by host.' });
      }
    });

    socket.on('join-private-lobby', ({
      code,
      mode,
      side = 'against',
      username = 'Player',
      elo = 0,
      icon = '👤',
      banner = '#3b82f6'
    } = {}) => {
      if (typeof code !== 'string') {
        socket.emit('private-lobby-error', { message: 'Invalid lobby code.' });
        return;
      }

      const normalizedCode = code.trim().toUpperCase();
      if (normalizedCode.length < 6) {
        socket.emit('private-lobby-error', { message: 'Lobby code must be six characters.' });
        return;
      }

      const lobby = privateLobbies.get(normalizedCode);
      if (!lobby) {
        socket.emit('private-lobby-error', { message: 'Lobby not found or already started.' });
        return;
      }

      if (lobby.hostSocketId === socket.id) {
        socket.emit('private-lobby-error', { message: 'You are already hosting this lobby.' });
        return;
      }

      const hostSocket = io.sockets.sockets.get(lobby.hostSocketId);
      if (!hostSocket) {
        privateLobbies.delete(normalizedCode);
        socket.emit('private-lobby-error', { message: 'Host disconnected. Lobby closed.' });
        return;
      }

      if (mode && mode !== lobby.mode) {
        socket.emit('private-lobby-error', { message: `Host configured this lobby for ${lobby.mode.toUpperCase()} mode.` });
        return;
      }

      const hostSide = lobby.hostSide;
      const requestedSide = side === 'for' ? 'for' : 'against';
      const guestSide = requestedSide === hostSide ? (hostSide === 'for' ? 'against' : 'for') : requestedSide;

      const matchId = `private-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const topicIndex = Math.floor(Math.random() * 1000000);

      const match = {
        id: matchId,
        mode: lobby.mode,
        type: 'practice',
        topicIndex,
        player1: { id: lobby.hostSocketId, username: lobby.host.username, side: hostSide },
        player2: { id: socket.id, username, side: guestSide },
        currentTurn: hostSide === 'for' ? lobby.hostSocketId : socket.id,
        messages: [],
        scores: { [lobby.hostSocketId]: 0, [socket.id]: 0 },
        round: 1,
        totalRounds: TOTAL_ROUNDS,
        messagesPlayed: 0,
        isPrivate: true
      };

      activeMatches.set(matchId, match);
      privateLobbies.delete(normalizedCode);

      socket.join(matchId);
      hostSocket.join(matchId);

      io.to(lobby.hostSocketId).emit('match-found', {
        matchId,
        opponent: { username, elo, icon, banner },
        yourSide: hostSide,
        opponentSide: guestSide,
        goesFirst: hostSide === 'for',
        topicIndex,
        mode: lobby.mode,
        type: 'practice',
        privateCode: normalizedCode
      });

      io.to(socket.id).emit('match-found', {
        matchId,
        opponent: { username: lobby.host.username, elo: lobby.host.elo, icon: lobby.host.icon, banner: lobby.host.banner },
        yourSide: guestSide,
        opponentSide: hostSide,
        goesFirst: guestSide === 'for',
        topicIndex,
        mode: lobby.mode,
        type: 'practice',
        privateCode: normalizedCode
      });

      console.log(`Private practice match created (${normalizedCode}): ${lobby.host.username || 'Host'} vs ${username || 'Guest'}`);
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

      if (match.messagesPlayed >= match.totalRounds * 2) {
        socket.emit('error', { message: 'Debate already completed' });
        return;
      }
      
      // Add message to match
      match.messages.push({
        sender: socket.id,
        text: message,
        time
      });

      match.messagesPlayed = (match.messagesPlayed || 0) + 1;
      const totalRounds = match.totalRounds || TOTAL_ROUNDS;
      const currentRound = Math.min(totalRounds, Math.ceil(match.messagesPlayed / 2));
      const roundCompleted = match.messagesPlayed % 2 === 0;
      const debateComplete = roundCompleted && currentRound >= totalRounds;
      
      // Switch turns
      match.currentTurn = socket.id === match.player1.id ? match.player2.id : match.player1.id;
      
      // Broadcast message to both players
      io.to(matchId).emit('opponent-message', {
        text: message,
        time,
        round: currentRound,
        roundCompleted,
        senderId: socket.id,
        totalRounds
      });

      if (debateComplete) {
        io.to(matchId).emit('debate-ended');
        activeMatches.delete(matchId);
        console.log(`Match completed: ${matchId}`);
        return;
      }
      
      // Notify turn change
      io.to(matchId).emit('turn-change', {
        currentTurn: match.currentTurn,
        round: roundCompleted ? Math.min(currentRound + 1, totalRounds) : currentRound,
        roundCompleted
      });
    });

    socket.on('turn-timeout', ({ matchId }) => {
      const match = activeMatches.get(matchId);
      if (!match) return;

      if (match.currentTurn !== socket.id) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }

      if (match.messagesPlayed >= match.totalRounds * 2) {
        socket.emit('error', { message: 'Debate already completed' });
        return;
      }

      match.messages.push({
        sender: socket.id,
        text: '',
        time: 0,
        timeout: true
      });

      match.messagesPlayed = (match.messagesPlayed || 0) + 1;
      const totalRounds = match.totalRounds || TOTAL_ROUNDS;
      const currentRound = Math.min(totalRounds, Math.ceil(match.messagesPlayed / 2));
      const roundCompleted = match.messagesPlayed % 2 === 0;
      const debateComplete = roundCompleted && currentRound >= totalRounds;

      match.currentTurn = socket.id === match.player1.id ? match.player2.id : match.player1.id;

      io.to(matchId).emit('turn-timeout', {
        senderId: socket.id,
        round: currentRound,
        roundCompleted,
        totalRounds
      });

      if (debateComplete) {
        io.to(matchId).emit('debate-ended');
        activeMatches.delete(matchId);
        console.log(`Match completed via timeout: ${matchId}`);
        return;
      }

      io.to(matchId).emit('turn-change', {
        currentTurn: match.currentTurn,
        round: roundCompleted ? Math.min(currentRound + 1, totalRounds) : currentRound,
        roundCompleted
      });
    });

    // End debate
    socket.on('end-debate', ({ matchId, forfeit = false } = {}) => {
      const match = activeMatches.get(matchId);
      if (!match) return;

      const opponentId = match.player1.id === socket.id ? match.player2.id : match.player1.id;
      const departureContext = {
        forfeit,
        beforeStart: (match.messagesPlayed || 0) === 0
      };

      if (forfeit && opponentId) {
        io.to(opponentId).emit('opponent-disconnected', departureContext);
      } else {
        io.to(matchId).emit('debate-ended');
      }

      activeMatches.delete(matchId);
      console.log(`Match ended: ${matchId}${forfeit ? ' (forfeit)' : ''}`);
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

      for (const [code, lobby] of privateLobbies.entries()) {
        if (lobby.hostSocketId === socket.id) {
          privateLobbies.delete(code);
          console.log(`Private lobby ${code} removed (host disconnected).`);
        }
      }
      
      // Handle active matches
      activeMatches.forEach((match, matchId) => {
        if (match.player1.id === socket.id || match.player2.id === socket.id) {
          const opponentId = match.player1.id === socket.id ? match.player2.id : match.player1.id;
          io.to(opponentId).emit('opponent-disconnected', {
            forfeit: true,
            beforeStart: (match.messagesPlayed || 0) === 0
          });
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
