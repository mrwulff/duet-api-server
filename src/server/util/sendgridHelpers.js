import config from "../util/config.js";
const sgMail = config.sendgridInit(); // Sendgrid

async function sendDonorThankYouEmail(donorInfo) {
    // Send donor thank-you email
    // Takes in donorInfo object with "email", "firstName" fields
    let email = donorInfo['email'];
    let firstName = donorInfo['firstName'];
    const msg = {
        to: email,
        from: "duet@giveduet.org",
        templateId: "d-2780c6e3d4f3427ebd0b20bbbf2f8cfc",
        dynamic_template_data: {
            name: firstName
        }
    };

    sgMail
        .send(msg)
        .then(() => {
            console.log(`Donation confirmation sent ${email} to successfully.`);
        })
        .catch(error => {
            console.error(error.toString());
        });
}

export default {
    sendDonorThankYouEmail
}