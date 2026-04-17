/* ========================================
   CHECKOUT PAGE
   Purpose: Confirm shipping and payment details for the current cart
   and store checkout data for invoice generation.
   ======================================== */

const CHECKOUT_TAX_RATE = 0.15;
const CHECKOUT_DISCOUNT_RATE = 0.1;
const CHECKOUT_DISCOUNT_QUANTITY = 3;

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

function getProductImage(item) {
    const imageById = {
        1: "assets/images/products/backpack.jpeg",
        2: "assets/images/products/headphone.jpeg",
        3: "assets/images/products/lamp.webp",
        4: "assets/images/products/watch.jpeg",
        5: "assets/images/products/portable-charger.jpeg",
        6: "assets/images/products/notebook.jpg"
    };

    if (typeof item.image === "string" && item.image.includes("/")) {
        return item.image;
    }

    return imageById[item.id] || "";
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
    return item.quantity >= CHECKOUT_DISCOUNT_QUANTITY ? subtotal * CHECKOUT_DISCOUNT_RATE : 0;
}

function calculateTotals(cart) {
    const subtotal = cart.reduce((sum, item) => sum + getLineSubtotal(item), 0);
    const discount = cart.reduce((sum, item) => sum + getLineDiscount(item), 0);
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * CHECKOUT_TAX_RATE;
    const total = taxableAmount + tax;

    return { subtotal, discount, tax, total };
}

function showState(stateName) {
    document.getElementById("checkoutContent").classList.add("hidden");
    document.getElementById("checkoutGuestState").classList.add("hidden");
    document.getElementById("checkoutEmptyState").classList.add("hidden");

    if (stateName === "content") {
        document.getElementById("checkoutContent").classList.remove("hidden");
    }

    if (stateName === "guest") {
        document.getElementById("checkoutGuestState").classList.remove("hidden");
    }

    if (stateName === "empty") {
        document.getElementById("checkoutEmptyState").classList.remove("hidden");
    }
}

function renderSummary(cart) {
    const checkoutItems = document.getElementById("checkoutItems");
    const totals = calculateTotals(cart);
    const user = getCurrentUser();
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    checkoutItems.innerHTML = "";

    cart.forEach((item) => {
        const lineSubtotal = getLineSubtotal(item);
        const lineDiscount = getLineDiscount(item);
        const lineTax = (lineSubtotal - lineDiscount) * CHECKOUT_TAX_RATE;
        const lineTotal = lineSubtotal - lineDiscount + lineTax;

        const article = document.createElement("article");
        article.className = "cart-item";
        article.innerHTML = `
            <div class="item-art">
                <img src="${getProductImage(item)}" alt="${item.name}">
            </div>
            <div class="item-main">
                <h3>${item.name}</h3>
                <p class="muted">${item.description}</p>
                <div class="item-meta">
                    <span>Quantity: ${item.quantity}</span>
                    <span>Subtotal: ${currency(lineSubtotal)}</span>
                    <span>Discount: ${currency(lineDiscount)}</span>
                    <span>Tax: ${currency(lineTax)}</span>
                    <span>Total: ${currency(lineTotal)}</span>
                </div>
            </div>
        `;

        checkoutItems.appendChild(article);
    });

    document.getElementById("checkoutUserName").textContent = `${user.firstName} ${user.lastName}`;
    document.getElementById("checkoutItemCount").textContent = String(itemCount);
    document.getElementById("checkoutSubtotal").textContent = currency(totals.subtotal);
    document.getElementById("checkoutDiscount").textContent = `- ${currency(totals.discount)}`;
    document.getElementById("checkoutTax").textContent = currency(totals.tax);
    document.getElementById("checkoutTotal").textContent = currency(totals.total);

    return totals;
}

function showMessage(message, type) {
    const box = document.getElementById("checkoutMessage");
    box.className = `message-box ${type}`;
    box.textContent = message;
    box.classList.remove("hidden");
}

function hideMessage() {
    const box = document.getElementById("checkoutMessage");
    box.className = "hidden";
    box.textContent = "";
}

function buildCheckoutRecord(user, cart, totals, formData) {
    return {
        checkoutId: `CHK-${Date.now()}`,
        checkoutDate: new Date().toISOString(),
        status: "awaiting_invoice",
        trn: user.trn,
        customer: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        },
        shipping: {
            fullName: formData.get("fullName").trim(),
            phone: formData.get("phone").trim(),
            email: formData.get("email").trim().toLowerCase(),
            parish: formData.get("parish"),
            address: formData.get("address").trim(),
            notes: formData.get("notes").trim()
        },
        payment: {
            method: formData.get("paymentMethod"),
            amountPaid: Number(formData.get("amountPaid")),
            changeDue: Number(formData.get("amountPaid")) - totals.total
        },
        items: cart.map((item) => ({
            ...item,
            subtotal: getLineSubtotal(item),
            discount: getLineDiscount(item)
        })),
        pricing: totals
    };
}

function validateCheckout(formData, totals) {
    const requiredFields = [
        "fullName",
        "phone",
        "email",
        "parish",
        "address",
        "paymentMethod",
        "amountPaid"
    ];

    const hasEmptyField = requiredFields.some((field) => !String(formData.get(field)).trim());
    if (hasEmptyField) {
        return "All required checkout fields must be filled out.";
    }

    const amountPaid = Number(formData.get("amountPaid"));
    if (Number.isNaN(amountPaid) || amountPaid < totals.total) {
        return `Amount paid must be at least ${currency(totals.total)}.`;
    }

    return "";
}

function setupPage() {
    const user = getCurrentUser();

    if (!user) {
        showState("guest");
        return null;
    }

    const cart = Array.isArray(user.cart) ? user.cart : [];
    if (!cart.length) {
        showState("empty");
        return null;
    }

        showState("content");
        const totals = renderSummary(cart);

        document.getElementById("fullName").value = `${user.firstName} ${user.lastName}`;
        document.getElementById("phone").value = user.phone || "";
        document.getElementById("email").value = user.email || "";
        document.getElementById("amountPaid").value = totals.total.toFixed(2);

        return { user, cart, totals };
}

function setupForm(pageData) {
    const form = document.getElementById("checkoutForm");
    if (!form || !pageData) {
        return;
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        hideMessage();

        const latestUser = getCurrentUser();
        const latestCart = Array.isArray(latestUser?.cart) ? latestUser.cart : [];
        const latestTotals = calculateTotals(latestCart);
        const formData = new FormData(form);
        const validationError = validateCheckout(formData, latestTotals);

        if (validationError) {
            showMessage(validationError, "error");
            return;
        }

        const checkoutRecord = buildCheckoutRecord(latestUser, latestCart, latestTotals, formData);
        const allCheckouts = readStorage("AllCheckouts", []);
        allCheckouts.push(checkoutRecord);

        writeStorage("AllCheckouts", allCheckouts);
        writeStorage("PendingCheckout", checkoutRecord);

        latestUser.cart = [];
        latestUser.lastCheckoutId = checkoutRecord.checkoutId;
        syncCurrentUser(latestUser);

        form.reset();
        showMessage(
            `Checkout confirmed. Record ${checkoutRecord.checkoutId} is saved and ready for invoice generation.`,
            "success"
        );
        window.setTimeout(() => {
            window.location.href = "invoice.html";
        }, 1800);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const pageData = setupPage();
    setupForm(pageData);
});
