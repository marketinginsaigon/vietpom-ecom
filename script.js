/* ============================================================
   BỘ MÃ LOGIC GIỎ HÀNG CHUẨN XÁC - ĐÃ VÁ LỖI CẬP NHẬT GIAO DIỆN CỤC BỘ
   ============================================================ */

// Cấu hình URL Web App từ Google Apps Script của Anh
const CONFIG = {
    SHEET_API: "https://script.google.com/macros/s/AKfycbxxNhKcTgxtPQCVtl1brMMF0Wr0jtYZex1ueG74WJpRfa6AyabrOuzOZX8bcM5aLFdMVA/exec"
};

let allProducts = [];
let cart = {};

// 1. TẢI DỮ LIỆU SẢN PHẨM TỪ GOOGLE SHEET
async function fetchProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#15558D; font-weight:bold;">🔄 Đang tải danh mục sản phẩm chính hãng...</div>';
    
    try {
        const res = await fetch(`${CONFIG.SHEET_API}?action=getProducts`);
        const data = await res.json();
        
        // Gán thêm ID duy nhất dựa vào vị trí dòng (index) để đảm bảo không bao giờ trùng định danh
        allProducts = data.map((p, index) => ({
            ...p,
            id: p.id ? String(p.id).trim() : `prod_${index}`,
            price: parseInt(p.price) || 0
        }));
        
        renderCategories();
        renderProducts(allProducts);
    } catch (err) {
        console.error("Lỗi tải sản phẩm:", err);
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#E60000; font-weight:bold;">❌ Không thể tải danh mục. Anh vui lòng tải lại trang (F5).</div>';
    }
}

// 2. HIỂN THỊ DANH SÁCH DANH MỤC LỌC THUỐC
function renderCategories() {
    const select = document.getElementById('categorySelect');
    if (!select) return;
    
    const categories = ['Tất cả', ...new Set(allProducts.map(p => p.category).filter(Boolean))];
    select.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    
    select.addEventListener('change', (e) => {
        const filter = e.target.value;
        const filtered = filter === 'Tất cả' ? allProducts : allProducts.filter(p => p.category === filter);
        renderProducts(filtered);
    });
}

// 3. RENDER DANH SÁCH SẢN PHẨM LÊN GIAO DIỆN
function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    if (products.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#64748b;">Không tìm thấy sản phẩm phù hợp.</div>';
        return;
    }
    
    grid.innerHTML = products.map(p => {
        const currentQty = cart[p.id] ? cart[p.id].qty : 0;
        
        return `
            <div class="product-card" data-id="${p.id}">
                <a href="#products" onclick="return false;">
                    <div class="product-img-wrap">
                        <span class="product-tag">HD</span>
                        <img src="${p.image || 'placeholder.jpg'}" alt="${p.name}">
                    </div>
                    <div class="product-meta">
                        <span class="category-badge">${p.category || 'Dược phẩm'}</span>
                        <span class="unit-badge">${p.unit || 'Hộp'}</span>
                    </div>
                    <h3>${p.name}</h3>
                    <div class="price">${p.price.toLocaleString('vi-VN')} đ</div>
                </a>
                <div class="product-bottom">
                    ${currentQty === 0 ? `
                        <button class="add-btn" onclick="updateCartItem('${p.id}', 1)">🛒 Chọn mua</button>
                    ` : `
                        <div class="qty-control">
                            <button onclick="updateCartItem('${p.id}', ${currentQty - 1})">-</button>
                            <span style="font-weight:bold; color:#15558D; font-size:14px;">${currentQty}</span>
                            <button onclick="updateCartItem('${p.id}', ${currentQty + 1})">+</button>
                        </div>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

// 4. HÀM CẬP NHẬT GIỎ HÀNG CHUẨN XÁC THEO ID DUY NHẤT
window.updateCartItem = function(id, qty) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    
    if (qty <= 0) {
        delete cart[id];
    } else {
        cart[id] = {
            name: product.name,
            price: product.price,
            qty: qty,
            unit: product.unit || 'Hộp'
        };
    }
    
    // VÁ LỖI TẠI ĐÂY: Chỉ định vị và sửa đúng cụm nút bấm của thẻ có data-id trùng khớp
    updateSingleProductUI(id, qty);
    updateCartSummary();
};

// Cập nhật nút bấm cục bộ dựa theo bộ chọn data-id chính xác tuyệt đối
function updateSingleProductUI(id, qty) {
    // Tìm chính xác thẻ product-card chứa ID này, không sợ bị lẫn sang các thẻ Calcium khác
    const card = document.querySelector(`.product-card[data-id="${id}"]`);
    if (!card) return;
    
    const bottom = card.querySelector('.product-bottom');
    if (!bottom) return;
    
    if (qty <= 0) {
        bottom.innerHTML = `<button class="add-btn" onclick="updateCartItem('${id}', 1)">🛒 Chọn mua</button>`;
    } else {
        bottom.innerHTML = `
            <div class="qty-control">
                <button onclick="updateCartItem('${id}', ${qty - 1})">-</button>
                <span style="font-weight:bold; color:#15558D; font-size:14px;">${qty}</span>
                <button onclick="updateCartItem('${id}', ${qty + 1})">+</button>
            </div>
        `;
    }
}

// 5. CẬP NHẬT KHỐI TỔNG HỢP ĐƠN HÀNG VÀ DETAIL THANH TOÁN
function updateCartSummary() {
    const cartItems = document.getElementById('cartItems');
    const headerCount = document.getElementById('headerCartCount');
    const subtotalText = document.getElementById('subtotalText');
    const totalText = document.getElementById('totalText');
    const quickCount = document.getElementById('quickProductCount');
    const quickTotalText = document.getElementById('quickTotalText');
    
    let totalItems = 0;
    let subtotal = 0;
    let html = '';
    
    for (const id in cart) {
        const item = cart[id];
        totalItems += item.qty;
        subtotal += item.price * item.qty;
        
        html += `
            <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #e2e8f0;">
                <div style="flex-grow:1; padding-right:10px;">
                    <div style="font-weight:bold; font-size:14px; color:#333;">${item.name}</div>
                    <div style="font-size:12px; color:#64748b;">${item.price.toLocaleString('vi-VN')} đ x ${item.qty} ${item.unit}</div>
                </div>
                <div style="font-weight:bold; color:#15558D; min-width:80px; text-align:right;">
                    ${(item.price * item.qty).toLocaleString('vi-VN')} đ
                </div>
            </div>
        `;
    }
    
    if (cartItems) cartItems.innerHTML = html || '<div style="text-align:center; padding:20px; color:#64748b;">Anh/Chị chưa chọn sản phẩm nào.</div>';
    if (headerCount) headerCount.innerText = totalItems;
    if (quickCount) quickCount.innerText = totalItems;
    
    if (subtotalText) subtotalText.innerText = `${subtotal.toLocaleString('vi-VN')} đ`;
    if (totalText) totalText.innerText = `${subtotal.toLocaleString('vi-VN')} đ`;
    if (quickTotalText) quickTotalText.innerText = `${subtotal.toLocaleString('vi-VN')} đ`;
}

// 6. XỬ LÝ LỌC TÌM KIẾM THEO TÊN
document.getElementById('searchInput')?.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase().trim();
    const select = document.getElementById('categorySelect');
    const currentCat = select ? select.value : 'Tất cả';
    
    let filtered = allProducts;
    if (currentCat !== 'Tất cả') {
        filtered = filtered.filter(p => p.category === currentCat);
    }
    
    if (keyword !== '') {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(keyword));
    }
    renderProducts(filtered);
});

