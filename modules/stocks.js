const fs = require('fs');
const DB_PATH = './data/db.json';
const TICK_MS = 5*60*1000; // default 5 phút (config)
let ioGlobal;

function readDB(){ try { return JSON.parse(fs.readFileSync(DB_PATH)) } catch(e){ return { users: [], codes: [], trades: [], stocks: [] }; } }
function writeDB(db){ fs.writeFileSync(DB_PATH, JSON.stringify(db, null,2)); }

function randomPercentChange(){
  // tăng 20% xác suất tăng 20% như bạn yêu cầu: 20% up, 80% down
  const r = Math.random();
  if(r < 0.20) return (1 + (0.05 + Math.random()*0.15)); // up between +5%..+20%
  return (1 - (0.01 + Math.random()*0.20)); // down between -1%..-21%
}

module.exports = {
  init: (io) => {
    ioGlobal = io;
    // initialize data if not exist
    const db = readDB();
    if(!db.stocks || db.stocks.length < 10){
      // create 10 stocks
      db.stocks = [];
      for(let i=1;i<=12;i++){
        db.stocks.push({
          id: 'STK'+i,
          name: 'Cổ phiếu '+i,
          price: 500000000 + i*10000000, // >= 500 triệu
          available: 100, // total 100 shares
          owners: {} // userId -> qty
        });
      }
      writeDB(db);
    }
    // start ticker
    setInterval(()=>{ module.exports.tick() }, TICK_MS);
  },

  getStocks: (req,res) => {
    const db = readDB();
    res.json(db.stocks);
  },

  buyStock: (req,res) => {
    // body: { userId, stockId, qty }
    const { userId, stockId, qty } = req.body;
    const db = readDB();
    const user = db.users.find(u=>u.id===userId);
    const stock = db.stocks.find(s=>s.id===stockId);
    if(!user || !stock) return res.status(400).json({error:'invalid'});
    if(qty < 30) return res.status(400).json({error:'min30'});
    if(qty > stock.available) return res.status(400).json({error:'not_enough'});
    // check user had not bought this stock before (one-time buy rule)
    if((user.holdings && user.holdings[stockId] && user.holdings[stockId] > 0)) return res.status(400).json({error:'one_time_only'});
    const cost = stock.price * qty;
    if(user.balance < cost) return res.status(400).json({error:'no_money'});
    user.balance -= cost;
    user.holdings = user.holdings || {};
    user.holdings[stockId] = (user.holdings[stockId]||0) + qty;
    stock.available -= qty;
    // record ownership
    stock.owners[userId] = (stock.owners[userId] || 0) + qty;
    db.trades.push({ type:'buy', userId, stockId, qty, price: stock.price, at: Date.now() });
    writeDB(db);
    ioGlobal.emit('stocks:update', { stocks: db.stocks });
    res.json({ ok:true, user, stock });
  },

  sellStock: (req,res) => {
    const { userId, stockId, qty } = req.body;
    const db = readDB();
    const user = db.users.find(u=>u.id===userId);
    const stock = db.stocks.find(s=>s.id===stockId);
    if(!user || !stock) return res.status(400).json({error:'invalid'});
    if(!user.holdings || (user.holdings[stockId]||0) < qty) return res.status(400).json({error:'not_owned'});
    // on sell: add money equal to current price * qty
    const revenue = stock.price * qty;
    user.balance += revenue;
    user.holdings[stockId] -= qty;
    stock.available += qty;
    stock.owners[userId] = (stock.owners[userId]||0) - qty;
    if(stock.owners[userId] <= 0) delete stock.owners[userId];
    db.trades.push({ type:'sell', userId, stockId, qty, price: stock.price, at: Date.now() });
    writeDB(db);
    ioGlobal.emit('stocks:update', { stocks: db.stocks });
    res.json({ ok:true, user, stock });
  },

  tick: () => {
    // change stock prices each tick
    const db = readDB();
    db.stocks.forEach(s=>{
      const factor = randomPercentChange();
      s.price = Math.max(500000000, Math.floor(s.price * factor));
      // when decreased, owners' net worth decreases (we track via balance/holdings so no direct subtraction)
      // If price change negative we do not auto-change user balance; only on sell we compute based on current price
    });
    writeDB(db);
    if(ioGlobal) ioGlobal.emit('stocks:update', { stocks: db.stocks });
  },

  setupSocket: (socket, io) => {
    // client can request stocks via socket
    socket.on('stocks:request', ()=>{
      const db = readDB();
      socket.emit('stocks:update', { stocks: db.stocks });
    });
  }
};
