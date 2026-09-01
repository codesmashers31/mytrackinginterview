import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, MetricCard } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import {
  Mic, MicOff, Play, Pause, Square, Sparkles, Award, AlertCircle,
  CheckCircle2, RotateCcw, Volume2, History, BarChart3, MessageSquare,
  Flame, TrendingUp, Lightbulb, FileText, Send, Check, ChevronRight,
  BookOpen, HelpCircle, ShieldAlert
} from 'lucide-react';

export default function StudentAiCommunication() {
  const [activeTab, setActiveTab] = useState('practice'); // 'practice', 'evaluating', 'report', 'history', 'analytics'
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [customPromptOpen, setCustomPromptOpen] = useState(false);
  const [customCategory, setCustomCategory] = useState('Project & Technical');
  const [customLevel, setCustomLevel] = useState('Intermediate');
  const [generatingTopic, setGeneratingTopic] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [micPermission, setMicPermission] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [transcriptInput, setTranscriptInput] = useState('');
  const [inputMode, setInputMode] = useState('voice'); // 'voice', 'text'

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // Evaluation & History
  const [submittingSpeech, setSubmittingSpeech] = useState(false);
  const [evaluationReport, setEvaluationReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchTopics();
    fetchAnalytics();
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await fetch(buildApiUrl('/communication/topics'), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
        if (data.length > 0) setSelectedTopic(data[0]);
      }
    } catch (err) {
      console.error('Failed to load topics:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(buildApiUrl('/communication/my-analytics'), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to load communication analytics:', err);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(buildApiUrl('/communication/my-history'), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGenerateCustomTopic = async () => {
    setGeneratingTopic(true);
    try {
      const res = await fetch(buildApiUrl('/communication/generate-topic'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ category: customCategory, level: customLevel })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate topic');

      setSelectedTopic(data);
      setCustomPromptOpen(false);
      toast.success('✨ New AI Interview Topic generated!');
    } catch (err) {
      toast.error(err.message || 'Error generating topic');
    } finally {
      setGeneratingTopic(false);
    }
  };

  // Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
      toast.success('🎙️ Microphone active! Start speaking clearly.');
    } catch (err) {
      console.error('Microphone error:', err);
      setMicPermission('denied');
      toast.error('Microphone permission denied. You can still practice via Text Submission tab!');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      toast.success('⏹️ Recording captured! Preview your audio or submit for AI analysis.');
    }
  };

  const handleResetRecording = () => {
    if (isRecording) stopRecording();
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
    setTranscriptInput('');
  };

  const handleSubmitForEvaluation = async () => {
    if (!audioBlob && !transcriptInput.trim()) {
      return toast.error('Please record your spoken answer or enter your transcript text.');
    }

    setSubmittingSpeech(true);
    const formData = new FormData();
    formData.append('topicTitle', selectedTopic?.title || 'General Interview Speaking Practice');
    formData.append('topicCategory', selectedTopic?.category || 'General');
    formData.append('topicContext', (selectedTopic?.keyPointsToCover || []).join(', '));
    formData.append('durationSeconds', recordingSeconds);

    if (audioBlob) {
      formData.append('audio', audioBlob, 'speech_recording.webm');
    }
    if (transcriptInput) {
      formData.append('transcriptText', transcriptInput);
    }

    try {
      const res = await fetch(buildApiUrl('/communication/submit-speech'), {
        method: 'POST',
        headers: authHeaders(),
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Speech evaluation failed');

      setEvaluationReport(data);
      setActiveTab('report');
      fetchAnalytics();
      toast.success(`🎉 Evaluation Complete! Overall Score: ${data.session?.overallScore || data.evaluation?.overallScore}/100`);
    } catch (err) {
      toast.error(err.message || 'Failed to analyze speech. Please try again.');
    } finally {
      setSubmittingSpeech(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AppShell
      title="AI Spoken Communication & Interview Coach"
      subtitle="Refine English fluency, eliminate grammatical errors, elevate technical vocabulary, and gain recruiter-ready verbal confidence."
      searchPlaceholder="Search communication topics..."
    >
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Speaking Practices"
          value={`${analytics?.totalSessions || 0} Sessions`}
          helper="Recorded & analyzed"
          tone="primary"
          icon={<MessageSquare size={20} />}
        />
        <MetricCard
          title="Average Verbal Score"
          value={`${analytics?.averageOverallScore || 0}/100`}
          helper={`Best Score: ${analytics?.bestScore || 0}`}
          tone={analytics?.averageOverallScore >= 75 ? 'success' : 'warning'}
          icon={<Award size={20} />}
        />
        <MetricCard
          title="Grammar & Fluency"
          value={`${analytics?.averageGrammarScore || 0}% / ${analytics?.averageFluencyScore || 0}%`}
          helper="Syntax accuracy & flow"
          tone="success"
          icon={<TrendingUp size={20} />}
        />
        <MetricCard
          title="Professional Tone"
          value={`${analytics?.averageProfessionalScore || 0}%`}
          helper="Corporate IT lexicon"
          tone="neutral"
          icon={<Flame size={20} />}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('practice')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm shrink-0 ${
            activeTab === 'practice'
              ? 'bg-blue-600 text-white shadow-blue-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Mic size={16} />
          <span>Live Speaking Studio</span>
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
          <span>Evaluation History</span>
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
          <span>Verbal Skills Radar</span>
        </button>
      </div>

      {/* VIEW 1: PRACTICE & RECORDING STUDIO */}
      {activeTab === 'practice' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Topics Directory */}
          <div className="space-y-4">
            <SurfaceCard className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={14} className="text-blue-600" />
                  <span>Interview Prompts</span>
                </h3>

                <button
                  type="button"
                  onClick={() => setCustomPromptOpen(!customPromptOpen)}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-xl transition flex items-center gap-1 border border-indigo-200"
                >
                  <Sparkles size={12} />
                  <span>AI Generator</span>
                </button>
              </div>

              {/* AI Prompt Generator Collapsible */}
              {customPromptOpen && (
                <div className="p-3.5 bg-indigo-50/50 border border-indigo-200/60 rounded-2xl mb-3 space-y-2.5 animate-in fade-in">
                  <span className="text-[11px] font-black text-indigo-900 block">Generate Custom Topic</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Category</label>
                      <select
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value)}
                        className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-xl font-medium"
                      >
                        <option value="Project & Technical">Project & Technical</option>
                        <option value="HR & Self Introduction">HR & Self Intro</option>
                        <option value="Behavioral & Leadership">Behavioral</option>
                        <option value="Problem Solving">Problem Solving</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Level</label>
                      <select
                        value={customLevel}
                        onChange={e => setCustomLevel(e.target.value)}
                        className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-xl font-medium"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateCustomTopic}
                    disabled={generatingTopic}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {generatingTopic ? 'Generating...' : 'Create AI Topic ✨'}
                  </button>
                </div>
              )}

              {/* Topics List */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {topics.map(t => {
                  const isSelected = selectedTopic?._id === t._id || selectedTopic?.title === t.title;
                  return (
                    <div
                      key={t._id || t.title}
                      onClick={() => {
                        setSelectedTopic(t);
                        handleResetRecording();
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-black text-slate-900 line-clamp-1">{t.title}</span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                          {t.level}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block line-clamp-2">
                        {t.description}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SurfaceCard>
          </div>

          {/* Center/Right: Selected Prompt & Live Recorder Studio */}
          <div className="lg:col-span-2 space-y-6">
            {selectedTopic && (
              <SurfaceCard className="p-6">
                {/* Topic Header */}
                <div className="border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full uppercase">
                      {selectedTopic.category}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      Target Time: ~{selectedTopic.recommendedDurationSeconds || 90}s
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 mt-1">
                    {selectedTopic.title}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {selectedTopic.description}
                  </p>
                </div>

                {/* Key Points to Cover & Suggested Vocabulary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {selectedTopic.keyPointsToCover?.length > 0 && (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                      <span className="font-black text-slate-800 block mb-1.5 flex items-center gap-1">
                        <Lightbulb size={13} className="text-amber-500" />
                        Key Points to Structure:
                      </span>
                      <ul className="space-y-1 pl-4 list-disc text-slate-600 font-medium text-[11px]">
                        {selectedTopic.keyPointsToCover.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedTopic.vocabularyHints?.length > 0 && (
                    <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200/60 text-xs">
                      <span className="font-black text-blue-900 block mb-1.5 flex items-center gap-1">
                        <Sparkles size={13} className="text-blue-600" />
                        Recommended Lexicon:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTopic.vocabularyHints.map((v, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mode Selector: Voice Recording vs Text Fallback */}
                <div className="flex items-center gap-2 mb-4 p-1 bg-slate-100 rounded-2xl w-fit">
                  <button
                    type="button"
                    onClick={() => setInputMode('voice')}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                      inputMode === 'voice' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Mic size={14} />
                    <span>Microphone Recording</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputMode('text')}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                      inputMode === 'text' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText size={14} />
                    <span>Type Spoken Transcript</span>
                  </button>
                </div>

                {/* Live Audio Studio */}
                {inputMode === 'voice' ? (
                  <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                    {/* Animated Sound Wave or Status */}
                    <div className="mb-4">
                      {isRecording ? (
                        <div className="flex items-center gap-1.5 h-12">
                          {[40, 70, 90, 60, 100, 80, 50, 95, 60, 80, 100, 70, 45].map((h, i) => (
                            <div
                              key={i}
                              className="w-1.5 bg-gradient-to-t from-red-500 to-amber-400 rounded-full animate-pulse"
                              style={{ height: `${h}%`, animationDuration: `${0.4 + (i % 3) * 0.2}s` }}
                            />
                          ))}
                        </div>
                      ) : audioUrl ? (
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs bg-emerald-950/60 px-4 py-1.5 rounded-full border border-emerald-800">
                          <CheckCircle2 size={14} />
                          <span>Voice Recording Ready ({formatTimer(recordingSeconds)})</span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 font-medium">
                          Press the microphone button below to record your pitch
                        </div>
                      )}
                    </div>

                    {/* Timer Display */}
                    <div className="font-mono text-2xl font-black tracking-widest text-slate-200 mb-6">
                      {formatTimer(recordingSeconds)}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4">
                      {!isRecording && !audioUrl && (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="h-16 w-16 rounded-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-transform active:scale-95"
                        >
                          <Mic size={26} />
                        </button>
                      )}

                      {isRecording && (
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/40 animate-pulse transition-transform active:scale-95"
                        >
                          <Square size={22} className="fill-white" />
                        </button>
                      )}

                      {audioUrl && !isRecording && (
                        <div className="flex items-center gap-3">
                          <audio ref={audioPlayerRef} src={audioUrl} className="hidden" onEnded={() => setIsPlayingPreview(false)} />
                          <button
                            type="button"
                            onClick={() => {
                              if (audioPlayerRef.current) {
                                if (isPlayingPreview) {
                                  audioPlayerRef.current.pause();
                                  setIsPlayingPreview(false);
                                } else {
                                  audioPlayerRef.current.play();
                                  setIsPlayingPreview(true);
                                }
                              }
                            }}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl border border-slate-700 transition flex items-center gap-2"
                          >
                            {isPlayingPreview ? <Pause size={14} /> : <Play size={14} />}
                            <span>{isPlayingPreview ? 'Pause Audio' : 'Listen Preview'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleResetRecording}
                            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl border border-slate-700 transition"
                            title="Re-record"
                          >
                            <RotateCcw size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Text Input Fallback */
                  <div className="space-y-3">
                    <textarea
                      rows={5}
                      placeholder="Type or paste what you would speak in response to this interview question..."
                      value={transcriptInput}
                      onChange={e => setTranscriptInput(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition leading-relaxed"
                    />
                  </div>
                )}

                {/* Submit Action */}
                <div className="mt-6 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleSubmitForEvaluation}
                    disabled={submittingSpeech || (!audioBlob && !transcriptInput.trim())}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                  >
                    {submittingSpeech ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>AI Transcribing & Evaluating Speech...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Submit for AI Fluency & Grammar Coaching</span>
                      </>
                    )}
                  </button>
                </div>
              </SurfaceCard>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: AI EVALUATION REPORT */}
      {activeTab === 'report' && evaluationReport && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Hero Score Banner */}
          {(() => {
            const report = evaluationReport.session || evaluationReport.evaluation;
            const scores = report.scores || {};

            return (
              <>
                <SurfaceCard className="p-6 bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-800 text-white rounded-3xl shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
                        AI Verbal Assessment Report
                      </span>
                      <h2 className="text-2xl font-black mt-1">{report.topic}</h2>
                      <p className="text-xs text-indigo-100 mt-1">
                        Category: {report.category} • Duration: {report.durationSeconds || 0}s • Filler Words: {report.fillerWordCount || 0}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-center">
                      <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                        <div className="text-4xl font-black text-emerald-300">{report.overallScore}/100</div>
                        <span className="text-[10px] font-bold text-indigo-200 uppercase">Verbal Score</span>
                      </div>
                    </div>
                  </div>
                </SurfaceCard>

                {/* 6 Sub-Score Progress Bars */}
                <SurfaceCard className="p-6">
                  <h3 className="text-sm font-black text-slate-900 mb-4">Competency Score Breakdown</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: 'Grammar & Syntax', val: scores.grammar || 70, color: 'from-blue-500 to-blue-600' },
                      { label: 'Fluency & Flow', val: scores.fluency || 70, color: 'from-emerald-500 to-emerald-600' },
                      { label: 'Vocabulary Range', val: scores.vocabulary || 70, color: 'from-purple-500 to-purple-600' },
                      { label: 'Clarity & Articulation', val: scores.clarity || 70, color: 'from-indigo-500 to-indigo-600' },
                      { label: 'Professional Tone', val: scores.professionalTone || 70, color: 'from-amber-500 to-amber-600' },
                      { label: 'Technical Depth', val: scores.technicalCommunication || 70, color: 'from-rose-500 to-rose-600' }
                    ].map(s => (
                      <div key={s.label} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-700">{s.label}</span>
                          <span className="text-slate-900 font-black">{s.val}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${s.color} rounded-full`} style={{ width: `${s.val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </SurfaceCard>

                {/* Transcribed Speech */}
                <SurfaceCard className="p-6">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">Transcribed Spoken Text</span>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-medium leading-relaxed italic">
                    "{report.transcript}"
                  </div>
                </SurfaceCard>

                {/* Sentence Mistake Analysis */}
                <SurfaceCard className="p-6">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-4">
                    <ShieldAlert size={16} className="text-rose-600" />
                    <span>Linguistic Corrections ("You Said" vs "Better Version")</span>
                  </h3>

                  {(!report.mistakes || report.mistakes.length === 0) ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Outstanding! No major grammar or syntax mistakes were detected in your pitch.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {report.mistakes.map((m, idx) => (
                        <div key={idx} className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded-md">
                              {m.category || 'Grammar'} Correction
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 bg-red-50/60 border border-red-200/60 rounded-xl text-red-950">
                              <span className="text-[10px] font-black uppercase text-red-700 block mb-1">❌ You Said:</span>
                              <span className="font-semibold">"{m.originalText}"</span>
                            </div>

                            <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-emerald-950">
                              <span className="text-[10px] font-black uppercase text-emerald-700 block mb-1">✨ Professional Alternative:</span>
                              <span className="font-bold">"{m.improvedVersion}"</span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-600 pt-1">
                            <span className="font-bold text-slate-700">Coach Note: </span>
                            {m.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </SurfaceCard>

                {/* Positive Feedback & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.positiveFeedback?.length > 0 && (
                    <SurfaceCard className="p-5 bg-emerald-50/40 border border-emerald-200/70">
                      <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5 mb-2">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        Strengths Observed
                      </span>
                      <ul className="text-xs text-emerald-800 space-y-1.5 pl-4 list-disc font-medium">
                        {report.positiveFeedback.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </SurfaceCard>
                  )}

                  {report.areasOfImprovement?.length > 0 && (
                    <SurfaceCard className="p-5 bg-amber-50/40 border border-amber-200/70">
                      <span className="text-xs font-black text-amber-900 flex items-center gap-1.5 mb-2">
                        <AlertCircle size={14} className="text-amber-600" />
                        Key Focus Areas
                      </span>
                      <ul className="text-xs text-amber-800 space-y-1.5 pl-4 list-disc font-medium">
                        {report.areasOfImprovement.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </SurfaceCard>
                  )}
                </div>

                {/* Ideal Model Answer Demonstration */}
                {report.idealAnswerOrExample && (
                  <SurfaceCard className="p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 border border-indigo-200/60">
                    <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5 mb-2">
                      <Sparkles size={14} className="text-indigo-600" />
                      Model Placement Response Demonstration
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line italic">
                      "{report.idealAnswerOrExample}"
                    </p>
                  </SurfaceCard>
                )}

                {/* Bottom Return Buttons */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      handleResetRecording();
                      setActiveTab('practice');
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition"
                  >
                    Practice Another Interview Question
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('history');
                      fetchHistory();
                    }}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    View All Sessions
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* VIEW 3: HISTORY */}
      {activeTab === 'history' && (
        <SurfaceCard className="p-5">
          <h3 className="text-sm font-black text-slate-900 mb-4">Past Spoken Practice Sessions</h3>

          {loadingHistory ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading previous sessions...</div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No speaking sessions recorded yet. Start practicing in the Live Speaking Studio!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Topic</th>
                    <th className="pb-3">Duration</th>
                    <th className="pb-3">Overall Score</th>
                    <th className="pb-3">Grammar</th>
                    <th className="pb-3">Fluency</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map(s => (
                    <tr key={s._id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 text-slate-500 font-medium">
                        {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 font-bold text-slate-900 max-w-[220px] truncate">{s.topic}</td>
                      <td className="py-3.5 text-slate-500">{s.durationSeconds || 0}s</td>
                      <td className="py-3.5">
                        <span className={`font-black ${s.overallScore >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {s.overallScore}/100
                        </span>
                      </td>
                      <td className="py-3.5 font-semibold text-slate-700">{s.scores?.grammar || 70}%</td>
                      <td className="py-3.5 font-semibold text-slate-700">{s.scores?.fluency || 70}%</td>
                      <td className="py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEvaluationReport({ session: s });
                            setActiveTab('report');
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700"
                        >
                          View Report →
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

      {/* VIEW 4: ANALYTICS */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <SurfaceCard className="p-6">
            <h3 className="text-sm font-black text-slate-900 mb-4">Verbal Progression & Metrics</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] font-bold uppercase text-blue-700 block">Avg Grammar</span>
                <span className="text-2xl font-black text-blue-900 mt-1 block">{analytics.averageGrammarScore || 0}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-700 block">Avg Fluency</span>
                <span className="text-2xl font-black text-emerald-900 mt-1 block">{analytics.averageFluencyScore || 0}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                <span className="text-[10px] font-bold uppercase text-purple-700 block">Avg Vocabulary</span>
                <span className="text-2xl font-black text-purple-900 mt-1 block">{analytics.averageVocabularyScore || 0}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-bold uppercase text-amber-700 block">Professional Tone</span>
                <span className="text-2xl font-black text-amber-900 mt-1 block">{analytics.averageProfessionalScore || 0}%</span>
              </div>
            </div>
          </SurfaceCard>
        </div>
      )}
    </AppShell>
  );
}
