/* ========================================
   PERSON 3: CART PAGE
   Purpose: Render the current user's cart, allow quantity changes,
   removal, clearing, and calculate subtotal, discount, tax, and total.
   ======================================== */

const CART_TAX_RATE = 0.15;
const CART_DISCOUNT_RATE = 0.1;
const CART_DISCOUNT_QUANTITY = 3;

function readStorage(key, fallback) {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
}

function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function currency(amount) {
    return new Intl.NumberFormat("en-JM", {
        style: "currency",
        currency: "JMD",
        maximumFractionDigits: 2
    }).format(amount);
}

function getCurrentUser() {
    return readStorage("CurrentUser", null);
}

function syncCurrentUser(user) {
    const allUsers = readStorage("RegistrationData", []);
    const userIndex = allUsers.findIndex((storedUser) => storedUser.trn === user.trn);

    if (userIndex >= 0) {
        allUsers[userIndex] = user;
        writeStorage("RegistrationData", allUsers);
    }

    writeStorage("CurrentUser", user);
}

function getLineSubtotal(item) {
    return item.price * item.quantity;
}

function getLineDiscount(item) {
    const subtotal = getLineSubtotal(item);
    return item.quantity >= CART_DISCOUNT_QUANTITY ? subtotal * CART_DISCOUNT_RATE : 0;
}

function calculateCartTotals(cart) {
    const subtotal = cart.reduce((sum, item) => sum + getLineSubtotal(item), 0);
    const discount = cart.reduce((sum, item) => sum + getLineDiscount(item), 0);
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * CART_TAX_RATE;
    const total = taxableAmount + tax;

    return {
        subtotal,
        discount,
        tax,
        total
    };
}

function updateSummary(cart) {
    const totals = calculateCartTotals(cart);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    document.getElementById("subtotalValue").textContent = currency(totals.subtotal);
    document.getElementById("discountValue").textContent = `- ${currency(totals.discount)}`;
    document.getElementById("taxValue").textContent = currency(totals.tax);
    document.getElementById("totalValue").textContent = currency(totals.total);
    document.getElementById("cartItemCount").textContent = String(itemCount);
}

function renderCart(cart) {
    const cartItems = document.getElementById("cartItems");
    cartItems.innerHTML = "";

    cart.forEach((item) => {
        const lineSubtotal = getLineSubtotal(item);
        const lineDiscount = getLineDiscount(item);
        const lineTax = (lineSubtotal - lineDiscount) * CART_TAX_RATE;
        const lineTotal = lineSubtotal - lineDiscount + lineTax;

        const article = document.createElement("article");
        article.className = "cart-item";
        article.innerHTML = `
            <div class="item-art" aria-hidden="true">${item.image || "🛍️"}</div>
            <div class="item-main">
                <h3>${item.name}</h3>
                <p class="muted">${item.description}</p>
                <div class="item-meta">
                    <span>Price: ${currency(item.price)}</span>
                    <span>Subtotal: ${currency(lineSubtotal)}</span>
                    <span>Discount: ${currency(lineDiscount)}</span>
                    <span>Tax: ${currency(lineTax)}</span>
                    <span>Total: ${currency(lineTotal)}</span>
                </div>
            </div>
            <div class="item-actions">
                <div class="quantity-controls">
                    <button type="button" data-action="decrease" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button type="button" data-action="increase" data-id="${item.id}">+</button>
                </div>
                <button class="danger-button" type="button" data-action="remove" data-id="${item.id}">Remove</button>
            </div>
        `;

        cartItems.appendChild(article);
    });
}

function showState(stateName) {
    document.getElementById("cartLayout").classList.add("hidden");
    document.getElementById("emptyState").classList.add("hidden");
    document.getElementById("guestState").classList.add("hidden");

    if (stateName === "cart") {
        document.getElementById("cartLayout").classList.remove("hidden");
    }

    if (stateName === "empty") {
        document.getElementById("emptyState").classList.remove("hidden");
    }

    if (stateName === "guest") {
        document.getElementById("guestState").classList.remove("hidden");
    }
}

function renderPage() {
    const user = getCurrentUser();

    if (!user) {
        showState("guest");
        return;
    }

    document.getElementById("cartUserName").textContent = `${user.firstName} ${user.lastName}`;

    const cart = Array.isArray(user.cart) ? user.cart : [];
    if (!cart.length) {
        document.getElementById("cartItemCount").textContent = "0";
        showState("empty");
        return;
    }

    showState("cart");
    renderCart(cart);
    updateSummary(cart);
}

function updateQuantity(itemId, change) {
    const user = getCurrentUser();
    if (!user) {
        return;
    }

    const cart = Array.isArray(user.cart) ? user.cart : [];
    const item = cart.find((cartItem) => cartItem.id === itemId);

    if (!item) {
        return;
    }

    item.quantity += change;

    if (item.quantity <= 0) {
        user.cart = cart.filter((cartItem) => cartItem.id !== itemId);
    } else {
        user.cart = cart;
    }

    syncCurrentUser(user);
    renderPage();
}

function removeItem(itemId) {
    const user = getCurrentUser();
    if (!user) {
        return;
    }

    user.cart = (user.cart || []).filter((item) => item.id !== itemId);
    syncCurrentUser(user);
    renderPage();
}

function clearCart() {
    const user = getCurrentUser();
    if (!user) {
        return;
    }

    user.cart = [];
    syncCurrentUser(user);
    renderPage();
}

function setupEvents() {
    const cartItems = document.getElementById("cartItems");
    const clearCartBtn = document.getElementById("clearCartBtn");

    cartItems.addEventListener("click", (event) => {
        const target = event.target;

        if (!(target instanceof HTMLButtonElement)) {
            return;
        }

        const itemId = Number(target.dataset.id);
        const action = target.dataset.action;

        if (action === "increase") {
            updateQuantity(itemId, 1);
        }

        if (action === "decrease") {
            updateQuantity(itemId, -1);
        }

        if (action === "remove") {
            removeItem(itemId);
        }
    });

    clearCartBtn.addEventListener("click", () => {
        clearCart();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderPage();
    setupEvents();
});
