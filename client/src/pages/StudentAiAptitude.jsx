import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, MetricCard } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import {
  Brain, Clock, Award, CheckCircle2, AlertCircle, Sparkles,
  BookOpen, Calculator, HelpCircle, ArrowRight, RotateCcw,
  Check, X, ChevronRight, Filter, Search, BarChart3, History,
  TrendingUp, Flame, Lightbulb, Zap, ShieldAlert, Copy, Layers
} from 'lucide-react';

export default function StudentAiAptitude() {
  const [activeTab, setActiveTab] = useState('practice'); // 'practice', 'study', 'foundations', 'solver', 'history', 'analytics'
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [searchTopic, setSearchTopic] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Test Session State
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [isTimed, setIsTimed] = useState(true);
  const [loadingTest, setLoadingTest] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Topic Guide State
  const [guideTopic, setGuideTopic] = useState('Percentage');
  const [topicGuide, setTopicGuide] = useState(null);
  const [loadingGuide, setLoadingGuide] = useState(false);

  // Foundations State
  const [foundationsData, setFoundationsData] = useState(null);
  const [foundationsTab, setFoundationsTab] = useState('fractions'); // 'fractions', 'squares', 'cubes', 'divisibility', 'shortcuts'
  const [loadingFoundations, setLoadingFoundations] = useState(false);

  // AI Question Solver State
  const [solverQuestion, setSolverQuestion] = useState('');
  const [solverTopicHint, setSolverTopicHint] = useState('');
  const [solverLoading, setSolverLoading] = useState(false);
  const [solverResult, setSolverResult] = useState(null);

  // History & Analytics State
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    fetchTopics();
    fetchAnalytics();
    fetchFoundations();
    fetchTopicGuide('Percentage');
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await fetch(buildApiUrl('/aptitude/topics'), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
        if (data.length > 0 && !selectedTopic) setSelectedTopic(data[0]);
      }
    } catch (err) {
      console.error('Failed to load aptitude topics:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(buildApiUrl('/aptitude/my-analytics'), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(buildApiUrl('/aptitude/my-history'), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      toast.error('Failed to load test history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchFoundations = async () => {
    setLoadingFoundations(true);
    try {
      const res = await fetch(buildApiUrl('/aptitude/foundations'), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setFoundationsData(data);
      }
    } catch (err) {
      console.error('Failed to load foundations:', err);
    } finally {
      setLoadingFoundations(false);
    }
  };

  const fetchTopicGuide = async (topicName) => {
    setLoadingGuide(true);
    setGuideTopic(topicName);
    try {
      const res = await fetch(buildApiUrl(`/aptitude/topic-guide/${encodeURIComponent(topicName)}`), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTopicGuide(data);
      }
    } catch (err) {
      console.error('Failed to load topic guide:', err);
    } finally {
      setLoadingGuide(false);
    }
  };

  const handleSolveQuestion = async (e) => {
    e?.preventDefault();
    if (!solverQuestion.trim()) {
      return toast.error('Please paste or type an aptitude question to solve.');
    }

    setSolverLoading(true);
    try {
      const res = await fetch(buildApiUrl('/aptitude/solve-question'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ questionText: solverQuestion.trim(), topicHint: solverTopicHint.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to solve question');

      setSolverResult(data);
      toast.success('✨ Root-Cause Breakdown & Shortcut generated!');
    } catch (err) {
      toast.error(err.message || 'Failed to analyze question');
    } finally {
      setSolverLoading(false);
    }
  };

  // Start Test
  const handleStartTest = async () => {
    if (!selectedTopic) return toast.error('Please select an aptitude topic first');

    setLoadingTest(true);
    try {
      const res = await fetch(buildApiUrl('/aptitude/generate-test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          topic: selectedTopic.name,
          difficulty,
          questionCount
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate test');

      setActiveSession(data);
      setCurrentQuestionIndex(0);
      setStudentAnswers({});
      setFlaggedQuestions({});
      setTestResult(null);

      if (isTimed) {
        setSecondsRemaining(data.totalTimeSeconds || (data.questions.length * 90));
      } else {
        setSecondsRemaining(0);
      }

      toast.success(`🎯 ${selectedTopic.name} Test initialized with ${data.questions.length} questions!`);
    } catch (err) {
      toast.error(err.message || 'Error generating test');
    } finally {
      setLoadingTest(false);
    }
  };

  // Timer Effect
  useEffect(() => {
    if (activeSession && isTimed && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [activeSession, isTimed, secondsRemaining]);

  const handleAutoSubmit = () => {
    toast.error('⏰ Time is up! Submitting your test automatically...');
    handleSubmitTest();
  };

  const handleSelectOption = (optionLetter) => {
    setStudentAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionLetter
    }));
  };

  const toggleFlag = () => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [currentQuestionIndex]: !prev[currentQuestionIndex]
    }));
  };

  const handleSubmitTest = async () => {
    if (!activeSession) return;
    clearInterval(timerRef.current);
    setShowConfirmModal(false);
    setSubmittingTest(true);

    const answersPayload = activeSession.questions.map((q, idx) => ({
      questionId: q.id,
      selectedOption: studentAnswers[idx] || null
    }));

    const totalTimeAllocated = activeSession.totalTimeSeconds || (activeSession.questions.length * 90);
    const timeTaken = isTimed ? Math.max(1, totalTimeAllocated - secondsRemaining) : 120;

    try {
      const res = await fetch(buildApiUrl('/aptitude/submit-test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          sessionId: activeSession.sessionId,
          answers: answersPayload,
          timeTakenSeconds: timeTaken
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit test');

      setTestResult(data);
      setActiveSession(null);
      fetchAnalytics();
      toast.success(`🎉 Test Complete! Score: ${data.score}/${data.totalQuestions} (${data.accuracy}%)`);
    } catch (err) {
      toast.error(err.message || 'Error submitting test');
    } finally {
      setSubmittingTest(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredTopics = topics.filter(t => {
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    const matchesSearch = t.name.toLowerCase().includes(searchTopic.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTopic.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const currentQ = activeSession ? activeSession.questions[currentQuestionIndex] : null;
  const categories = ['All', 'Arithmetic', 'Commercial Math', 'Algebra', 'Geometry & Mensuration', 'Modern Math & DI'];

  return (
    <AppShell
      title="AI Quantitative Aptitude Mastery Suite"
      subtitle="Learn core formulas, speed-math tricks, master foundations from scratch, solve complex questions with instant root-cause AI breakdown, and practice topic tests."
      searchPlaceholder="Search quantitative topics..."
    >
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Tests Completed"
          value={`${analytics?.totalTests || 0} Exams`}
          helper={`${analytics?.totalQuestionsAttempted || 0} Questions Solved`}
          tone="primary"
          icon={<Brain size={20} />}
        />
        <MetricCard
          title="Overall Accuracy"
          value={`${analytics?.averageAccuracy || 0}%`}
          helper={`Best Score: ${analytics?.bestAccuracy || 0}%`}
          tone={analytics?.averageAccuracy >= 70 ? 'success' : 'warning'}
          icon={<Award size={20} />}
        />
        <MetricCard
          title="Daily Streak"
          value={`${analytics?.streakDays || 0} Days`}
          helper="Continuous Practice"
          tone="neutral"
          icon={<Flame size={20} />}
        />
        <MetricCard
          title="Aptitude Mastery"
          value={`${Object.keys(analytics?.topicBreakdown || {}).length} Topics`}
          helper="Assessed with AI Diagnostics"
          tone="primary"
          icon={<TrendingUp size={20} />}
        />
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('practice'); setTestResult(null); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm shrink-0 ${
            activeTab === 'practice'
              ? 'bg-blue-600 text-white shadow-blue-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Zap size={16} />
          <span>⚡ Practice Tests</span>
        </button>

        <button
          onClick={() => { setActiveTab('study'); if (!topicGuide) fetchTopicGuide(guideTopic); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm shrink-0 ${
            activeTab === 'study'
              ? 'bg-blue-600 text-white shadow-blue-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <BookOpen size={16} />
          <span>🧠 Topic Study & Formula Vault</span>
        </button>

        <button
          onClick={() => { setActiveTab('foundations'); if (!foundationsData) fetchFoundations(); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm shrink-0 ${
            activeTab === 'foundations'
              ? 'bg-blue-600 text-white shadow-blue-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Calculator size={16} />
          <span>🔢 Math Foundations & Speed Math</span>
        </button>

        <button
          onClick={() => setActiveTab('solver')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm shrink-0 ${
            activeTab === 'solver'
              ? 'bg-blue-600 text-white shadow-blue-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Sparkles size={16} />
          <span>🤖 AI Question Solver (Root-Cause)</span>
        </button>

        <button
          onClick={() => { setActiveTab('history'); fetchHistory(); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm shrink-0 ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-blue-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <History size={16} />
          <span>📜 Test History</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PRACTICE TESTS & EXAM STUDIO                       */}
      {/* ========================================================= */}
      {activeTab === 'practice' && !activeSession && !testResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Topics Directory */}
          <div className="lg:col-span-2 space-y-4">
            <SurfaceCard className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Placement Quantitative Syllabus</h3>
                  <p className="text-xs text-slate-400">16 standard core placement aptitude topics</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search topics (e.g. Ratio, Work, SI)..."
                    value={searchTopic}
                    onChange={e => setSearchTopic(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition ${
                      categoryFilter === cat
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Topics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {filteredTopics.map(t => {
                  const isSelected = selectedTopic?._id === t._id || selectedTopic?.name === t.name;
                  return (
                    <div
                      key={t._id || t.name}
                      onClick={() => setSelectedTopic(t)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-black text-slate-900">{t.name}</span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {t.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </SurfaceCard>
          </div>

          {/* Right Column: Test Setup & Configuration */}
          <div className="space-y-6">
            <SurfaceCard className="p-6 space-y-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Selected Topic</span>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">
                  {selectedTopic?.name || 'Choose a Topic'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedTopic?.description || 'Select a topic on the left to configure your practice test session.'}
                </p>
              </div>

              {/* Difficulty Selector */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-2">Difficulty Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Easy', 'Medium', 'Hard'].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        difficulty === d
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count Selector */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-2">Question Count</label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        questionCount === cnt
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {cnt} Qs
                    </button>
                  ))}
                </div>
              </div>

              {/* Timed Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <Clock size={16} className="text-blue-600" />
                  <div>
                    <span className="text-xs font-black text-slate-800 block">Exam Timer Mode</span>
                    <span className="text-[10px] text-slate-400">90 seconds countdown per question</span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={isTimed}
                  onChange={e => setIsTimed(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </div>

              {/* Start Test Button */}
              <button
                type="button"
                onClick={handleStartTest}
                disabled={loadingTest || !selectedTopic}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {loadingTest ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>AI Generating Custom Test Session...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Start Test Session</span>
                  </>
                )}
              </button>
            </SurfaceCard>
          </div>
        </div>
      )}

      {/* ACTIVE TEST MODE (Live Exam Palette, Questions, Timer) */}
      {activeSession && currentQ && (
        <div className="max-w-5xl mx-auto space-y-6">
          <SurfaceCard className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl shadow-xl">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-600 text-white text-xs font-black rounded-xl uppercase tracking-wider">
                {activeSession.topic}
              </span>
              <span className="text-xs text-slate-300 font-bold">
                Question {currentQuestionIndex + 1} of {activeSession.questions.length}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {isTimed && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-amber-300 font-mono font-black text-sm">
                  <Clock size={14} className="text-amber-400 animate-pulse" />
                  <span>{formatTimer(secondsRemaining)}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95"
              >
                Submit Exam
              </button>
            </div>
          </SurfaceCard>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-4">
              <SurfaceCard className="p-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <span className="text-xs font-black text-slate-400">
                    Difficulty: <span className="text-blue-600 font-bold">{currentQ.difficulty || difficulty}</span>
                  </span>
                  <button
                    type="button"
                    onClick={toggleFlag}
                    className={`text-xs font-bold px-3 py-1 rounded-xl transition flex items-center gap-1 ${
                      flaggedQuestions[currentQuestionIndex]
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{flaggedQuestions[currentQuestionIndex] ? '🚩 Marked for Review' : 'Mark for Review'}</span>
                  </button>
                </div>

                <p className="text-sm font-bold text-slate-900 leading-relaxed mb-6">
                  {currentQ.question}
                </p>

                <div className="space-y-3">
                  {currentQ.options?.map((opt, i) => {
                    const optLetter = String.fromCharCode(65 + i);
                    const isSelected = studentAnswers[currentQuestionIndex] === optLetter;
                    return (
                      <div
                        key={optLetter}
                        onClick={() => handleSelectOption(optLetter)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-black shadow-sm ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className={`h-7 w-7 rounded-xl flex items-center justify-center font-black text-xs ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {optLetter}
                        </div>
                        <span className="text-xs font-medium flex-1">{opt}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  >
                    ← Previous
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(activeSession.questions.length - 1, prev + 1))}
                    disabled={currentQuestionIndex === activeSession.questions.length - 1}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-30"
                  >
                    Next Question →
                  </button>
                </div>
              </SurfaceCard>
            </div>

            {/* Right Question Palette */}
            <div>
              <SurfaceCard className="p-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Question Palette</h4>
                <div className="grid grid-cols-5 gap-2">
                  {activeSession.questions.map((q, idx) => {
                    const isAnswered = studentAnswers[idx] !== undefined;
                    const isFlagged = flaggedQuestions[idx];
                    const isCurrent = currentQuestionIndex === idx;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`h-9 rounded-xl font-black text-xs transition relative ${
                          isCurrent
                            ? 'ring-2 ring-blue-600 ring-offset-2'
                            : ''
                        } ${
                          isFlagged
                            ? 'bg-amber-500 text-white'
                            : isAnswered
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </SurfaceCard>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM SUBMISSION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-slate-900">Confirm Exam Submission?</h3>
            <p className="text-xs text-slate-500">
              You have answered {Object.keys(studentAnswers).length} of {activeSession?.questions.length} questions.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Resume Test
              </button>
              <button
                type="button"
                onClick={handleSubmitTest}
                disabled={submittingTest}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md"
              >
                {submittingTest ? 'Grading...' : 'Yes, Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEST RESULT & SCORECARD VIEW */}
      {testResult && (
        <div className="max-w-4xl mx-auto space-y-6">
          <SurfaceCard className="p-6 bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-800 text-white rounded-3xl shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Exam Scorecard</span>
                <h2 className="text-2xl font-black mt-1">{testResult.topic} Practice Exam</h2>
                <p className="text-xs text-indigo-100 mt-1">
                  Difficulty: {testResult.difficulty} • Time Taken: {testResult.timeTakenSeconds || 0}s
                </p>
              </div>

              <div className="flex items-center gap-4 text-center">
                <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                  <div className="text-3xl font-black text-emerald-300">{testResult.score}/{testResult.totalQuestions}</div>
                  <span className="text-[10px] font-bold text-indigo-200 uppercase">Correct Answers</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                  <div className="text-3xl font-black text-amber-300">{testResult.accuracy}%</div>
                  <span className="text-[10px] font-bold text-indigo-200 uppercase">Accuracy Rate</span>
                </div>
              </div>
            </div>
          </SurfaceCard>

          {/* AI Diagnostic Performance Report */}
          {testResult.aiAnalysis && (
            <SurfaceCard className="p-6">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-indigo-600" />
                <span>AI Conceptual Diagnostics & Action Plan</span>
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed font-medium">
                {testResult.aiAnalysis.overallSummary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testResult.aiAnalysis.strengths?.length > 0 && (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-2xl text-xs">
                    <span className="font-black text-emerald-900 block mb-1.5 flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      Demonstrated Strengths
                    </span>
                    <ul className="text-emerald-800 space-y-1 pl-4 list-disc font-medium text-[11px]">
                      {testResult.aiAnalysis.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {testResult.aiAnalysis.weaknesses?.length > 0 && (
                  <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl text-xs">
                    <span className="font-black text-amber-900 block mb-1.5 flex items-center gap-1">
                      <AlertCircle size={14} className="text-amber-600" />
                      Bottlenecks & Gaps
                    </span>
                    <ul className="text-amber-800 space-y-1 pl-4 list-disc font-medium text-[11px]">
                      {testResult.aiAnalysis.weaknesses.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </SurfaceCard>
          )}

          {/* Question Breakdown with Step-by-Step Mathematical Explanations */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900">Step-by-Step Question Review & Shortcuts</h3>

            {testResult.questions?.map((q, idx) => {
              const isCorrect = q.isCorrect;
              return (
                <SurfaceCard key={idx} className={`p-5 border ${isCorrect ? 'border-emerald-200' : 'border-red-200'}`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                    <span className="text-xs font-black text-slate-900">Question {idx + 1}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isCorrect ? 'Correct ✓' : 'Incorrect ✕'}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900 mb-3">{q.question}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block">Your Answer:</span>
                      <span className={`font-black ${isCorrect ? 'text-emerald-700' : 'text-red-600'}`}>
                        {q.studentAnswer || 'Skipped (Unanswered)'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-600 block">Correct Answer:</span>
                      <span className="font-black text-emerald-800">{q.correctAnswer}</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200/60 text-xs text-slate-700 space-y-1.5">
                    <span className="font-black text-blue-900 block flex items-center gap-1">
                      <Lightbulb size={13} className="text-amber-500" />
                      Mathematical Derivation:
                    </span>
                    <p className="font-medium whitespace-pre-line text-[11px] leading-relaxed">
                      {q.explanation}
                    </p>
                    {q.shortcutSolution && (
                      <div className="mt-2 pt-2 border-t border-blue-200/60 text-[11px] font-bold text-indigo-900">
                        ⚡ 10-Second Shortcut Trick: {q.shortcutSolution}
                      </div>
                    )}
                  </div>
                </SurfaceCard>
              );
            })}
          </div>

          <div className="flex items-center justify-end pt-4">
            <button
              type="button"
              onClick={() => { setTestResult(null); setActiveTab('practice'); }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition"
            >
              Start Another Practice Exam
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: TOPIC STUDY & FORMULA VAULT                        */}
      {/* ========================================================= */}
      {activeTab === 'study' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Topics List */}
          <div className="space-y-4">
            <SurfaceCard className="p-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BookOpen size={14} className="text-blue-600" />
                <span>Select Topic</span>
              </h3>
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {topics.map(t => {
                  const isSelected = guideTopic === t.name;
                  return (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => fetchTopicGuide(t.name)}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{t.name}</span>
                        <ChevronRight size={13} className={isSelected ? 'text-blue-600' : 'text-slate-400'} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </SurfaceCard>
          </div>

          {/* Right Column: Topic Detailed Guide, Formulas, Shortcuts, Worked Examples */}
          <div className="lg:col-span-3 space-y-6">
            {loadingGuide ? (
              <SurfaceCard className="p-12 text-center text-slate-400 text-xs">Loading Topic Study Guide...</SurfaceCard>
            ) : topicGuide ? (
              <>
                {/* Topic Header & Core Intuition */}
                <SurfaceCard className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl shadow-xl">
                  <span className="px-2.5 py-0.5 bg-blue-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                    {topicGuide.category || 'Quantitative Aptitude'}
                  </span>
                  <h2 className="text-xl font-black mt-2">{topicGuide.topicName} — Master Guide</h2>
                  <p className="text-xs text-indigo-100 mt-2 leading-relaxed font-medium">
                    {topicGuide.coreIntuition}
                  </p>
                </SurfaceCard>

                {/* Formula Cheat Sheet */}
                <SurfaceCard className="p-6">
                  <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Calculator size={16} className="text-blue-600" />
                    <span>Essential Formula Cheat Sheet</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {topicGuide.formulas?.map((f, i) => (
                      <div key={i} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                        <span className="text-xs font-black text-slate-900 block">{f.name}</span>
                        <div className="p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-blue-700 select-all">
                          {f.formula}
                        </div>
                        <span className="text-[10px] text-slate-400 block">{f.note}</span>
                      </div>
                    ))}
                  </div>
                </SurfaceCard>

                {/* Speed Math Shortcuts for this Topic */}
                {topicGuide.shortcuts?.length > 0 && (
                  <SurfaceCard className="p-6 bg-amber-50/40 border border-amber-200/70">
                    <h3 className="text-sm font-black text-amber-950 mb-3 flex items-center gap-2">
                      <Zap size={16} className="text-amber-600" />
                      <span>Speed Math & Shortcut Hacks</span>
                    </h3>
                    <div className="space-y-3">
                      {topicGuide.shortcuts.map((sc, i) => (
                        <div key={i} className="p-3.5 bg-white/90 border border-amber-200 rounded-xl text-xs space-y-1">
                          <span className="font-black text-amber-900 block">⚡ {sc.title}</span>
                          <p className="text-amber-800 text-[11px] font-medium leading-relaxed">{sc.tip}</p>
                        </div>
                      ))}
                    </div>
                  </SurfaceCard>
                )}

                {/* Step-by-Step Worked Examples with Root-Cause logic */}
                {topicGuide.workedExamples?.length > 0 && (
                  <SurfaceCard className="p-6">
                    <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                      <Lightbulb size={16} className="text-indigo-600" />
                      <span>Worked Examples with Root-Cause Logic</span>
                    </h3>
                    <div className="space-y-4">
                      {topicGuide.workedExamples.map((ex, i) => (
                        <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-3">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-900">Example {i + 1} ({ex.difficulty || 'Medium'})</span>
                            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                              Ans: {ex.answer}
                            </span>
                          </div>

                          <p className="font-bold text-slate-900">{ex.question}</p>

                          <div className="p-3 bg-indigo-50/60 border border-indigo-200/60 rounded-xl space-y-1 text-indigo-950 text-[11px]">
                            <span className="font-black text-indigo-900 block">🎯 Root Mathematical Principle:</span>
                            <p>{ex.rootLogic}</p>
                          </div>

                          <div className="p-3 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-700 space-y-1">
                            <span className="font-bold text-slate-900 block">Step-by-Step Working:</span>
                            <p className="whitespace-pre-line leading-relaxed font-mono text-[11px]">{ex.stepByStep}</p>
                          </div>

                          {ex.shortcutTrick && (
                            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 font-bold">
                              ⚡ 10-Second Shortcut: {ex.shortcutTrick}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </SurfaceCard>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MATH FOUNDATIONS & SPEED MATH TOOLKIT              */}
      {/* ========================================================= */}
      {activeTab === 'foundations' && (
        <div className="space-y-6">
          <SurfaceCard className="p-6 bg-gradient-to-r from-teal-700 via-emerald-800 to-indigo-900 text-white rounded-3xl shadow-xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">
              Aptitude Prerequisites & Speed Toolkit
            </span>
            <h2 className="text-xl font-black mt-1">Foundational Math Bootcamp</h2>
            <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
              Master the core mental arithmetic prerequisites (fraction conversions, squares, cubes, divisibility, and LCM) required to solve competitive exams in seconds.
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              {[
                { id: 'fractions', label: 'Fraction to % Chart' },
                { id: 'squares', label: 'Squares (1 to 50)' },
                { id: 'cubes', label: 'Cubes (1 to 30)' },
                { id: 'divisibility', label: 'Divisibility Rules' },
                { id: 'shortcuts', label: 'Speed Math Hacks' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setFoundationsTab(sub.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    foundationsTab === sub.id
                      ? 'bg-white text-emerald-900 shadow-md font-black'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </SurfaceCard>

          {/* Sub-tab 1: Fraction to Percentage Chart */}
          {foundationsTab === 'fractions' && foundationsData?.fractionsToPercentages && (
            <SurfaceCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Fraction to Percentage Conversion Table</h3>
                  <p className="text-xs text-slate-400">Essential for fast mental calculation in Percentage, Profit/Loss, and DI</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {foundationsData.fractionsToPercentages.map((item, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center hover:bg-blue-50/50 hover:border-blue-300 transition">
                    <span className="text-base font-black text-blue-700 block font-mono">{item.fraction}</span>
                    <span className="text-xs font-black text-slate-900 block mt-1">{item.percentage}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">({item.decimal})</span>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}

          {/* Sub-tab 2: Squares Table */}
          {foundationsTab === 'squares' && foundationsData?.squares && (
            <SurfaceCard className="p-6">
              <h3 className="text-sm font-black text-slate-900 mb-1">Squares (1 to 50)</h3>
              <p className="text-xs text-slate-400 mb-4">Memorize squares up to 30; use base shortcuts for 31-50</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2 font-mono text-xs">
                {foundationsData.squares.map(sq => (
                  <div key={sq.number} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-slate-400 text-[10px] block">{sq.number}²</span>
                    <span className="text-slate-900 font-black text-xs">{sq.square}</span>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}

          {/* Sub-tab 3: Cubes Table */}
          {foundationsTab === 'cubes' && foundationsData?.cubes && (
            <SurfaceCard className="p-6">
              <h3 className="text-sm font-black text-slate-900 mb-1">Cubes (1 to 30)</h3>
              <p className="text-xs text-slate-400 mb-4">Crucial for Compound Interest and Number Series questions</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-6 gap-3 font-mono text-xs">
                {foundationsData.cubes.map(cb => (
                  <div key={cb.number} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <span className="text-slate-400 text-[10px] block">{cb.number}³</span>
                    <span className="text-indigo-900 font-black text-sm">{cb.cube}</span>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}

          {/* Sub-tab 4: Divisibility Rules */}
          {foundationsTab === 'divisibility' && foundationsData?.divisibilityRules && (
            <SurfaceCard className="p-6">
              <h3 className="text-sm font-black text-slate-900 mb-4">Divisibility Rules & Tests (2 to 19)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {foundationsData.divisibilityRules.map(d => (
                  <div key={d.number} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                        {d.number}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">Divisibility by {d.number}</span>
                    </div>
                    <p className="text-xs text-slate-700 pt-1">{d.rule}</p>
                    <div className="p-2 bg-white border border-slate-200 rounded-xl text-[11px] font-mono text-slate-600">
                      💡 {d.example}
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}

          {/* Sub-tab 5: Speed Math Shortcuts */}
          {foundationsTab === 'shortcuts' && foundationsData?.speedMathShortcuts && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {foundationsData.speedMathShortcuts.map((sc, i) => (
                <SurfaceCard key={i} className="p-5 space-y-2 bg-gradient-to-br from-white to-slate-50">
                  <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-500" />
                    {sc.title}
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{sc.technique}</p>
                  <div className="p-3 bg-blue-50/60 border border-blue-200/60 rounded-xl text-[11px] font-mono text-blue-950">
                    ⚡ {sc.example}
                  </div>
                </SurfaceCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: AI QUESTION SOLVER & ROOT-CAUSE EXPLAINER          */}
      {/* ========================================================= */}
      {activeTab === 'solver' && (
        <div className="space-y-6">
          <SurfaceCard className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <Sparkles size={18} />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900">AI Aptitude Question Solver & Root-Cause Explainer</h3>
                <p className="text-xs text-slate-400">Paste any difficult aptitude question to get instant core logic, step-by-step derivation, and 10-second speed-math shortcut.</p>
              </div>
            </div>

            <form onSubmit={handleSolveQuestion} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-black text-slate-800 block mb-1.5">Paste or Type Question</label>
                <textarea
                  rows={4}
                  placeholder="e.g. A can do a work in 12 days and B in 18 days. They work together for 4 days, then A leaves. In how many more days will B complete the remaining work?"
                  value={solverQuestion}
                  onChange={e => setSolverQuestion(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold">Topic Hint (Optional):</span>
                  <select
                    value={solverTopicHint}
                    onChange={e => setSolverTopicHint(e.target.value)}
                    className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-blue-500"
                  >
                    <option value="">Auto Detect Topic</option>
                    {topics.map(t => (
                      <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={solverLoading || !solverQuestion.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-indigo-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {solverLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Deconstructing Root Logic & Shortcuts...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Explain Root Cause & Solve ⚡</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </SurfaceCard>

          {/* Solver Result Breakdown */}
          {solverResult && (
            <div className="space-y-4 animate-in fade-in">
              {/* Header Box */}
              <SurfaceCard className="p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="px-2.5 py-0.5 bg-indigo-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                      {solverResult.topicIdentified || 'Aptitude'} • {solverResult.difficulty || 'Medium'}
                    </span>
                    <h3 className="text-lg font-black mt-2">Verified Solution & Root Concept</h3>
                    <p className="text-xs text-indigo-100 mt-1 max-w-2xl leading-relaxed">
                      {solverResult.rootConcept}
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 text-center shrink-0">
                    <span className="text-[10px] font-bold text-indigo-200 uppercase block">Final Answer</span>
                    <span className="text-2xl font-black text-emerald-300 block mt-0.5">{solverResult.finalAnswer}</span>
                  </div>
                </div>
              </SurfaceCard>

              {/* Given Data & Formula Used */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {solverResult.givenData?.length > 0 && (
                  <SurfaceCard className="p-5">
                    <span className="text-xs font-black text-slate-900 block mb-2">📋 Given Data Extracted</span>
                    <ul className="text-xs text-slate-700 space-y-1.5 pl-4 list-disc font-medium">
                      {solverResult.givenData.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </SurfaceCard>
                )}

                {solverResult.formulaUsed && (
                  <SurfaceCard className="p-5">
                    <span className="text-xs font-black text-slate-900 block mb-2">📐 Core Formula / Relation</span>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl font-mono text-xs font-bold text-blue-900">
                      {solverResult.formulaUsed}
                    </div>
                  </SurfaceCard>
                )}
              </div>

              {/* Step-by-Step Derivation */}
              {solverResult.stepByStepSolution?.length > 0 && (
                <SurfaceCard className="p-6">
                  <span className="text-xs font-black text-slate-900 block mb-3">📝 Step-by-Step Mathematical Derivation</span>
                  <div className="space-y-2.5">
                    {solverResult.stepByStepSolution.map((st, i) => (
                      <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium">
                        {st}
                      </div>
                    ))}
                  </div>
                </SurfaceCard>
              )}

              {/* Shortcut Hack & Common Traps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {solverResult.shortcutTrick && (
                  <SurfaceCard className="p-5 bg-emerald-50/50 border border-emerald-200/70">
                    <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5 mb-2">
                      <Zap size={14} className="text-emerald-600" />
                      10-Second Exam Shortcut Trick
                    </span>
                    <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                      {solverResult.shortcutTrick}
                    </p>
                  </SurfaceCard>
                )}

                {solverResult.commonMistakes && (
                  <SurfaceCard className="p-5 bg-amber-50/50 border border-amber-200/70">
                    <span className="text-xs font-black text-amber-950 flex items-center gap-1.5 mb-2">
                      <ShieldAlert size={14} className="text-amber-600" />
                      Common Exam Traps / Pitfalls
                    </span>
                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                      {solverResult.commonMistakes}
                    </p>
                  </SurfaceCard>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: TEST ATTEMPT HISTORY & TOPIC MASTERY               */}
      {/* ========================================================= */}
      {activeTab === 'history' && (
        <SurfaceCard className="p-5">
          <h3 className="text-sm font-black text-slate-900 mb-4">Past Quantitative Practice Attempts</h3>

          {loadingHistory ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading previous tests...</div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No test attempts recorded yet. Launch your first practice exam from the Practice Tests tab!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Topic</th>
                    <th className="pb-3">Difficulty</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3">Accuracy</th>
                    <th className="pb-3">Time</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map(att => (
                    <tr key={att._id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 text-slate-500 font-medium">
                        {new Date(att.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 font-bold text-slate-900">{att.topic}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          att.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' :
                          att.difficulty === 'Hard' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {att.difficulty}
                        </span>
                      </td>
                      <td className="py-3.5 font-black text-slate-900">{att.score}/{att.totalQuestions}</td>
                      <td className="py-3.5">
                        <span className={`font-black ${att.accuracy >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {att.accuracy}%
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500">{att.timeTakenSeconds || 0}s</td>
                      <td className="py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setTestResult(att);
                            setActiveTab('practice');
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700"
                        >
                          Review Explanations →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SurfaceCard>
      )}
    </AppShell>
  );
}
