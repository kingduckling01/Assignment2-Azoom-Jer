

/* ---------- Saving and loading ---------- */

// Working copy of all the arrays while the page is open.
let data = loadData();

function loadData() {
    const saved = localStorage.getItem("azoomData");
    if (saved !== null) {
        return JSON.parse(saved);
    }
    return JSON.parse(JSON.stringify(defaultData));
}

function saveData() {
    localStorage.setItem("azoomData", JSON.stringify(data));
}

// Back to the starting data ("Reset demo data").
function resetData() {
    localStorage.removeItem("azoomData");
    sessionStorage.clear();
    data = loadData();
    saveData();
}


/* ---------- Passing data between pages (sessionStorage) ---------- */

function setCurrentBooking(id) {
    sessionStorage.setItem("currentBookingId", id);
}

// Returns "" when there is none.
function getCurrentBooking() {
    const id = sessionStorage.getItem("currentBookingId");
    if (id === null) {
        return "";
    }
    return id;
}

function clearCurrentBooking() {
    sessionStorage.removeItem("currentBookingId");
}

// What the landing page chose, for the Reserve page to pre-fill:
// { carId, parkId, pickupDate, returnDate, name, email }
function saveReservationDraft(draft) {
    sessionStorage.setItem("reservationDraft", JSON.stringify(draft));
}

// Returns null when there is none.
function getReservationDraft() {
    const saved = sessionStorage.getItem("reservationDraft");
    if (saved === null) {
        return null;
    }
    return JSON.parse(saved);
}

function clearReservationDraft() {
    sessionStorage.removeItem("reservationDraft");
}


/* ---------- Employee login ---------- */

function loginEmployee(pin) {
    for (let i = 0; i < data.employees.length; i++) {
        if (data.employees[i].pin === pin) {
            sessionStorage.setItem("employeeId", data.employees[i].id);
            return "";
        }
    }
    return "Incorrect employee PIN.";
}

// Returns null when nobody is logged in.
function getLoggedInEmployee() {
    const id = sessionStorage.getItem("employeeId");
    if (id === null) {
        return null;
    }
    return findById(data.employees, id);
}

function logoutEmployee() {
    sessionStorage.removeItem("employeeId");
}


/* ---------- Finding things ---------- */

// Returns the item with this id, or null.
function findById(list, id) {
    for (let i = 0; i < list.length; i++) {
        if (list[i].id === id) {
            return list[i];
        }
    }
    return null;
}

function findCar(id) {
    return findById(data.cars, id);
}

function findCarPark(id) {
    return findById(data.carParks, id);
}

// Ignores spaces and letter case.
function findBooking(id) {
    return findById(data.bookings, String(id).trim().toUpperCase());
}

function getBookingsByStatus(status) {
    return data.bookings.filter(function (booking) {
        return booking.status === status;
    });
}


/* ---------- Money and dates ---------- */

function money(amount) {
    return data.settings.currency + amount.toFixed(2);
}

function round2(number) {
    return Math.round(number * 100) / 100;
}

// Rental days between two "yyyy-mm-dd" dates (at least 1).
function daysBetween(pickupDate, returnDate) {
    const milliseconds = new Date(returnDate) - new Date(pickupDate);
    const days = Math.round(milliseconds / (1000 * 60 * 60 * 24));
    if (days < 1) {
        return 1;
    }
    return days;
}

// When the booking's car is due back.
function getDueTime(booking) {
    return new Date(booking.returnDate + "T" + data.settings.dueTime + ":00");
}

// Rental price and deposit for a car and dates.
function getQuote(carId, pickupDate, returnDate) {
    const car = findCar(carId);
    const days = daysBetween(pickupDate, returnDate);
    const rental = round2(car.pricePerDay * days);
    return {
        days: days,
        rental: rental,
        deposit: round2(rental * data.settings.depositRate)
    };
}


/* ---------- Credit card checks ---------- */

// True if the text is only the digits 0-9.
function isDigits(text) {
    if (text.length === 0) {
        return false;
    }
    for (let i = 0; i < text.length; i++) {
        if (text[i] < "0" || text[i] > "9") {
            return false;
        }
    }
    return true;
}

function removeSpaces(text) {
    return text.split(" ").join("");
}

