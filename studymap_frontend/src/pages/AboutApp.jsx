import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  FiArrowLeft, FiBook, FiFileText, FiMessageSquare, FiEdit3,
  FiLayers, FiHelpCircle, FiMap, FiFile, FiClock, FiUser,
  FiShield, FiDatabase, FiCpu, FiDownload, FiCheck, FiX
} from 'react-icons/fi';
import '../styles/about-app.css';

const features = [
  { icon: FiBook,         title: 'Projects',      desc: 'Create, view, and organise study projects with custom colours and descriptions.' },
  { icon: FiFileText,     title: 'Documents',     desc: 'Upload PDF, DOCX, TXT, or PPTX files for AI-powered analysis.' },
  { icon: FiMessageSquare,title: 'AI Chat',       desc: 'Three modes: Document Only, Enhanced, and Discover for research.' },
  { icon: FiEdit3,        title: 'Notes',         desc: 'Create and edit notes with Markdown support and AI enhancement.' },
  { icon: FiLayers,       title: 'Flashcards',    desc: 'Generate AI decks with spaced repetition and export to PDF, Markdown, or Anki.' },
  { icon: FiHelpCircle,   title: 'Quizzes',       desc: "AI-generated quizzes with Bloom's Taxonomy, review missed questions, export results." },
  { icon: FiMap,          title: 'Mind Maps',     desc: 'Generate visual mind maps from your documents and export as PNG.' },
  { icon: FiFile,         title: 'Summaries',     desc: 'Three formats: Cornell Notes, Study Guide, and Research Summary. Export as PDF or Markdown.' },
  { icon: FiCpu,          title: 'Cheatsheets',   desc: 'Auto-generate or manually create cheatsheets. Export as PDF, Markdown, or JSON.' },
  { icon: FiClock,        title: 'Study Mode',    desc: 'Full-screen study environment with timer, flashcards, and quizzes with progress tracking.' },
  { icon: FiUser,         title: 'Profile',       desc: 'Update username, bio, and avatar. Change password and toggle theme.' },
  { icon: FiDownload,     title: 'Export Everything', desc: 'Export flashcards, quizzes, summaries, and cheatsheets in multiple formats.' },
];

const stats = [
  { value: '12', label: 'Features' },
  { value: '3',  label: 'Chat modes' },
  { value: '4',  label: 'File types' },
  { value: '3+', label: 'Export formats' },
];

const dataCollection = [
  { data: 'Username',                      reason: 'To identify you on the platform' },
  { data: 'Email',                         reason: 'For login and account recovery' },
  { data: 'Password',                      reason: 'To secure your account (hashed and salted)' },
  { data: 'Bio (optional)',                reason: 'To personalise your profile' },
  { data: 'Avatar (optional)',             reason: 'To personalise your profile' },
  { data: 'Project names & descriptions', reason: 'To organise your study materials' },
  { data: 'Project colour',               reason: 'To visually distinguish your projects' },
  { data: 'Documents (PDF/DOCX/TXT/PPTX)', reason: 'Your study materials for AI processing' },
  { data: 'Extracted text from documents', reason: 'Used by AI to generate study materials' },
  { data: 'AI-generated content',          reason: 'Your flashcards, quizzes, mind maps, summaries, cheatsheets' },
  { data: 'Chat messages',                 reason: 'To provide AI-powered Q&A' },
  { data: 'Quiz answers',                  reason: 'To calculate scores and track progress' },
  { data: 'Flashcard review data',         reason: 'To schedule optimal review times' },
  { data: 'Service logs',                  reason: 'To monitor performance and maintain service quality' },
  { data: 'Timestamps',                    reason: 'For account and content management' },
];

const storageItems = [
  {
    icon: FiDatabase,
    colorClass: 'icon-purple',
    title: 'Database',
    desc: "All user data is stored in a secure relational database. Each user's data is isolated and linked to their account.",
  },
  {
    icon: FiDownload,
    colorClass: 'icon-blue',
    title: 'Media Files',
    desc: 'Uploaded documents and avatars are stored in secure media storage with organised file paths.',
  },
  {
    icon: FiShield,
    colorClass: 'icon-green',
    title: 'Authentication Tokens',
    desc: "Secure tokens are stored in your browser's local storage and are rotated regularly with automatic logout on token blacklist.",
  },
];

const protectionItems = [
  {
    title: 'Authentication & Access Control',
    points: [
      'Secure token-based authentication',
      'Passwords are hashed and salted',
      'All API endpoints require authentication',
      'Users can only access their own data',
    ],
  },
  {
    title: 'Security Measures',
    points: [
      'Protection against common web vulnerabilities',
      'Secure coding practices',
      'API access controls and monitoring',
    ],
  },
];

const usageItems = [
  {
    title: 'To Provide Services',
    points: [
      'Documents are processed by AI (OpenRouter API) to generate study materials',
      'Chat messages are sent to AI to get responses based on your documents',
      'AI-generated content (flashcards, quizzes, etc.) is created for your use',
    ],
  },
  {
    title: 'To Improve Services',
    points: [
      'API logs help monitor performance and fix issues',
      'Usage patterns help us understand what features need improvement',
    ],
  },
];

