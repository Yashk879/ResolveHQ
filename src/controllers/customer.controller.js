const pool = require("../db/pool");

async function createCustomers(req, res) {

    const { name, email ,} = req.body;

    const companyId = req.user.companyId;

    try {

        if (!name || !email) {
            return res.status(400).json({
                message: "Name and Email is Required"
            });
        }

        const existingUser = await pool.query(
            `SELECT id
             FROM customers
             WHERE company_id=$1 AND email=$2`,
            [companyId, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: "Customer Already Exists"
            });
        }

        const result = await pool.query(
            `INSERT INTO customers
            (company_id,name,email)
            VALUES ($1,$2,$3)
            RETURNING id,company_id,name,email,created_at`,
            [companyId, name, email]
        );

        return res.status(201).json({
            message: "Customer Created Successfully",
            customer: result.rows[0]
        });

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({
            message: "Internal Server Error"
        });

    }
}

async function listCustomers(req,res){
    const companyId=req.user.companyId;

    const search=req.query.search

    try{
        let result;

        if(search){
            result=await pool.query(
                `SELECT c.id,c.company_id,c.name,c.email,c.created_at,t.subject as problem
                from customers c
                left join lateral(
                select subject from tickets
                where tickets.customer_id=c.id
                order by created_at desc
                limit 1)
                t on true
                where c.company_id=$1
                and (c.name ILIKE $2 OR c.email ILIKE $2)
                order by c.id`,
                [companyId,`%${search}%`]
            )
        }
        else{
            result=await pool.query(
                `SELECT c.id,c.company_id,c.name,c.email,c.created_at,
                t.subject as problem from customers c
                left join lateral(
                select subject from tickets
                where tickets.customer_id=c.id
                order by created_at desc
                limit 1)
                t on true
                where c.company_id=$1
                order by c.id`,
                [companyId]
            )
        }

        return res.status(200).json({
            message:"Customer  Fetched Succesfully",
            customers:result.rows
        })
    }
    catch(err){
        console.error(err);

        return res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

async function getCustomerById(req,res){
    const customerId=req.params.id;

    const companyId=req.user.companyId;

     try{
        const result=await pool.query(
            `SELECT id,company_id,name,email,created_at
            from customers
            where id=$1
            and company_id=$2`,
            [customerId,companyId]
        );
 
        if(result.rows.length===0){
            return res.status(404).json({
                message:"Customer Not Found"
            });
        }
 
        return res.status(200).json({
            customer:result.rows[0]
        });
    }
    catch(err){
        console.error(err);
 
        return res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

async function getCustomerTickets(req,res){
 
    const customerId=req.params.id;
 
    const companyId=req.user.companyId;
 
    try{
        const customerResult=await pool.query(
            `SELECT id from customers
            where id=$1
            and company_id=$2`,
            [customerId,companyId]
        );
 
        if(customerResult.rows.length===0){
            return res.status(404).json({
                message:"Customer Not Found"
            });
        }
 
        const result=await pool.query(
            `SELECT id,company_id,customer_id,assigned_agent_id,subject,description,status,priority,created_at,updated_at
            from tickets
            where customer_id=$1
            and company_id=$2
            order by created_at desc`,
            [customerId,companyId]
        );
 
        return res.status(200).json({
            tickets:result.rows
        });
    }
    catch(err){
        console.error(err);
 
        return res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

module.exports = {
    createCustomers,
    listCustomers,getCustomerById,getCustomerTickets
};