/*
=================================================
 IPVision Frontend Script

 Cloudflare Worker:
 https://ipvision-proxy.jozefmasiar.workers.dev/

 Gets:
 - Real visitor IP
 - Country
 - City
 - Region
 - Timezone
 - ISP

=================================================
*/


async function loadIPVision() {

    const workerURL =
        "https://ipvision-proxy.jozefmasiar.workers.dev/?nocache="
        + Date.now();


    try {


        const response = await fetch(
            workerURL,
            {
                method: "GET",
                cache: "no-store"
            }
        );


        if (!response.ok) {

            throw new Error(
                "Worker HTTP error: "
                + response.status
            );

        }



        const data =
            await response.json();



        console.log(
            "IPVision response:",
            data
        );



        /*
        Update elements safely
        */


        const ipElement =
            document.getElementById("ip");


        const countryElement =
            document.getElementById("country");


        const cityElement =
            document.getElementById("city");


        const regionElement =
            document.getElementById("region");


        const timezoneElement =
            document.getElementById("timezone");


        const ispElement =
            document.getElementById("isp");




        if (ipElement) {

            ipElement.textContent =
                data.client_ip ||
                data.ip ||
                "N/A";

        }



        if (countryElement) {

            countryElement.textContent =
                data.country ||
                data.country_code ||
                "N/A";

        }



        if (cityElement) {

            cityElement.textContent =
                data.city ||
                "N/A";

        }



        if (regionElement) {

            regionElement.textContent =
                data.region ||
                "N/A";

        }



        if (timezoneElement) {

            timezoneElement.textContent =
                data.timezone ||
                "N/A";

        }



        if (ispElement) {

            ispElement.textContent =
                data.isp ||
                "N/A";

        }




    } catch(error) {


        console.error(
            "IPVision error:",
            error
        );



        const ipElement =
            document.getElementById("ip");


        if (ipElement) {

            ipElement.textContent =
                "N/A";

        }


    }

}




// Start automatically

document.addEventListener(
    "DOMContentLoaded",
    loadIPVision
);
