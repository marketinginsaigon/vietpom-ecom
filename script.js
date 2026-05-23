/* ============================================================
   BỘ MÃ LOGIC GIỎ HÀNG VIETPOM - PHIÊN BẢN HIỂN THỊ TAG ĐỘNG
   ============================================================ */

const CONFIG = {
    // Anh dán URL Apps Script mới chạy ở Bước 1 của anh vào đây nhé
    SHEET_API: "https://script.google.com/macros/s/AKfycbxxNhKcTgxtPQCVtl1brMMF0Wr0jtYZex1ueG74WJpRfa6AyabrOuzOZX8bcM5aLFdMVA/exec"
};

let allProducts = [];
let cart = {};

// 1. TẢI SẢN PHẨM TỪ GOOGLE SHEET
async function fetchProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#15558D; font-weight:bold;">🔄 Đang tải danh mục sản phẩm chính hãng...</div>';
    
    try {
        const res = await fetch(`${CONFIG.SHEET_API}?action=getProducts`);
        const data = await res.json();
        
        allProducts = data.map((p, index) => ({
            ...p,
            id: `line_item_${index}`,
            price: parseInt(p.price) || 0,
            tag: p.tag ? String(p.tag).trim() : "" // Đọc cột tag động từ Google Sheet
        }));
        
        renderCategories();
        renderProducts(allProducts);
    } catch (err) {
        console.error("Lỗi tải sản phẩm:", err);
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
        const filtered = filter === 'Tất cả' ? allProducts : allProducts.filter(p => p.category === filter);
        renderProducts(filtered);
    });
}

