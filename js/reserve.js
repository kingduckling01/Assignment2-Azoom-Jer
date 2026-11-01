/* Reserve */


const reserveForm = document.getElementById("reserve-form");
const reserveLayout = document.getElementById("reserve-layout");
const alertBox = document.getElementById("form-alert");
const confirmationBox = document.getElementById("confirmation");

const carSelect = document.getElementById("car");
const pickupInput = document.getElementById("pickup");
const returnInput = document.getElementById("return");
const parkSelect = document.getElementById("park");
const dateHint = document.getElementById("date-hint");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const licenceInput = document.getElementById("licence");

const holderInput = document.getElementById("card-holder");
const numberInput = document.getElementById("card-number");
const expiryInput = document.getElementById("card-expiry");
const cvvInput = document.getElementById("card-cvv");

const submitButton = document.getElementById("submit-btn");

const normalHint = dateHint.textContent;


/* Price */

function updateSummary() {
    const car = findCar(carSelect.value);

    // If no car avail
    if (car === null) {
        document.getElementById("sum-car").textContent = "-";
        document.getElementById("sum-car-info").textContent = "";
        document.getElementById("sum-rate").textContent = "-";
        document.getElementById("sum-days").textContent = "-";
        document.getElementById("sum-rental").textContent = "-";
        document.getElementById("sum-deposit").textContent = "-";
        return;
    }

    document.getElementById("sum-car").textContent = car.name;
    document.getElementById("sum-car-info").textContent =
        car.category + " · " + car.seats + " seats · " + car.transmission;
    document.getElementById("sum-rate").textContent = money(car.pricePerDay) + " / day";

    const pickup = pickupInput.value;
    const returnDate = returnInput.value;

    if (pickup !== "" && returnDate !== "" && returnDate < pickup) {
        dateHint.textContent = "The return date cannot be before the pick-up date.";
        dateHint.classList.add("form-error");
    } else {
        dateHint.textContent = normalHint;
        dateHint.classList.remove("form-error");
    }

    if (pickup === "" || returnDate === "" || returnDate < pickup) {
        document.getElementById("sum-days").textContent = "-";
        document.getElementById("sum-rental").textContent = "-";
        document.getElementById("sum-deposit").textContent = "-";
        submitButton.textContent = "Reserve and pay deposit";
        return;
    }

    const quote = getQuote(car.id, pickup, returnDate);

    document.getElementById("sum-days").textContent = plural(quote.days, "day");
    document.getElementById("sum-rental").textContent = money(quote.rental);
    document.getElementById("sum-deposit").textContent = money(quote.deposit);
    submitButton.textContent = "Reserve and pay " + money(quote.deposit) + " deposit";
}


/* Submit */

reserveForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearAlert(alertBox);

    const details = {
        name: nameInput.value,
        email: emailInput.value,
        licence: licenceInput.value,
        carId: carSelect.value,
        pickupDate: pickupInput.value,
        returnDate: returnInput.value,
        parkId: parkSelect.value,
        card: {
            holder: holderInput.value,
            number: numberInput.value,
            expiry: expiryInput.value,
            cvv: cvvInput.value
        }
    };

    const result = reserveCar(details);

    if (result.error !== "") {
        showAlert(alertBox, result.error, "danger");
    } else {
        showConfirmation(result.booking);
    }
});


/*  Confirmation */

function showConfirmation(booking) {
    updateStepper(booking);
    const car = findCar(booking.carId);
    const park = findCarPark(booking.returnParkId);
    const days = daysBetween(booking.pickupDate, booking.returnDate);

    confirmationBox.innerHTML = `
        <p class="eyebrow">Reservation confirmed</p>
        <h2>Thank you, ${esc(booking.customerName)}</h2>
        <p class="lead">Your car is reserved. Keep your booking ID: you will need it at the office.</p>

        <div class="booking-id">
            <span>Booking ID</span>
            <strong>${esc(booking.id)}</strong>
        </div>

        <dl class="summary-rows confirm-rows">
            <div><dt>Car</dt><dd>${esc(car.name)}</dd></div>
            <div><dt>Pick-up</dt><dd>${formatDate(booking.pickupDate)} at the AZoom office</dd></div>
            <div><dt>Return by</dt><dd>${formatDate(booking.returnDate)}, ${data.settings.dueTime}</dd></div>
            <div><dt>Return car park</dt><dd>${esc(park.name)}<br><small>${esc(park.address)}</small></dd></div>
            <div><dt>Rental total</dt><dd>${money(booking.rentalAmount)} (${plural(days, "day")})</dd></div>
            <div class="summary-deposit"><dt>Deposit charged</dt>
                <dd>${money(booking.deposit)} to card ending ${esc(booking.cardLast4)}</dd></div>
        </dl>

        <p class="form-hint">The deposit will be deducted from your final bill.</p>

        <div class="confirm-actions">
            <a class="btn" href="rent.html" onclick="setCurrentBooking('${booking.id}')">Next: collect at the office</a>
            <a class="btn btn-outline" href="reserve.html">Reserve another car</a>
        </div>
    `;

    reserveLayout.hidden = true;
    confirmationBox.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
}




function applyReservationDraft() {
    const draft = getReservationDraft();
    if (draft === null) {
        return;
    }
    clearReservationDraft();

    const car = findCar(draft.carId);
    if (car !== null && car.status === "available") {
        carSelect.value = car.id;
    }
    if (findCarPark(draft.parkId) !== null) {
        parkSelect.value = draft.parkId;
    }
    if (draft.pickupDate !== "" && draft.pickupDate >= toDateString(new Date())) {
        pickupInput.value = draft.pickupDate;
        if (draft.returnDate >= draft.pickupDate) {
            returnInput.value = draft.returnDate;
        } else {
            returnInput.value = draft.pickupDate;
        }
    }
    nameInput.value = draft.name;
    emailInput.value = draft.email;
}

fillCarOptions(carSelect);
fillParkOptions(parkSelect);

// Block the form when every car is taken
const freeCars = data.cars.filter(function (car) {
    return car.status === "available";
});
if (freeCars.length === 0) {
    showAlert(alertBox, "Sorry, every car is currently reserved or rented. Try again later.", "danger");
    submitButton.disabled = true;
}

setDefaultDates(pickupInput, returnInput);
applyReservationDraft();

carSelect.addEventListener("change", updateSummary);
pickupInput.addEventListener("change", function () {
    syncReturnDate(pickupInput, returnInput);
    updateSummary();
});
returnInput.addEventListener("change", updateSummary);

updateSummary();
