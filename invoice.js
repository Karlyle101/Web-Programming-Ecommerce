function renderInvoice(invoice) {
    const allInvoices = getAllInvoices();

    document.getElementById("invoiceNumberBadge").textContent = invoice.invoiceNumber;
    document.getElementById("invoiceDateBadge").textContent = new Date(invoice.invoiceDate).toLocaleDateString();
    document.getElementById("storedInvoiceCount").textContent = String(allInvoices.length);

    document.getElementById("invoiceNumber").textContent = invoice.invoiceNumber;
    document.getElementById("invoiceDate").textContent = new Date(invoice.invoiceDate).toLocaleDateString();
    document.getElementById("invoiceTrn").textContent = invoice.trn;

    document.getElementById("shipName").textContent = invoice.shipping.fullName;
    document.getElementById("shipEmail").textContent = invoice.shipping.email;
    document.getElementById("shipPhone").textContent = invoice.shipping.phone;
    document.getElementById("shipAddress").textContent = `${invoice.shipping.address}, ${invoice.shipping.parish}`;

    const itemsBody = document.getElementById("invoiceItems");
    itemsBody.innerHTML = "";

    invoice.items.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${currency(item.subtotal)}</td>
            <td>${currency(item.discount)}</td>
            <td>${currency(item.tax)}</td>
            <td>${currency(item.total)}</td>
        `;
        itemsBody.appendChild(row);
    });

    document.getElementById("summarySubtotal").textContent = currency(invoice.pricing.subtotal);
    document.getElementById("summaryDiscount").textContent = `- ${currency(invoice.pricing.discount)}`;
    document.getElementById("summaryTax").textContent = currency(invoice.pricing.tax);
    document.getElementById("summaryTotal").textContent = currency(invoice.pricing.total);
    document.getElementById("summaryPaid").textContent = currency(invoice.payment.amountPaid);
    document.getElementById("summaryChange").textContent = currency(invoice.payment.changeDue);
    document.getElementById("summaryMethod").textContent = invoice.payment.method;

    const invoiceHistoryCard = document.getElementById("invoiceHistoryCard");
    const invoiceHistoryList = document.getElementById("invoiceHistoryList");
    invoiceHistoryList.innerHTML = "";

    allInvoices
        .slice()
        .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
        .slice(0, 5)
        .forEach((storedInvoice) => {
            const item = document.createElement("div");
            item.className = "invoice-link-row";
            item.innerHTML = `
                <div class="stat-row">
                    <span>${storedInvoice.invoiceNumber} - ${storedInvoice.trn}</span>
                    <strong>${currency(storedInvoice.pricing.total)}</strong>
                </div>
                <div class="stat-row">
                    <span>${new Date(storedInvoice.invoiceDate).toLocaleDateString()}</span>
                    <button class="text-button" type="button" data-invoice-number="${storedInvoice.invoiceNumber}">View Invoice</button>
                </div>
            `;
            invoiceHistoryList.appendChild(item);
        });

    invoiceHistoryCard.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
    const invoice =
        ensureInvoiceForPendingCheckout() ||
        getSelectedInvoice() ||
        readStorage("LastInvoice", null);

    if (!invoice) {
        document.getElementById("emptyInvoiceState").classList.remove("hidden");
        return;
    }

    document.getElementById("invoiceContent").classList.remove("hidden");
    renderInvoice(invoice);

    document.getElementById("invoiceHistoryList").addEventListener("click", (event) => {
        const target = event.target;

        if (!(target instanceof HTMLButtonElement) || !target.dataset.invoiceNumber) {
            return;
        }

        setSelectedInvoice(target.dataset.invoiceNumber);
        window.location.href = "invoice.html";
    });
});
