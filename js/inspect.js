/* Employee inspection*/


const alertBox = document.getElementById("page-alert");
const loginCard = document.getElementById("login-card");
const loginForm = document.getElementById("login-form");
const pinInput = document.getElementById("pin");
const inspectArea = document.getElementById("inspect-area");
const bookingCard = document.getElementById("booking-card");
const bookingDetails = document.getElementById("booking-details");
const inspectForm = document.getElementById("inspect-form");
const damageList = document.getElementById("damage-list");
const notesInput = document.getElementById("notes");
const damageTotal = document.getElementById("damage-total");
const confirmationBox = document.getElementById("confirmation");
const waitingRows = document.getElementById("waiting-rows");


let currentBooking = null;


/* Login  */

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearAlert(alertBox);

    const error = loginEmployee(pinInput.value.trim());

    if (error !== "") {
        showAlert(alertBox, error, "danger");
        pinInput.value = "";
    } else {
        window.location.reload();
    }
});


function selectBooking(id) {
    clearAlert(alertBox);
    updateStepper(null);
    confirmationBox.hidden = true;

    const booking = findBooking(id);

    if (booking === null || booking.status !== "returned") {
        showAlert(alertBox, "That booking is not waiting for inspection.", "danger");
        return;
    }

    currentBooking = booking;
    showBooking(booking);
    bookingCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showBooking(booking) {
    const car = findCar(booking.carId);
    const park = findCarPark(booking.returnedParkId);

    let lateText = "None";
    if (booking.lateHours > 0) {
        lateText = booking.lateHours + " hr (" + money(booking.lateHours * data.settings.lateFeePerHour) + ")";
    }

    bookingDetails.innerHTML =
        detailRow("Booking ID", esc(booking.id) + " " + badge(booking.status)) +
        detailRow("Customer", esc(booking.customerName)) +
        detailRow("Car", esc(car.name)) +
        detailRow("Returned", formatDateTime(booking.returnedAt)) +
        detailRow("Returned at", esc(park.name)) +
        detailRow("Late return", lateText);

    damageList.innerHTML = "";
    data.damageTypes.forEach(function (type) {
        const label = document.createElement("label");
        label.className = "check-item";
        label.innerHTML = `
            <input type="checkbox" name="damage" value="${esc(type.id)}" onchange="updateDamageTotal()">
            <span>${esc(type.label)}</span>
            <strong>${money(type.fee)}</strong>
        `;
        damageList.appendChild(label);
    });

    notesInput.value = "";
    updateDamageTotal();
    bookingCard.hidden = false;
}

function getTickedDamages() {
    const boxes = damageList.querySelectorAll("input[type=checkbox]");
    const ids = [];
    boxes.forEach(function (box) {
        if (box.checked) {
            ids.push(box.value);
        }
    });
    return ids;
}

function updateDamageTotal() {
    const ids = getTickedDamages();

    if (ids.length === 0) {
        damageTotal.className = "alert alert-success";
        damageTotal.textContent = "No damage ticked. The car will be marked available.";
        return;
    }

    let total = 0;
    ids.forEach(function (id) {
        total = total + findById(data.damageTypes, id).fee;
    });

    damageTotal.className = "alert alert-warning";
    damageTotal.textContent = ids.length + " damage item(s), " + money(total) +
        " before GST. The car will go to maintenance.";
}




inspectForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearAlert(alertBox);

    if (currentBooking === null) {
        return;
    }

    const error = inspectCar(currentBooking.id, getTickedDamages(), notesInput.value);

    if (error !== "") {
        showAlert(alertBox, error, "danger");
    } else {
        showConfirmation(currentBooking);
    }
});

function showConfirmation(booking) {
    updateStepper(booking);
    const car = findCar(booking.carId);

    let damageText = "No damage found";
    let carText = "Available for rent";
    if (booking.damages.length > 0) {
        const names = booking.damages.map(function (damage) {
            return esc(damage.label) + " (" + money(damage.fee) + ")";
        });
        damageText = names.join("<br>");
        carText = "In maintenance";
    }

    let notesText = "None";
    if (booking.inspectionNotes !== "") {
        notesText = esc(booking.inspectionNotes);
    }

    confirmationBox.innerHTML = `
        <p class="eyebrow">Inspection saved</p>
        <h2>${esc(car.name)} inspected</h2>
        <p class="lead">The booking is now ready for the customer's final bill.</p>

        <dl class="summary-rows confirm-rows">
            ${detailRow("Booking ID", esc(booking.id) + " " + badge(booking.status))}
            ${detailRow("Customer", esc(booking.customerName))}
            ${detailRow("Damage", damageText)}
            ${detailRow("Notes", notesText)}
            ${detailRow("Car status", carText + " " + badge(car.status))}
            ${detailRow("Inspected by", esc(booking.inspectedBy))}
        </dl>

        <div class="confirm-actions">
            <a class="btn" href="payment.html" onclick="setCurrentBooking('${booking.id}')">Next: final bill</a>
            <a class="btn btn-outline" href="inspect.html">Inspect another car</a>
        </div>
    `;

    bookingCard.hidden = true;
    confirmationBox.hidden = false;
    showWaitingTable();
    window.scrollTo({ top: 0, behavior: "smooth" });
}


/* Inspection Table */

function showWaitingTable() {
    const waiting = getBookingsByStatus("returned");

    if (waiting.length === 0) {
        waitingRows.innerHTML = '<tr><td colspan="6">No cars are waiting for inspection.</td></tr>';
        return;
    }

    waitingRows.innerHTML = "";
    waiting.forEach(function (booking) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${esc(booking.id)}</td>
            <td>${esc(booking.customerName)}</td>
            <td>${esc(findCar(booking.carId).name)}</td>
            <td>${formatDateTime(booking.returnedAt)}</td>
            <td>${badge(booking.status)}</td>
            <td><button type="button" class="btn btn-outline btn-small"
                onclick="selectBooking('${booking.id}')">Select</button></td>
        `;
        waitingRows.appendChild(row);
    });
}



if (getLoggedInEmployee() === null) {
    // Only the login card is shown.
    loginCard.hidden = false;
} else {
    inspectArea.hidden = false;
    showWaitingTable();

    // Arriving from the Return page: open that booking.
    const bookingFromPreviousPage = getCurrentBooking();
    if (bookingFromPreviousPage !== "") {
        clearCurrentBooking();
        selectBooking(bookingFromPreviousPage);
    }
}
