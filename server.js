const app=require("./src/app")

const {Server}=require("socket.io")

const http=require("http")

const server=http.createServer(app);

const io=new Server(server)

io.on("connection",(socket)=>{
    console.log("Client Connected:",socket.id);
});

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