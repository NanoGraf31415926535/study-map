import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FiArrowLeft, FiMail, FiMapPin, FiCode, FiUsers, FiBriefcase, FiBook } from 'react-icons/fi';
import '../styles/about.css';

export default function About() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const technicalSkills = [
    'Python', 'Django', 'Flask', 'FastAPI', 'JavaScript', 'HTML', 'CSS',
    'SQL', 'RESTful APIs', 'Git', 'Docker', 'Agile Methodologies',
    'Data Analysis', 'Machine Learning'
  ];

  const softSkills = [
    'Problem-solving', 'Teamwork', 'Communication', 'Adaptability',
    'Critical Thinking', 'Time Management'
  ];

  const experiences = [
    {
      company: 'Ruth Miskin Training',
      role: 'Full Stack Software Developer',
      period: 'Oct 2025 – Present',
      achievements: [
        'Spearheaded an educational platform using Flask and React, increasing course completion rates by 25%.',
        'Integrated third-party APIs that drove a 30% increase in user interaction.',
        'Collaborated with educators to design features aligned with pedagogical goals, improving satisfaction by 20%.',
        'Managed project timelines via Agile, ensuring on-time delivery of all features.',
        'Implemented code-review feedback loops that reduced post-deployment issues by 15%.',
      ]
    },
    {
      company: 'The Code Registry',
      role: 'Full Stack Web Developer',
      period: 'Jun 2025 – Oct 2026',
      achievements: [
        'Architected a scalable Django/Angular platform supporting 10,000+ users with 40% reliability improvement.',
        'Built CI/CD pipelines cutting deployment time by 50% for faster feature releases.',
        'Enhanced security protocols, reducing vulnerabilities by 60% and ensuring compliance.',
        'Performance-tuned the application, achieving 35% faster response times.',
        'Mentored 4 interns in full-stack development practices.',
      ]
    },
    {
      company: 'Freelance – Lukas Emanuel Holz',
      role: 'Full Stack AI Developer',
      period: 'Aug 2025 – Sep 2025',
      achievements: [
        'Built an AI-driven web app using ML to personalise user experiences, boosting engagement 30%.',
        'Delivered a Tableau data-visualisation dashboard providing real-time stakeholder insights.',
        'Defined project scope with cross-functional teams to meet client expectations on time.',
        'Used Git-based workflows that reduced integration issues by 25%.',
        'Ran user-testing sessions leading to a 15% usability improvement.',
      ]
    },
    {
      company: 'Goethe University',
      role: 'Full Stack Web Developer',
      period: 'Jun 2024 – Jun 2025',
      achievements: [
        'Led Django/React development that streamlined course registration, cutting admin workload 35%.',
        'Applied responsive design, raising user-satisfaction ratings by 50%.',
        'Optimised database queries to cut load times by 40%.',
        'Collaborated with faculty to improve course management, increasing enrolment by 20%.',
        'Trained 3 junior developers, fostering a collaborative learning environment.',
      ]
    },
    {
      company: 'Capstone Project in Bioinformatics',
      role: 'Python Developer',
      period: 'Oct 2022 – Aug 2023',
      achievements: [
        'Built a Python/Flask bioinformatics app improving genomic-data processing speed by 30%.',
        'Co-implemented an ML model that raised genetic-marker prediction accuracy by 25%.',
        'Designed a UI that reduced onboarding time by 40%.',
        'Integrated RESTful APIs, cutting data-retrieval time by 50%.',
        'Ran code reviews that lowered bug reports in testing by 20%.',
      ]
    },
  ];

  return (
    <div className="about-root relative min-h-screen">
      <div className="about-ambient" aria-hidden="true" />

      <div className="flex flex-col md:flex-row">
        <div className="flex-1 md:ml-64 p-4 md:p-10">
          <div className="max-w-4xl mx-auto">

            {/* Back */}
            <button
              onClick={() => navigate(-1)}
              className="ghost-btn flex items-center gap-2 px-3 py-2 rounded-xl text-sm mb-8 fade-up"
            >
              <FiArrowLeft size={14} /> Back
            </button>

            {/* Hero card */}
            <div className="about-hero-card rounded-2xl p-6 md:p-8 mb-6 fade-up">
              <div className="about-avatar">AS</div>
              <div className="about-hero-text">
                <h1 className="about-name">Artem Sakhniuk</h1>
                <p className="about-role-label">Full Stack Developer &amp; Creator of <span className="about-accent">StudyMap</span></p>
                <div className="about-meta">
                  <span className="about-meta-item">
                    <FiMapPin size={13} /> London, UK
                  </span>
                  <a href="mailto:artemsakhnyuk33@gmail.com" className="about-meta-item about-meta-link">
                    <FiMail size={13} /> artemsakhnyuk33@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="about-card rounded-2xl p-6 mb-6 fade-in">
              <div className="about-section-header">
                <FiBriefcase size={15} className="about-section-icon" />
                <h2 className="about-section-title">Professional Summary</h2>
              </div>
              <p className="about-body">
                Detail-oriented Python Developer with over 2 years of experience in full-stack development and
                bioinformatics applications. Proficient in leveraging frameworks like Django and Flask to build scalable
                web applications while driving digital transformation initiatives. Adept at collaborating with
                cross-functional teams to deliver innovative solutions that enhance operational efficiency and user experience.
              </p>
            </div>

            {/* Skills */}
            <div className="about-card rounded-2xl p-6 mb-6 fade-in">
              <div className="about-section-header">
                <FiCode size={15} className="about-section-icon" />
                <h2 className="about-section-title">Skills</h2>
              </div>
              <div className="skills-grid">
                <div>
                  <p className="skills-group-label">Technical</p>
                  <div className="skill-tags">
                    {technicalSkills.map((s) => (
                      <span key={s} className="skill-tag">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="skills-group-label">Soft Skills</p>
                  <div className="skill-tags">
                    {softSkills.map((s) => (
                      <span key={s} className="skill-tag skill-tag--soft">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Experience */}
            <div className="about-card rounded-2xl p-6 mb-6 fade-in">
              <div className="about-section-header">
                <FiUsers size={15} className="about-section-icon" />
                <h2 className="about-section-title">Professional Experience</h2>
              </div>
              <div className="exp-list">
                {experiences.map((exp, idx) => (
                  <div key={idx} className="exp-item">
                    <div className="exp-timeline-dot" />
                    <div className="exp-content">
                      <div className="exp-header">
                        <div>
                          <h3 className="exp-company">{exp.company}</h3>
                          <p className="exp-role">{exp.role}</p>
                        </div>
                        <span className="exp-period">{exp.period}</span>
                      </div>
                      <ul className="exp-achievements">
                        {exp.achievements.map((ach, aidx) => (
                          <li key={aidx} className="exp-achievement">
                            <span className="exp-bullet" />
                            <span>{ach}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="about-card rounded-2xl p-6 mb-6 fade-in">
              <div className="about-section-header">
                <FiBook size={15} className="about-section-icon" />
                <h2 className="about-section-title">Education</h2>
              </div>
              <div className="edu-block">
                <h3 className="exp-company">Taras Shevchenko National University</h3>
                <p className="exp-role">Bachelor's Degree in Bioinformatics</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
