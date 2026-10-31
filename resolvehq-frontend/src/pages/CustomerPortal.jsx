
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCustomerAuth } from "../context/CustomerAuthContext.jsx";
import {
  createOwnTicket,
  listOwnTickets,
  listCustomerFaqs
} from "../api/customerPortal.js";
import { StatusBadge, PriorityBadge } from "../components/Badges.jsx";
import Loading from "../components/Loading.jsx";

function formatDate(iso) {
  if (!iso) return "—";

  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export default function CustomerPortal() {
  const { customer, logout } = useCustomerAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [faqLoading, setFaqLoading] = useState(true);
  const [error, setError] = useState("");
  const [faqError, setFaqError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await listOwnTickets();
      setTickets(res.data.tickets || []);
    } catch {
      setError("Couldn't load your tickets.");
    } finally {
      setLoading(false);
    }
  }

  async function loadFaqs() {
    setFaqLoading(true);
    setFaqError("");

    try {
      const res = await listCustomerFaqs();
      setFaqs(res.data.faqs || []);
    } catch {
      setFaqError("Couldn't load FAQs. Please try again.");
    } finally {
      setFaqLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadFaqs();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
    } finally {
      navigate("/customer/login", { replace: true });
    }
  }

  const categories = [
    ...new Set(faqs.map((faq) => faq.category).filter(Boolean))
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      !category || faq.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-paper)" }}>
      <header className="topbar">
        <Link
          to="/customer/portal"
          style={{
            fontWeight: 600,
            color: "inherit",
            textDecoration: "none"
          }}
        >
          ResolveHQ Support
        </Link>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-4)",
          marginLeft: "auto"
        }}>
          <span style={{
            color: "var(--color-slate-muted)",
            fontSize: 13
          }}>
            {customer?.name}
          </span>

          <button
            className="btn"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      </header>

      <div className="content" style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* Knowledge Base */}
        
