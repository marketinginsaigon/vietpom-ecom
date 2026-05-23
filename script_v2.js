/* ============================================================
   BỘ MÃ LOGIC GIỎ HÀNG VIETPOM - PHIÊN BẢN SẠCH CACHE V2 CHỐT HẠ
   ============================================================ */

let allProducts = [];
let cart = {};

// ĐƯỜNG DẪN WEB APP APPS SCRIPT GỐC ĐANG CHẠY CỦA ANH
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbwTKyIZ7xACTb2vLojiQZnzwP0_gtSdjIbrk9e2Bt1sYdAKbP8LEBgziIywwsROpWNxMw/exec";

function getInputValueSafely(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
}

// 1. TẢI SẢN PHẨM TỪ GOOGLE SHEET
async function fetchProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#15558D; font-weight:bold;">🔄 Đang tải danh mục sản phẩm chính hãng...</div>';
    
    try {
        const res = await fetch(`${GOOGLE_SHEET_URL}?action=getProducts`);
        const data = await res.json();
        
        allProducts = data.map((p, index) => {
            const nameStr = p.name ? String(p.name).trim() : (p.tên ? String(p.tên).trim() : "");
            const priceNum = parseInt(p.price) || parseInt(p.giá) || 0;
            const categoryStr = p.category ? String(p.category).trim() : (p.danhmục ? String(p.danhmục).trim() : "Dược phẩm");
            const unitStr = p.unit ? String(p.unit).trim() : (p.đơnvị ? String(p.đơnvị).trim() : "Hộp");
            const imageStr = p.image ? String(p.image).trim() : (p.hìnhảnh ? String(p.hìnhảnh).trim() : "");
            const tagStr = p.tag ? String(p.tag).trim().replace(/[\[\]]/g, '') : "";

            return {
                id: `line_item_${index}`,
                name: nameStr,
                price: priceNum,
                category: categoryStr,
                unit: unitStr,
                image: imageStr,
                tag: tagStr
            };
        }).filter(p => p.name !== ""); 
        
        renderCategories();
        renderProducts(allProducts);
    } catch (err) {
        console.error("Lỗi tải danh mục:", err);
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#E60000; font-weight:bold;">❌ Không thể tải danh mục. Anh vui lòng tải lại trang (F5).</div>';
    }
}

// 2. HIỂN THỊ DANH MỤC LỌC
function renderCategories() {
    const select = document.getElementById('categorySelect');
    if (!select) return;
    const categories = ['Tất cả', ...new Set(allProducts.map(p => p.category).filter(Boolean))];
    select.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    select.addEventListener('change', (e) => {
        const filter = e.target.value;
        renderProducts(filter === 'Tất cả' ? allProducts : allProducts.filter(p => p.category === filter));
    });
}

// 3. RENDER DANH SÁCH RA LƯỚI
function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    if (products.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#64748b;">Không tìm thấy sản phẩm phù hợp.</div>';
        return;
    }
    
    grid.innerHTML = products.map(p => {
        const currentQty = cart[p.id] ? cart[p.id].qty : 0;
        let displayTag = p.tag && p.tag !== "" ? p.tag : 'HD';
        
        return `
            <div class="product-card" data-id="${p.id}">
                <a href="#products" onclick="return false;">
                    <div class="product-img-wrap">
                        <span class="product-tag">${displayTag}</span>
                        <img src="${p.image || 'placeholder.jpg'}" alt="${p.name || 'Sản phẩm'}">
                    </div>
                    <div class="product-meta">
                        <span class="category-badge">${p.category || 'Dược phẩm'}</span>
                        <span class="unit-badge">${p.unit || 'Hộp'}</span>
                    </div>
                    <h3>${p.name || 'Sản phẩm không tên'}</h3>
                </a>
                <div class="product-bottom">
                    <div class="price">${p.price.toLocaleString('vi-VN')} đ</div>
                    <div class="action-zone">
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
            </div>
        `;
    }).join('');
}

// 4. CẬP NHẬT GIỎ HÀNG
window.updateCartItem = function(id, qty) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    if (qty <= 0) { delete cart[id]; } 
    else {
        cart[id] = {
            name: product.name,
            price: product.price,
            qty: qty,
            unit: product.unit,
            tag: product.tag
        };
    }
    updateSingleProductUI(id, qty);
    updateCartSummary();
};

