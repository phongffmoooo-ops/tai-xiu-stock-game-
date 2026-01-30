document.getElementById('revealAdmin').addEventListener('click', ()=>{
  const secret = document.getElementById('gitSecret').value.trim();
  if(secret === 'admindzvailon'){
    document.getElementById('adminPanel').style.display = 'block';
  } else { alert('Không hợp lệ'); }
});

document.getElementById('createCode').addEventListener('click', async ()=>{
  const pw1 = document.getElementById('pw1').value;
  const pw2 = document.getElementById('pw2').value;
  const code = document.getElementById('newCode').value;
  const days = parseInt(document.getElementById('days').value);
  const res = await fetch('/api/admin/create-code', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ pw1,pw2,code,days })});
  const j = await res.json(); alert(JSON.stringify(j));
});

document.getElementById('doStockAction').addEventListener('click', async ()=>{
  const pw1 = document.getElementById('pw1').value;
  const pw2 = document.getElementById('pw2').value;
  const stockId = document.getElementById('stockIdAdmin').value;
  const action = document.getElementById('actionStock').value;
  const res = await fetch('/api/admin/stock-action', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ pw1,pw2,stockId,action })});
  const j = await res.json(); alert(JSON.stringify(j));
});
