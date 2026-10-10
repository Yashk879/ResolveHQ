
import api from "../api/axios";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import ShinyText from "../components/ShinyText";

const FEATURES = [
  {
    icon: "🎫",
    title: "One queue, every ticket",
    text: "Every customer issue lands in one clear, searchable queue. Filter by status, priority, or subject and stay organized.",
  },
  {
    icon: "🏢",
    title: "Built for multiple teams",
    text: "Keep companies, customers, agents, and tickets properly separated with role-based access and tenant isolation.",
  },
  {
    icon: "⚡",
    title: "Fast triage",
    text: "Assign, reprioritize, update status, and reply without jumping between different screens.",
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
      const response = await api.post("/contact", contactForm);

      setContactStatus(
        response.data?.message || "Message sent successfully!"
      );

      setContactForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });

      setTimeout(() => {
        setShowContact(false);
        setContactStatus("");
      }, 1000);
    } catch (error) {
      console.error("Contact form error:", error);

      setContactStatus(
        error.response?.data?.message ||
          error.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setContactLoading(false);
    }
  }

  function closeContactModal() {
    if (contactLoading) return;

    setShowContact(false);
    setContactStatus("");
  }

  return (
    <div className="landing-page">
      {/* HERO */}
      <section className="hero-bg">
        {/* NAVBAR */}
        <nav className="home-nav">
          <div className="nav-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-ghost">
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  Agent login
                </Link>

                <Link to="/signup" className="btn btn-primary">
                  Create workspace
                </Link>
              </>
            )}

            <button
              type="button"
              className="contact-btn"
              onClick={() => setShowContact(true)}
            >
              Contact
            </button>
          </div>
        </nav>

        {/* HERO CONTENT */}
        <div className="home-hero">
          <ShinyText
            text="ResolveHQ"
            className="hero-brand"
            speed={2}
            delay={1}
            color="#ffffff"
            shineColor="#8db5ff"
            spread={120}
            direction="left"
            yoyo={false}
            pauseOnHover={false}
          />

          <h1>
            Customer support,
            without the chaos.
          </h1>

          <p className="hero-description">
            A straightforward helpdesk for small support
            teams — bringing tickets, customers, and agents
            together in one organized workspace.
          </p>

          <div className="cta-row">
            <Link
              to="/customer/login"
              className="btn btn-primary btn-lg"
            >
              Raise a ticket
              <span className="btn-arrow">→</span>
            </Link>

            <Link
              to="/signup"
              className="btn btn-ghost btn-lg"
            >
              Start a workspace
            </Link>
          </div>

          <div className="hero-note">
            No complicated setup · Role-based access ·
            Built for focused support teams
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section">
        <div className="features-header">
          <span className="section-label">Why ResolveHQ</span>

          <h2>Everything your support team needs.</h2>

          <p>
            Keep your workflow simple, organized, and
            focused on resolving customer issues.
          </p>
        </div>

        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="panel feature-card"
            >
              <div className="feature-icon">{feature.icon}</div>

              <h3>{feature.title}</h3>

              <p>{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="bottom-cta">
        <div>
          <span className="section-label">GET STARTED</span>

          <h2>Ready to simplify your support?</h2>

          <p>
            Create your workspace and start managing
            customer issues in one place.
          </p>
        </div>

        <Link to="/signup" className="btn btn-primary btn-lg">
          Create workspace
          <span className="btn-arrow">→</span>
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <span>ResolveHQ</span>

        <p>
          Built to simplify customer support and keep
          every issue on track.
        </p>
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
            <div className="contact-modal-header">
              <div>
                <span className="section-label">GET IN TOUCH</span>

                <h2>Contact ResolveHQ</h2>

                <p>
                  Have a question? We'd love to hear
                  from you.
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

            <form
              className="contact-form"
              onSubmit={handleContactSubmit}
            >
              <div className="field">
                <label htmlFor="contact-name">Name</label>

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

              <div className="field">
                <label htmlFor="contact-email">Email</label>

                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  value={contactForm.email}
                  onChange={handleContactChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="contact-subject">Subject</label>

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

              <div className="field">
                <label htmlFor="contact-message">Message</label>

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

              {contactStatus && (
                <p
                  className="contact-status"
                  role="status"
                  aria-live="polite"
                >
                  {contactStatus}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary contact-submit"
                disabled={contactLoading}
              >
                {contactLoading ? "Sending..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
