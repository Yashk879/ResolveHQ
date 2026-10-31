
const pool = require("../db/pool");

// 1. Get FAQs
async function getFaqs(req, res) {
    try {
        const companyId =
            req.user?.companyId || req.customer?.companyId;

        if (!companyId) {
            return res.status(401).json({
                message: "Company Authentication Required"
            });
        }

        const search = req.query.search || "";
        const category = req.query.category || "";

        const result = await pool.query(
            `SELECT id, question, answer, category,
                    is_published, created_at, updated_at
             FROM faqs
             WHERE company_id = $1
             AND ($2 = 'admin' OR is_published = TRUE)
             AND question ILIKE $3
             AND ($4 = '' OR category = $4)
             ORDER BY created_at DESC`,
            [
                companyId,
                req.user?.role === "admin" ? "admin" : "customer",
                `%${search}%`,
                category
            ]
        );

        return res.status(200).json({
            faqs: result.rows
        });

    } catch (err) {
        console.error("Get FAQs Error:", err);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}


// 2. Create FAQ (Admin)
async function createFaq(req, res) {
    try {
        const { question, answer, category } = req.body;
        const companyId = req.user.companyId;

        if (!question?.trim() || !answer?.trim()) {
            return res.status(400).json({
                message: "Question and Answer are Required"
            });
        }

        const result = await pool.query(
            `INSERT INTO faqs
             (company_id, question, answer, category)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                companyId,
                question.trim(),
                answer.trim(),
                category?.trim() || null
            ]
        );

        return res.status(201).json({
            message: "FAQ Created Successfully",
            faq: result.rows[0]
        });

    } catch (err) {
        console.error("Create FAQ Error:", err);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}


// 3. Update FAQ (Admin)
async function updateFaq(req, res) {
    try {
        const faqId = req.params.id;
        const companyId = req.user.companyId;

        const { question, answer, category, is_published } = req.body;

        if (
            question === undefined &&
            answer === undefined &&
            category === undefined &&
            is_published === undefined
        ) {
            return res.status(400).json({
                message: "At least one field is Required"
            });
        }

        if (
            (question !== undefined && !question.trim()) ||
            (answer !== undefined && !answer.trim())
        ) {
            return res.status(400).json({
                message: "Question and Answer cannot be Empty"
            });
        }

        if (
            is_published !== undefined &&
            typeof is_published !== "boolean"
        ) {
            return res.status(400).json({
                message: "Invalid Published Status"
            });
        }

        const result = await pool.query(
            `UPDATE faqs
             SET question = COALESCE($1, question),
                 answer = COALESCE($2, answer),
                 category = CASE
                     WHEN $3::boolean THEN $4
                     ELSE category
                 END,
                 is_published = COALESCE($5, is_published),
                 updated_at = NOW()
             WHERE id = $6 AND company_id = $7
             RETURNING *`,
            [
                question?.trim() ?? null,
                answer?.trim() ?? null,
                category !== undefined,
                category?.trim() || null,
                is_published ?? null,
                faqId,
                companyId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "FAQ Not Found"
            });
        }

        return res.status(200).json({
            message: "FAQ Updated Successfully",
            faq: result.rows[0]
        });

    } catch (err) {
        console.error("Update FAQ Error:", err);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}


// 4. Delete FAQ (Admin)
async function deleteFaq(req, res) {
    try {
        const faqId = req.params.id;
        const companyId = req.user.companyId;

        const result = await pool.query(
            `DELETE FROM faqs
             WHERE id = $1 AND company_id = $2
             RETURNING id`,
            [faqId, companyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "FAQ Not Found"
            });
        }

        return res.status(200).json({
            message: "FAQ Deleted Successfully"
        });

    } catch (err) {
        console.error("Delete FAQ Error:", err);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

module.exports = {
    getFaqs,
    createFaq,
    updateFaq,
    deleteFaq
};
