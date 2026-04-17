function createBarRows(containerId, dataMap) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const values = Object.values(dataMap);
    const maxValue = values.length ? Math.max(...values, 1) : 1;

    Object.entries(dataMap).forEach(([label, count]) => {
        const row = document.createElement("div");
        row.className = "bar-row";
        row.innerHTML = `
            <div class="stat-row"><span>${label}</span><strong>${count}</strong></div>
            <div class="bar-track">
                <div class="bar-fill" style="width: ${(count / maxValue) * 100}%"></div>
            </div>
        `;
        container.appendChild(row);
    });
}

function showUserFrequency(users) {
    const userFrequency = {};

    users.forEach((user) => {
        const fullName = `${user.firstName} ${user.lastName}`;
        const invoiceCount = Array.isArray(user.invoices) ? user.invoices.length : 0;
        userFrequency[fullName] = invoiceCount;
    });

    createBarRows("frequencyChart", userFrequency);
}

function renderGenderChart(users) {
    const genderStats = { Male: 0, Female: 0, Other: 0 };

    users.forEach((user) => {
        if (genderStats[user.gender] !== undefined) {
            genderStats[user.gender] += 1;
        }
    });

    createBarRows("genderChart", genderStats);
}

function renderAgeChart(users) {
    const ageGroups = {
        "18-25": 0,
        "26-35": 0,
        "36-50": 0,
        "50+": 0
    };

    users.forEach((user) => {
        const age = calculateAge(user.dob);
        const group = getAgeGroup(age);
        ageGroups[group] += 1;
    });

    createBarRows("ageChart", ageGroups);
}

function renderInvoiceFeatures(invoices) {
    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.pricing.total, 0);
    const averageInvoice = invoices.length ? totalRevenue / invoices.length : 0;
    const invoiceFeatures = document.getElementById("invoiceFeatures");

    invoiceFeatures.innerHTML = `
        <div class="stat-row"><span>Total Invoices</span><strong>${invoices.length}</strong></div>
        <div class="stat-row"><span>Total Revenue</span><strong>${currency(totalRevenue)}</strong></div>
        <div class="stat-row"><span>Average Invoice</span><strong>${currency(averageInvoice)}</strong></div>
    `;
}

function renderInvoiceTable(invoices) {
    const body = document.getElementById("invoiceTableBody");
    body.innerHTML = "";

    invoices.forEach((invoice) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${invoice.invoiceNumber}</td>
            <td>${invoice.trn}</td>
            <td>${invoice.customer.firstName} ${invoice.customer.lastName}</td>
            <td>${new Date(invoice.invoiceDate).toLocaleDateString()}</td>
            <td>${currency(invoice.pricing.total)}</td>
            <td>${invoice.customer.gender || "-"}</td>
            <td>${invoice.customer.ageGroup || "-"}</td>
            <td><button class="text-button" type="button" data-invoice-number="${invoice.invoiceNumber}">View</button></td>
        `;
        body.appendChild(row);
    });
}

function showInvoices(filteredInvoices) {
    console.log("ShowInvoices()", filteredInvoices);
    renderInvoiceTable(filteredInvoices);
}

function getUserInvoices(trn) {
    const user = getUserByTrn(trn);
    const result = document.getElementById("userInvoicesResult");
    result.innerHTML = "";

    if (!user) {
        result.innerHTML = "<p class='muted'>No registered user was found with that TRN.</p>";
        return;
    }

    const invoices = Array.isArray(user.invoices) ? user.invoices : [];
    console.log("GetUserInvoices()", trn, invoices);

    if (!invoices.length) {
        result.innerHTML = `<p class='muted'>${user.firstName} ${user.lastName} has no invoices yet.</p>`;
        return;
    }

    invoices.forEach((invoice) => {
        const item = document.createElement("div");
        item.className = "invoice-link-row";
        item.innerHTML = `
            <div class="stat-row">
                <span>${invoice.invoiceNumber} - ${new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                <strong>${currency(invoice.pricing.total)}</strong>
            </div>
            <div class="stat-row">
                <span>${invoice.trn}</span>
                <button class="text-button" type="button" data-invoice-number="${invoice.invoiceNumber}">View Invoice</button>
            </div>
        `;
        result.appendChild(item);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const users = getUsers();
    const invoices = getAllInvoices();

    document.getElementById("registeredUsersCount").textContent = String(users.length);
    document.getElementById("storedInvoicesCount").textContent = String(invoices.length);

    showUserFrequency(users);
    renderGenderChart(users);
    renderAgeChart(users);
    renderInvoiceFeatures(invoices);
    showInvoices(invoices);

    document.getElementById("searchButton").addEventListener("click", () => {
        const searchValue = document.getElementById("searchTRN").value.trim().toLowerCase();
        const filtered = invoices.filter((invoice) => invoice.trn.toLowerCase().includes(searchValue));
        showInvoices(filtered);
    });

    document.getElementById("clearSearchButton").addEventListener("click", () => {
        document.getElementById("searchTRN").value = "";
        showInvoices(invoices);
    });

    document.getElementById("loadUserInvoicesButton").addEventListener("click", () => {
        const trn = document.getElementById("userInvoiceTrn").value.trim();
        getUserInvoices(trn);
    });

    document.getElementById("invoiceTableBody").addEventListener("click", (event) => {
        const target = event.target;

        if (!(target instanceof HTMLButtonElement) || !target.dataset.invoiceNumber) {
            return;
        }

        setSelectedInvoice(target.dataset.invoiceNumber);
        window.location.href = "invoice.html";
    });

    document.getElementById("userInvoicesResult").addEventListener("click", (event) => {
        const target = event.target;

        if (!(target instanceof HTMLButtonElement) || !target.dataset.invoiceNumber) {
            return;
        }

        setSelectedInvoice(target.dataset.invoiceNumber);
        window.location.href = "invoice.html";
    });
});
