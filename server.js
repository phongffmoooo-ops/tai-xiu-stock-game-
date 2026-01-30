const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const auth = require('./modules/auth');
const dice = require('./modules/dice');
const stocks = require('./modules/stocks');
const aiManager = require('./modules/ai-manager');
const admin = require('./modules/admin');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// REST endpoints (auth, admin, stock actions)
app.post('/api/login', auth.login);
app.post('/api/register', auth.register);
app.post('/api/deposit', auth.fakeDeposit); // nạp giả dưới 200k
app.get('/api/user/:id', auth.getUser);
app.get('/api/stocks', stocks.getStocks);
app.post('/api/buy-stock', stocks.buyStock);
app.post('/api/sell-stock', stocks.sellStock);
app.post('/api/admin/create-code', admin.createCode);
app.post('/api/admin/cancel-code', admin.cancelCode);
app.post('/api/admin/stock-action', admin.stockAction);

// sockets for game + realtime updates
io.on('connection', (socket) => {
  console.log('client connected', socket.id);
  dice.setupSocket(socket, io);
  stocks.setupSocket(socket, io);
  aiManager.setupSocket(socket, io);
});

// init managers
stocks.init(io); // start stock tickers
aiManager.init(io); // start AI cycles

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
