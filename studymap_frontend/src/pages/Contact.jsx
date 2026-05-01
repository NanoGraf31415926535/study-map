import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FiMail, FiArrowLeft, FiBook, FiZap, FiLayers, FiMessageCircle } from 'react-icons/fi';
import '../styles/contact.css';

const FEATURES = [
  { icon: FiBook, label: 'AI Study Projects', desc: 'Build structured learning paths with AI guidance' },
  { icon: FiZap, label: 'Smart Flashcards', desc: 'Auto-generated cards from your notes & materials' },
  { icon: FiLayers, label: 'Quizzes & Cheatsheets', desc: 'Test yourself and review at a glance' },
];

export default function Contact() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [focused, setFocused] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    const form = e.target;
    const formData = new FormData(form);
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });
      if (res.ok) { setStatus('success'); form.reset(); }
      else setStatus('error');
    } catch { setStatus('error'); }
  };

  return (
    <div className="contact-root relative min-h-screen">
      <div className="contact-ambient" aria-hidden="true" />

      <div className="flex flex-col md:flex-row">
        <div className="flex-1 md:ml-64 p-4 md:p-10">
          <div className="max-w-5xl mx-auto">

            {/* Back */}
            <button
              onClick={() => navigate(-1)}
              className="ghost-btn flex items-center gap-2 px-3 py-2 rounded-xl text-sm mb-8 fade-up"
            >
              <FiArrowLeft size={14} /> Back
            </button>

            {/* Hero */}
            <div className="contact-hero mb-10 fade-up">
              <div className="contact-badge mb-4">
                <FiMessageCircle size={13} />
                <span>Get in touch</span>
              </div>
              <h1 className="contact-title">Talk to the <span className="contact-title-accent">StudyMap</span> team</h1>
              <p className="contact-subtitle">
                Questions about your learning projects, flashcard packs, or AI features? We're here.
              </p>
            </div>

            {/* Feature pills */}
            <div className="feature-strip mb-10 fade-in">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div className="feature-pill" key={label}>
                  <div className="feature-pill-icon"><Icon size={16} /></div>
                  <div>
                    <p className="feature-pill-label">{label}</p>
                    <p className="feature-pill-desc">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Status banners */}
            {status === 'success' && (
              <div className="status-banner status-success mb-6 fade-up">
                <span>✓</span> Message sent! We'll get back to you within 24 hours.
              </div>
            )}
            {status === 'error' && (
              <div className="status-banner status-error mb-6 fade-up">
                <span>✕</span> Something went wrong. Please try again or email us directly.
              </div>
            )}

            {/* Main grid */}
            <div className="contact-grid fade-in">

              {/* Left — info */}
              <div className="space-y-5">
                <div className="contact-card p-6 rounded-2xl">
                  <h3 className="contact-card-title mb-1">Reach us directly</h3>
                  <p className="text-sm text-muted mb-5">
                    We read every message from students and educators building with StudyMap.
                  </p>
                  <a
                    href="mailto:artemsakhnyuk33@gmail.com"
                    className="contact-link-btn"
                  >
                    <span className="contact-link-icon"><FiMail size={15} /></span>
                    <span>artemsakhnyuk33@gmail.com</span>
                  </a>
                </div>

                <div className="contact-card p-6 rounded-2xl">
                  <h3 className="contact-card-title mb-3">What can we help with?</h3>
                  <ul className="topic-list">
                    {[
                      'Setting up your first study project',
                      'AI quiz & flashcard generation',
                      'Cheatsheet templates & formatting',
                      'Account or billing questions',
                      'Feedback & feature requests',
                    ].map((t) => (
                      <li key={t} className="topic-item">
                        <span className="topic-dot" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right — form */}
              <form
                id="contact-form"
                className="contact-card contact-form p-6 rounded-2xl space-y-4"
                action="https://formspree.io/f/movlgnaa"
                method="POST"
                onSubmit={handleSubmit}
              >
                <h3 className="contact-card-title mb-1">Send a message</h3>
                <p className="text-sm text-muted mb-4">We usually respond within one business day.</p>

                <div className="form-row">
                  <div className={`form-group ${focused === 'name' ? 'focused' : ''}`}>
                    <label htmlFor="name">Your name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="input-field"
                      placeholder="Alex Johnson"
                      onFocus={() => setFocused('name')}
                      onBlur={() => setFocused(null)}
                      required
                    />
                  </div>
                  <div className={`form-group ${focused === 'email' ? 'focused' : ''}`}>
                    <label htmlFor="email">Email address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="input-field"
                      placeholder="alex@university.edu"
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                      required
                    />
                  </div>
                </div>

                <div className={`form-group ${focused === 'subject' ? 'focused' : ''}`}>
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    className="input-field"
                    placeholder="e.g. Flashcard generation not working"
                    onFocus={() => setFocused('subject')}
                    onBlur={() => setFocused(null)}
                    required
                  />
                </div>

                <div className={`form-group ${focused === 'message' ? 'focused' : ''}`}>
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    className="input-field resize-none"
                    placeholder="Tell us what you're working on or what's going wrong..."
                    onFocus={() => setFocused('message')}
                    onBlur={() => setFocused(null)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="submit-btn w-full py-3 text-sm font-semibold rounded-xl"
                >
                  {status === 'sending' ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="spinner" /> Sending…
                    </span>
                  ) : 'Send Message →'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
