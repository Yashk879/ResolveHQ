const pool = require("../db/pool");

async function createCustomers(req, res) {

    const { name, email } = req.body;

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
                `SELECT id,company_id,name,email,created_at
                from customers
                where company_id=$1
                and (name ILIKE $2 OR EMAIL ILIKE $2)
                ordere by id`,
                [companyId,`%${search}%`]
            )
        }
        else{
            result=await pool.query(
                `SELECT id,company_id,name,email,created_at
                from customers
                where company_id=$1
                order by id`,
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



async function allCustomers(req, res) {

    const companyId = req.user.companyId;

    try {

        const result = await pool.query(
            `SELECT
                id,
                company_id,
                name,
                email,
                created_at
             FROM customers
             WHERE company_id=$1
             ORDER BY id DESC`,
            [companyId]
        );

        return res.status(200).json({
            message: "Customers Fetched Successfully",
            customers: result.rows
        });

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({
            message: "Internal Server Error"
        });

    }
}


module.exports = {
    createCustomers,
    listCustomers,getCustomerById,allCustomers
};