{/* Modern Knowledge Base */}
<section className="kb-section">
  <div className="kb-hero">
    <div className="kb-hero-content">
      <span className="kb-eyebrow">ResolveHQ Help Center</span>
      <h1>How can we help you?</h1>
      {/* <p>
        Find answers, explore helpful guides, and get support whenever you need it.
      </p> */}

      <div className="kb-search">
        <span className="kb-search-icon">⌕</span>
        <input
          type="text"
          placeholder="Search for answers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            type="button"
            className="kb-clear"
            onClick={() => setSearch("")}
          >
            Clear
          </button>
        )}
      </div>

      <span className="kb-hint">
        Search questions and answers to find what you're looking for.
      </span>
    </div>
    <div className="kb-hero-decoration" aria-hidden="true">
      <div className="kb-decoration-circle kb-circle-one" />
      <div className="kb-decoration-circle kb-circle-two" />
      <div className="kb-decoration-card">
        <span>✦</span>
        <strong>Help is here.</strong>
        {/* <small>Explore our knowledge base</small> */}
      </div>
    </div>
  </div>

  <div className="kb-content">
    <div className="kb-heading-row">
      <div>
        <span className="kb-eyebrow kb-eyebrow-blue">FAQs</span>
        <h2>Frequently Asked Questions</h2>
        <p>Browse topics or search for a specific answer.</p>
      </div>
      <span className="kb-count">
        {filteredFaqs.length} {filteredFaqs.length === 1 ? "article" : "articles"}
      </span>
    </div>

    <div className="kb-categories">
      <button
        type="button"
        className={`kb-category ${category === "" ? "active" : ""}`}
        onClick={() => setCategory("")}
      >
        All topics
      </button>

      {categories.map((item) => (
        <button
          type="button"
          key={item}
          className={`kb-category ${category === item ? "active" : ""}`}
          onClick={() => setCategory(category === item ? "" : item)}
        >
          {item}
        </button>
      ))}
    </div>

    <div className="kb-faq-list">
      {faqLoading && (
        <div className="kb-state">
          <Loading label="Finding helpful answers..." />
        </div>
      )}

      {faqError && (
        <div className="kb-state kb-error">{faqError}</div>
      )}

      {!faqLoading && !faqError && filteredFaqs.length === 0 && (
        <div className="kb-empty">
          <div className="kb-empty-icon">⌕</div>
          <h3>No answers found</h3>
          <p>Try another search term or choose a different topic.</p>
          <button
            type="button"
            className="kb-reset"
            onClick={() => {
              setSearch("");
              setCategory("");
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {!faqLoading && !faqError && filteredFaqs.map((faq) => {
        const isExpanded = expandedFaq === faq.id;

        return (
          <article
            className={`kb-faq-card ${isExpanded ? "expanded" : ""}`}
            key={faq.id}
          >
            <button
              type="button"
              className="kb-question"
              aria-expanded={isExpanded}
              onClick={() =>
                setExpandedFaq(isExpanded ? null : faq.id)
              }
            >
              <span className="kb-question-left">
                <span className="kb-question-icon">Q</span>
                <span className="kb-question-text">
                  <strong>{faq.question}</strong>
                  {faq.category && (
                    <small>{faq.category}</small>
                  )}
                </span>
              </span>

              <span className={`kb-chevron ${isExpanded ? "rotated" : ""}`}>
                ›
              </span>
            </button>

            {isExpanded && (
              <div className="kb-answer">
                <div className="kb-answer-label">ANSWER</div>
                <p>{faq.answer}</p>
              </div>
            )}
          </article>
        );
      })}
    </div>

    <div className="kb-contact">
      <div className="kb-contact-icon">?</div>
      <div className="kb-contact-copy">
        <strong>Didn't find what you were looking for?</strong>
        <p>Our support team is ready to help you resolve the issue.</p>
      </div>
      <button
        type="button"
        className="kb-contact-button"
        onClick={() => {
          setShowForm(true);
          document.querySelector(".kb-contact")?.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        }}
      >
        Raise a ticket <span>→</span>
      </button>
    </div>
  </div>
</section>


        {/* My Tickets */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--space-5)"
        }}>
          <h2>My tickets</h2>

          <button
            className="btn btn-primary"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Cancel" : "Raise a ticket"}
          </button>
        </div>

        {showForm && (
          <NewTicketPanel
            onCreated={() => {
              setShowForm(false);
              load();
            }}
          />
        )}

        {loading && <Loading label="Loading your tickets..." />}

        {error && <p className="error-text">{error}</p>}

        {!loading && !error && (
          <div className="panel" style={{ padding: "var(--space-5)" }}>
            {tickets.length === 0 ? (
              <p style={{ color: "var(--color-slate-muted)" }}>
                You haven't raised any tickets yet.
              </p>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Raised</th>
                    </tr>
                  </thead>

                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <Link to={`/customer/portal/tickets/${t.id}`}>
                            {t.subject}
                          </Link>
                        </td>
                        <td><StatusBadge status={t.status} /></td>
                        <td><PriorityBadge priority={t.priority} /></td>
                        <td className="mono">{formatDate(t.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NewTicketPanel({ onCreated }) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!subject || !description) {
      setError("Subject and description are required.");
      return;
    }

    setSubmitting(true);

    try {
      await createOwnTicket({ subject, description });
      onCreated();
    } catch (err) {
      setError(
        err.response?.data?.message || "Couldn't submit your ticket."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="panel"
      style={{
        padding: "var(--space-5)",
        marginBottom: "var(--space-4)"
      }}
    >
      <h2 style={{ marginBottom: "var(--space-4)" }}>Raise a ticket</h2>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="subject">Subject</label>
          <input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="description">Describe the issue</label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error && (
          <p className="error-text" style={{ marginBottom: "var(--space-4)" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit ticket"}
        </button>
      </form>
    </div>
  );
}
