const {sendMail}=require("../utils/mailer")

async function contactMail(req,res){
    const {name,email,subject,message}=req.body;

    try{
        if(!name || !email || !subject || !message){
            return res.status(400).json({
                message:"Name, email, subject and message are required"
            })
        }

        const html=`
        <h2>New Contact Message - ResolveHQ</h2>

            <p><strong>Name:</strong> ${name}</p>

            <p><strong>Email:</strong> ${email}</p>

            <p><strong>Subject:</strong> ${subject}</p>

            <p><strong>Message:</strong><p>${message}</p></p>`;

    await sendMail(
        process.env.GMAIL_USER,
        `ResolveHQ Contact: ${subject}`,html
    );

    return res.status(200).json({
        message:"Message Sent Succesfully"
    })
}
    catch(err){
        console.error("Contact form error: ",err);

        return res.status(500).json({
            message:"Failed to send message"
        });
    }
}

module.exports={contactMail}