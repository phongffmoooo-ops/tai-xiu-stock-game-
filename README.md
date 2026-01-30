# Tài Xỉu + Cổ phiếu - Prototype

Yêu cầu: Node.js >= 14

Cài:
1. git clone ... (hoặc dán thư mục)
2. cd tai-xiu-stock-game
3. npm install
4. npm start
5. Mở http://localhost:3000

Admin secret hiển thị khi nhập mã: admindzvailon (trong trang Admin). 
Mật khẩu admin để thao tác: pw1 = 0987654321, pw2 = zxcvbnm

Ghi chú:
- Thời gian xúc: 3 phút (module dice.js)
- Tick cổ phiếu: 5 phút (module stocks.js)
- AI trade cycle: 10 phút (ai-manager.js)
- Nạp giả: chỉ <= 200k, dùng mã admin do admin tạo 1 lần rồi bị mark used.

Production:
- Thay in-memory/file -> DB (Postgres/Mongo)
- Thêm xác thực JWT, HTTPS, input validation.
