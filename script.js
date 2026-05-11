// =====================================================
// CẤU HÌNH GOOGLE SHEET
// =====================================================
// Sau khi deploy Google Apps Script thành Web App,
// dán URL vào biến bên dưới.
// Ví dụ: const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx.../exec";
const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyBHZZypb8bNGnbC8UenQUWYY5F0xHTJ6kknlcEP9AeGRwBAj_nZhySq_AjA1s6I6R7tQ/exec";
// =====================================================
// DỮ LIỆU SẢN PHẨM
// =====================================================
// Bạn có thể sửa tên sản phẩm, giá, quy cách, ghi chú tại đây.
let PRODUCTS = [];

async function fetchProducts() {
  try {
    const response = await fetch(GOOGLE_SHEET_WEB_APP_URL);
    const data = await response.json();
    
    // BỘ CHỐNG LỖI: Lọc bỏ dòng trống và tự động điền danh mục nếu trong Sheets lỡ quên
    PRODUCTS = data.filter(item => item.id && item.name).map(item => {
        return {
            id: item.id,
            name: item.name,
            price: Number(item.price) || 0,
            unit: item.unit || "Hộp",
            image: item.image || "",
            category: item.category || "Tất cả", // Rất quan trọng: Thiếu cái này web sẽ ẩn SP
            tag: item.tag || "",
            note: item.note || ""
        };
    });
    
    renderProducts();
  } catch (error) {
    console.error("Lỗi tải dữ liệu kho hàng:", error);
  }
}

fetchProducts();
const state = {
  cart: {},
  search: "",
  category: "Tất cả",
  isSubmitting: false,
};

const elements = {
  miniProducts: document.getElementById("miniProducts"),
  productGrid: document.getElementById("productGrid"),
  categorySelect: document.getElementById("categorySelect"),
  searchInput: document.getElementById("searchInput"),
  cartItems: document.getElementById("cartItems"),
  headerCartCount: document.getElementById("headerCartCount"),
  subtotalText: document.getElementById("subtotalText"),
  shippingText: document.getElementById("shippingText"),
  discountText: document.getElementById("discountText"),
  totalText: document.getElementById("totalText"),
  quickProductCount: document.getElementById("quickProductCount"),
  quickTotalText: document.getElementById("quickTotalText"),
  orderForm: document.getElementById("orderForm"),
  submitButton: document.getElementById("submitButton"),
  submitStatus: document.getElementById("submitStatus"),
  customerName: document.getElementById("customerName"),
  customerPhone: document.getElementById("customerPhone"),
  customerAddress: document.getElementById("customerAddress"),
  customerNote: document.getElementById("customerNote"),
};

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

function getCartItems() {
  return Object.entries(state.cart)
    .map(([id, quantity]) => {
      const product = PRODUCTS.find((item) => item.id === id);
      return product ? { ...product, quantity } : null;
    })
    .filter(Boolean);
}

function getTotals() {
  const cartItems = getCartItems();
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal >= 1200000 || subtotal === 0 ? 0 : 30000;
  const discount = subtotal >= 1200000 ? Math.round(subtotal * 0.15) : 0;
  const total = Math.max(subtotal + shippingFee - discount, 0);

  return {
    cartItems,
    subtotal,
    shippingFee,
    discount,
    total,
  };
}

function getFilteredProducts() {
  return PRODUCTS.filter((product) => {
    const matchSearch = product.name.toLowerCase().includes(state.search.toLowerCase());
    const matchCategory = state.category === "Tất cả" || product.category === state.category;
    return matchSearch && matchCategory;
  });
}

function increase(id) {
  state.cart[id] = (state.cart[id] || 0) + 1;
  render();
}

function decrease(id) {
  const nextQuantity = (state.cart[id] || 0) - 1;

  if (nextQuantity <= 0) {
    delete state.cart[id];
  } else {
    state.cart[id] = nextQuantity;
  }

  render();
}

function removeItem(id) {
  delete state.cart[id];
  render();
}

function renderMiniProducts() {
  elements.miniProducts.innerHTML = PRODUCTS.slice(0, 4)
    .map((product) => {
      return `
        <div class="mini-product">
          <div class="mini-img">Hình sản phẩm</div>
          <strong>${product.name}</strong>
          <span>${formatCurrency(product.price)}</span>
        </div>
      `;
    })
    .join("");
}

function renderCategories() {
  const categories = ["Tất cả", ...new Set(PRODUCTS.map((item) => item.category))];

  elements.categorySelect.innerHTML = categories
    .map((category) => `<option value="${category}">${category}</option>`)
    .join("");

  elements.categorySelect.value = state.category;
}