const weDoNot = [
  'Sell your data to third parties',
  'Share your documents with other users',
  'Use your data for advertising',
];

const thirdParty = [
  'AI processing service for document analysis and chat responses',
  'Form handling service for contact form submissions',
];

export default function AboutApp() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className="about-app-root relative min-h-screen">
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 md:ml-64 p-4 md:p-8">
          <div className="about-max-width mx-auto">

            {/* Back button */}
            <button
              onClick={() => navigate(-1)}
              className="ghost-btn flex items-center gap-2 px-3 py-2 rounded-xl text-sm mb-6 fade-up"
            >
              <FiArrowLeft size={14} /> Back
            </button>

            {/* Hero */}
            <div className="about-hero about-card rounded-2xl p-6 md:p-8 mb-4 fade-up">
              <div className="about-hero-inner">
                <div>
                  <div className="about-badge mb-3">AI-Powered Study Platform</div>
                  <h1 className="text-3xl font-bold mb-3">About StudyMap</h1>
                  <p className="about-hero-desc leading-relaxed">
                    StudyMap is a full-stack web application that helps you organise study materials,
                    create flashcards, quizzes, mind maps, summaries, and cheatsheets using AI.
                    Upload your documents and let our AI transform them into effective study tools.
                  </p>
                </div>
                <div className="about-stats-grid">
                  {stats.map((s, i) => (
                    <div key={i} className="about-stat">
                      <span className="about-stat-value">{s.value}</span>
                      <span className="about-stat-label">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="about-card rounded-2xl p-6 mb-4 fade-in">
              <div className="about-section-header mb-6">
                <div className="about-section-bar" />
                <h2 className="text-xl font-bold">What You Can Do</h2>
              </div>
              <div className="about-features-grid">
                {features.map((f, idx) => (
                  <div key={idx} className="about-feature-item rounded-xl p-4 flex gap-3">
                    <div className="about-feature-icon rounded-lg flex-shrink-0 flex items-center justify-center">
                      <f.icon size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                      <p className="about-feature-desc text-xs leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data collection */}
            <div className="about-card rounded-2xl p-6 mb-4 fade-in">
              <div className="about-section-header mb-6">
                <div className="about-section-bar about-section-bar--purple" />
                <h2 className="text-xl font-bold">Data We Collect &amp; Why</h2>
              </div>
              <div className="about-data-list">
                {dataCollection.map((item, idx) => (
                  <div key={idx} className="about-data-row">
                    <span className="about-data-pill">{item.data}</span>
                    <span className="about-data-reason">{item.reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Storage */}
            <div className="about-card rounded-2xl p-6 mb-4 fade-in">
              <div className="about-section-header mb-6">
                <div className="about-section-bar about-section-bar--green" />
                <h2 className="text-xl font-bold">How We Store Your Data</h2>
              </div>
              <div className="about-storage-grid">
                {storageItems.map((item, idx) => (
                  <div key={idx} className="about-storage-item rounded-xl p-4 flex gap-3">
                    <div className={`about-storage-icon rounded-lg flex-shrink-0 flex items-center justify-center ${item.colorClass}`}>
                      <item.icon size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                      <p className="about-feature-desc text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Protection */}
            <div className="about-card rounded-2xl p-6 mb-4 fade-in">
              <div className="about-section-header mb-6">
                <div className="about-section-bar about-section-bar--teal" />
                <h2 className="text-xl font-bold">How We Protect Your Data</h2>
              </div>
              <div className="about-protect-grid">
                {protectionItems.map((item, idx) => (
                  <div key={idx} className="about-protect-box rounded-xl p-4">
                    <h3 className="text-sm font-semibold mb-3 text-success">{item.title}</h3>
                    <ul className="about-check-list">
                      {item.points.map((p, i) => (
                        <li key={i} className="flex gap-2 text-xs items-start">
                          <FiCheck size={13} className="about-check-icon flex-shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage */}
            <div className="about-card rounded-2xl p-6 mb-6 fade-in">
              <div className="about-section-header mb-6">
                <div className="about-section-bar" />
                <h2 className="text-xl font-bold">How We Use Your Information</h2>
              </div>
              <div className="about-usage-grid mb-4">
                {usageItems.map((item, idx) => (
                  <div key={idx} className="about-usage-box rounded-xl p-4">
                    <h3 className="text-sm font-semibold mb-3 text-primary">{item.title}</h3>
                    <ul className="about-check-list">
                      {item.points.map((p, i) => (
                        <li key={i} className="flex gap-2 text-xs items-start">
                          <FiCheck size={13} className="about-check-icon flex-shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="about-donot-box rounded-xl p-4 mb-4">
                <h3 className="text-sm font-semibold mb-3 about-donot-title">We Do NOT</h3>
                <ul className="about-check-list">
                  {weDoNot.map((p, i) => (
                    <li key={i} className="flex gap-2 text-xs items-start">
                      <FiX size={13} className="about-x-icon flex-shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="about-third-box rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3">Third-Party Services</h3>
                <ul className="about-check-list">
                  {thirdParty.map((p, i) => (
                    <li key={i} className="flex gap-2 text-xs items-start">
                      <span className="about-bullet flex-shrink-0 mt-1.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
