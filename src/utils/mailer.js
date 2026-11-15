
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail(to, subject, html) {
    try {
        const result = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL,
            to,
            subject,
            html
        });

        if (result.error) {
            console.error("Resend Email Error:", result.error);
            return false;
        }

        console.log("Email sent successfully:", result.data?.id);
        return true;

    } catch (err) {
        console.error("Failed to send email:", err);
        return false;
    }
}

module.exports = { sendMail };
