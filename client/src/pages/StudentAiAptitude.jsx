import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, MetricCard } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import {
  Brain, CheckCircle2, Clock, Sparkles, Award, AlertCircle,
  Bookmark, BarChart3, History, Play, Flame, Search, Check,
  BookOpen, TrendingUp, SlidersHorizontal, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function StudentAiAptitude() {
  const [activeTab, setActiveTab] = useState('practice');
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('Percentage');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [isTimed, setIsTimed] = useState(true);
  const [searchTopic, setSearchTopic] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [generatingTest, setGeneratingTest] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [reviewFlags, setReviewFlags] = useState({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const [testResult, setTestResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchTopics();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    let timer = null;
    if (activeTab === 'test' && currentTest) {
      timer = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
        if (isTimed) {
          setTimeRemainingSeconds(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              handleSubmitTest(true);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeTab, currentTest, isTimed]);

  const fetchTopics = async () => {
    try {
      const res = await fetch(buildApiUrl('/aptitude/topics'), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
        if (data.length > 0 && !selectedTopic) {
          setSelectedTopic(data[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load topics:', err);
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
      toast.error('Failed to load attempt history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleStartTest = async () => {
    setGeneratingTest(true);
    try {
      const res = await fetch(buildApiUrl('/aptitude/generate-test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          topic: selectedTopic,
          difficulty,
          questionCount
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate test');

      setCurrentTest(data);
      setCurrentQuestionIdx(0);
      setStudentAnswers({});
      setReviewFlags({});
      setElapsedSeconds(0);
      setTimeRemainingSeconds(data.questionCount * 90);
      setActiveTab('test');
      toast.success(`🚀 Test generated! ${data.questionCount} Questions on ${selectedTopic}. Good luck!`);
    } catch (err) {
      toast.error(err.message || 'Error generating test. Please try again.');
    } finally {
      setGeneratingTest(false);
    }
  };

  const handleSelectOption = (optionId) => {
    setStudentAnswers(prev => ({
      ...prev,
      [currentQuestionIdx]: optionId
    }));
  };

  const handleToggleReview = () => {
    setReviewFlags(prev => ({
      ...prev,
      [currentQuestionIdx]: !prev[currentQuestionIdx]
    }));
  };

  const handleSubmitTest = async (autoSubmit = false) => {
    if (autoSubmit) {
      toast('⏰ Time is up! Submitting your answers...', { icon: '⏳' });
    }
    setSubmittingTest(true);
    setShowSubmitModal(false);

    try {
      const questionsToSubmit = (currentTest._serverPayload || currentTest.questions).map((q, idx) => ({
        ...q,
        studentAnswer: studentAnswers[idx] || null
      }));

      const res = await fetch(buildApiUrl('/aptitude/submit-test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          topic: currentTest.topic,
          difficulty: currentTest.difficulty,
          submittedQuestions: questionsToSubmit,
          timeTakenSeconds: elapsedSeconds,
          isTimed
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit test');

      setTestResult(data);
      setActiveTab('result');
      fetchAnalytics();
      toast.success(`🎉 Test Complete! Score: ${data.score}/${data.totalQuestions} (${data.accuracy}%)`);
    } catch (err) {
      toast.error(err.message || 'Failed to submit test');
    } finally {
      setSubmittingTest(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const categories = ['All', ...new Set(topics.map(t => t.category))];
  const filteredTopics = topics.filter(t => {
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchTopic.toLowerCase()) || (t.description && t.description.toLowerCase().includes(searchTopic.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <AppShell
      title="AI Aptitude Practice & Diagnostic Engine"
      subtitle="Master campus recruitment quantitative and logical aptitude with AI-generated tests, instant step-by-step reasoning, and performance analytics."
      searchPlaceholder="Search aptitude topics..."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Tests Completed"
          value={`${analytics?.progress?.totalTestsTaken || 0} Tests`}
          helper={`${analytics?.progress?.totalQuestionsAttempted || 0} Questions Solved`}
          tone="primary"
          icon={<Brain size={20} />}
        />
        <MetricCard
          title="Average Accuracy"
          value={`${analytics?.progress?.averageAccuracy || 0}%`}
          helper="Overall across all topics"
          tone={analytics?.progress?.averageAccuracy >= 70 ? 'success' : 'warning'}
          icon={<Award size={20} />}
        />
        <MetricCard
          title="Strongest Topics"
          value={analytics?.progress?.strongestTopics?.[0] || 'Need More Tests'}
          helper={analytics?.progress?.strongestTopics?.slice(1).join(', ') || 'Keep practicing'}
          tone="success"
          icon={<TrendingUp size={20} />}
        />
        <MetricCard
          title="Practice Streak"
          value={`${analytics?.progress?.streakDays || 0} Days 🔥`}
          helper="Daily practice consistency"
          tone="neutral"
          icon={<Flame size={20} />}
        />
      </div>

      {activeTab !== 'test' && (
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm shrink-0 ${
              activeTab === 'practice'
                ? 'bg-blue-600 text-white shadow-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Play size={16} />
            <span>Practice & Test Setup</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              fetchHistory();
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm shrink-0 ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <History size={16} />
            <span>Attempt History</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('analytics');
              fetchAnalytics();
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <BarChart3 size={16} />
            <span>Topic Mastery</span>
          </button>
        </div>
      )}

      {activeTab === 'practice' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SurfaceCard className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <BookOpen size={16} className="text-blue-600" />
                    <span>Select Aptitude Topic (16 Core Placement Modules)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Choose any quantitative or logical category to test your problem-solving speed.</p>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search topics..."
                    value={searchTopic}
                    onChange={e => setSearchTopic(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500 w-48"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
                {filteredTopics.map((t) => {
                  const isSelected = selectedTopic === t.name;
                  const topicMastery = analytics?.progress?.topicMastery?.find(m => m.topicName === t.name);

                  return (
                    <div
                      key={t.name}
                      onClick={() => setSelectedTopic(t.name)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{t.name}</span>
                            {isSelected && (
                              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded mt-1 inline-block">
                            {t.category}
                          </span>
                        </div>

                        {topicMastery && (
                          <div className="text-right shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              topicMastery.accuracyRate >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {topicMastery.accuracyRate}% Acc
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </SurfaceCard>
          </div>

          <div className="space-y-6">
            <SurfaceCard className="p-6">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-4">
                <SlidersHorizontal size={16} className="text-indigo-600" />
                <span>Test Configuration</span>
              </h3>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Selected Module</span>
                <span className="text-sm font-black text-blue-700 block mt-0.5">{selectedTopic}</span>
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold text-slate-700 block mb-2">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Easy', 'Medium', 'Hard'].map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`py-2 rounded-xl text-xs font-black transition border ${
                        difficulty === lvl
                          ? lvl === 'Easy'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
                            : lvl === 'Medium'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                            : 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-200'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold text-slate-700 block mb-2">Number of Questions</label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-2 rounded-xl text-xs font-black transition border ${
                        questionCount === cnt
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cnt} Qs
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Timed Exam Mode</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">90 seconds per question countdown</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTimed(!isTimed)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    isTimed ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                      isTimed ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={handleStartTest}
                disabled={generatingTest || !selectedTopic}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {generatingTest ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Generating AI Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate & Launch Test ({questionCount} Qs)</span>
                  </>
                )}
              </button>
            </SurfaceCard>
          </div>
        </div>
      )}

      {activeTab === 'test' && currentTest && (
        <div className="max-w-4xl mx-auto space-y-6">
          <SurfaceCard className="p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black rounded-xl">
                {currentTest.topic}
              </span>
              <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full border ${
                currentTest.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                currentTest.difficulty === 'Hard' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {currentTest.difficulty} Level
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isTimed && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-black ${
                  timeRemainingSeconds < 60 ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' : 'bg-slate-100 text-slate-800'
                }`}>
                  <Clock size={14} />
                  <span>{formatTimer(timeRemainingSeconds)}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
              >
                Submit Test
              </button>
            </div>
          </SurfaceCard>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {(() => {
                const q = currentTest.questions[currentQuestionIdx];
                const selectedOption = studentAnswers[currentQuestionIdx];
                const isMarkedForReview = !reviewFlags[currentQuestionIdx] ? false : true;

                return (
                  <SurfaceCard className="p-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <span className="text-xs font-black text-slate-400">
                        Question {currentQuestionIdx + 1} of {currentTest.questions.length}
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleReview}
                        className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl transition ${
                          isMarkedForReview ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Bookmark size={13} className={isMarkedForReview ? 'fill-purple-700' : ''} />
                        <span>{isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
                      </button>
                    </div>

                    <div className="text-sm md:text-base font-bold text-slate-900 leading-relaxed mb-6">
                      {q.question}
                    </div>

                    <div className="space-y-3">
                      {q.options.map(opt => {
                        const isChosen = selectedOption === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => handleSelectOption(opt.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                              isChosen
                                ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                            }`}
                          >
                            <div className={`h-8 w-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 transition ${
                              isChosen ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {opt.id}
                            </div>
                            <span className="text-xs md:text-sm font-semibold text-slate-800">
                              {opt.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIdx === 0}
                        className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition disabled:opacity-30"
                      >
                        <ChevronLeft size={16} />
                        <span>Previous</span>
                      </button>

                      {currentQuestionIdx < currentTest.questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentQuestionIdx(prev => Math.min(currentTest.questions.length - 1, prev + 1))}
                          className="flex items-center gap-1 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                        >
                          <span>Next</span>
                          <ChevronRight size={16} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowSubmitModal(true)}
                          className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                        >
                          <Check size={16} />
                          <span>Review & Submit</span>
                        </button>
                      )}
                    </div>
                  </SurfaceCard>
                );
              })()}
            </div>

            <div className="space-y-4">
              <SurfaceCard className="p-5">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
                  Question Palette ({Object.keys(studentAnswers).length}/{currentTest.questions.length} Answered)
                </h4>

                <div className="grid grid-cols-5 gap-2 mb-4">
                  {currentTest.questions.map((_, idx) => {
                    const isAnswered = studentAnswers[idx] !== undefined;
                    const isCurrent = currentQuestionIdx === idx;
                    const isMarked = !reviewFlags[idx] ? false : true;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentQuestionIdx(idx)}
                        className={`h-10 rounded-xl font-bold text-xs transition relative ${
                          isCurrent
                            ? 'ring-2 ring-blue-600 ring-offset-2 '
                            : ''
                        } ${
                          isMarked
                            ? 'bg-purple-600 text-white shadow-sm'
                            : isAnswered
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>{idx + 1}</span>
                        {isMarked && (
                          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-purple-300 border border-white" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] space-y-1.5 font-semibold text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-emerald-600 shrink-0" />
                    <span>Answered ({Object.keys(studentAnswers).length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-purple-600 shrink-0" />
                    <span>Marked for Review ({Object.keys(reviewFlags).filter(k => reviewFlags[k]).length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-slate-200 shrink-0" />
                    <span>Unanswered ({currentTest.questions.length - Object.keys(studentAnswers).length})</span>
                  </div>
                </div>
              </SurfaceCard>
            </div>
          </div>
        </div>
      )}

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-base font-black text-slate-900 mb-2">Submit Your Aptitude Test?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Here is your test summary before final evaluation:
            </p>

            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl mb-6 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Answered</span>
                <span className="text-lg font-black text-emerald-600">{Object.keys(studentAnswers).length}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Unanswered</span>
                <span className="text-lg font-black text-amber-600">{currentTest.questions.length - Object.keys(studentAnswers).length}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Review</span>
                <span className="text-lg font-black text-purple-600">{Object.keys(reviewFlags).filter(k => reviewFlags[k]).length}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Back to Test
              </button>
              <button
                type="button"
                onClick={() => handleSubmitTest(false)}
                disabled={submittingTest}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                {submittingTest ? 'Grading Answers...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'result' && testResult && (
        <div className="max-w-4xl mx-auto space-y-6">
          <SurfaceCard className="p-6 bg-gradient-to-r from-blue-600 via-indigo-700 to-blue-800 text-white rounded-3xl shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">
                  Aptitude Performance Scorecard
                </span>
                <h2 className="text-2xl font-black mt-1">{testResult.attempt?.topic} Test Completed</h2>
                <p className="text-xs text-blue-100 mt-1">
                  Difficulty: {testResult.attempt?.difficulty} • Time Taken: {Math.round((testResult.attempt?.timeTakenSeconds || 0) / 60)} mins ({testResult.attempt?.timeTakenSeconds || 0}s)
                </p>
              </div>

              <div className="flex items-center gap-4 text-center">
                <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
                  <div className="text-3xl font-black">{testResult.score}/{testResult.totalQuestions}</div>
                  <span className="text-[10px] font-bold text-blue-200 uppercase">Correct Score</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
                  <div className="text-3xl font-black text-emerald-300">{testResult.accuracy}%</div>
                  <span className="text-[10px] font-bold text-blue-200 uppercase">Accuracy Rate</span>
                </div>
              </div>
            </div>
          </SurfaceCard>

          {testResult.aiAnalysis && (
            <SurfaceCard className="p-6 border border-indigo-100 bg-gradient-to-br from-indigo-50/30 to-white rounded-3xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">AI Diagnostic Mentor Feedback</h3>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium mb-4">
                {testResult.aiAnalysis.overallSummary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testResult.aiAnalysis.strengths?.length > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60">
                    <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5 mb-2">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      Key Strengths Demonstrated
                    </span>
                    <ul className="text-xs text-emerald-800 space-y-1 pl-4 list-disc font-medium">
                      {testResult.aiAnalysis.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {testResult.aiAnalysis.weaknesses?.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60">
                    <span className="text-xs font-black text-amber-900 flex items-center gap-1.5 mb-2">
                      <AlertCircle size={14} className="text-amber-600" />
                      Areas for Improvement
                    </span>
                    <ul className="text-xs text-amber-800 space-y-1 pl-4 list-disc font-medium">
                      {testResult.aiAnalysis.weaknesses.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {testResult.aiAnalysis.recommendations?.length > 0 && (
                <div className="mt-4 p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 text-xs text-blue-950">
                  <span className="font-black text-blue-900 block mb-1">Actionable Next Practice Step:</span>
                  <span>{testResult.aiAnalysis.recommendations.join(' ')}</span>
                </div>
              )}
            </SurfaceCard>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <BookOpen size={16} className="text-blue-600" />
              <span>Step-by-Step Question Review & Solutions</span>
            </h3>

            {testResult.attempt?.questions?.map((q, idx) => {
              const isCorrect = q.isCorrect;
              const isSkipped = !q.studentAnswer;

              return (
                <SurfaceCard
                  key={idx}
                  className={`p-5 border-l-4 ${
                    isCorrect ? 'border-l-emerald-500' : isSkipped ? 'border-l-slate-400' : 'border-l-red-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-400">Question {idx + 1}</span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      isCorrect ? 'bg-emerald-100 text-emerald-800' : isSkipped ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-800'
                    }`}>
                      {isCorrect ? '✓ Correct' : isSkipped ? '⚪ Skipped' : '✕ Incorrect'}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-900 mb-4">{q.question}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {q.options.map(opt => {
                      const isStudentAns = q.studentAnswer === opt.id;
                      const isCorrectOpt = q.correctAnswer === opt.id;

                      let optStyle = 'bg-slate-50 border-slate-200 text-slate-700';
                      if (isCorrectOpt) {
                        optStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                      } else if (isStudentAns && !isCorrect) {
                        optStyle = 'bg-red-50 border-red-300 text-red-900 font-bold line-through';
                      }

                      return (
                        <div key={opt.id} className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${optStyle}`}>
                          <span className="h-6 w-6 rounded-lg bg-white/80 font-black text-[11px] flex items-center justify-center shrink-0">
                            {opt.id}
                          </span>
                          <span>{opt.text}</span>
                          {isCorrectOpt && <span className="ml-auto text-emerald-700 font-black text-[10px]">CORRECT</span>}
                          {isStudentAns && !isCorrect && <span className="ml-auto text-red-600 font-black text-[10px]">YOUR CHOICE</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700">
                    <span className="font-black text-slate-900 block mb-1">Step-by-Step Explanation:</span>
                    <p className="whitespace-pre-line leading-relaxed text-slate-600">{q.explanation}</p>
                  </div>
                </SurfaceCard>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setActiveTab('practice')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition"
            >
              Start Another Practice Test
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('history');
                fetchHistory();
              }}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              View Full History
            </button>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <SurfaceCard className="p-5">
            <h3 className="text-sm font-black text-slate-900 mb-4">Your Past Aptitude Attempts</h3>

            {loadingHistory ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading previous tests...</div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No tests attempted yet. Launch a practice test in the Practice tab!
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
                        <td className="py-3.5 text-slate-500">{att.timeTakenSeconds}s</td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setTestResult({
                                attempt: att,
                                score: att.score,
                                totalQuestions: att.totalQuestions,
                                accuracy: att.accuracy,
                                aiAnalysis: att.aiAnalysis
                              });
                              setActiveTab('result');
                            }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700"
                          >
                            Review Solutions →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SurfaceCard>
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <SurfaceCard className="p-6">
            <h3 className="text-sm font-black text-slate-900 mb-4">Topic Mastery Breakdown</h3>

            {analytics.progress?.topicMastery?.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Complete practice tests to unlock topic mastery analytics.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.progress.topicMastery.map(tm => (
                  <div key={tm.topicName} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-slate-900">{tm.topicName}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        tm.accuracyRate >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {tm.accuracyRate}% Accuracy
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                        style={{ width: `${tm.accuracyRate}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                      <span>{tm.correctQuestions}/{tm.totalQuestions} Correct</span>
                      <span>{tm.testsTaken} Tests Taken</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>
      )}
    </AppShell>
  );
}
