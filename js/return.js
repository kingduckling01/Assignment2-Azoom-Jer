/* Return */


const alertBox = document.getElementById("page-alert");
const lookupCard = document.getElementById("lookup-card");
const lookupForm = document.getElementById("lookup-form");
const bookingIdInput = document.getElementById("booking-id");
const bookingCard = document.getElementById("booking-card");
const bookingDetails = document.getElementById("booking-details");
const returnForm = document.getElementById("return-form");
const parkSelect = document.getElementById("park");
const returnTimeInput = document.getElementById("return-time");
const latePreview = document.getElementById("late-preview");
const confirmationBox = document.getElementById("confirmation");
const outRows = document.getElementById("out-rows");


let currentBooking = null;

const notOutMessages = {
    reserved: "This car has not been collected yet. Collect it on the Rent page first.",
    returned: "This car has already been returned and is waiting for inspection.",
    inspected: "This car has already been returned and inspected.",
    paid: "This rental is finished and has been paid."
};

function toDateTimeInputValue(date) {
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    return toDateString(date) + "T" + hours + ":" + minutes;
}


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

    if (booking.status !== "rented") {
        showAlert(alertBox, "Booking " + booking.id + ": " + notOutMessages[booking.status], "danger");
        return;
    }

    currentBooking = booking;
    showBooking(booking);
}

function showBooking(booking) {
    const car = findCar(booking.carId);
    const bookedPark = findCarPark(booking.returnParkId);

    bookingDetails.innerHTML =
        detailRow("Booking ID", esc(booking.id) + " " + badge(booking.status)) +
        detailRow("Customer", esc(booking.customerName)) +
        detailRow("Car", esc(car.name)) +
        detailRow("Collected", formatDateTime(booking.rentedAt)) +
        detailRow("Due back", formatDate(booking.returnDate) + ", " + data.settings.dueTime) +
        detailRow("Booked return car park", esc(bookedPark.name));

    fillParkOptions(parkSelect);
    parkSelect.value = booking.returnParkId;

    returnTimeInput.value = toDateTimeInputValue(new Date());
    updateLatePreview();
    bookingCard.hidden = false;
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


/* Late fee preview */

function updateLatePreview() {
    if (currentBooking === null) {
        return;
    }

    const returnedAt = new Date(returnTimeInput.value);

    if (returnTimeInput.value === "" || isNaN(returnedAt.getTime())) {
        latePreview.className = "alert alert-info";
        latePreview.textContent = "Choose the return date and time.";
        return;
    }

    const lateHours = getLateHours(currentBooking, returnedAt);

    if (lateHours === 0) {
        latePreview.className = "alert alert-success";
        latePreview.textContent = "Returned on time. No late fee.";
    } else {
        const fee = lateHours * data.settings.lateFeePerHour;
        latePreview.className = "alert alert-warning";
        latePreview.textContent = plural(lateHours, "hour") + " late. Late fee: " + money(fee) + ".";
    }
}

returnTimeInput.addEventListener("input", updateLatePreview);
returnTimeInput.addEventListener("change", updateLatePreview);


/* Return  */

returnForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearAlert(alertBox);

    if (currentBooking === null) {
        return;
    }

    const returnedAt = new Date(returnTimeInput.value);
    const error = returnCar(currentBooking.id, parkSelect.value, returnedAt);

    if (error !== "") {
        showAlert(alertBox, error, "danger");
    } else {
        showConfirmation(currentBooking);
    }
});

function showConfirmation(booking) {
    updateStepper(booking);
    const car = findCar(booking.carId);
    const park = findCarPark(booking.returnedParkId);

    let lateText = "None (returned on time)";
    if (booking.lateHours > 0) {
        lateText = booking.lateHours + " hr, fee " + money(booking.lateHours * data.settings.lateFeePerHour);
    }

    confirmationBox.innerHTML = `
        <p class="eyebrow">Car returned</p>
        <h2>Thank you, ${esc(booking.customerName)}</h2>
        <p class="lead">The ${esc(car.name)} is back with us and is now waiting for inspection by AZoom staff.</p>

        <dl class="summary-rows confirm-rows">
            ${detailRow("Booking ID", esc(booking.id) + " " + badge(booking.status))}
            ${detailRow("Returned", formatDateTime(booking.returnedAt))}
            ${detailRow("Return car park", esc(park.name) + "<br><small>" + esc(park.address) + "</small>")}
            ${detailRow("Late fee", lateText)}
        </dl>

        <p class="form-hint">Your final bill will be ready once the car has been inspected. Any late fee
            or damage charges are added to it, and your deposit of ${money(booking.deposit)} is deducted.</p>

        <div class="confirm-actions">
            <a class="btn" href="inspect.html" onclick="setCurrentBooking('${booking.id}')">Next: staff inspection</a>
            <a class="btn btn-outline" href="return.html">Return another car</a>
        </div>
    `;

    lookupCard.hidden = true;
    bookingCard.hidden = true;
    confirmationBox.hidden = false;
    showOutTable();
    window.scrollTo({ top: 0, behavior: "smooth" });
}


/*  Table of cars out on the road  */

function showOutTable() {
    const out = getBookingsByStatus("rented");

    if (out.length === 0) {
        outRows.innerHTML = '<tr><td colspan="6">No cars are out on the road.</td></tr>';
        return;
    }

    outRows.innerHTML = "";
    out.forEach(function (booking) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${esc(booking.id)}</td>
            <td>${esc(booking.customerName)}</td>
            <td>${esc(findCar(booking.carId).name)}</td>
            <td>${formatDate(booking.returnDate)}, ${data.settings.dueTime}</td>
            <td>${badge(booking.status)}</td>
            <td><button type="button" class="btn btn-outline btn-small"
                onclick="selectBooking('${booking.id}')">Select</button></td>
        `;
        outRows.appendChild(row);
    });
}




showOutTable();


const bookingFromPreviousPage = getCurrentBooking();
if (bookingFromPreviousPage !== "") {
    bookingIdInput.value = bookingFromPreviousPage;
    lookupBooking(bookingFromPreviousPage);
    clearCurrentBooking();
}
