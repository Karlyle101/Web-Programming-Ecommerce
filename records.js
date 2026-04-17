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
    }).format(amount || 0);
}

function getUsers() {
    return readStorage("RegistrationData", []);
}

function getCurrentUser() {
    return readStorage("CurrentUser", null);
}

function calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age -= 1;
    }

    return age;
}

function getAgeGroup(age) {
    const numericAge = Number(age);

    if (numericAge >= 18 && numericAge <= 25) {
        return "18-25";
    }

    if (numericAge >= 26 && numericAge <= 35) {
        return "26-35";
    }

    if (numericAge >= 36 && numericAge <= 50) {
        return "36-50";
    }

    return "50+";
}

function getUserByTrn(trn) {
    return getUsers().find((user) => user.trn === trn) || null;
}

function getAllInvoices() {
    return readStorage("AllInvoices", []);
}

function getInvoiceByNumber(invoiceNumber) {
    return getAllInvoices().find((invoice) => invoice.invoiceNumber === invoiceNumber) || null;
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

function setSelectedInvoice(invoiceNumber) {
    writeStorage("SelectedInvoiceNumber", invoiceNumber);
}

function getSelectedInvoice() {
    const selectedInvoiceNumber = readStorage("SelectedInvoiceNumber", null);
    return selectedInvoiceNumber ? getInvoiceByNumber(selectedInvoiceNumber) : null;
}

function getInvoiceNumber() {
    return `INV-${Date.now()}`;
}

function updateStoredUser(updatedUser) {
    const users = getUsers();
    const userIndex = users.findIndex((user) => user.trn === updatedUser.trn);

    if (userIndex >= 0) {
        users[userIndex] = updatedUser;
        writeStorage("RegistrationData", users);
    }

    const currentUser = getCurrentUser();
    if (currentUser && currentUser.trn === updatedUser.trn) {
        writeStorage("CurrentUser", updatedUser);
    }
}

function createInvoiceFromCheckout(checkoutRecord) {
    const user = getUserByTrn(checkoutRecord.trn);
    const age = user ? calculateAge(user.dob) : null;

    return {
        invoiceNumber: getInvoiceNumber(),
        invoiceDate: new Date().toISOString(),
        checkoutId: checkoutRecord.checkoutId,
        companyName: "Campus Cart",
        trn: checkoutRecord.trn,
        customer: {
            firstName: checkoutRecord.customer.firstName,
            lastName: checkoutRecord.customer.lastName,
            email: checkoutRecord.customer.email,
            gender: user ? user.gender : "",
            age,
            ageGroup: age ? getAgeGroup(age) : ""
        },
        shipping: checkoutRecord.shipping,
        payment: checkoutRecord.payment,
        items: checkoutRecord.items.map((item) => ({
            ...item,
            tax: (item.subtotal - item.discount) * 0.15,
            total: item.subtotal - item.discount + (item.subtotal - item.discount) * 0.15
        })),
        pricing: checkoutRecord.pricing
    };
}

function ensureInvoiceForPendingCheckout() {
    const pendingCheckout = readStorage("PendingCheckout", null);
    if (!pendingCheckout) {
        return null;
    }

    const allInvoices = getAllInvoices();
    const existingInvoice = allInvoices.find((invoice) => invoice.checkoutId === pendingCheckout.checkoutId);
    if (existingInvoice) {
        writeStorage("LastInvoice", existingInvoice);
        localStorage.removeItem("PendingCheckout");
        return existingInvoice;
    }

    const invoice = createInvoiceFromCheckout(pendingCheckout);
    const updatedInvoices = [...allInvoices, invoice];
    writeStorage("AllInvoices", updatedInvoices);
    writeStorage("LastInvoice", invoice);

    const user = getUserByTrn(invoice.trn);
    if (user) {
        const currentInvoices = Array.isArray(user.invoices) ? user.invoices : [];
        user.invoices = [...currentInvoices, invoice];
        updateStoredUser(user);
    }

    const allCheckouts = readStorage("AllCheckouts", []);
    const updatedCheckouts = allCheckouts.map((checkout) => (
        checkout.checkoutId === pendingCheckout.checkoutId
            ? { ...checkout, status: "invoice_generated", invoiceNumber: invoice.invoiceNumber }
            : checkout
    ));
    writeStorage("AllCheckouts", updatedCheckouts);
    localStorage.removeItem("PendingCheckout");

    return invoice;
}
