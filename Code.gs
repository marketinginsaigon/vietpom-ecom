const SHEET_NAME = "DonHang";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Thời gian",
        "Mã đơn hàng",
        "Họ tên",
        "Số điện thoại",
        "Địa chỉ",
        "Ghi chú",
        "Sản phẩm",
        "Tiền hàng",
        "Phí giao hàng",
        "Chiết khấu",
        "Tổng thanh toán",
        "Trạng thái"
      ]);
    }

    const data = JSON.parse(e.postData.contents || "{}");

    const productsText = (data.items || [])
      .map(function (item) {
        return (
          item.name +
          " | SL: " +
          item.quantity +
          " | Giá: " +
          item.price +
          " | Thành tiền: " +
          item.lineTotal
        );
      })
      .join("\n");

    sheet.appendRow([
      data.createdAt || new Date(),
      data.orderCode || "",
      data.customer && data.customer.name ? data.customer.name : "",
      data.customer && data.customer.phone ? data.customer.phone : "",
      data.customer && data.customer.address ? data.customer.address : "",
      data.customer && data.customer.note ? data.customer.note : "",
      productsText,
      data.subtotal || 0,
      data.shippingFee || 0,
      data.discount || 0,
      data.total || 0,
      "Đơn mới"
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({
        result: "success",
        orderCode: data.orderCode
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        result: "error",
        message: error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService
    .createTextOutput("Google Apps Script Web App is running.")
    .setMimeType(ContentService.MimeType.TEXT);
}
