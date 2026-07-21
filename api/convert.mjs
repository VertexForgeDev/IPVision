async function loadIPVision(targetIp = '') {
    try {
        const url = targetIp.trim()
            ? `https://ipvision-proxy.jozefmasiar.workers.dev/?ip=${encodeURIComponent(targetIp)}&nocache=${Date.now()}`
            : `https://ipvision-proxy.jozefmasiar.workers.dev/?nocache=${Date.now()}`;

        const response = await fetch(url, { cache: "no-store" });
        const data = await response.json();

        console.log("IPVision:", data);

        // Main IP display
        const ip = document.getElementById("ipAddress");
        if (ip) ip.textContent = data.client_ip || "N/A";

        // Location line
        const location = document.getElementById("location");
        if (location) {
            location.innerHTML = `<i class="fa-solid fa-location-dot text-indigo-400"></i> ${data.city || ""}, ${data.region || ""}, ${data.country || ""}`.trim();
        }

        // Country
        const country = document.getElementById("val-country");
        if (country) country.textContent = data.country || "N/A";

        // Region
        const region = document.getElementById("val-region");
        if (region) region.textContent = data.region || "N/A";

        // ISP
        const isp = document.getElementById("isp");
        if (isp) isp.textContent = data.isp || "N/A";

        // Timezone
        const timezone = document.getElementById("timezone");
        if (timezone) timezone.textContent = data.timezone || "N/A";

        // Coordinates
        const coords = document.getElementById("val-coords");
        if (coords) {
            coords.textContent = (data.latitude && data.longitude) 
                ? `${data.latitude}, ${data.longitude}` 
                : "N/A";
        }

    } catch (error) {
        console.error("IPVision error:", error);
    }
}

// Event Listeners for your UI buttons
document.addEventListener("DOMContentLoaded", () => {
    loadIPVision(); // Load self IP on page load

    // Hook up lookup button & form search
    const form = document.getElementById("search-form");
    const ipInput = document.getElementById("ipInput");

    if (form && ipInput) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            loadIPVision(ipInput.value);
        });
    }

    // Hook up "Refresh Self IP" button if you have one
    const myIpBtn = document.getElementById("myIpBtn");
    if (myIpBtn) {
        myIpBtn.addEventListener("click", () => {
            if (ipInput) ipInput.value = "";
            loadIPVision("");
        });
    }
});
