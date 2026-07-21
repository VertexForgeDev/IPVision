async function loadIPVision() {

    try {

        const response = await fetch(
            "https://ipvision-proxy.jozefmasiar.workers.dev/?nocache=" + Date.now(),
            {
                cache: "no-store"
            }
        );


        const data = await response.json();


        console.log("IPVision:", data);



        // Main IP display
        const ip =
            document.getElementById("ipAddress");

        if (ip) {
            ip.textContent =
                data.client_ip || "N/A";
        }



        // Location line
        const location =
            document.getElementById("location");

        if (location) {

            location.innerHTML =
                `<i class="fa-solid fa-location-dot text-indigo-400"></i>
                ${data.city || ""}
                ${data.region || ""}
                ${data.country || ""}`;

        }



        // Country
        const country =
            document.getElementById("val-country");

        if (country) {

            country.textContent =
                data.country || "N/A";

        }



        // Region
        const region =
            document.getElementById("val-region");

        if (region) {

            region.textContent =
                data.region || "N/A";

        }



        // ISP
        const isp =
            document.getElementById("isp");

        if (isp) {

            isp.textContent =
                data.isp || "N/A";

        }



        // Timezone
        const timezone =
            document.getElementById("timezone");

        if (timezone) {

            timezone.textContent =
                data.timezone || "N/A";

        }



        // Coordinates
        const coords =
            document.getElementById("val-coords");

        if (coords) {

            coords.textContent =
                `${data.latitude || 0}, ${data.longitude || 0}`;

        }



    } catch(error) {

        console.error(
            "IPVision error:",
            error
        );

    }

}



document.addEventListener(
    "DOMContentLoaded",
    loadIPVision
);