// 7. GỬI ĐƠN HÀNG VỀ GOOGLE SHEET KHI SUBMIT FORM
document.getElementById('orderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (Object.keys(cart).length === 0) {
        alert("Giỏ hàng đang trống, Anh/Chị vui lòng chọn ít nhất 1 sản phẩm trước khi gửi đơn nha.");
        return;
    }
    
    const btn = document.getElementById('submitButton');
    const status = document.getElementById('submitStatus');
    if (btn) { btn.disabled = true; btn.innerText = "⏳ Đang gửi đơn hàng..."; }
    
    const itemsDetail = Object.keys(cart).map(id => `${cart[id].name} (${cart[id].qty} ${cart[id].unit})`).join('\n');
    const totalAmount = Object.keys(cart).reduce((sum, id) => sum + (cart[id].price * cart[id].qty), 0);
    
    const formData = new FormData(e.target);
    formData.append('action', 'submitOrder');
    formData.append('items', itemsDetail);
    formData.append('total', totalAmount);
    
    try {
        const res = await fetch(CONFIG.SHEET_API, { method: 'POST', body: formData });
        const result = await res.json();
        
        if (result.status === 'success') {
            if (status) {
                status.className = "submit-status text-success";
                status.style.color = "#15558D";
                status.innerHTML = "🎉 <b>Gửi đơn thành công!</b> Hệ thống VietPOM đã ghi nhận đơn hàng. Dược sĩ sẽ liên hệ xác nhận cho Anh/Chị ngay.";
                status.classList.remove('hidden');
            }
            cart = {};
            updateCartSummary();
            renderProducts(allProducts);
            e.target.reset();
        } else {
            throw new Error(result.message);
        }
    } catch (err) {
        console.error("Lỗi gửi đơn:", err);
        if (status) {
            status.className = "submit-status text-danger";
            status.style.color = "#E60000";
            status.innerHTML = "❌ <b>Gửi đơn thất bại.</b> Có lỗi kết nối đường truyền, Anh/Chị vui lòng nhấn nút gửi lại nhé.";
            status.classList.remove('hidden');
        }
    } finally {
        if (btn) { btn.disabled = false; btn.innerText = "Gửi đơn hàng ngay"; }
    }
});

// KHỞI CHẠY HỆ THỐNG KHI TẢI TRANG SẴN SÀNG
document.addEventListener('DOMContentLoaded', fetchProducts);
