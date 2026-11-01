/* Payment */


const alertBox = document.getElementById("page-alert");
const lookupCard = document.getElementById("lookup-card");
const lookupForm = document.getElementById("lookup-form");
const bookingIdInput = document.getElementById("booking-id");
const billCard = document.getElementById("bill-card");
const bookingDetails = document.getElementById("booking-details");
const billRows = document.getElementById("bill-rows");
const billTotals = document.getElementById("bill-totals");
const payForm = document.getElementById("pay-form");
const payButton = document.getElementById("pay-btn");
const receiptBox = document.getElementById("receipt");
const unpaidRows = document.getElementById("unpaid-rows");

const holderInput = document.getElementById("card-holder");
const numberInput = document.getElementById("card-number");
const expiryInput = document.getElementById("card-expiry");
const cvvInput = document.getElementById("card-cvv");

let currentBooking = null;

const notReadyMessages = {
    reserved: "This car has not been collected yet, so there is nothing to pay.",
    rented: "This car is still out on the road. Return it first.",
    returned: "This car is waiting for inspection by AZoom staff. Your bill will be ready afterwards."
};

// Receipt ID
function receiptNumber(booking) {
    return "RC" + booking.id.slice(2);
}

function billLineRows(bill) {
    let rows = "";
    bill.lines.forEach(function (line) {
        rows = rows + "<tr><td>" + esc(line.label) + '</td><td class="amount">' + money(line.amount) + "</td></tr>";
    });
    return rows;
}

function billTotalRows(bill, lastLabel, lastAmount) {
    return "<tr><td>Subtotal</td><td class=\"amount\">" + money(bill.subtotal) + "</td></tr>" +
        "<tr><td>GST (" + Math.round(data.settings.gstRate * 100) + "%)</td><td class=\"amount\">" + money(bill.gst) + "</td></tr>" +
        "<tr><td>Total</td><td class=\"amount\">" + money(bill.total) + "</td></tr>" +
        "<tr><td>Less deposit already paid</td><td class=\"amount\">-" + money(bill.deposit) + "</td></tr>" +
        "<tr class=\"amount-due\"><td>" + lastLabel + "</td><td class=\"amount\">" + money(lastAmount) + "</td></tr>";
}


/* Find Booking */

function lookupBooking(id) {
    clearAlert(alertBox);
    updateStepper(null);
    billCard.hidden = true;
    receiptBox.hidden = true;
    currentBooking = null;

    const booking = findBooking(id);

    if (booking === null) {
        showAlert(alertBox, "We couldn't find a booking with ID \"" + id.trim() + "\". Check it and try again.", "danger");
        return;
    }

    if (booking.status === "paid") {
        showReceipt(booking);
        return;
    }

    if (booking.status !== "inspected") {
        showAlert(alertBox, "Booking " + booking.id + ": " + notReadyMessages[booking.status], "danger");
        return;
    }

    currentBooking = booking;
    showBill(booking);
}

lookupForm.addEventListener("submit", function (event) {
    event.preventDefault();
    lookupBooking(bookingIdInput.value);
});

function selectBooking(id) {
    bookingIdInput.value = id;
    lookupBooking(id);
    billCard.scrollIntoView({ behavior: "smooth", block: "start" });
}


/* Bill */

function showBill(booking) {
    const car = findCar(booking.carId);
    const bill = getBill(booking.id);

    bookingDetails.innerHTML =
        detailRow("Booking ID", esc(booking.id) + " " + badge(booking.status)) +
        detailRow("Customer", esc(booking.customerName)) +
        detailRow("Car", esc(car.name)) +
        detailRow("Rental period", formatDate(booking.pickupDate) + " to " + formatDate(booking.returnDate));

    billRows.innerHTML = billLineRows(bill);
    billTotals.innerHTML = billTotalRows(bill, "Amount due", bill.amountDue);

    payButton.textContent = "Pay " + money(bill.amountDue);
    billCard.hidden = false;
}


/* Pay */

payForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearAlert(alertBox);

    if (currentBooking === null) {
        return;
    }

    const card = {
        holder: holderInput.value,
        number: numberInput.value,
        expiry: expiryInput.value,
        cvv: cvvInput.value
    };

    const error = payBill(currentBooking.id, card);

    if (error !== "") {
        showAlert(alertBox, error, "danger");
    } else {
        showReceipt(currentBooking);
    }
});


/* Receipt */

function showReceipt(booking) {
    updateStepper(booking);
    const car = findCar(booking.carId);
    const bill = getBill(booking.id);

    receiptBox.innerHTML = `
        <p class="eyebrow">Payment received</p>
        <h2>Thank you, ${esc(booking.customerName)}</h2>
        <p class="lead">Your rental is complete and paid in full. We hope to see you again soon.</p>

        <div class="booking-id">
            <span>Receipt no.</span>
            <strong>${receiptNumber(booking)}</strong>
        </div>

        <dl class="summary-rows confirm-rows">
            ${detailRow("Booking ID", esc(booking.id) + " " + badge(booking.status))}
            ${detailRow("Car", esc(car.name))}
            ${detailRow("Paid on", formatDateTime(booking.paidAt))}
            ${detailRow("Inspected by", esc(booking.inspectedBy))}
        </dl>

        <div class="table-wrap">
            <table class="table">
                <thead><tr><th>Item</th><th class="amount">Amount</th></tr></thead>
                <tbody>${billLineRows(bill)}</tbody>
                <tfoot>${billTotalRows(bill, "Amount paid", booking.amountPaid)}</tfoot>
            </table>
        </div>

        <div class="confirm-actions">
            <a class="btn" href="reserve.html">Reserve another car</a>
            <a class="btn btn-outline" href="index.html">Back to home</a>
        </div>
    `;

    lookupCard.hidden = true;
    billCard.hidden = true;
    receiptBox.hidden = false;
    showUnpaidTable();
    window.scrollTo({ top: 0, behavior: "smooth" });
}


/* Payment Table */

function showUnpaidTable() {
    const ready = getBookingsByStatus("inspected");

    if (ready.length === 0) {
        unpaidRows.innerHTML = '<tr><td colspan="6">No bookings are waiting for payment.</td></tr>';
        return;
    }

    unpaidRows.innerHTML = "";
    ready.forEach(function (booking) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${esc(booking.id)}</td>
            <td>${esc(booking.customerName)}</td>
            <td>${esc(findCar(booking.carId).name)}</td>
            <td>${esc(booking.inspectedBy)}</td>
            <td>${badge(booking.status)}</td>
            <td><button type="button" class="btn btn-outline btn-small"
                onclick="selectBooking('${booking.id}')">Select</button></td>
        `;
        unpaidRows.appendChild(row);
    });
}




showUnpaidTable();

const bookingFromPreviousPage = getCurrentBooking();
if (bookingFromPreviousPage !== "") {
    bookingIdInput.value = bookingFromPreviousPage;
    lookupBooking(bookingFromPreviousPage);
    clearCurrentBooking();
}
