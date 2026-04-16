/* ========================================
   PERSON 2: PRODUCT CATALOGUE
   Purpose: Display and manage the product store front.
   Uses localStorage keys: AllProducts, CurrentUser, RegistrationData.
   ======================================== */

const DEFAULT_PRODUCTS = [
    {
        id: 1,
        name: "Campus Backpack",
        price: 4200,
        description: "Water-resistant backpack with a padded laptop sleeve and side bottle holders.",
        image: "🎒"
    },
    {
        id: 2,
        name: "Wireless Headphones",
        price: 7800,
        description: "Bluetooth headphones with soft ear cushions and long battery life.",
        image: "🎧"
    },
    {
        id: 3,
        name: "Study Lamp",
        price: 2600,
        description: "Compact LED desk lamp with three light modes for late-night reading.",
        image: "💡"
    },
    {
        id: 4,
        name: "Smart Watch",
        price: 9500,
        description: "Daily activity tracker with timer, heart-rate support, and message alerts.",
        image: "⌚"
    },
    {
        id: 5,
        name: "Portable Charger",
        price: 3100,
        description: "Fast-charge power bank with dual USB ports for phones and tablets.",
        image: "🔋"
    },
    {
        id: 6,
        name: "Notebook Set",
        price: 1450,
        description: "Three ruled notebooks for classes, planning, and project notes.",
        image: "📓"
    }
];

function readStorage(key, fallback) {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
}

function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function seedProducts() {
    const existingProducts = readStorage("AllProducts", null);

    if (!Array.isArray(existingProducts) || existingProducts.length === 0) {
        writeStorage("AllProducts", DEFAULT_PRODUCTS);
        return DEFAULT_PRODUCTS;
    }

    return existingProducts;
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

function syncUserRecord(updatedUser) {
    const allUsers = readStorage("RegistrationData", []);
    const userIndex = allUsers.findIndex((user) => user.trn === updatedUser.trn);

    if (userIndex >= 0) {
        allUsers[userIndex] = updatedUser;
        writeStorage("RegistrationData", allUsers);
    }

    writeStorage("CurrentUser", updatedUser);
}

function showToast(message, isSuccess = true) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.background = isSuccess ? "var(--success)" : "#8d4429";
    toast.classList.remove("hidden");

    window.setTimeout(() => {
        toast.classList.add("hidden");
    }, 2400);
}

function updateWelcomeCard() {
    const welcomeUser = document.getElementById("welcomeUser");
    const currentUser = getCurrentUser();

    if (!currentUser) {
        welcomeUser.textContent = "Guest visitor";
        return;
    }

    welcomeUser.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
}

function renderProducts(products) {
    const productContainer = document.getElementById("productContainer");
    const noProducts = document.getElementById("noProducts");

    productContainer.innerHTML = "";

    if (!products.length) {
        noProducts.classList.remove("hidden");
        return;
    }

    noProducts.classList.add("hidden");

    products.forEach((product) => {
        const card = document.createElement("article");
        card.className = "product-card";
        card.innerHTML = `
            <div class="product-image" aria-hidden="true">${product.image}</div>
            <div class="product-body">
                <h2>${product.name}</h2>
                <p>${product.description}</p>
                <div class="product-meta">
                    <span class="price">${currency(product.price)}</span>
                    <button class="add-button" type="button" data-product-id="${product.id}">Add to Cart</button>
                </div>
            </div>
        `;

        productContainer.appendChild(card);
    });
}

function addToCart(productId) {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        showToast("Login first before adding products to the cart.", false);
        return;
    }

    const allProducts = readStorage("AllProducts", []);
    const selectedProduct = allProducts.find((product) => product.id === productId);

    if (!selectedProduct) {
        showToast("That product could not be found.", false);
        return;
    }

    const userCart = Array.isArray(currentUser.cart) ? currentUser.cart : [];
    const existingItem = userCart.find((item) => item.id === selectedProduct.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        userCart.push({
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: selectedProduct.price,
            description: selectedProduct.description,
            image: selectedProduct.image,
            quantity: 1
        });
    }

    currentUser.cart = userCart;
    syncUserRecord(currentUser);
    showToast(`${selectedProduct.name} added to cart.`);
}

function sortProducts(sortValue) {
    const products = [...readStorage("AllProducts", [])];

    if (sortValue === "low-high") {
        products.sort((a, b) => a.price - b.price);
    }

    if (sortValue === "high-low") {
        products.sort((a, b) => b.price - a.price);
    }

    renderProducts(products);
}

function setupEventListeners() {
    const priceFilter = document.getElementById("priceFilter");
    const logoutBtn = document.getElementById("logoutBtn");
    const productContainer = document.getElementById("productContainer");

    priceFilter.addEventListener("change", (event) => {
        sortProducts(event.target.value);
    });

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("CurrentUser");
        updateWelcomeCard();
        showToast("You have been logged out.");
    });

    productContainer.addEventListener("click", (event) => {
        const target = event.target;

        if (target instanceof HTMLButtonElement && target.dataset.productId) {
            addToCart(Number(target.dataset.productId));
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const products = seedProducts();
    updateWelcomeCard();
    renderProducts(products);
    setupEventListeners();
});
