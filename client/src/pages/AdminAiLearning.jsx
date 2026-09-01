import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, MetricCard } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import {
  Brain, MessageSquare, Award, TrendingUp, Search, Filter,
  CheckCircle2, AlertCircle, Sparkles, Clock, Eye, Users,
  BarChart3, RefreshCw, X, ShieldAlert
} from 'lucide-react';

export default function AdminAiLearning() {
  const [activeModule, setActiveModule] = useState('aptitude'); // 'aptitude', 'communication'

  // Aptitude State
  const [aptitudeAttempts, setAptitudeAttempts] = useState([]);
  const [aptitudeStats, setAptitudeStats] = useState({ totalTests: 0, avgAccuracy: 0, totalQuestions: 0 });
  const [aptSearch, setAptSearch] = useState('');
  const [aptTopicFilter, setAptTopicFilter] = useState('All');
  const [loadingAptitude, setLoadingAptitude] = useState(false);
  const [selectedAptAttempt, setSelectedAptAttempt] = useState(null);

  // Communication State
  const [commSessions, setCommSessions] = useState([]);
  const [commStats, setCommStats] = useState({ totalSessions: 0, avgOverall: 0, avgGrammar: 0, avgFluency: 0 });
  const [commSearch, setCommSearch] = useState('');
  const [loadingComm, setLoadingComm] = useState(false);
  const [selectedCommSession, setSelectedCommSession] = useState(null);

  useEffect(() => {
    fetchAptitudeOverview();
    fetchCommOverview();
  }, []);

  const fetchAptitudeOverview = async () => {
    setLoadingAptitude(true);
    try {
      let url = '/aptitude/admin/overview?limit=100';
      if (aptTopicFilter !== 'All') url += `&topic=${encodeURIComponent(aptTopicFilter)}`;
      if (aptSearch.trim()) url += `&search=${encodeURIComponent(aptSearch.trim())}`;

      const res = await fetch(buildApiUrl(url), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAptitudeAttempts(data.attempts || []);
        setAptitudeStats(data.stats || {});
      }
    } catch (err) {
      console.error('Failed to load admin aptitude data:', err);
    } finally {
      setLoadingAptitude(false);
    }
  };

  const fetchCommOverview = async () => {
    setLoadingComm(true);
    try {
      let url = '/communication/admin/overview?limit=100';
      if (commSearch.trim()) url += `&search=${encodeURIComponent(commSearch.trim())}`;

      const res = await fetch(buildApiUrl(url), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCommSessions(data.sessions || []);
        setCommStats(data.stats || {});
      }
    } catch (err) {
      console.error('Failed to load admin comm data:', err);
    } finally {
      setLoadingComm(false);
    }
  };

  return (
    <AppShell
      title="AI Learning & Performance Oversight Hub"
      subtitle="Monitor student engagement, quantitative aptitude scores, and verbal communication recordings across all batches."
      searchPlaceholder="Search student records..."
    >
      {/* Module Selector Tabs */}
      <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveModule('aptitude')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm ${
            activeModule === 'aptitude'
              ? 'bg-blue-600 text-white shadow-blue-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Brain size={16} />
          <span>Aptitude Practice Oversight ({aptitudeStats.totalTests || 0})</span>
        </button>

        <button
          onClick={() => setActiveModule('communication')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm ${
            activeModule === 'communication'
              ? 'bg-blue-600 text-white shadow-blue-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <MessageSquare size={16} />
          <span>Communication Coaching Oversight ({commStats.totalSessions || 0})</span>
        </button>
      </div>

      {/* ======================================================= */}
      {/* MODULE 1: APTITUDE MONITORING                           */}
      {/* ======================================================= */}
      {activeModule === 'aptitude' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Tests Completed"
              value={`${aptitudeStats.totalTests || 0}`}
              helper="Across all student cohorts"
              tone="primary"
              icon={<Brain size={20} />}
            />
            <MetricCard
              title="Average Accuracy"
              value={`${aptitudeStats.avgAccuracy || 0}%`}
              helper="Cohort mean score"
              tone={aptitudeStats.avgAccuracy >= 70 ? 'success' : 'warning'}
              icon={<Award size={20} />}
            />
            <MetricCard
              title="Questions Solved"
              value={`${aptitudeStats.totalQuestions || 0}`}
              helper={`${aptitudeStats.totalCorrect || 0} Correct Answers`}
              tone="neutral"
              icon={<CheckCircle2 size={20} />}
            />
            <MetricCard
              title="Aptitude Mastery"
              value={`${aptitudeAttempts.filter(a => a.accuracy >= 70).length} High-Scores`}
              helper="Tests scored ≥ 70% accuracy"
              tone="success"
              icon={<TrendingUp size={20} />}
            />
          </div>

          <SurfaceCard className="p-5">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by student name, email, or topic..."
                    value={aptSearch}
                    onChange={e => setAptSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchAptitudeOverview()}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchAptitudeOverview}
                  className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-slate-800"
                >
                  Search
                </button>
              </div>

              <button
                type="button"
                onClick={fetchAptitudeOverview}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                title="Refresh"
              >
                <RefreshCw size={14} className={loadingAptitude ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Attempts Table */}
            {loadingAptitude ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading aptitude logs...</div>
            ) : aptitudeAttempts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No aptitude test logs found matching query.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-3">Student</th>
                      <th className="pb-3">Topic</th>
                      <th className="pb-3">Difficulty</th>
                      <th className="pb-3">Score</th>
                      <th className="pb-3">Accuracy</th>
                      <th className="pb-3">Time</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aptitudeAttempts.map(att => (
                      <tr key={att._id} className="hover:bg-slate-50/50">
                        <td className="py-3">
                          <span className="font-bold text-slate-900 block">{att.studentName}</span>
                          <span className="text-[10px] text-slate-400 block">{att.studentEmail}</span>
                        </td>
                        <td className="py-3 font-semibold text-slate-800">{att.topic}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            att.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' :
                            att.difficulty === 'Hard' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {att.difficulty}
                          </span>
                        </td>
                        <td className="py-3 font-black text-slate-900">{att.score}/{att.totalQuestions}</td>
                        <td className="py-3">
                          <span className={`font-black ${att.accuracy >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {att.accuracy}%
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">{att.timeTakenSeconds || 0}s</td>
                        <td className="py-3 text-slate-500">
                          {new Date(att.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedAptAttempt(att)}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold text-xs transition"
                            title="Inspect Test"
                          >
                            <Eye size={14} />
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

      {/* ======================================================= */}
      {/* MODULE 2: COMMUNICATION COACHING MONITORING             */}
      {/* ======================================================= */}
      {activeModule === 'communication' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Speaking Sessions"
              value={`${commStats.totalSessions || 0}`}
              helper="Recordings analyzed by AI"
              tone="primary"
              icon={<MessageSquare size={20} />}
            />
            <MetricCard
              title="Average Verbal Score"
              value={`${commStats.avgOverall || 0}/100`}
              helper="Cohort mean verbal rating"
              tone={commStats.avgOverall >= 75 ? 'success' : 'warning'}
              icon={<Award size={20} />}
            />
            <MetricCard
              title="Grammar Average"
              value={`${commStats.avgGrammar || 0}%`}
              helper="Syntax correctness"
              tone="success"
              icon={<CheckCircle2 size={20} />}
            />
            <MetricCard
              title="Fluency Average"
              value={`${commStats.avgFluency || 0}%`}
              helper="Sentence flow & pacing"
              tone="neutral"
              icon={<TrendingUp size={20} />}
            />
          </div>

          <SurfaceCard className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search student or topic..."
                    value={commSearch}
                    onChange={e => setCommSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchCommOverview()}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchCommOverview}
                  className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-slate-800"
                >
                  Search
                </button>
              </div>

              <button
                type="button"
                onClick={fetchCommOverview}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                title="Refresh"
              >
                <RefreshCw size={14} className={loadingComm ? 'animate-spin' : ''} />
              </button>
            </div>

            {loadingComm ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading speech sessions...</div>
            ) : commSessions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No spoken session records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-3">Student</th>
                      <th className="pb-3">Topic</th>
                      <th className="pb-3">Overall Score</th>
                      <th className="pb-3">Grammar</th>
                      <th className="pb-3">Fluency</th>
                      <th className="pb-3">Tone</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {commSessions.map(sess => (
                      <tr key={sess._id} className="hover:bg-slate-50/50">
                        <td className="py-3">
                          <span className="font-bold text-slate-900 block">{sess.studentName}</span>
                          <span className="text-[10px] text-slate-400 block">{sess.studentEmail}</span>
                        </td>
                        <td className="py-3 font-semibold text-slate-800 max-w-[200px] truncate">{sess.topic}</td>
                        <td className="py-3">
                          <span className={`font-black ${sess.overallScore >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {sess.overallScore}/100
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-slate-700">{sess.scores?.grammar || 70}%</td>
                        <td className="py-3 font-semibold text-slate-700">{sess.scores?.fluency || 70}%</td>
                        <td className="py-3 font-semibold text-slate-700">{sess.scores?.professionalTone || 70}%</td>
                        <td className="py-3 text-slate-500">
                          {new Date(sess.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedCommSession(sess)}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold text-xs transition"
                            title="Inspect Session"
                          >
                            <Eye size={14} />
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

      {/* Modal 1: Inspect Aptitude Test Attempt */}
      {selectedAptAttempt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Student Aptitude Record</span>
                <h3 className="text-base font-black text-slate-900">{selectedAptAttempt.studentName} — {selectedAptAttempt.topic}</h3>
                <span className="text-xs text-slate-400">{selectedAptAttempt.studentEmail} • Score: {selectedAptAttempt.score}/{selectedAptAttempt.totalQuestions} ({selectedAptAttempt.accuracy}%)</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAptAttempt(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
              >
                <X size={16} />
              </button>
            </div>

            {/* AI Summary */}
            {selectedAptAttempt.aiAnalysis && (
              <div className="p-4 bg-indigo-50/50 border border-indigo-200/60 rounded-2xl mb-4 text-xs">
                <span className="font-black text-indigo-950 block mb-1">AI Diagnostic Summary:</span>
                <p className="text-indigo-900">{selectedAptAttempt.aiAnalysis.overallSummary}</p>
              </div>
            )}

            {/* Questions list */}
            <div className="space-y-3">
              {selectedAptAttempt.questions?.map((q, i) => (
                <div key={i} className={`p-3.5 rounded-2xl border text-xs ${q.isCorrect ? 'bg-emerald-50/40 border-emerald-200' : 'bg-red-50/40 border-red-200'}`}>
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>Q{i+1}: {q.question}</span>
                    <span className={q.isCorrect ? 'text-emerald-700' : 'text-red-700'}>
                      {q.isCorrect ? 'Correct ✓' : 'Incorrect ✕'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span>Student Answer: <strong>{q.studentAnswer || 'Skipped'}</strong> | Correct Answer: <strong>{q.correctAnswer}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Inspect Communication Session */}
      {selectedCommSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Spoken Communication Audit</span>
                <h3 className="text-base font-black text-slate-900">{selectedCommSession.studentName} — {selectedCommSession.topic}</h3>
                <span className="text-xs text-slate-400">{selectedCommSession.studentEmail} • Overall Verbal Rating: {selectedCommSession.overallScore}/100</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCommSession(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
              >
                <X size={16} />
              </button>
            </div>

            {/* Transcript */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 italic mb-4">
              "{selectedCommSession.transcript}"
            </div>

            {/* Mistakes */}
            {selectedCommSession.mistakes?.length > 0 && (
              <div className="space-y-2 mb-4">
                <span className="text-xs font-black text-slate-900 block">Linguistic Corrections:</span>
                {selectedCommSession.mistakes.map((m, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div><span className="text-red-600 font-bold">Spoken:</span> "{m.originalText}"</div>
                    <div><span className="text-emerald-700 font-bold">Suggested:</span> "{m.improvedVersion}"</div>
                    <div className="text-[10px] text-slate-500">{m.explanation}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