function updateSingleProductUI(id, qty) {
    const card = document.querySelector(`.product-card[data-id="${id}"]`);
    if (!card) return;
    const zone = card.querySelector('.action-zone');
    if (!zone) return;
    zone.innerHTML = qty <= 0 ? `<button class="add-btn" onclick="updateCartItem('${id}', 1)">🛒 Chọn mua</button>` : `
        <div class="qty-control">
            <button onclick="updateCartItem('${id}', ${qty - 1})">-</button>
            <span style="font-weight:bold; color:#15558D; font-size:14px;">${qty}</span>
            <button onclick="updateCartItem('${id}', ${qty + 1})">+</button>
        </div>
    `;
}

function updateCartSummary() {
    const cartItems = document.getElementById('cartItems');
    const headerCount = document.getElementById('headerCartCount');
    const subtotalText = document.getElementById('subtotalText');
    const shippingText = document.getElementById('shippingText');
    const totalText = document.getElementById('totalText');
    
    let totalItems = 0;
    let subtotal = 0;
    let html = '';
    
    for (const id in cart) {
        const item = cart[id];
        totalItems += item.qty;
        subtotal += item.price * item.qty;
        
        html += `
            <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #e2e8f0;">
                <div style="flex-grow:1;">
                    <div style="font-weight:bold; font-size:14px; color:#15558D;">${item.name}</div>
                    <div style="font-size:12px; color:#64748b;">${item.price.toLocaleString('vi-VN')} đ</div>
                </div>
                <div style="font-weight:bold; color:#15558D; font-size:14px;">x${item.qty}</div>
            </div>
        `;
    }
    
    let shippingFee = (subtotal > 0 && subtotal < 1200000) ? 30000 : 0;
    if (cartItems) cartItems.innerHTML = html || '<div style="text-align:center; padding:20px; color:#64748b;">Giỏ hàng trống</div>';
    if (headerCount) headerCount.innerText = totalItems;
    if (subtotalText) subtotalText.innerText = `${subtotal.toLocaleString('vi-VN')} đ`;
    if (shippingText) shippingText.innerText = shippingFee === 0 ? "Miễn phí" : `${shippingFee.toLocaleString('vi-VN')} đ`;
    if (totalText) totalText.innerText = `${(subtotal + shippingFee).toLocaleString('vi-VN')} đ`;
}

// 7. SUBMIT ĐƠN HÀNG - ĐÓNG GÓI CHUỖI SẠCH KHÔNG DÙNG JSON
document.getElementById('orderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (Object.keys(cart).length === 0) { alert("Giỏ hàng trống!"); return; }
    
    const btn = document.getElementById('submitButton');
    const status = document.getElementById('submitStatus');
    if (btn) { btn.disabled = true; btn.innerText = "⏳ Đang gửi đơn hàng..."; }
    
    const itemsDetail = Object.keys(cart).map(id => {
        const item = cart[id];
        let pTag = item.tag ? `[${item.tag}]` : '[VietPOM]';
        return `${pTag} ${item.name} (${item.qty} ${item.unit})`;
    }).join('\n');
    
    const subtotal = Object.keys(cart).reduce((sum, id) => sum + (cart[id].price * cart[id].qty), 0);
    const shippingFee = (subtotal > 0 && subtotal < 1200000) ? 30000 : 0;
    
    // Gửi bằng URLSearchParams truyền thống để đẩy thẳng vào e.parameter, KHÔNG GÂY SYNTAXERROR
    const formParams = new URLSearchParams();
    formParams.append('action', 'submitOrder');
    formParams.append('name', getInputValueSafely('customerName') || getInputValueSafely('name'));
    formParams.append('phone', getInputValueSafely('customerPhone') || getInputValueSafely('phone'));
    formParams.append('address', getInputValueSafely('customerAddress') || getInputValueSafely('address'));
    formParams.append('taxId', getInputValueSafely('customerTaxId') || getInputValueSafely('taxId'));
    formParams.append('note', getInputValueSafely('customerNote') || getInputValueSafely('note'));
    formParams.append('items', itemsDetail); 
    formParams.append('total', `${(subtotal + shippingFee).toLocaleString('vi-VN')} đ`);
    
    try {
        if (status) { status.innerText = "⏳ Đang đồng bộ dữ liệu..."; status.classList.remove('hidden'); }
        
        // Gửi POST chuẩn URL encoded vượt rào bảo mật Google Sheet
        await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formParams.toString()
        });
        
        if (status) {
            status.className = "submit-status text-success";
            status.style.color = "#15558D";
            status.innerHTML = "🎉 <b>Gửi đơn thành công!</b> Dữ liệu đã đổ về Sheet.";
        }
        cart = {};
        updateCartSummary();
        renderProducts(allProducts);
        e.target.reset();
    } catch (err) {
        console.error(err);
    } finally {
        if (btn) { btn.disabled = false; btn.innerText = "Gửi đơn hàng ngay"; }
    }
});

document.addEventListener('DOMContentLoaded', fetchProducts);
