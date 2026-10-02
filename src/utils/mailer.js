const nodemailer=require("nodemailer")

const transporter=nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.GMAIL_USER,
        pass:process.env.GMAIL_APP_PASSWORD
    }
})

async function sendMail(to,subject,html){
    try{
        await transporter.sendMail({
            from:process.env.GMAIL_USER,
            to,
            subject,
            html
        })
    }
    catch(err){
        console.error("Failed to send Email ",err);
    }
}

module.exports={sendMail}