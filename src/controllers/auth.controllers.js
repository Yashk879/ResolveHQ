
const pool = require("../db/pool");
const bcrypt = require("bcrypt");

async function CompanySignup(req, res) {
    const { companyName, name, email, password } = req.body;

    try {
        const normalizedEmail = email?.trim().toLowerCase();

        if (!companyName || !name || !normalizedEmail || !password) {
            return res.status(400).json({
                message: "All fields are Required"
            });
        }

        const existingUser = await pool.query(
            "SELECT id FROM agents WHERE LOWER(email) = $1",
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: "Email Already Exists"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const companyResult = await client.query(
                `INSERT INTO companies (name)
                 VALUES ($1)
                 RETURNING id, name`,
                [companyName.trim()]
            );

            const company = companyResult.rows[0];

            const agentResult = await client.query(
                `INSERT INTO agents
                 (company_id, name, email, password_hash, role)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, company_id, name, email, role`,
                [
                    company.id,
                    name.trim(),
                    normalizedEmail,
                    passwordHash,
                    "admin"
                ]
            );

            const agent = agentResult.rows[0];

            await client.query("COMMIT");

            return res.status(201).json({
                message: "Signup Successful",
                company,
                agent
            });

        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Server Error"
        });
    }
}

module.exports = { CompanySignup };