// 3. RENDER DANH SÁCH RA LƯỚI (HIỂN THỊ TAG LÊN ẢNH SẢN PHẨM)
function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    if (products.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#64748b;">Không tìm thấy sản phẩm phù hợp.</div>';
        return;
    }
    
    grid.innerHTML = products.map(p => {
        const currentQty = cart[p.id] ? cart[p.id].qty : 0;
        // Nếu trên sheet anh nhập tag có hoặc không có dấu ngoặc [], web tự động hiển thị sạch đẹp
        const displayTag = p.tag ? p.tag.replace(/[\[\]]/g, '') : 'HD'; 
        
        return `
            <div class="product-card" data-id="${p.id}">
                <a href="#products" onclick="return false;">
                    <div class="product-img-wrap">
                        <span class="product-tag">${displayTag}</span>
                        <img src="${p.image || 'placeholder.jpg'}" alt="${p.name}">
                    </div>
                    <div class="product-meta">
                        <span class="category-badge">${p.category || 'Dược phẩm'}</span>
                        <span class="unit-badge">${p.unit || 'Hộp'}</span>
                    </div>
                    <h3>${p.name}</h3>
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
    
    if (qty <= 0) {
        delete cart[id];
    } else {
        cart[id] = {
            name: product.name,
            price: product.price,
            qty: qty,
            unit: product.unit || 'Hộp',
            tag: product.tag // Lưu kèm tag nhà cung cấp riêng của sản phẩm này vào giỏ
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
    
    if (qty <= 0) {
        zone.innerHTML = `<button class="add-btn" onclick="updateCartItem('${id}', 1)">🛒 Chọn mua</button>`;
    } else {
        zone.innerHTML = `
            <div class="qty-control">
                <button onclick="updateCartItem('${id}', ${qty - 1})">-</button>
                <span style="font-weight:bold; color:#15558D; font-size:14px;">${qty}</span>
                <button onclick="updateCartItem('${id}', ${qty + 1})">+</button>
            </div>
        `;
    }
}

// 5. TỔNG HỢP GIỎ HÀNG VÀ TÍNH SHIP
function updateCartSummary() {
    const cartItems = document.getElementById('cartItems');
    const headerCount = document.getElementById('headerCartCount');
    const subtotalText = document.getElementById('subtotalText');
    const shippingText = document.getElementById('shippingText');
    const totalText = document.getElementById('totalText');
    const quickCount = document.getElementById('quickProductCount');
    const quickTotalText = document.getElementById('quickTotalText');
    const summaryNote = document.querySelector('.summary-note');
    
    let totalItems = 0;
    let subtotal = 0;
    let html = '';
    
    for (const id in cart) {
        const item = cart[id];
        totalItems += item.qty;
        subtotal += item.price * item.qty;
        
        html += `
            <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #e2e8f0;">
                <div style="flex-grow:1; padding-right:10px;">
                    <div style="font-weight:bold; font-size:14px; color:#15558D;">${item.name}</div>
                    <div style="font-size:12px; color:#64748b; margin-top:2px;">${item.price.toLocaleString('vi-VN')} đ / ${item.unit}</div>
                </div>
                
                <div style="display:flex; align-items:center; gap:8px; margin-right:15px; flex-shrink:0;">
                    <button onclick="updateCartItem('${id}', ${item.qty - 1})" style="width:24px; height:24px; background:#e2e8f0; border:none; border-radius:4px; font-weight:bold; cursor:pointer; color:#475569; display:flex; align-items:center; justify-content:center;">-</button>
                    <span style="font-weight:bold; font-size:14px; color:#15558D; min-width:16px; text-align:center;">${item.qty}</span>
                    <button onclick="updateCartItem('${id}', ${item.qty + 1})" style="width:24px; height:24px; background:#15558D; border:none; border-radius:4px; font-weight:bold; cursor:pointer; color:#fff; display:flex; align-items:center; justify-content:center;">+</button>
                </div>

                <div style="font-weight:bold; color:#15558D; min-width:85px; text-align:right; flex-shrink:0; font-size:14px;">
                    ${(item.price * item.qty).toLocaleString('vi-VN')} đ
                </div>
            </div>
        `;
    }
    
    let shippingFee = (subtotal > 0 && subtotal < 1200000) ? 30000 : 0;
    let finalTotal = subtotal + shippingFee;
    
    if (shippingText) {
        if (subtotal === 0) shippingText.innerText = "0 đ";
        else if (shippingFee === 0) { shippingText.innerText = "Miễn phí"; shippingText.style.color = "#15558D"; }
        else { shippingText.innerText = `${shippingFee.toLocaleString('vi-VN')} đ`; shippingText.style.color = "#333333"; }
    }

    if (summaryNote) {
        if (subtotal > 0 && subtotal < 1200000) {
            const missingAmount = 1200000 - subtotal;
            summaryNote.innerHTML = `<strong>Ưu đãi hiện tại</strong><p>Mua thêm <b>${missingAmount.toLocaleString('vi-VN')} đ</b> để được <b>Miễn phí giao hàng (Freeship)</b>.</p>`;
        } else {
            summaryNote.innerHTML = `<strong>Ưu đãi hiện tại</strong><p>Đơn từ 1.200.000đ được miễn phí giao hàng (Freeship).</p>`;
        }
    }
    
    if (cartItems) cartItems.innerHTML = html || '<div style="text-align:center; padding:30px; color:#64748b; font-size:14px;">Anh/Chị chưa chọn sản phẩm nào.</div>';
    if (headerCount) headerCount.innerText = totalItems;
    if (quickCount) quickCount.innerText = totalItems;
    
    if (subtotalText) subtotalText.innerText = `${subtotal.toLocaleString('vi-VN')} đ`;
    if (totalText) totalText.innerText = `${finalTotal.toLocaleString('vi-VN')} đ`;
    if (quickTotalText) quickTotalText.innerText = `${finalTotal.toLocaleString('vi-VN')} đ`;
}

// 6. TÌM KIẾM SẢN PHẨM
document.getElementById('searchInput')?.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase().trim();
    const select = document.getElementById('categorySelect');
    const currentCat = select ? select.value : 'Tất cả';
    
    let filtered = allProducts;
    if (currentCat !== 'Tất cả') filtered = filtered.filter(p => p.category === currentCat);
    if (keyword !== '') filtered = filtered.filter(p => p.name.toLowerCase().includes(keyword));
    renderProducts(filtered);
});

// 7. SUBMIT FORM ĐƠN HÀNG (TỰ ĐỘNG LẤY TAG ĐỘNG TỪNG SẢN PHẨM GHÉP VÀO ĐƠN TRẢ VỀ)
document.getElementById('orderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (Object.keys(cart).length === 0) {
        alert("Giỏ hàng đang trống, Anh/Chị vui lòng chọn ít nhất 1 sản phẩm trước khi gửi đơn nha.");
        return;
    }
    
    const btn = document.getElementById('submitButton');
    const status = document.getElementById('submitStatus');
    if (btn) { btn.disabled = true; btn.innerText = "⏳ Đang gửi đơn hàng..."; }
    
    // TỰ ĐỘNG GHÉP TAG TỪNG SẢN PHẨM (Ví dụ: [VietPOM] Tên SP hoặc [HoneyLand] Tên SP)
    const itemsDetail = Object.keys(cart).map(id => {
        const item = cart[id];
        const prefixTag = item.tag ? (item.tag.startsWith('[') ? item.tag : `[${item.tag}]`) : '[VietPOM]';
        return `${prefixTag} ${item.name} (${item.qty} ${item.unit})`;
    }).join('\n');
    
    const subtotalAmount = Object.keys(cart).reduce((sum, id) => sum + (cart[id].price * cart[id].qty), 0);
    const shippingFee = (subtotalAmount > 0 && subtotalAmount < 1200000) ? 30000 : 0;
    const finalTotalAmount = subtotalAmount + shippingFee;
    
    const params = new URLSearchParams();
    params.append('action', 'submitOrder');
    params.append('name', document.getElementById('customerName')?.value || '');
    params.append('phone', document.getElementById('customerPhone')?.value || '');
    params.append('address', document.getElementById('customerAddress')?.value || '');
    params.append('taxId', document.getElementById('customerTaxId')?.value || '');
    params.append('note', document.getElementById('customerNote')?.value || '');
    params.append('items', itemsDetail); 
    params.append('shipping', shippingFee === 0 ? "Miễn phí" : `${shippingFee} đ`);
    params.append('total', `${finalTotalAmount.toLocaleString('vi-VN')} đ`);
    
    try {
        await fetch(CONFIG.SHEET_API, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        
        if (status) {
            status.className = "submit-status text-success";
            status.style.color = "#15558D";
            status.innerHTML = "🎉 <b>Gửi đơn thành công!</b> Hệ thống đã ghi nhận đơn hàng của Anh/Chị.";
            status.classList.remove('hidden');
        }
        cart = {};
        updateCartSummary();
        renderProducts(allProducts);
        e.target.reset();
        
    } catch (err) {
        console.error("Lỗi gửi đơn:", err);
    } finally {
        if (btn) { btn.disabled = false; btn.innerText = "Gửi đơn hàng ngay"; }
    }
});

document.addEventListener('DOMContentLoaded', fetchProducts);
