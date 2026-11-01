/* Pre-stored data */


// Date as "2026-10-20".
function toDateString(date) {
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    return date.getFullYear() + "-" + month + "-" + day;
}

// Date n days from today.
function daysFromToday(n) {
    const date = new Date();
    date.setDate(date.getDate() + n);
    return toDateString(date);
}


const defaultData = {

    settings: {
        currency: "$",
        depositRate: 0.2,      // paid when reserving, deducted from the final bill
        gstRate: 0.09,         // on rental + late fee + damages
        lateFeePerHour: 15,
        dueTime: "18:00"       // cars are due back at this time on the return date
    },

    cars: [
        { id: "C01", name: "Economy Car",      category: "Economy", image: "car-economy.jpg",  pricePerDay: 45,  seats: 5, transmission: "Automatic", status: "available" },
        { id: "C02", name: "Comfort Sedan",    category: "Sedan",   image: "car-sedan.jpg",    pricePerDay: 65,  seats: 5, transmission: "Automatic", status: "available" },
        { id: "C03", name: "Family SUV",       category: "SUV",     image: "car-suv.jpg",      pricePerDay: 85,  seats: 7, transmission: "Automatic", status: "available" },
        { id: "C04", name: "Electric Cruiser", category: "Electric", image: "car-electric.jpg", pricePerDay: 95,  seats: 5, transmission: "Automatic", status: "available" },
        { id: "C05", name: "Luxury Car",       category: "Premium", image: "car-luxury.jpg",   pricePerDay: 120, seats: 5, transmission: "Automatic", status: "available" },
        { id: "C06", name: "Sports Roadster",  category: "Sports",  image: "car-sports.jpg",   pricePerDay: 180, seats: 2, transmission: "Automatic", status: "available" }
    ],

    carParks: [
        { id: "P01", name: "Marina Bay Car Park",      address: "10 Bayfront Avenue" },
        { id: "P02", name: "Orchard Central Car Park", address: "181 Orchard Road" },
        { id: "P03", name: "Changi Airport Car Park",  address: "Airport Boulevard" }
    ],

    damageTypes: [
        { id: "D01", label: "Minor scratch",      fee: 80 },
        { id: "D02", label: "Dent",               fee: 250 },
        { id: "D03", label: "Cracked windscreen", fee: 400 },
        { id: "D04", label: "Broken mirror",      fee: 180 },
        { id: "D05", label: "Tyre damage",        fee: 150 },
        { id: "D06", label: "Interior stain",     fee: 60 },
        { id: "D07", label: "Fuel tank not full", fee: 40 }
    ],

    employees: [
        { id: "E01", name: "Alex Wong", pin: "1234" }
    ],

    // Empty at the start; reservations are added here.
    bookings: [],

    // Number for the next booking ID (AZ1001, ...)
    nextBookingNo: 1001
};
