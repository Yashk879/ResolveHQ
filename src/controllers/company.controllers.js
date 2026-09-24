const pool=require("../db/pool")

async function listCompanies(req,res){
    try{
        const result=await pool.query(
            `SELECT id,name from companies order by name`
        );

        return res.status(200).json({
            companies:result.rows
        });
    }

    catch(err){
        console.error(err);

        return res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

module.exports={listCompanies}