const app=require("./src/app")

const http = require("http");
const { initSocket } = require("./src/socket");

const server = http.createServer(app);
const io = initSocket(server);
app.set("io", io);


const pool=require("./src/db/pool")

pool.query("SELECT NOW()",(err,result)=>{
    if(err){
        console.error("Database Connection Failed: ",err);
        return;
    }

    console.log("Database Connected:",result.rows[0]);

    server.listen(3000,()=>{
        console.log("Server Running on Port 3000");
    });
});
