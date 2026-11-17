const pool = require("../db/pool");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function customerSignup(req, res) {
    const { companyId, name, email, password } = req.body;

    try {
        const normalizedEmail = email?.trim().toLowerCase();

        if (!companyId || !name || !normalizedEmail || !password) {
            return res.status(400).json({
                message: "Company, Name, Email and password are required"
            });
        }

        const existingCustomer = await pool.query(
            `SELECT id, password_hash
             FROM customers
             WHERE company_id = $1
             AND LOWER(email) = $2`,
            [companyId, normalizedEmail]
        );

        const passwordHash = await bcrypt.hash(password, 10);

        if (existingCustomer.rows.length > 0) {
            const customer = existingCustomer.rows[0];

            if (customer.password_hash) {
                return res.status(409).json({
                    message: "An account with this email already exists. Please log in."
                });
            }

            const update = await pool.query(
                `UPDATE customers
                 SET password_hash = $1, name = $2
                 WHERE id = $3
                 RETURNING id, company_id, name, email, created_at`,
                [passwordHash, name.trim(), customer.id]
            );

            return res.status(200).json({
                message: "Account created successfully. Please log in.",
                customer: update.rows[0]
            });
        }

        const result = await pool.query(
            `INSERT INTO customers
             (company_id, name, email, password_hash)
             VALUES ($1, $2, $3, $4)
             RETURNING id, company_id, name, email, created_at`,
            [companyId, name.trim(), normalizedEmail, passwordHash]
        );

        return res.status(201).json({
            message: "Account created successfully. Please log in.",
            customer: result.rows[0]
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

async function customerLogin(req, res) {
    const { companyId, email, password } = req.body;

    try {
        const normalizedEmail = email?.trim().toLowerCase();

        if (!companyId || !normalizedEmail || !password) {
            return res.status(400).json({
                message: "Company, email and password are required"
            });
        }

        const result = await pool.query(
            `SELECT id, company_id, name, email, password_hash
             FROM customers
             WHERE company_id = $1
             AND LOWER(email) = $2`,
            [companyId, normalizedEmail]
        );

        if (result.rows.length === 0 || !result.rows[0].password_hash) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const customer = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            customer.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                customerId: customer.id,
                companyId: customer.company_id,
                type: "customer"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "30m"
            }
        );

        res.cookie("customer_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 30 * 60 * 1000
        });

        return res.status(200).json({
            message: "Login successful",
            customer: {
                id: customer.id,
                companyId: customer.company_id,
                name: customer.name,
                email: customer.email
            }
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

async function customerLogout(req, res) {
    try {
        res.clearCookie("customer_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        });

        return res.status(200).json({
            message: "Logged out successfully"
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

async function getCustomerMe(req, res) {
    try {
        const result = await pool.query(
            `SELECT id, company_id, name, email
             FROM customers
             WHERE id = $1`,
            [req.customer.customerId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid session"
            });
        }

        return res.status(200).json({
            customer: result.rows[0]
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

module.exports = {customerSignup,customerLogin,customerLogout,getCustomerMe};