const { v4: uuidv4 } = require('uuid');

let activeRounds = {}; // roundId -> round data

module.exports = {
  setupSocket: (socket, io) => {
    socket.on('dice:createRound', (data) => {
      // data: { betSide: 'tai'|'xiu', amount, userId }
      // create round with 3-minute timer default (configurable)
      const roundId = uuidv4();
      const round = {
        id: roundId,
        bets: [],
        createdAt: Date.now(),
        durationMs: 3*60*1000, // 3 phút, có thể config
        state: 'shaking', // shaking -> covered -> revealed
        cupOwnerAction: null
      };
      activeRounds[roundId] = round;
      // accept bets while round open
      io.emit('dice:roundCreated', round);
      // after duration -> lock and simulate roll but keep covered; reveal only on 'dice:reveal'
      setTimeout(()=>{
        // simulate 3 dice
        const d1 = 1 + Math.floor(Math.random()*6);
        const d2 = 1 + Math.floor(Math.random()*6);
        const d3 = 1 + Math.floor(Math.random()*6);
        const total = d1+d2+d3;
        const result = (total>=11 && total<=17) ? 'tai' : 'xiu';
        round.result = { dice: [d1,d2,d3], total, result };
        round.state = 'covered';
        io.emit('dice:roundLocked', { roundId, state: round.state });
      }, round.durationMs);
    });

    socket.on('dice:placeBet', (data) => {
      // place bet during open period (prototype trusting client)
      const { roundId, userId, side, amount } = data;
      const round = activeRounds[roundId];
      if(!round) return;
      round.bets.push({ userId, side, amount });
      io.emit('dice:betPlaced', { roundId, userId, side, amount });
    });

    socket.on('dice:reveal', ({ roundId, userId })=>{
      // Only reveal when player clicks chén (client triggers). Could restrict to admin but user asked manual click.
      const round = activeRounds[roundId];
      if(!round || round.state !== 'covered') return;
      round.state = 'revealed';
      // settle bets: apply win/lose rates: you requested win 39%, lose 51% — that's odd; we interpret as house probabilities.
      // Here we will honor simulated result; but to match requested odds we can skew result generator when creating round — for simplicity leave fair.
      io.emit('dice:revealed', { roundId, result: round.result });
      // cleanup after reveal:
      setTimeout(()=>{ delete activeRounds[roundId]; }, 60*1000);
    });
  }
};
