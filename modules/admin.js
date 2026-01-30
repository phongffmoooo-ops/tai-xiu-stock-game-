const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const DB_PATH = './data/db.json';
function readDB(){ try { return JSON.parse(fs.readFileSync(DB_PATH)) } catch(e){ return { users: [], codes: [], trades: [], stocks: [] }; } }
function writeDB(db){ fs.writeFileSync(DB_PATH, JSON.stringify(db, null,2)); }

const ADMIN_PW1 = '0987654321';
const ADMIN_PW2 = 'zxcvbnm';

module.exports = {
  createCode: (req,res) => {
    const { pw1, pw2, code, days } = req.body;
    if(pw1 !== ADMIN_PW1 || pw2 !== ADMIN_PW2) return res.status(403).json({error:'auth'});
    const db = readDB();
    db.codes = db.codes || [];
    db.codes.push({ code, days, used:false, createdAt:Date.now() });
    writeDB(db);
    res.json({ ok:true });
  },

  cancelCode: (req,res) => {
    const { pw1, pw2, code } = req.body;
    if(pw1 !== ADMIN_PW1 || pw2 !== ADMIN_PW2) return res.status(403).json({error:'auth'});
    const db = readDB();
    const idx = (db.codes||[]).findIndex(c=>c.code===code);
    if(idx >= 0) { db.codes.splice(idx,1); writeDB(db); res.json({ ok:true }); }
    else res.status(404).json({ error:'notfound' });
  },

  stockAction: (req,res) => {
    // body: { pw1, pw2, stockId, action: 'increase'|'decrease'|'bankrupt', amount }
    const { pw1, pw2, stockId, action } = req.body;
    if(pw1 !== ADMIN_PW1 || pw2 !== ADMIN_PW2) return res.status(403).json({error:'auth'});
    const db = readDB();
    const s = db.stocks.find(x=>x.id===stockId);
    if(!s) return res.status(404).json({error:'stock'});
    if(action === 'bankrupt'){
      // owners lose 200 triệu
      Object.keys(s.owners || {}).forEach(uid=>{
        const user = db.users.find(u=>u.id===uid);
        if(user) user.balance -= 200000000;
        // remove holdings
        if(user && user.holdings && user.holdings[stockId]) user.holdings[stockId] = 0;
      });
      s.price = 0;
      s.available = 0;
      s.owners = {};
    } else if(action === 'increase'){
      s.price = Math.floor(s.price * 1.20);
    } else if(action === 'decrease'){
      s.price = Math.max(1, Math.floor(s.price * 0.8));
    }
    writeDB(db);
    res.json({ ok:true, stock: s });
  }
};
