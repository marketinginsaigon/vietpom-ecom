# Pharma Care Landing Page

Landing page thương mại điện tử dành cho ngành dược phẩm.

## Chức năng chính

- Hiển thị danh sách sản phẩm thuốc/dược phẩm
- Có nút **Chọn mua** dưới mỗi sản phẩm
- Có tăng/giảm số lượng
- Tự động tổng hợp đơn hàng
- Tính tiền hàng, phí giao hàng, chiết khấu, tổng thanh toán
- Có form điền thông tin mua hàng
- Gửi đơn hàng về Google Sheet trong Google Drive thông qua Google Apps Script

## Cấu trúc thư mục

```text
pharma_landing_github_v2/
├── index.html
├── style.css
├── script.js
└── google-apps-script/
    └── Code.gs
```

## Cách đưa lên GitHub Pages

1. Tạo repository mới trên GitHub.
2. Upload các file:
   - `index.html`
   - `style.css`
   - `script.js`
3. Vào repository → **Settings** → **Pages**.
4. Ở phần **Build and deployment**:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Bấm **Save**.
6. Chờ GitHub tạo link website.

## Cách tạo Google Sheet nhận đơn hàng

1. Vào Google Drive.
2. Tạo Google Sheet mới.
3. Đặt tên file, ví dụ: `Đơn hàng landing page dược phẩm`.
4. Trong Google Sheet, vào **Extensions → Apps Script**.
5. Xóa code mặc định.
6. Copy toàn bộ code trong file:

```text
google-apps-script/Code.gs
```

7. Dán vào Apps Script.
8. Bấm **Save**.

## Deploy Google Apps Script thành Web App

1. Trong Apps Script, bấm **Deploy → New deployment**.
2. Chọn loại deployment là **Web app**.
3. Cấu hình:
   - Execute as: `Me`
   - Who has access: `Anyone`
4. Bấm **Deploy**.
5. Cấp quyền theo hướng dẫn của Google.
6. Copy **Web App URL**.

## Dán Web App URL vào landing page

Mở file `script.js`, tìm dòng:

```js
const GOOGLE_SHEET_WEB_APP_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
```

Thay bằng URL thật:

```js
const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx.../exec";
```

Sau đó upload lại file `script.js` lên GitHub.

## Cách sửa sản phẩm

Mở file `script.js`, tìm mảng:

```js
const PRODUCTS = [...]
```

Bạn có thể sửa:
- Tên sản phẩm
- Nhóm sản phẩm
- Giá
- Quy cách
- Tag
- Ghi chú

Ví dụ:

```js
{
  id: "p1",
  name: "Tên sản phẩm",
  category: "Nhóm sản phẩm",
  price: 45000,
  unit: "Hộp 10 viên",
  tag: "Bán chạy",
  note: "Ghi chú sử dụng hoặc lưu ý sản phẩm.",
}
```

## Lưu ý quan trọng

Landing page này là bản mẫu. Khi triển khai thật cho ngành dược, cần kiểm tra:
- Pháp lý quảng cáo dược phẩm
- Loại sản phẩm có được bán online hay không
- Quy trình tư vấn của dược sĩ/nhân viên chuyên môn
- Cách dùng từ không cam kết chữa khỏi bệnh
- Chính sách bảo mật thông tin khách hàng
