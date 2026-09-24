const cors=require("cors")

const express=require("express")

const cookieParser=require("cookie-parser")

const ticketRoute=require("./routes/ticketRoutes")

const authroutes=require("./routes/auth.routes")

const customerRoutes=require("./routes/customer.routes")

const messageRoutes=require("./routes/messages.routes")

const agentsRouter=require("./routes/agents.routes")

const statsRouter=require("./routes/stats.routes")

const companyRoutes=require("./routes/company.routes")

const customerAuthRoutes=require("./routes/customerAuth.routes")

const customerPortalRoutes=require("./routes/customerPortal.routes")

const app=express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());

app.use(cookieParser());

app.use("/api/auth",authroutes)

app.use("/api/tickets",ticketRoute)

app.use("/api/customer",customerRoutes)

app.use("/api/response",messageRoutes)

app.use("/api/agents",agentsRouter)

app.use("/api/stats",statsRouter)

app.use("/api/companies",companyRoutes)

app.use("/api/customer-auth",customerAuthRoutes)

app.use("/api/customer-portal",customerPortalRoutes)

module.exports=app;