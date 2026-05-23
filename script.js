/* ============================================================
   BỘ MÃ LOGIC GIỎ HÀNG VIETPOM - PHIÊN BẢN CHỐNG LỖI VALUE 100%
   ============================================================ */

let allProducts = [];
let cart = {};

// ĐƯỜNG DẪN WEB APP APPS SCRIPT ĐANG CHẠY CỦA ANH
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbxxNhKcTgxtPQCVtl1brMMF0Wr0jtYZex1ueG74WJpRfa6AyabrOuzOZX8bcM5aLFdMVA/exec";

// Hàm lấy giá trị an toàn từ các ô input, nếu không có ô đó thì trả về chuỗi rỗng chứ không sập code
function getInputValueSafely(id) {
    const element = document.getElementById(id);
    return element ? element.value : '';
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
            
            let tagStr = "";
            if (p.tag !== null && p.tag !== undefined) {
                tagStr = String(p.tag).trim().replace(/[\[\]]/g, ''); 
            }

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
    
    if (qty <= 0) {
        delete cart[id];
    } else {
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

// 7. SUBMIT FORM ĐƠN HÀNG (SỬ DỤNG HÀM LẤY GIÁ TRỊ AN TOÀN CHỐNG LỖI VALUE)
document.getElementById('orderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (Object.keys(cart).length === 0) {
        alert("Giỏ hàng đang trống, Anh/Chị vui lòng chọn ít nhất 1 sản phẩm trước khi gửi đơn nha.");
        return;
    }
    
    const btn = document.getElementById('submitButton');
    const status = document.getElementById('submitStatus');
    if (btn) { btn.disabled = true; btn.innerText = "⏳ Đang gửi đơn hàng..."; }
    
    const itemsDetail = Object.keys(cart).map(id => {
        const item = cart[id];
        let prefixTag = '[VietPOM]'; 
        if (item.tag && String(item.tag).trim() !== "" && String(item.tag).trim() !== "undefined") {
            const cleanTag = String(item.tag).trim();
            prefixTag = cleanTag.startsWith('[') ? cleanTag : `[${cleanTag}]`;
        }
        return `${prefixTag} ${item.name} (${item.qty} ${item.unit})`;
    }).join('\n');
    
    const subtotalAmount = Object.keys(cart).reduce((sum, id) => sum + (cart[id].price * cart[id].qty), 0);
    const shippingFee = (subtotalAmount > 0 && subtotalAmount < 1200000) ? 30000 : 0;
    const finalTotalAmount = subtotalAmount + shippingFee;
    
    // Đóng gói tham số an toàn bằng hàm bọc bảo vệ getInputValueSafely
    const urlParams = new URLSearchParams();
    urlParams.append('action', 'submitOrder');
    urlParams.append('name', getInputValueSafely('customerName'));
    urlParams.append('phone', getInputValueSafely('customerPhone'));
    urlParams.append('address', getInputValueSafely('customerAddress'));
    urlParams.append('taxId', getInputValueSafely('customerTaxId'));
    urlParams.append('note', getInputValueSafely('customerNote'));
    urlParams.append('items', itemsDetail); 
    urlParams.append('total', `${finalTotalAmount.toLocaleString('vi-VN')} đ`);
    
    try {
        const logStatus = document.getElementById('submitStatus');
        if (logStatus) { logStatus.innerText = "⏳ Hệ thống đang kết nối đường truyền..."; logStatus.classList.remove('hidden'); }

        await fetch(`${GOOGLE_SHEET_URL}?${urlParams.toString()}`, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: urlParams.toString()
        });
        
        if (status) {
            status.className = "submit-status text-success";
            status.style.color = "#15558D";
            status.innerHTML = "🎉 <b>Gửi đơn thành công!</b> Hệ thống đã ghi nhận đơn hàng của Anh/Chị.";
        }
        cart = {};
        updateCartSummary();
        renderProducts(allProducts);
        e.target.reset();
        
    } catch (err) {
        console.error("Lỗi gửi đơn:", err);
        if (status) {
            status.className = "submit-status text-danger";
            status.style.color = "red";
            status.innerText = "Lỗi đường truyền giao diện: " + err.toString();
        }
    } finally {
        if (btn) { btn.disabled = false; btn.innerText = "Gửi đơn hàng ngay"; }
    }
});

document.addEventListener('DOMContentLoaded', fetchProducts);
