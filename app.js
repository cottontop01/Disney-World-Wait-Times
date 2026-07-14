let selectedPark = "Magic Kingdom";

let alerts = [];

let rideData = [];

const PARKS = {
    "Magic Kingdom":
        "75ea578a-adc8-4116-a54d-dccb60765ef9",

    "EPCOT":
        "47f90d2c-e191-4239-a466-5892ef59a88b",

    "Hollywood Studios":
        "288747d1-8b4f-4a64-867e-ea7c9b27bad8",

    "Animal Kingdom":
        "1c84a229-8862-4648-9c71-378ddd2c7693"
};

const parkButtons = {
    mkBtn: "Magic Kingdom",
    epBtn: "EPCOT",
    hsBtn: "Hollywood Studios",
    akBtn: "Animal Kingdom"
};

async function requestNotifications() {

    if (
        "Notification" in window &&
        Notification.permission !== "granted"
    ) {
        await Notification.requestPermission();
    }
}

requestNotifications();

async function loadLiveWaitTimes() {

    rideData = [];

    for (const [parkName, parkId] of Object.entries(PARKS)) {

        try {

            const response =
                await fetch(
                    `https://api.themeparks.wiki/v1/entity/${parkId}/live`
                );

            const data =
                await response.json();

            (data.liveData || []).forEach(item => {

                if (!item.queue) {
                    return;
                }

                const wait =
                    item.queue?.STANDBY?.waitTime;

                if (
                    wait === undefined ||
                    wait === null
                ) {
                    return;
                }

                rideData.push({
                    park: parkName,
                    name: item.name,
                    wait: wait
                });

            });

        } catch (error) {

            console.error(
                `Failed loading ${parkName}`,
                error
            );

        }
    }

    populateRideSelector();
    renderRides();

    const updatedTime =
        document.getElementById(
            "updatedTime"
        );

    if (updatedTime) {

        updatedTime.textContent =
            new Date()
            .toLocaleTimeString(
                [],
                {
                    hour: "numeric",
                    minute: "2-digit"
                }
            );

    }
}

function setupParkButtons() {

    Object.entries(parkButtons)
    .forEach(([id, park]) => {

        const button =
            document.getElementById(id);

        if (!button) return;

        button.addEventListener(
            "click",
            () => {

                selectedPark = park;

                document
                .querySelectorAll(".tab")
                .forEach(tab =>
                    tab.classList.remove(
                        "active"
                    )
                );

                button.classList.add(
                    "active"
                );

                renderRides();
                populateRideSelector();

            }
        );

    });
}

function populateRideSelector() {

    const selector =
        document.getElementById(
            "alertRide"
        );

    if (!selector) return;

    const rides =
        rideData.filter(
            ride =>
                ride.park === selectedPark
        );

    selector.innerHTML =
        rides.map(ride => `
            <option value="${ride.name}">
                ${ride.name}
            </option>
        `).join("");
}

function addAlert() {

    const ride =
        document.getElementById(
            "alertRide"
        ).value;

    const wait =
        parseInt(
            document.getElementById(
                "alertWait"
            ).value
        );

    if (
        !ride ||
        isNaN(wait)
    ) {
        return;
    }

    alerts.push({
        ride,
        wait,
        triggered: false
    });

    renderAlerts();

    document.getElementById(
        "alertWait"
    ).value = "";
}

function renderAlerts() {

    const container =
        document.getElementById(
            "alerts"
        );

    if (!container) return;

    container.innerHTML =

        alerts.map(alert => `

            <div class="
                alert
                ${alert.triggered ? "alert-triggered" : ""}
            ">

                🔔 ${alert.ride}

                <br>

                Notify below
                ${alert.wait} min

            </div>

        `).join("");
}

function showRideAlert(ride) {

    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {

        new Notification(
            "Disney Ride Alert",
            {
                body:
                `${ride.name} is now ${ride.wait} minutes`
            }
        );

    }

    if (navigator.vibrate) {

        navigator.vibrate([
            500,
            250,
            500,
            250,
            1000
        ]);

    }
}

function checkAlerts() {

    alerts.forEach(alert => {

        const ride =
            rideData.find(
                r => r.name === alert.ride
            );

        if (!ride) return;

        if (
            ride.wait <= alert.wait &&
            !alert.triggered
        ) {

            alert.triggered = true;

            showRideAlert(ride);

            renderAlerts();
        }

        if (
            ride.wait > alert.wait
        ) {

            alert.triggered = false;
        }
    });
}

function renderRides() {

    const rides =
        rideData
        .filter(
            ride =>
                ride.park === selectedPark
        )
        .sort(
            (a, b) =>
                a.wait - b.wait
        );

    const ridesContainer =
        document.getElementById(
            "rides"
        );

    if (!ridesContainer) return;

    ridesContainer.innerHTML =

        rides.map(ride => `

            <div class="ride-row">

                <div class="ride-name">
                    ${ride.name}
                </div>

                <div class="ride-wait">
                    ${ride.wait}
                </div>

            </div>

        `).join("");

    checkAlerts();
}

setupParkButtons();

loadLiveWaitTimes();

setInterval(
    loadLiveWaitTimes,
    60000
);