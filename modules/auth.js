const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const DB_PATH = './data/db.json';

function readDB(){
  try { return JSON.parse(fs.readFileSync(DB_PATH)) } catch(e) { return { users: [], codes: [], trades: [], stocks: [] }; }
}
function writeDB(db){ fs.writeFileSync(DB_PATH, JSON.stringify(db, null,2)); }

module.exports = {
  register: (req,res) => {
    const db = readDB();
    const { username, password } = req.body;
    if(db.users.find(u=>u.username===username)) return res.status(400).json({error:'exists'});
    const user = { id: uuidv4(), username, password, balance: 1000000, holdings: {}, history: [] };
    db.users.push(user); writeDB(db);
    res.json({ ok:true, user });
  },

  login: (req,res) => {
    const db = readDB();
    const { username, password } = req.body;
    const u = db.users.find(x=>x.username===username && x.password===password);
    if(!u) return res.status(401).json({error:'invalid'});
    res.json({ ok:true, user: u });
  },

  getUser: (req,res) => {
    const db = readDB();
    const u = db.users.find(x=>x.id===req.params.id);
    if(!u) return res.status(404).json({error:'notfound'});
    res.json(u);
  },

  fakeDeposit: (req,res) => {
    // nạp giả theo code admin 1 lần, mỗi lần <=200000
    const { userId, amount, code } = req.body;
    const db = readDB();
    const c = db.codes.find(x=>x.code===code && !x.used);
    if(!c) return res.status(400).json({error:'invalid_or_used'});
    if(amount > 200000) return res.status(400).json({error:'limit'});
    const u = db.users.find(x=>x.id===userId);
    if(!u) return res.status(404).json({error:'user'});
    u.balance += amount;
    c.used = true;
    u.history.push({ type:'deposit', amount, at:Date.now(), note:'fake' });
    writeDB(db);
    res.json({ ok:true, user:u });
  }
};