function checkCard(card, now) {
    if (now === undefined) {
        now = new Date();
    }

    if (card.holder.trim() === "") {
        return "Please enter the name on the card.";
    }

    const number = removeSpaces(card.number);
    if (number.length !== 16 || !isDigits(number)) {
        return "The card number must have 16 digits.";
    }

    const expiry = card.expiry.trim();
    if (expiry.length !== 5 || expiry[2] !== "/") {
        return "Enter the expiry date as MM/YY.";
    }
    const month = Number(expiry.slice(0, 2));
    const year = 2000 + Number(expiry.slice(3, 5));
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
        return "Enter the expiry date as MM/YY.";
    }
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth() + 1;
    if (year < thisYear || (year === thisYear && month < thisMonth)) {
        return "This card has expired.";
    }

    if ((card.cvv.length !== 3 && card.cvv.length !== 4) || !isDigits(card.cvv)) {
        return "The CVV must be 3 or 4 digits.";
    }

    return "";
}


/* ---------- Step 1: Reserve ---------- */

// details: { name, email, licence, carId, pickupDate, returnDate, parkId, card: { holder, number, expiry, cvv } }
function reserveCar(details, now) {
    if (now === undefined) {
        now = new Date();
    }

    const name = details.name.trim();
    const email = details.email.trim();
    const licence = details.licence.trim().toUpperCase();

    if (name === "") {
        return { error: "Please enter your name.", booking: null };
    }
    if (email.indexOf("@") === -1 || email.indexOf(".") === -1) {
        return { error: "Please enter a valid email.", booking: null };
    }
    if (licence === "") {
        return { error: "Please enter your driving licence number.", booking: null };
    }
    if (details.pickupDate === "" || details.returnDate === "") {
        return { error: "Please choose pick-up and return dates.", booking: null };
    }
    if (details.pickupDate < toDateString(now)) {
        return { error: "The pick-up date cannot be in the past.", booking: null };
    }
    if (details.returnDate < details.pickupDate) {
        return { error: "The return date cannot be before the pick-up date.", booking: null };
    }

    const car = findCar(details.carId);
    if (car === null) {
        return { error: "Please choose a car.", booking: null };
    }
    if (car.status !== "available") {
        return { error: car.name + " is not available right now.", booking: null };
    }

    const park = findCarPark(details.parkId);
    if (park === null) {
        return { error: "Please choose a return car park.", booking: null };
    }

    const cardError = checkCard(details.card, now);
    if (cardError !== "") {
        return { error: cardError, booking: null };
    }

    const quote = getQuote(car.id, details.pickupDate, details.returnDate);

    // Keep only the last 4 digits, never the full number or CVV.
    const cardNumber = removeSpaces(details.card.number);

    const booking = {
        id: "AZ" + data.nextBookingNo,
        carId: car.id,
        customerName: name,
        email: email,
        licence: licence,
        pickupDate: details.pickupDate,
        returnDate: details.returnDate,
        returnParkId: park.id,
        rentalAmount: quote.rental,
        deposit: quote.deposit,
        cardLast4: cardNumber.slice(-4),
        status: "reserved",
        rentedAt: "",
        returnedAt: "",
        returnedParkId: "",
        lateHours: 0,
        damages: [],
        inspectionNotes: "",
        inspectedBy: "",
        paidAt: "",
        amountPaid: 0
    };

    data.bookings.push(booking);
    data.nextBookingNo++;
    car.status = "reserved";
    saveData();

    return { error: "", booking: booking };
}


/* ---------- Step 2: Rent ---------- */

function collectCar(bookingId, licence, now) {
    if (now === undefined) {
        now = new Date();
    }

    const booking = findBooking(bookingId);
    if (booking === null) {
        return "Booking " + bookingId + " was not found.";
    }
    if (booking.status !== "reserved") {
        return "Booking " + booking.id + " is " + booking.status + ", not waiting for collection.";
    }
    if (licence.trim().toUpperCase() !== booking.licence) {
        return "The licence number does not match this booking.";
    }

    if (toDateString(now) < booking.pickupDate) {
        return "This car can only be collected from the pick-up date, " + booking.pickupDate + ".";
    }

    booking.status = "rented";
    booking.rentedAt = now.toISOString();
    findCar(booking.carId).status = "rented";
    saveData();
    return "";
}


/* ---------- Step 3: Return ---------- */

// Every started hour after the due time counts as late.
function getLateHours(booking, returnedAt) {
    const lateMilliseconds = returnedAt - getDueTime(booking);
    if (lateMilliseconds > 0) {
        return Math.ceil(lateMilliseconds / (1000 * 60 * 60));
    }
    return 0;
}

