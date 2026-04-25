import { useEffect, useState, useCallback, Suspense, lazy, startTransition } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { FiFile, FiMessageSquare, FiEdit, FiTarget, FiHelpCircle, FiMap, FiList, FiBookOpen, FiArrowLeft, FiMenu } from 'react-icons/fi';
import { useProjectStore } from '../../store/useProjectStore';
import { useGenerationStore } from '../../store/useGenerationStore';
import { useChatStore } from '../../store/useChatStore';
import ProjectSidebar from '../../components/ProjectSidebar';
import '../../styles/project.css';

const DocumentsTab = lazy(() => import('./DocumentsTab'));
const ChatTab = lazy(() => import('./ChatTab'));
const NotesTab = lazy(() => import('./NotesTab'));
const FlashcardsTab = lazy(() => import('./FlashcardsTab'));
const QuizTab = lazy(() => import('./QuizTab'));
const MindMapTab = lazy(() => import('./MindMapTab'));
const SummaryTab = lazy(() => import('./SummaryTab'));
const StudyModeTab = lazy(() => import('./StudyModeTab'));

const TABS = [
  { id: 'documents', label: 'Documents', icon: FiFile },
  { id: 'chat', label: 'Chat', icon: FiMessageSquare },
  { id: 'notes', label: 'Notes', icon: FiEdit },
  { id: 'flashcards', label: 'Flashcards', icon: FiTarget },
  { id: 'quiz', label: 'Quiz', icon: FiHelpCircle },
  { id: 'mindmap', label: 'Mind Map', icon: FiMap },
  { id: 'summary', label: 'Summary', icon: FiList },
  { id: 'study', label: 'Study Mode', icon: FiBookOpen },
];

export default function ProjectView() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'documents';

  const { projects, fetchProjects, selectedProject, fetchDocuments, documents, fetchNotes, notes } = useProjectStore();
  const { decks, quizzes, fetchDecks, fetchQuizzes } = useGenerationStore();
  const { sessions, fetchSessions } = useChatStore();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchProjects();
      setIsLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (projects.length > 0 && projectId) {
      const project = projects.find(p => p.id === parseInt(projectId));
      if (project) {
        fetchDocuments(projectId);
        fetchNotes(projectId);
        fetchDecks(projectId);
        fetchQuizzes(projectId);
        fetchSessions(projectId);
      }
    }
  }, [projects, projectId, fetchDocuments, fetchNotes, fetchDecks, fetchQuizzes, fetchSessions]);

  const setTab = (tab) => {
    startTransition(() => {
      setSearchParams({ tab });
    });
  };

  const handleRefresh = useCallback(() => {
    fetchDocuments(projectId);
    fetchNotes(projectId);
    fetchDecks(projectId);
    fetchQuizzes(projectId);
  }, [projectId, fetchDocuments, fetchNotes, fetchDecks, fetchQuizzes]);

  const project = projects.find(p => p.id === parseInt(projectId));
  const projectDecks = decks[projectId] || [];
  const projectSessions = sessions[projectId] || [];
  const projectDocuments = documents[projectId] || [];
  const projectNotes = notes[projectId] || [];
  const projectQuizzes = quizzes[projectId] || [];

  const stats = {
    documents: projectDocuments?.length || 0,
    decks: projectDecks?.length || 0,
    quizzes: projectQuizzes?.length || 0,
    notes: projectNotes?.length || 0,
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'documents':
        return <DocumentsTab projectId={projectId} documents={projectDocuments} onRefresh={handleRefresh} />;
      case 'chat':
        return <ChatTab projectId={projectId} />;
      case 'notes':
        return <NotesTab projectId={projectId} notes={projectNotes} onRefresh={handleRefresh} />;
      case 'flashcards':
        return <FlashcardsTab projectId={projectId} />;
      case 'quiz':
        return <QuizTab projectId={projectId} />;
      case 'mindmap':
        return <MindMapTab projectId={projectId} />;
      case 'summary':
        return <SummaryTab projectId={projectId} />;
      case 'study':
        return <StudyModeTab projectId={projectId} onExit={() => setSearchParams({ tab: 'documents' })} />;
      default:
        return <DocumentsTab projectId={projectId} documents={projectDocuments} onRefresh={handleRefresh} />;
    }
  };

  const isStudyMode = activeTab === 'study';

  const handleExitStudyMode = () => {
    setSearchParams({ tab: 'documents' });
  };

  if (isStudyMode) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-950 overflow-y-auto">
          <Suspense fallback={
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
            </div>
          }>
            <StudyModeTab projectId={projectId} onExit={handleExitStudyMode} />
          </Suspense>
        </div>
    );
  }

  if (isLoading || !project) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
      </div>
    );
  }

  return (
    <div className="project-view fixed inset-0 flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <ProjectSidebar project={project} stats={stats} />
        </div>
        
        {/* Mobile Sidebar Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
            <div className="mobile-drawer absolute left-0 top-0 bottom-0 w-64 overflow-y-auto">
              <div className="p-4 flex justify-between items-center border-b mobile-drawer-header">
                <h2 className="font-bold">Menu</h2>
                <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ProjectSidebar project={project} stats={stats} embedded={true} />
              </div>
            </div>
          </div>
        )}
        
        <main className="flex-1 md:ml-64 p-3 md:p-6 overflow-y-auto pb-24 md:pb-6" style={{height: '100vh'}}>
          {/* Mobile back button */}
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="mobile-back-btn md:hidden flex items-center gap-1.5"
            >
              <FiArrowLeft size={16} /> Back
            </button>
          </div>
          
          <div className="flex gap-2 mb-4 md:mb-6 border-b pb-2 overflow-x-auto tab-scroll">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="tab-btn md:hidden flex items-center gap-2 px-3 py-2.5 rounded-lg border"
            >
              <FiMenu size={16} /><span className="ml-1">Menu</span>
            </button>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`tab-btn flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-lg whitespace-nowrap border transition-all ${
                  activeTab === tab.id
                    ? 'active'
                    : 'border-transparent'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
            </div>
          }>
            <div className="fade-up" style={{minHeight: '100%'}}>{renderTab()}</div>
          </Suspense>
        </main>
      </div>
  );
}