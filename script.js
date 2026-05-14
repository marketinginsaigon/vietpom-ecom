const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyBHZZypb8bNGnbC8UenQUWYY5F0xHTJ6kknlcEP9AeGRwBAj_nZhySq_AjA1s6I6R7tQ/exec";
let PRODUCTS = [];

const state = { cart: {}, search: "", category: "Tất cả", isSubmitting: false };

const getElements = () => ({
  miniProducts: document.getElementById("miniProducts"), productGrid: document.getElementById("productGrid"),
  categorySelect: document.getElementById("categorySelect"), searchInput: document.getElementById("searchInput"),
  cartItems: document.getElementById("cartItems"), headerCartCount: document.getElementById("headerCartCount"),
  subtotalText: document.getElementById("subtotalText"), shippingText: document.getElementById("shippingText"),
  totalText: document.getElementById("totalText"), quickProductCount: document.getElementById("quickProductCount"),
  quickTotalText: document.getElementById("quickTotalText"), orderForm: document.getElementById("orderForm"),
  submitButton: document.getElementById("submitButton"), submitStatus: document.getElementById("submitStatus"),
  customerName: document.getElementById("customerName"), customerPhone: document.getElementById("customerPhone"),
  customerAddress: document.getElementById("customerAddress"), customerTaxId: document.getElementById("customerTaxId"),
  customerNote: document.getElementById("customerNote"),
});
const elements = getElements();

async function fetchProducts() {
  const CACHE_KEY = "vietpom_products_cache";
  if(elements.productGrid) {
    elements.productGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; color: #15558D; font-size: 16px;">
        <span style="font-size: 24px; display: block; margin-bottom: 10px;">⏳</span>
        <strong>Đang tải danh sách sản phẩm từ kho...</strong>
      </div>`;
  }

  const cachedData = localStorage.getItem(CACHE_KEY);
  if (cachedData) processData(JSON.parse(cachedData));

  try {
    const response = await fetch(GOOGLE_SHEET_WEB_APP_URL);
    const data = await response.json();
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    processData(data);
  } catch (error) { 
    if (!cachedData && elements.productGrid) elements.productGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #E60000; padding: 40px;">❌ Lỗi kết nối. Vui lòng tải lại trang (F5).</div>`;
  }
}

function processData(data) {
  PRODUCTS = data.filter(item => item.id && item.name).map(item => ({
    id: item.id, name: item.name, price: Number(item.price) || 0, oldPrice: Number(item.oldPrice) || 0,
    unit: item.unit || "Hộp", image: item.image || "", category: item.category || "Tất cả", 
    tag: item.tag || "", // LẤY TAG TỪ EXCEL LÊN WEB
    note: item.note || ""
  }));
  renderCategories(); renderProducts();
}

function formatCurrency(value) { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value); }

function getCartItems() {
  return Object.entries(state.cart).map(([id, quantity]) => {
    const product = PRODUCTS.find((item) => item.id === id);
    return product ? { ...product, quantity } : null;
  }).filter(Boolean);
}

function getTotals() {
  const cartItems = getCartItems();
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal >= 1200000 || subtotal === 0 ? 0 : 30000;
  const total = subtotal + shippingFee; 
  return { cartItems, subtotal, shippingFee, discount: 0, total };
}

function getFilteredProducts() {
  return PRODUCTS.filter((product) => {
    const matchSearch = product.name.toLowerCase().includes(state.search.toLowerCase());
    const matchCategory = state.category === "Tất cả" || product.category === state.category;
    return matchSearch && matchCategory;
  });
}

function increase(id) { state.cart[id] = (state.cart[id] || 0) + 1; renderCartAndTotals(); }
function decrease(id) {
  const nextQuantity = (state.cart[id] || 0) - 1;
  if (nextQuantity <= 0) delete state.cart[id]; else state.cart[id] = nextQuantity;
  renderCartAndTotals();
}
function removeItem(id) { delete state.cart[id]; renderCartAndTotals(); }

function renderCategories() {
  if(!elements.categorySelect) return;
  elements.categorySelect.innerHTML = ["Tất cả", ...new Set(PRODUCTS.map((item) => item.category))].map((cat) => `<option value="${cat}">${cat}</option>`).join("");
  elements.categorySelect.value = state.category;
}

function renderProducts() {
  if(!elements.productGrid) return;
  const products = getFilteredProducts();
  if (products.length === 0) { elements.productGrid.innerHTML = `<div class="empty-cart" style="grid-column: 1 / -1;"><strong>Không tìm thấy sản phẩm</strong></div>`; return; }
  
  elements.productGrid.innerHTML = products.map((product) => {
    const qty = state.cart[product.id] || 0;
    const buyControl = qty ? `<div class="qty-control"><button type="button" onclick="decrease('${product.id}')">−</button><span>${qty}</span><button type="button" onclick="increase('${product.id}')">+</button></div>` : `<button type="button" class="add-btn" onclick="increase('${product.id}')">🛒 Chọn mua</button>`;
      
    const priceDisplay = (product.oldPrice > product.price) 
      ? `<div style="display: flex; flex-direction: column;"><del style="color: #94a3b8; font-size: 13px; line-height: 1; font-weight: 500;">${formatCurrency(product.oldPrice)}</del><span class="price" style="color: #E60000 !important; font-size: 18px;">${formatCurrency(product.price)}</span></div>`
      : `<span class="price">${formatCurrency(product.price)}</span>`;

    // NẾU CÓ TAG THÌ IN RA MÀN HÌNH, KHÔNG CÓ THÌ ẨN
    const tagDisplay = product.tag ? `<div class="product-tag">${product.tag}</div>` : "";

    return `
      <article class="product-card">
        <div class="product-inner">
          <div class="product-img-wrap">
            ${tagDisplay}
            <img src="${product.image}" alt="${product.name}" style="width: 100%; height: 180px; object-fit: contain; border-radius: 8px; padding: 10px; background-color: #ffffff; box-sizing: border-box;">
          </div>
          <div class="product-meta"><span class="category-badge">${product.category}</span><span class="product-unit">${product.unit}</span></div>
          <h3>${product.name}</h3><p class="note">${product.note}</p>
          <div class="product-bottom"><div style="display: flex; flex-direction: column; justify-content: flex-end;"><span class="price-label" style="margin-bottom: 2px;">Giá bán</span>${priceDisplay}</div>${buyControl}</div>
        </div>
      </article>`;
  }).join("");
}