function renderProducts() {
  const products = getFilteredProducts();

  if (products.length === 0) {
    elements.productGrid.innerHTML = `
      <div class="empty-cart" style="grid-column: 1 / -1;">
        <strong>Không tìm thấy sản phẩm phù hợp</strong>
        <p>Hãy thử từ khóa khác hoặc chọn lại danh mục.</p>
      </div>
    `;
    return;
  }

  elements.productGrid.innerHTML = products
    .map((product) => {
      const quantity = state.cart[product.id] || 0;
      const buyControl = quantity
        ? `
          <div class="qty-control">
            <button type="button" onclick="decrease('${product.id}')" aria-label="Giảm số lượng">−</button>
            <span>${quantity}</span>
            <button type="button" onclick="increase('${product.id}')" aria-label="Tăng số lượng">+</button>
          </div>
        `
        : `
          <button type="button" class="add-btn" onclick="increase('${product.id}')">
            🛒 Chọn mua
          </button>
        `;

      return `
        <article class="product-card">
          <div class="product-inner">
            <div class="product-img-wrap">
              <div class="product-tag">${product.tag}</div>
              <img src="${product.image}" alt="${product.name}" style="width: 100%; aspect-ratio: 1/1; object-fit: cover; border-radius: 8px;">
            </div>

            <div class="product-meta">
              <span class="category-badge">${product.category}</span>
              <span class="product-unit">${product.unit}</span>
            </div>

            <h3>${product.name}</h3>
            <p class="note">${product.note}</p>

            <div class="product-bottom">
              <div>
                <span class="price-label">Giá bán</span>
                <span class="price">${formatCurrency(product.price)}</span>
              </div>
              ${buyControl}
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCart() {
  const { cartItems } = getTotals();

  if (cartItems.length === 0) {
    elements.cartItems.innerHTML = `
      <div class="empty-cart">
        <strong>Chưa có sản phẩm nào trong đơn</strong>
        <p>Hãy bấm “Chọn mua” ở sản phẩm để thêm vào đơn hàng.</p>
      </div>
    `;
    return;
  }

  elements.cartItems.innerHTML = `
    <div class="cart-list">
      ${cartItems
        .map((item) => {
          return `
            <div class="cart-item">
              <div>
                <strong>${item.name}</strong>
                <small>${item.unit} · ${formatCurrency(item.price)}</small>
              </div>

              <div class="cart-actions">
                <div class="qty-control">
                  <button type="button" onclick="decrease('${item.id}')" aria-label="Giảm số lượng">−</button>
                  <span>${item.quantity}</span>
                  <button type="button" onclick="increase('${item.id}')" aria-label="Tăng số lượng">+</button>
                </div>

                <div class="line-total">${formatCurrency(item.price * item.quantity)}</div>

                <button type="button" class="remove-btn" onclick="removeItem('${item.id}')" aria-label="Xóa sản phẩm">×</button>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderTotals() {
  const { cartItems, subtotal, shippingFee, discount, total } = getTotals();

  elements.headerCartCount.textContent = cartItems.length;
  elements.subtotalText.textContent = formatCurrency(subtotal);
  elements.shippingText.textContent = shippingFee === 0 ? "Miễn phí" : formatCurrency(shippingFee);
  elements.discountText.textContent = discount > 0 ? `- ${formatCurrency(discount)}` : "0đ";
  elements.totalText.textContent = formatCurrency(total);

  elements.quickProductCount.textContent = cartItems.length;
  elements.quickTotalText.textContent = formatCurrency(total);
}

function render() {
  renderProducts();
  renderCart();
  renderTotals();
}

function showSubmitStatus(type, message) {
  elements.submitStatus.className = `submit-status ${type}`;
  elements.submitStatus.textContent = message;
}

function clearSubmitStatus() {
  elements.submitStatus.className = "submit-status hidden";
  elements.submitStatus.textContent = "";
}

async function submitOrder(event) {
  event.preventDefault();

  const { cartItems, subtotal, shippingFee, discount, total } = getTotals();

  const customer = {
    name: elements.customerName.value.trim(),
    phone: elements.customerPhone.value.trim(),
    address: elements.customerAddress.value.trim(),
    note: elements.customerNote.value.trim(),
  };

  if (cartItems.length === 0) {
    showSubmitStatus("error", "Vui lòng chọn ít nhất 1 sản phẩm trước khi gửi đơn hàng.");
    return;
  }

  if (!customer.name || !customer.phone || !customer.address) {
    showSubmitStatus("error", "Vui lòng điền đủ họ tên, số điện thoại và địa chỉ giao hàng.");
    return;
  }
  const orderCode = `DH-${Date.now()}`;

  const orderPayload = {
    orderCode,
    createdAt: new Date().toLocaleString("vi-VN"),
    customer,
    items: cartItems.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      price: item.price,
      quantity: item.quantity,
      lineTotal: item.price * item.quantity,
    })),
    subtotal,
    shippingFee,
    discount,
    total,
  };

  try {
    state.isSubmitting = true;
    elements.submitButton.disabled = true;
    elements.submitButton.textContent = "Đang gửi đơn hàng...";
    showSubmitStatus("loading", "Đang gửi đơn hàng về Google Sheet...");

    await fetch(GOOGLE_SHEET_WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(orderPayload),
    });

    showSubmitStatus(
      "success",
      `Đã gửi đơn hàng ${orderCode}. Vui lòng kiểm tra file Google Sheet trong Google Drive.`
    );

    state.cart = {};
    elements.orderForm.reset();
    render();
  } catch (error) {
    showSubmitStatus(
      "error",
      "Không gửi được đơn hàng. Vui lòng kiểm tra lại URL Apps Script hoặc kết nối mạng."
    );
  } finally {
    state.isSubmitting = false;
    elements.submitButton.disabled = false;
    elements.submitButton.textContent = "Gửi đơn hàng";
  }
}

elements.searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderProducts();
});

elements.categorySelect.addEventListener("change", (event) => {
  state.category = event.target.value;
  renderProducts();
});

elements.orderForm.addEventListener("submit", submitOrder);

// Cho phép gọi hàm từ onclick trong HTML render động
window.increase = increase;
window.decrease = decrease;
window.removeItem = removeItem;

renderMiniProducts();
renderCategories();
render();
clearSubmitStatus();
