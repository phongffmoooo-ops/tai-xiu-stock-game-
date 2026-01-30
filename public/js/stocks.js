const socketS = io();
const stocksDiv = document.getElementById('stocks-table');

function renderStocks(stocks){
  let html = '<table border="1"><tr><th>ID</th><th>Name</th><th>Price</th><th>Available</th></tr>';
  stocks.forEach(s=>{
    html += `<tr><td>${s.id}</td><td>${s.name}</td><td>${(s.price).toLocaleString()}</td><td>${s.available}</td></tr>`;
  });
  html += '</table>';
  stocksDiv.innerHTML = html;
}

socketS.on('connect', ()=>{ socketS.emit('stocks:request'); });
socketS.on('stocks:update', (data)=>{ renderStocks(data.stocks); });

document.getElementById('buyBtn').addEventListener('click', async ()=>{
  const stockId = document.getElementById('stockId').value;
  const qty = parseInt(document.getElementById('stockQty').value);
  // demo user
  const res = await fetch('/api/buy-stock', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId:'demo-user', stockId, qty }) });
  const j = await res.json();
  alert(JSON.stringify(j));
});

document.getElementById('sellBtn').addEventListener('click', async ()=>{
  const stockId = document.getElementById('sellStockId').value;
  const qty = parseInt(document.getElementById('sellQty').value);
  const res = await fetch('/api/sell-stock', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId:'demo-user', stockId, qty }) });
  const j = await res.json();
  alert(JSON.stringify(j));
});
