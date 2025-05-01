Dưới đây là bản dịch tiếng Việt cho tài liệu README của **R2Money-Auto-Bot**:

---

# R2Money-Auto-Bot

Một bot tự động để tương tác với giao thức R2 Money trên mạng thử nghiệm Sepolia. Bot này cho phép người dùng thực hiện hoán đổi giữa token USDC và R2USD, cũng như stake R2USD để nhận về token sR2USD.

## Tính Năng

- Hoán đổi USDC sang R2USD  
- Hoán đổi R2USD sang USDC  
- Stake R2USD để nhận sR2USD  
- Kiểm tra số dư các token  
- Hỗ trợ nhiều ví cùng lúc  
- Hỗ trợ proxy để luân chuyển IP  

## Yêu Cầu Trước Khi Sử Dụng

- Node.js phiên bản 16 trở lên  
- Ví Ethereum với private key  
- ETH trên mạng Sepolia để trả phí gas  
- Token USDC trên Sepolia  

## Cài Đặt

1. Clone repository:
```bash
git clone https://github.com/Zack914/R2-Testnet-Autobot.git
cd R2-Testnet-Autobot
```

2. Cài đặt các thư viện cần thiết:
```bash
npm install
```

3. Chỉnh sửa file `.env` với private key của bạn:
```
PRIVATE_KEY_1=nhập_private_key_tại_đây
PRIVATE_KEY_2=private_key_khác_nếu_có
# Thêm nhiều key nếu cần
```

4. (Tùy chọn) Tạo file `proxies.txt` với danh sách proxy của bạn (mỗi dòng một proxy):
```
http://username:password@host:port
http://host:port
```

## Cách Sử Dụng

Chạy bot bằng lệnh:

```bash
node index.js
```

Thực hiện theo menu tương tác để:
1. Hoán đổi USDC sang R2USD  
2. Hoán đổi R2USD sang USDC  
3. Stake R2USD để nhận sR2USD  
4. Kiểm tra số dư  
5. Thoát chương trình  

## Địa Chỉ Token (Sepolia)

- **USDC**: `0xef84994ef411c4981328ffce5fda41cd3803fae4`  
- **R2USD**: `0x20c54c5f742f123abb49a982bfe0af47edb38756`  
- **sR2USD**: `0xbd6b25c4132f09369c354bee0f7be777d7d434fa`  

## Ghi Chú Bảo Mật

- Bot này yêu cầu bạn cung cấp private key. **Không bao giờ chia sẻ private key của bạn với bất kỳ ai.**  
- Chỉ sử dụng bot này trên testnet Sepolia.  
- Luôn kiểm tra mã nguồn trước khi chạy với private key của bạn.  

## Miễn Trừ Trách Nhiệm

Bot này chỉ dành cho mục đích học tập. Bạn hoàn toàn chịu trách nhiệm khi sử dụng. Tác giả không chịu trách nhiệm cho bất kỳ tổn thất nào về tài sản.

## Giấy Phép

MIT License

## Tham Gia Cộng Đồng Của Chúng Tôi