function renderCart() {
  if(!elements.cartItems) return;
  const { cartItems } = getTotals();
  if (cartItems.length === 0) { elements.cartItems.innerHTML = `<div class="empty-cart"><strong>Chưa có sản phẩm nào</strong></div>`; return; }
  elements.cartItems.innerHTML = `<div class="cart-list">${cartItems.map((item) => `<div class="cart-item"><div><strong>${item.name}</strong><small>${item.unit} · ${formatCurrency(item.price)}</small></div><div class="cart-actions"><div class="qty-control"><button type="button" onclick="decrease('${item.id}')">−</button><span>${item.quantity}</span><button type="button" onclick="increase('${item.id}')">+</button></div><div class="line-total">${formatCurrency(item.price * item.quantity)}</div><button type="button" class="remove-btn" onclick="removeItem('${item.id}')">×</button></div></div>`).join("")}</div>`;
}

function renderTotals() {
  const { cartItems, subtotal, shippingFee, total } = getTotals();
  if (elements.headerCartCount) elements.headerCartCount.textContent = cartItems.length;
  if (elements.subtotalText) elements.subtotalText.textContent = formatCurrency(subtotal);
  if (elements.shippingText) elements.shippingText.textContent = shippingFee === 0 ? "Miễn phí" : formatCurrency(shippingFee);
  if (elements.totalText) elements.totalText.textContent = formatCurrency(total);
  if (elements.quickProductCount) elements.quickProductCount.textContent = cartItems.length;
  if (elements.quickTotalText) elements.quickTotalText.textContent = formatCurrency(total);
}

function renderCartAndTotals() { renderCart(); renderTotals(); renderProducts(); }

function showSubmitStatus(type, message) { if(elements.submitStatus) { elements.submitStatus.className = `submit-status ${type}`; elements.submitStatus.textContent = message; } }
function clearSubmitStatus() { if(elements.submitStatus) { elements.submitStatus.className = "submit-status hidden"; elements.submitStatus.textContent = ""; } }

async function submitOrder(event) {
  event.preventDefault();
  const { cartItems, subtotal, shippingFee, total } = getTotals();
  const customer = { 
    name: elements.customerName.value.trim(), phone: elements.customerPhone.value.trim(), 
    address: elements.customerAddress.value.trim(), taxId: elements.customerTaxId ? elements.customerTaxId.value.trim() : "", note: elements.customerNote.value.trim() 
  };
  
  if (cartItems.length === 0) return showSubmitStatus("error", "Vui lòng chọn sản phẩm.");
  if (!customer.name || !customer.phone || !customer.address) return showSubmitStatus("error", "Vui lòng điền đủ thông tin.");
  
  const orderCode = `DH-${Date.now()}`;
  const orderPayload = {
    orderCode, createdAt: new Date().toLocaleString("vi-VN"), customer,
    // GÓI TAG CỦA SẢN PHẨM Ở ĐÂY ĐỂ GỬI VỀ APPS SCRIPT
    items: cartItems.map((item) => ({ id: item.id, name: item.name, category: item.category, unit: item.unit, price: item.price, quantity: item.quantity, lineTotal: item.price * item.quantity, tag: item.tag || "" })),
    subtotal, shippingFee, discount: 0, total,
  };

  try {
    state.isSubmitting = true; elements.submitButton.disabled = true; elements.submitButton.textContent = "Đang gửi...";
    await fetch(GOOGLE_SHEET_WEB_APP_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(orderPayload) });
    showSubmitStatus("success", `Đơn hàng ${orderCode} đã đặt thành công. Cảm ơn Anh/Chị!`);
    state.cart = {}; if(elements.orderForm) elements.orderForm.reset(); renderCartAndTotals();
  } catch (error) { showSubmitStatus("error", "Lỗi mạng. Vui lòng thử lại."); } 
  finally { state.isSubmitting = false; elements.submitButton.disabled = false; elements.submitButton.textContent = "Gửi đơn hàng"; }
}

if(elements.searchInput) elements.searchInput.addEventListener("input", (e) => { state.search = e.target.value; renderProducts(); });
if(elements.categorySelect) elements.categorySelect.addEventListener("change", (e) => { state.category = e.target.value; renderProducts(); });
if(elements.orderForm) elements.orderForm.addEventListener("submit", submitOrder);

window.increase = increase; window.decrease = decrease; window.removeItem = removeItem;
fetchProducts(); renderCartAndTotals(); clearSubmitStatus();
