/* Rent */


const alertBox = document.getElementById("page-alert");
const lookupCard = document.getElementById("lookup-card");
const lookupForm = document.getElementById("lookup-form");
const bookingIdInput = document.getElementById("booking-id");
const bookingCard = document.getElementById("booking-card");
const bookingDetails = document.getElementById("booking-details");
const collectForm = document.getElementById("collect-form");
const licenceInput = document.getElementById("licence");
const confirmationBox = document.getElementById("confirmation");
const waitingRows = document.getElementById("waiting-rows");

let currentBooking = null;


const notWaitingMessages = {
    rented: "This car has already been collected.",
    returned: "This car has already been returned.",
    inspected: "This rental is finished and waiting for payment.",
    paid: "This rental is finished and has been paid."
};


/* Find Booking */

function lookupBooking(id) {
    clearAlert(alertBox);
    updateStepper(null);
    bookingCard.hidden = true;
    confirmationBox.hidden = true;
    currentBooking = null;

    const booking = findBooking(id);

    if (booking === null) {
        showAlert(alertBox, "We couldn't find a booking with ID \"" + id.trim() + "\". Check it and try again.", "danger");
        return;
    }

    if (booking.status !== "reserved") {
        showAlert(alertBox, "Booking " + booking.id + ": " + notWaitingMessages[booking.status], "danger");
        return;
    }

    currentBooking = booking;
    showBooking(booking);
}

function showBooking(booking) {
    const car = findCar(booking.carId);
    const park = findCarPark(booking.returnParkId);

    bookingDetails.innerHTML =
        detailRow("Booking ID", esc(booking.id) + " " + badge(booking.status)) +
        detailRow("Customer", esc(booking.customerName)) +
        detailRow("Car", esc(car.name)) +
        detailRow("Pick-up date", formatDate(booking.pickupDate)) +
        detailRow("Return by", formatDate(booking.returnDate) + ", " + data.settings.dueTime) +
        detailRow("Return car park", esc(park.name)) +
        detailRow("Deposit paid", money(booking.deposit) + " (card ending " + esc(booking.cardLast4) + ")");

    licenceInput.value = "";
    bookingCard.hidden = false;
    licenceInput.focus();
}

lookupForm.addEventListener("submit", function (event) {
    event.preventDefault();
    lookupBooking(bookingIdInput.value);
});

function selectBooking(id) {
    bookingIdInput.value = id;
    lookupBooking(id);
    bookingCard.scrollIntoView({ behavior: "smooth", block: "start" });
}


/*  Collect  */

collectForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearAlert(alertBox);

    if (currentBooking === null) {
        return;
    }

    const error = collectCar(currentBooking.id, licenceInput.value);

    if (error !== "") {
        showAlert(alertBox, error, "danger");
    } else {
        showConfirmation(currentBooking);
    }
});

function showConfirmation(booking) {
    updateStepper(booking);
    const car = findCar(booking.carId);
    const park = findCarPark(booking.returnParkId);

    confirmationBox.innerHTML = `
        <p class="eyebrow">Car collected</p>
        <h2>Enjoy your drive, ${esc(booking.customerName)}</h2>
        <p class="lead">The ${esc(car.name)} is now rented to you.</p>

        <dl class="summary-rows confirm-rows">
            ${detailRow("Booking ID", esc(booking.id) + " " + badge(booking.status))}
            ${detailRow("Collected", formatDateTime(booking.rentedAt))}
            ${detailRow("Return by", formatDate(booking.returnDate) + ", " + data.settings.dueTime)}
            ${detailRow("Return car park", esc(park.name) + "<br><small>" + esc(park.address) + "</small>")}
        </dl>

        <p class="form-hint">Returning after ${data.settings.dueTime} on the return date costs
            ${money(data.settings.lateFeePerHour)} for each extra hour.</p>

        <div class="confirm-actions">
            <a class="btn" href="return.html" onclick="setCurrentBooking('${booking.id}')">Next: return the car</a>
            <a class="btn btn-outline" href="rent.html">Collect another booking</a>
        </div>
    `;

    lookupCard.hidden = true;
    bookingCard.hidden = true;
    confirmationBox.hidden = false;
    showWaitingTable();
    window.scrollTo({ top: 0, behavior: "smooth" });
}


/* Bookings Table */

function showWaitingTable() {
    const waiting = getBookingsByStatus("reserved");

    if (waiting.length === 0) {
        waitingRows.innerHTML = '<tr><td colspan="6">No bookings are waiting for collection.</td></tr>';
        return;
    }

    waitingRows.innerHTML = "";
    waiting.forEach(function (booking) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${esc(booking.id)}</td>
            <td>${esc(booking.customerName)}</td>
            <td>${esc(findCar(booking.carId).name)}</td>
            <td>${formatDate(booking.pickupDate)}</td>
            <td>${badge(booking.status)}</td>
            <td><button type="button" class="btn btn-outline btn-small"
                onclick="selectBooking('${booking.id}')">Select</button></td>
        `;
        waitingRows.appendChild(row);
    });
}



showWaitingTable();

const bookingFromPreviousPage = getCurrentBooking();
if (bookingFromPreviousPage !== "") {
    bookingIdInput.value = bookingFromPreviousPage;
    lookupBooking(bookingFromPreviousPage);
    clearCurrentBooking();
}
