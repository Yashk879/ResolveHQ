import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const FEATURES = [
  {
    icon: "🎫",
    title: "One queue, every ticket",
    text: "Every customer issue lands in a single, filterable queue — searchable by status, priority, or subject.",
  },
  {
    icon: "🏢",
    title: "Built for multiple teams",
    text: "Each company's tickets, customers, and agents are fully isolated — your data never mixes with anyone else's.",
  },
  {
    icon: "⚡",
    title: "Fast triage",
    text: "Assign, reprioritize, and reply without leaving the ticket — status changes reflect immediately for the whole team.",
  },
];

export default function Home() {
  const { status } = useAuth();

  const isAuthenticated = status === "authenticated";

  const [showContact, setShowContact] = useState(false);

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [contactStatus, setContactStatus] = useState("");

  const [contactLoading, setContactLoading] = useState(false);

  function handleContactChange(e) {
    const { name, value } = e.target;

    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleContactSubmit(e) {
    e.preventDefault();

    setContactLoading(true);
    setContactStatus("");

    try {
      const response = await fetch(
        "http://localhost:3000/api/contact",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(contactForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to send message"
        );
      }

      setContactStatus(
        "Message sent successfully! We'll get back to you soon."
      );

      setContactForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });

      // Close modal after 1 second
      setTimeout(() => {
        setShowContact(false);
        setContactStatus("");
      }, 1000);
    } catch (error) {
      console.error("Contact form error:", error);

      setContactStatus(
        error.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setContactLoading(false);
    }
  }

  function closeContactModal() {
    setShowContact(false);
    setContactStatus("");
  }

  return (
    <div>
      {/* HERO */}
      <div className="hero-bg">
        <nav className="home-nav">
          <span className="brand">ResolveHQ</span>

          <div
            style={{
              display: "flex",
              gap: "var(--space-3)",
              alignItems: "center",
            }}
          >
            {/* Authentication buttons */}
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="btn btn-ghost"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-ghost"
                >
                  Agent login
                </Link>

                <Link
                  to="/signup"
                  className="btn btn-primary"
                >
                  Create workspace
                </Link>
              </>
            )}

            {/* Contact button - LAST */}
            <button
              type="button"
              className="contact-btn"
              onClick={() => setShowContact(true)}
            >
              Contact
            </button>
          </div>
        </nav>

        <div className="home-hero">
          <h1>
            Customer support, without the chaos.
          </h1>

          <p>
            ResolveHQ is a straightforward helpdesk for
            small support teams — tickets, customers, and
            agents in one place, with clean role-based
            access and nothing you don't need.
          </p>

          <div className="cta-row">
            <Link
              to="/customer/login"
              className="btn btn-primary btn-lg"
            >
              Raise a ticket
            </Link>

            <Link
              to="/signup"
              className="btn btn-ghost btn-lg"
            >
              Start a workspace
            </Link>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="panel feature-card"
          >
            <div className="feature-icon">
              {f.icon}
            </div>

            <h3>{f.title}</h3>

            <p>{f.text}</p>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <footer className="home-footer">
        ResolveHQ — built to simplify customer support and
        keep every issue on track.
      </footer>

      {/* CONTACT MODAL */}
      {showContact && (
        <div
          className="contact-overlay"
          onClick={closeContactModal}
        >
          <div
            className="contact-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="contact-modal-header">
              <div>
                <h2>Contact ResolveHQ</h2>

                <p>
                  Have a question? We'd love to hear from
                  you.
                </p>
              </div>

              <button
                type="button"
                className="contact-close"
                onClick={closeContactModal}
                aria-label="Close contact form"
              >
                ×
              </button>
            </div>

            {/* Contact Form */}
            <form
              className="contact-form"
              onSubmit={handleContactSubmit}
            >
              {/* Name */}
              <div className="field">
                <label htmlFor="contact-name">
                  Name
                </label>

                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  value={contactForm.name}
                  onChange={handleContactChange}
                  placeholder="Enter your name"
                  required
                />
              </div>

              {/* Email */}
              <div className="field">
                <label htmlFor="contact-email">
                  Email
                </label>

                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  value={contactForm.email}
                  onChange={handleContactChange}
                  placeholder="Enter your Gmail"
                  required
                />
              </div>

              {/* Subject */}
              <div className="field">
                <label htmlFor="contact-subject">
                  Subject
                </label>

                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  value={contactForm.subject}
                  onChange={handleContactChange}
                  placeholder="What is this regarding?"
                  required
                />
              </div>

              {/* Message */}
              <div className="field">
                <label htmlFor="contact-message">
                  Message
                </label>

                <textarea
                  id="contact-message"
                  name="message"
                  rows="5"
                  value={contactForm.message}
                  onChange={handleContactChange}
                  placeholder="Tell us how we can help..."
                  required
                />
              </div>

              {/* Status */}
              {contactStatus && (
                <p className="contact-status">
                  {contactStatus}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary contact-submit"
                disabled={contactLoading}
              >
                {contactLoading
                  ? "Sending..."
                  : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}