// public/js/app.js
// Quản lý đăng nhập/đăng ký đơn giản, hiển thị balance, nạp giả (code admin)
// Lưu user vào localStorage để dùng xuyên các trang
(function(){
  const root = document.getElementById('app-root');

  function api(path, opts){
    return fetch(path, Object.assign({ headers: {'Content-Type':'application/json'} }, opts)).then(r=>r.json());
  }

  function getStoredUser(){
    try { return JSON.parse(localStorage.getItem('tx_user')); } catch(e){ return null; }
  }
  function storeUser(u){
    localStorage.setItem('tx_user', JSON.stringify(u));
  }
  function clearUser(){
    localStorage.removeItem('tx_user');
  }

  async function refreshUserFromServer(){
    const u = getStoredUser();
    if(!u) return null;
    try{
      const res = await api('/api/user/' + encodeURIComponent(u.id));
      if(res && !res.error){ storeUser(res); return res; }
    }catch(e){}
    return u;
  }

  function render(){
    const user = getStoredUser();
    if(user){
      renderUserPanel(user);
    } else {
      renderAuth();
    }
  }

  function renderAuth(){
    root.innerHTML = `
      <div class="auth">
        <h3>Đăng nhập</h3>
        <label>Username <input id="loginUser" /></label><br/>
        <label>Password <input id="loginPass" type="password" /></label><br/>
        <button id="btnLogin">Login</button>

        <h3>Đăng ký</h3>
        <label>Username <input id="regUser" /></label><br/>
        <label>Password <input id="regPass" type="password" /></label><br/>
        <button id="btnRegister">Register</button>

        <hr/>
        <p>Hoặc dùng user demo (không cần server): <button id="btnDemo">Dùng Demo</button></p>
      </div>
    `;
    document.getElementById('btnLogin').onclick = async ()=>{
      const username = document.getElementById('loginUser').value.trim();
      const password = document.getElementById('loginPass').value;
      if(!username || !password){ alert('Nhập thông tin'); return; }
      const res = await api('/api/login', { method:'POST', body: JSON.stringify({ username, password }) });
      if(res && res.ok){ storeUser(res.user); await refreshUserFromServer(); render(); }
      else alert('Login lỗi: ' + (res.error || JSON.stringify(res)));
    };
    document.getElementById('btnRegister').onclick = async ()=>{
      const username = document.getElementById('regUser').value.trim();
      const password = document.getElementById('regPass').value;
      if(!username || !password){ alert('Nhập thông tin'); return; }
      const res = await api('/api/register', { method:'POST', body: JSON.stringify({ username, password }) });
      if(res && res.ok){ storeUser(res.user); render(); }
      else alert('Register lỗi: ' + (res.error || JSON.stringify(res)));
    };
    document.getElementById('btnDemo').onclick = ()=>{
      const demo = { id:'demo-user', username:'demo', balance:1000000, holdings: {} };
      storeUser(demo); render();
    };
  }

  function renderUserPanel(user){
    const nav = `
      <div class="user-panel">
        <div>Xin chào <strong>${user.username}</strong> - Số dư: <span id="uiBalance">${(user.balance||0).toLocaleString()}</span></div>
        <div>
          <a href="/game-dice.html" target="_self">Chơi Tài Xỉu</a> |
          <a href="/game-stocks.html" target="_self">Chơi Cổ phiếu</a> |
          <a href="/admin.html" target="_self">Admin</a>
        </div>
        <div style="margin-top:8px;">
          <button id="btnRefreshUser">Làm mới thông tin</button>
          <button id="btnLogout">Đăng xuất</button>
        </div>

        <hr/>
        <div>
          <h4>Nạp giả (dư tối đa 200k, cần code admin)</h4>
          <label>Code: <input id="depositCode" /></label>
          <label>Amount: <input id="depositAmt" type="number" value="200000" /></label>
          <button id="btnDeposit">Nạp</button>
        </div>

        <hr/>
        <div>
          <h4>Lịch sử & Holdings (demo)</h4>
          <pre id="userData">${JSON.stringify(user, null, 2)}</pre>
        </div>
      </div>
    `;
    root.innerHTML = nav;

    document.getElementById('btnLogout').onclick = ()=>{
      clearUser(); render();
    };
    document.getElementById('btnRefreshUser').onclick = async ()=>{
      const updated = await refreshUserFromServer();
      if(updated) render();
      else alert('Không lấy được thông tin từ server');
    };
    document.getElementById('btnDeposit').onclick = async ()=>{
      const code = document.getElementById('depositCode').value.trim();
      let amount = parseInt(document.getElementById('depositAmt').value || '0');
      if(!code || !amount){ alert('Nhập code và số tiền'); return; }
      if(amount > 200000){ alert('Giới hạn nạp 200k'); return; }
      const user = getStoredUser();
      if(!user){ alert('Đăng nhập lại'); return; }
      const res = await api('/api/deposit', { method:'POST', body: JSON.stringify({ userId: user.id, amount, code }) });
      if(res && res.ok){
        // update local user object
        await refreshUserFromServer();
        render();
        alert('Nạp thành công');
      } else {
        alert('Lỗi nạp: ' + (res.error || JSON.stringify(res)));
      }
    };

    // update userData block
    const upd = async ()=>{
      const u = await refreshUserFromServer();
      document.getElementById('uiBalance').innerText = (u.balance||0).toLocaleString();
      document.getElementById('userData').innerText = JSON.stringify(u, null, 2);
    };
    upd();
  }

  // init
  (async function init(){
    // Try refresh stored user from server
    await refreshUserFromServer();
    render();
  })();
})();
