const fs = require('fs');
const DB_PATH = './data/db.json';

function readDB(){ try { return JSON.parse(fs.readFileSync(DB_PATH)) } catch(e){ return { users: [], codes: [], trades: [], stocks: [] }; } }
function writeDB(db){ fs.writeFileSync(DB_PATH, JSON.stringify(db, null,2)); }

let ioRef;

module.exports = {
  init: (io) => {
    ioRef = io;
    // create AI users if not exist
    const db = readDB();
    if(!db.users.some(u=>u.username==='AI_BANKER')) {
      db.users.push({ id: 'AI_BANKER', username:'AI_BANKER', password:'ai', balance: 1000000000, holdings:{}, history:[] });
    }
    // create some AI players
    for(let i=1;i<=3;i++){
      if(!db.users.some(u=>u.username===`AI_PLAYER_${i}`)){
        db.users.push({ id: `AI_PLAYER_${i}`, username:`AI_PLAYER_${i}`, password:'ai', balance: 500000000, holdings:{}, history:[] });
      }
    }
    writeDB(db);

    // AI action cycles: every 10 minutes buy/sell
    setInterval(()=>{ module.exports.aiTradeCycle() }, 10*60*1000);
    // small initial warmup: do a faster first run for demo
    setTimeout(()=>{ module.exports.aiTradeCycle() }, 5000);
  },

  setupSocket: (socket, io) => {
    // nothing socket-specific for now
  },

  aiTradeCycle: () => {
    const db = readDB();
    const ais = db.users.filter(u=>u.username.startsWith('AI_'));
    db.stocks.forEach(stock=>{
      // simple strategy: AI_BANKER may buy good stocks, others random
    });
    ais.forEach(ai=>{
      // choose random stock
      const stock = db.stocks[Math.floor(Math.random()*db.stocks.length)];
      if(!stock) return;
      // if ai has none and stock.available >=30 and ai.balance enough, buy 30..min(available,100)
      if((ai.holdings && ai.holdings[stock.id]) > 0) {
        // maybe sell randomly
        if(Math.random() < 0.3){
          const qty = Math.min( ai.holdings[stock.id], Math.floor(Math.random()*ai.holdings[stock.id]) + 1 );
          ai.balance += stock.price * qty;
          ai.holdings[stock.id] -= qty;
          stock.available += qty;
        }
      } else {
        if(stock.available >= 30 && Math.random() < 0.5){
          const qty = Math.min( stock.available, 30 + Math.floor(Math.random()*40) );
          const cost = qty * stock.price;
          if(ai.balance >= cost){
            ai.balance -= cost;
            ai.holdings = ai.holdings || {};
            ai.holdings[stock.id] = (ai.holdings[stock.id]||0) + qty;
            stock.available -= qty;
          }
        }
      }
    });
    writeDB(db);
    if(ioRef) ioRef.emit('stocks:update', { stocks: db.stocks });
  }
};
