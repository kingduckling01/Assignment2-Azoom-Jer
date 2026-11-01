/* Landing page */


const carGrid = document.getElementById("car-grid");
const filterBar = document.getElementById("fleet-filters");
const fleetCount = document.getElementById("fleet-count");

const homeForm = document.getElementById("home-form");
const homeAlert = document.getElementById("home-alert");
const nameInput = document.getElementById("full-name");
const emailInput = document.getElementById("email");
const carSelect = document.getElementById("car");
const parkSelect = document.getElementById("car-park");
const pickupInput = document.getElementById("pickup");
const returnInput = document.getElementById("return");


/*Fleet filtering*/


let fleetCategory = "All";


function getCategories() {
    const categories = ["All"];

    data.cars.forEach(function (car) {
        if (categories.indexOf(car.category) === -1) {
            categories.push(car.category);
        }
    });

    return categories;
}

function showFilters() {
    filterBar.innerHTML = "";

    getCategories().forEach(function (category) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "filter-btn";
        button.textContent = category;
        button.setAttribute("aria-pressed", "false");

        if (category === fleetCategory) {
            button.classList.add("active");
            button.setAttribute("aria-pressed", "true");
        }

        button.addEventListener("click", function () {
            fleetCategory = category;
            showFilters();
            showFleet(true);
        });

        filterBar.appendChild(button);
    });
}


function showFleet(animate) {
    carGrid.innerHTML = "";

    let shown = 0;

    data.cars.forEach(function (car) {
        if (fleetCategory !== "All" && car.category !== fleetCategory) {
            return;
        }

        let action = '<a class="car-reserve" href="reserve.html" onclick="startReservation(\'' + car.id + '\', \'\')">Reserve this car</a>';
        if (car.status !== "available") {
            action = '<span class="car-unavailable">Currently ' + esc(car.status) + "</span>";
        }

        const article = document.createElement("article");
        article.className = "car-card photo-card";
        if (animate === true) {
            article.classList.add("tile-in");
        }
        article.innerHTML = `
            <div class="photo" style="--img: url('../images/${esc(car.image)}')" role="img" aria-label="${esc(car.name)}"></div>
            <div class="car-overlay">
                <p class="car-category">${esc(car.category)}</p>
                <h3>${esc(car.name)}</h3>
                <div class="car-meta">
                    <span>${car.seats} Seats &middot; ${esc(car.transmission)}</span>
                    <span class="price"><strong>${money(car.pricePerDay)}</strong>/day</span>
                </div>
                ${action}
            </div>
        `;
        carGrid.appendChild(article);
        shown++;
    });

    if (shown === 0) {
        carGrid.innerHTML = '<p class="fleet-empty">No cars match these filters. Try another category.</p>';
    }

    fleetCount.textContent = "Showing " + shown + " of " + data.cars.length + " cars";
}


/* Reservation */


function startReservation(carId, parkId) {
    saveReservationDraft({
        carId: carId,
        parkId: parkId,
        pickupDate: "",
        returnDate: "",
        name: "",
        email: ""
    });
}

homeForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearAlert(homeAlert);

    if (pickupInput.value === "" || returnInput.value === "") {
        showAlert(homeAlert, "Please choose pick-up and return dates.", "danger");
        return;
    }
    if (returnInput.value < pickupInput.value) {
        showAlert(homeAlert, "The return date cannot be before the pick-up date.", "danger");
        return;
    }

    saveReservationDraft({
        carId: carSelect.value,
        parkId: parkSelect.value,
        pickupDate: pickupInput.value,
        returnDate: returnInput.value,
        name: nameInput.value,
        email: emailInput.value
    });

    window.location.href = "reserve.html";
});




showFilters();
showFleet(false);

fillCarOptions(carSelect);
fillParkOptions(parkSelect);
setDefaultDates(pickupInput, returnInput);
pickupInput.addEventListener("change", function () {
    syncReturnDate(pickupInput, returnInput);
});