// returnedAt is a Date (defaults to now).
function returnCar(bookingId, parkId, returnedAt) {
    if (returnedAt === undefined) {
        returnedAt = new Date();
    }

    const booking = findBooking(bookingId);
    if (booking === null) {
        return "Booking " + bookingId + " was not found.";
    }
    if (booking.status !== "rented") {
        return "Booking " + booking.id + " is " + booking.status + ", not currently rented.";
    }
    if (findCarPark(parkId) === null) {
        return "Please choose a car park.";
    }
    if (isNaN(returnedAt.getTime())) {
        return "Please enter a valid return date and time.";
    }
    // Compare in whole minutes: the return box has no seconds, the collection time does.
    const returnedMinute = Math.floor(returnedAt.getTime() / 60000);
    const rentedMinute = Math.floor(new Date(booking.rentedAt).getTime() / 60000);
    if (returnedMinute < rentedMinute) {
        return "The return time cannot be before the car was collected.";
    }

    booking.lateHours = getLateHours(booking, returnedAt);
    booking.returnedAt = returnedAt.toISOString();
    booking.returnedParkId = parkId;
    booking.status = "returned";
    findCar(booking.carId).status = "inspection";
    saveData();
    return "";
}


/* ---------- Step 4: Inspect ---------- */

// damageIds is like ["D01", "D04"], or [] for no damage. Needs a logged-in employee.
function inspectCar(bookingId, damageIds, notes) {
    const employee = getLoggedInEmployee();
    if (employee === null) {
        return "Employee login required.";
    }

    const booking = findBooking(bookingId);
    if (booking === null) {
        return "Booking " + bookingId + " was not found.";
    }
    if (booking.status !== "returned") {
        return "Booking " + booking.id + " is " + booking.status + ", not waiting for inspection.";
    }

    // Copy each damage, with its fee, into the booking.
    const damages = [];
    for (let i = 0; i < damageIds.length; i++) {
        const type = findById(data.damageTypes, damageIds[i]);
        if (type !== null) {
            damages.push({ id: type.id, label: type.label, fee: type.fee });
        }
    }

    booking.damages = damages;
    booking.inspectionNotes = notes.trim();
    booking.inspectedBy = employee.name;
    booking.status = "inspected";

    const car = findCar(booking.carId);
    if (damages.length > 0) {
        car.status = "maintenance";
    } else {
        car.status = "available";
    }
    saveData();
    return "";
}


/* ---------- Step 5: Final bill and payment ---------- */

// Itemised bill, or null if the booking does not exist.
function getBill(bookingId) {
    const booking = findBooking(bookingId);
    if (booking === null) {
        return null;
    }

    const lines = [];
    lines.push({ label: "Car rental", amount: booking.rentalAmount });

    if (booking.lateHours > 0) {
        lines.push({
            label: "Late return (" + booking.lateHours + " hr x " + money(data.settings.lateFeePerHour) + ")",
            amount: round2(booking.lateHours * data.settings.lateFeePerHour)
        });
    }

    booking.damages.forEach(function (damage) {
        lines.push({ label: "Damage: " + damage.label, amount: damage.fee });
    });

    let subtotal = 0;
    lines.forEach(function (line) {
        subtotal = subtotal + line.amount;
    });
    subtotal = round2(subtotal);

    const gst = round2(subtotal * data.settings.gstRate);
    const total = round2(subtotal + gst);

    return {
        bookingId: booking.id,
        lines: lines,
        subtotal: subtotal,
        gst: gst,
        total: total,
        deposit: booking.deposit,
        amountDue: round2(total - booking.deposit)
    };
}

function payBill(bookingId, card, now) {
    if (now === undefined) {
        now = new Date();
    }

    const booking = findBooking(bookingId);
    if (booking === null) {
        return "Booking " + bookingId + " was not found.";
    }
    if (booking.status === "paid") {
        return "Booking " + booking.id + " is already paid.";
    }
    if (booking.status !== "inspected") {
        return "The final bill is only available after the car has been inspected.";
    }

    const cardError = checkCard(card, now);
    if (cardError !== "") {
        return cardError;
    }

    const bill = getBill(booking.id);
    booking.amountPaid = bill.amountDue;
    booking.paidAt = now.toISOString();
    booking.status = "paid";
    saveData();
    return "";
}
