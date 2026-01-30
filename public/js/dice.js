const socket = io();

// simple demo user (in real: use login)
let currentUser = { id: 'demo-user', username: 'demo', balance: 1000000 };
document.getElementById('bal').innerText = currentUser.balance;

let currentRoundId = null;

document.getElementById('shakeBtn').addEventListener('click', ()=> {
  socket.emit('dice:createRound', { userId: currentUser.id });
});

socket.on('dice:roundCreated', (round) => {
  currentRoundId = round.id;
  document.getElementById('roundInfo').innerText = 'Vòng mới: ' + round.id;
  // start local 3-minute timer
  // disable reveal until server locked
  document.getElementById('revealBtn').disabled = true;
});

socket.on('dice:roundLocked', (data)=>{
  if(data.state === 'covered'){
    document.getElementById('roundInfo').innerText = 'Đã xúc xong — chén đã úp. Bấm "Mở chén" để xem kết quả.';
    document.getElementById('revealBtn').disabled = false;
    // animate chén (show covered)
    document.getElementById('dice-face').innerText = '🔒';
  }
});

document.getElementById('revealBtn').addEventListener('click', ()=>{
  socket.emit('dice:reveal', { roundId: currentRoundId, userId: currentUser.id });
});

socket.on('dice:revealed', ({ roundId, result })=>{
  if(roundId === currentRoundId){
    document.getElementById('dice-face').innerText = result.dice.join(' - ');
    document.getElementById('roundInfo').innerText = 'Kết quả: ' + result.result + ' (Tổng '+result.total+')';
  }
});

// bets
document.getElementById('betTai').addEventListener('click', ()=>{
  const amount = parseInt(document.getElementById('betAmount').value);
  socket.emit('dice:placeBet', { roundId: currentRoundId, userId: currentUser.id, side:'tai', amount });
});
document.getElementById('betXiu').addEventListener('click', ()=>{
  const amount = parseInt(document.getElementById('betAmount').value);
  socket.emit('dice:placeBet', { roundId: currentRoundId, userId: currentUser.id, side:'xiu', amount });
});
