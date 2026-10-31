
import { useEffect, useState } from "react";
import {
  listFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
} from "../api/faqs.js";

import Loading from "../components/Loading.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function FAQs() {
  const { addToast } = useToast();

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");

  const [submitting, setSubmitting] = useState(false);

  async function loadFaqs() {
    setLoading(true);
    setError("");

    try {
      const res = await listFaqs({
        search,
        category: categoryFilter,
      });

      setFaqs(res.data.faqs || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Couldn't load FAQs."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFaqs();
  }, [search, categoryFilter]);

  function resetForm() {
    setQuestion("");
    setAnswer("");
    setCategory("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(faq) {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setCategory(faq.category || "");
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!question.trim() || !answer.trim()) {
      setError("Question and answer are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    const data = {
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim() || null,
    };

    try {
      if (editingId) {
        await updateFaq(editingId, data);
        addToast("FAQ updated successfully.");
      } else {
        await createFaq(data);
        addToast("FAQ created successfully.");
      }

      resetForm();
      await loadFaqs();
    } catch (err) {
      setError(
        err.response?.data?.message || "Couldn't save FAQ."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePublish(faq) {
    try {
      await updateFaq(faq.id, {
        is_published: !faq.is_published,
      });

      addToast(
        faq.is_published
          ? "FAQ unpublished."
          : "FAQ published."
      );

      await loadFaqs();
    } catch (err) {
      addToast(
        err.response?.data?.message || "Couldn't update FAQ."
      );
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this FAQ?"
    );

    if (!confirmed) return;

    try {
      await deleteFaq(id);
      addToast("FAQ deleted successfully.");
      await loadFaqs();
    } catch (err) {
      addToast(
        err.response?.data?.message || "Couldn't delete FAQ."
      );
    }
  }

  const categories = [
    ...new Set(
      faqs.map((faq) => faq.category).filter(Boolean)
    ),
  ];

  return (
    <div className="content">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--space-5)",
          gap: "var(--space-3)",
        }}
      >
        <div>
          <h1>FAQs</h1>
          <p style={{ color: "var(--color-slate-muted)" }}>
            Manage your company's frequently asked questions.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setError("");
              setShowForm(true);
            }
          }}
        >
          {showForm ? "Cancel" : "Add FAQ"}
        </button>
      </div>

      {showForm && (
        <div
          className="panel"
          style={{
            padding: "var(--space-5)",
            marginBottom: "var(--space-4)",
          }}
        >
          <h2 style={{ marginBottom: "var(--space-4)" }}>
            {editingId ? "Edit FAQ" : "Create FAQ"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="faq-question">Question</label>
              <input
                id="faq-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="faq-answer">Answer</label>
              <textarea
                id="faq-answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter the answer"
                rows={5}
                required
                style={{ width: "100%" }}
              />
            </div>

            <div className="field">
              <label htmlFor="faq-category">Category</label>
              <input
                id="faq-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. General, Billing, Account"
              />
            </div>

            {error && (
              <p
                className="error-text"
                style={{ marginBottom: "var(--space-3)" }}
              >
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : editingId
                  ? "Save changes"
                  : "Create FAQ"}
              </button>

              <button
                type="button"
                className="btn"
                onClick={resetForm}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div
        className="panel"
        style={{
          padding: "var(--space-4)",
          marginBottom: "var(--space-4)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "var(--space-3)",
            flexWrap: "wrap",
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            style={{ flex: 1, minWidth: "180px" }}
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <Loading label="Loading FAQs..." />}

      {error && !showForm && (
        <p className="error-text">{error}</p>
      )}

      {!loading && !error && (
        <div
          className="panel"
          style={{ padding: "var(--space-5)" }}
        >
          {faqs.length === 0 ? (
            <p style={{ color: "var(--color-slate-muted)" }}>
              No FAQs found. Create your first FAQ.
            </p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {faqs.map((faq) => (
                    <tr key={faq.id}>
                      <td style={{ maxWidth: "350px" }}>
                        {faq.question}
                      </td>

                      <td>
                        {faq.category || "General"}
                      </td>

                      <td>
                        <span
                          style={{
                            color: faq.is_published
                              ? "var(--color-signal)"
                              : "var(--color-slate-muted)",
                            fontWeight: 600,
                          }}
                        >
                          {faq.is_published
                            ? "Published"
                            : "Draft"}
                        </span>
                      </td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "var(--space-2)",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            className="btn"
                            onClick={() => startEdit(faq)}
                          >
                            Edit
                          </button>

                          <button
                            className="btn"
                            onClick={() => togglePublish(faq)}
                          >
                            {faq.is_published
                              ? "Unpublish"
                              : "Publish"}
                          </button>

                          <button
                            className="btn"
                            onClick={() => handleDelete(faq.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
