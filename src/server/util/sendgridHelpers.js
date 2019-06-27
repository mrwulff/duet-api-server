import config from "../util/config.js";
const sgMail = config.sendgridInit(); // Sendgrid

async function sendDonorThankYouEmail(donorInfo) {
    // Send donor thank-you email
    // Takes in donorInfo object with "email", "firstName" fields
    const msg = {
        to: donorInfo['email'],
        from: "duet@giveduet.org",
        templateId: "d-2780c6e3d4f3427ebd0b20bbbf2f8cfc",
        dynamic_template_data: {
            name: donorInfo['firstName']
        }
    };

    sgMail
        .send(msg)
        .then(() => {
            console.log(`Donation confirmation sent ${donorInfo['email']} to successfully.`);
        })
        .catch(error => {
            console.error(error.toString());
        });
}

export default {
    sendDonorThankYouEmail
}