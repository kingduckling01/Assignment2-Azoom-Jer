/* Helpers shared by all pages (menu, stepper, footer button included).*/


// Escapes text so it is safe to put inside innerHTML.
function esc(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}

// Coloured status label, e.g. <span class="badge badge-rented">rented</span>.
function badge(status) {
    return '<span class="badge badge-' + esc(status) + '">' + esc(status) + "</span>";
}

// Shows a message in an alert box. type: danger, success, warning or info.
function showAlert(alertBox, message, type) {
    alertBox.className = "alert alert-" + type;
    alertBox.textContent = message;
    alertBox.hidden = false;
    alertBox.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearAlert(alertBox) {
    alertBox.hidden = true;
    alertBox.textContent = "";
}

// "2026-10-20" -> "20 Oct 2026"
function formatDate(isoDate) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const parts = isoDate.split("-");
    return Number(parts[2]) + " " + months[Number(parts[1]) - 1] + " " + parts[0];
}

// "2026-10-20T18:30:00" -> "20 Oct 2026, 18:30"
function formatDateTime(isoText) {
    const date = new Date(isoText);
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    return formatDate(toDateString(date)) + ", " + hours + ":" + minutes;
}

// plural(1, "day") -> "1 day", plural(3, "day") -> "3 days"
function plural(count, word) {
    if (count === 1) {
        return count + " " + word;
    }
    return count + " " + word + "s";
}

// One row of a <dl class="summary-rows"> list.
function detailRow(label, value) {
    return "<div><dt>" + label + "</dt><dd>" + value + "</dd></div>";
}

// Fills a <select> with the cars (unavailable ones disabled) and picks the first available.
function fillCarOptions(select) {
    select.innerHTML = "";

    data.cars.forEach(function (car) {
        const option = document.createElement("option");
        option.value = car.id;
        option.textContent = car.name + " - " + money(car.pricePerDay) + "/day";

        if (car.status !== "available") {
            option.textContent = option.textContent + " (" + car.status + ")";
            option.disabled = true;
        }

        select.appendChild(option);
    });

    for (let i = 0; i < data.cars.length; i++) {
        if (data.cars[i].status === "available") {
            select.value = data.cars[i].id;
            break;
        }
    }
}

// Fills a <select> with the car parks.
function fillParkOptions(select) {
    select.innerHTML = "";

    data.carParks.forEach(function (park) {
        const option = document.createElement("option");
        option.value = park.id;
        option.textContent = park.name;
        select.appendChild(option);
    });
}

// Earliest date is today; starts as a 3-day rental.
function setDefaultDates(pickupInput, returnInput) {
    pickupInput.min = toDateString(new Date());
    returnInput.min = toDateString(new Date());
    pickupInput.value = daysFromToday(0);
    returnInput.value = daysFromToday(3);
}

// Keeps the return date on or after the pick-up date.
function syncReturnDate(pickupInput, returnInput) {
    returnInput.min = pickupInput.value;
    if (returnInput.value < pickupInput.value) {
        returnInput.value = pickupInput.value;
    }
}


/* ---------- Progress stepper ---------- */

const stepNames = ["Reserve", "Rent", "Return", "Inspect", "Pay"];

// Steps a booking has finished, by status.
const stepsDoneByStatus = { reserved: 1, rented: 2, returned: 3, inspected: 4, paid: 5 };

// With a booking: shows how far it has got.
// With null: earlier steps done, this page's step current (data-step on the <ol>).
function updateStepper(booking) {
    const stepper = document.getElementById("stepper");
    if (stepper === null) {
        return;
    }

    let doneCount = Number(stepper.getAttribute("data-step")) - 1;
    if (booking !== null) {
        doneCount = stepsDoneByStatus[booking.status];
    }

    let html = "";
    for (let step = 1; step <= stepNames.length; step++) {
        let classes = "";
        let extra = "";
        if (step <= doneCount) {
            classes = "done";
            extra = '<span class="sr-only"> (done)</span>';
        } else if (step === doneCount + 1) {
            classes = "active";
            extra = '<span class="sr-only"> (current step)</span>';
        }
        html = html + '<li class="' + classes + '">' + stepNames[step - 1] + extra + "</li>";
    }
    stepper.innerHTML = html;
}


/* ---------- Menu, log out, reset ---------- */

// Opens or closes the menu on small screens.
function toggleMenu() {
    const header = document.querySelector(".site-header");
    const button = document.getElementById("nav-toggle");
    header.classList.toggle("nav-open");

    if (header.classList.contains("nav-open")) {
        button.setAttribute("aria-expanded", "true");
    } else {
        button.setAttribute("aria-expanded", "false");
    }
}

function logoutClicked() {
    logoutEmployee();
    window.location.href = "index.html";
}

function resetClicked() {
    if (confirm("Reset all demo data (cars, bookings, login)?")) {
        resetData();
        window.location.reload();
    }
}


updateStepper(null);
