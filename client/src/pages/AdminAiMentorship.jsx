import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  AppShell, SurfaceCard, StatusBadge, SectionTabs 
} from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { 
  CheckCircle2, Clock, Users, ShieldAlert, Cpu, Sparkles, 
  ExternalLink, Check, Trash2, Edit2, Play
} from 'lucide-react';

export default function AdminAiMentorship() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'submissions' | 'settings' | 'direct'
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [settings, setSettings] = useState({ aiGenerationEnabled: true, requireApproval: false });

  // Evaluation Side drawer state
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [evalForm, setEvalForm] = useState({
    grade: 'A',
    mentorFeedback: '',
    status: 'Completed'
  });
  const [submittingEval, setSubmittingEval] = useState(false);

  // Custom task form state
  const [customTask, setCustomTask] = useState({
    studentId: '',
    topicName: '',
    description: '',
    expectedDuration: '3 Hours'
  });
  const [submittingCustomTask, setSubmittingCustomTask] = useState(false);

  const fetchAdminDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/ai/admin/dashboard'), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRoster(data.students);
        setSettings(data.settings);
        await fetchSubmissions();
      }
    } catch (err) {
      toast.error('Unable to fetch admin statistics.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(buildApiUrl('/ai/admin/submissions'), { headers: authHeaders() });
      if (res.ok) {
        setSubmissions(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  const handleToggleAi = async (e) => {
    const nextVal = e.target.checked;
    try {
      const res = await fetch(buildApiUrl('/ai/admin/toggle-engine'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ enabled: nextVal })
      });
      if (res.ok) {
        toast.success(nextVal ? 'AI generation enabled globally' : 'AI generation disabled globally');
        const data = await res.json();
        setSettings(data.settings);
      } else {
        toast.error('Failed to change AI state.');
      }
    } catch (err) {
      toast.error('Connection issue.');
    }
  };

  const handleEvaluationSubmit = async (e) => {
    e.preventDefault();
    if (!evalForm.mentorFeedback.trim()) return toast.error('Please write mentor feedback.');
    setSubmittingEval(true);
    try {
      const res = await fetch(buildApiUrl('/ai/admin/review-assignment'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          submissionId: selectedSubmission._id,
          ...evalForm
        })
      });
      if (res.ok) {
        toast.success('Assignment evaluated and score updated.');
        setSelectedSubmission(null);
        setEvalForm({ grade: 'A', mentorFeedback: '', status: 'Completed' });
        fetchAdminDashboard();
      } else {
        toast.error('Failed to evaluate assignment.');
      }
    } catch (err) {
      toast.error('Connection failure during evaluation.');
    } finally {
      setSubmittingEval(false);
    }
  };

  const handleCustomTaskSubmit = async (e) => {
    e.preventDefault();
    if (!customTask.studentId || !customTask.topicName || !customTask.description) {
      return toast.error('Please fill in all details.');
    }
    setSubmittingCustomTask(true);
    try {
      const res = await fetch(buildApiUrl('/ai/admin/force-task'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(customTask)
      });
      if (res.ok) {
        toast.success('Custom task successfully assigned to student.');
        setCustomTask({ studentId: '', topicName: '', description: '', expectedDuration: '3 Hours' });
      } else {
        toast.error('Failed to assign custom task.');
      }
    } catch (err) {
      toast.error('Connection issue.');
    } finally {
      setSubmittingCustomTask(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="AI Mentorship Control Panel" subtitle="Retrieving system configurations...">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="AI Mentorship Control Panel" subtitle="Manage dynamic roadmaps, grade student assignments, and configure the generation rules.">
      <SectionTabs
        items={[
          { label: 'Active Students Roster', active: activeTab === 'overview', onClick: () => setActiveTab('overview') },
          { label: `Grader Queue (${submissions.length})`, active: activeTab === 'submissions', onClick: () => setActiveTab('submissions') },
          { label: 'Force Assign Override', active: activeTab === 'direct', onClick: () => setActiveTab('direct') },
          { label: 'AI Engine Settings', active: activeTab === 'settings', onClick: () => setActiveTab('settings') }
        ]}
      />

      <div className="mt-6 relative">
        {/* ACTIVE STUDENTS ROSTER TAB */}
        {activeTab === 'overview' && (
          <SurfaceCard className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-white">
              <h3 className="text-base font-bold text-[#1e293b]">Mentored Students</h3>
              <p className="text-xs font-medium text-slate-400">Showing {roster.length} active onboarding profiles</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-150 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Student Name</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Track & Level</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Week Progress</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Assignments Done</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Readiness Score</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-xs">
                  {roster.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-450 font-medium">No students are currently onboarded on the AI mentorship path.</td>
                    </tr>
                  ) : (
                    roster.map((student) => (
                      <tr key={student.studentId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-800">{student.name}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-700">{student.track}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{student.level} Track</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-600">Week {student.completedWeek} ({student.progress}%)</td>
                        <td className="px-4 py-3 font-bold text-slate-600">{student.assignmentsCompleted} completed</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-extrabold text-blue-700 bg-blue-50/60 px-2.5 py-1 rounded-lg border border-blue-100/30">{student.readinessScore}%</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            student.status === 'Placement Ready' ? 'bg-emerald-100 text-emerald-800' :
                            student.status === 'Interview Ready' ? 'bg-blue-100 text-blue-800' :
                            student.status === 'Almost Ready' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        )}

        {/* SUBMISSIONS GRADER QUEUE TAB */}
        {activeTab === 'submissions' && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* List block */}
            <div className={`${selectedSubmission ? 'md:col-span-2' : 'md:col-span-3'} space-y-4`}>
              <SurfaceCard className="p-6 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Pending Evaluation Queue</h3>
                
                <div className="space-y-3">
                  {submissions.length === 0 ? (
                    <p className="text-center text-xs font-semibold text-slate-400 py-8">All assignment submissions have been graded!</p>
                  ) : (
                    submissions.map((sub) => (
                      <div key={sub._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition shadow-2xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-800">{sub.studentId?.name || 'Student'}</h4>
                            {sub.isLate && (
                              <span className="text-[9px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Late Submission</span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-blue-600 mt-1">Week {sub.weekNumber}, Day {sub.dayNumber} Assignment</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Submitted: {new Date(sub.updatedAt).toLocaleString()}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <a 
                            href={sub.submissionLink} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="p-1.5 rounded-lg bg-slate-150 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
                          >
                            <ExternalLink size={14} />
                          </a>
                          <button 
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setEvalForm({ grade: 'A', mentorFeedback: '', status: 'Completed' });
                            }} 
                            className="crm-btn-primary px-4 py-1.5 text-xs font-bold"
                          >
                            Grade Submission
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SurfaceCard>
            </div>

            {/* Evaluation Details Drawer */}
            {selectedSubmission && (
              <div className="md:col-span-1">
                <SurfaceCard className="p-6 border border-blue-400 shadow-md">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Evaluate Project</h3>
                    <button 
                      onClick={() => setSelectedSubmission(null)} 
                      className="text-xs font-bold text-slate-400 hover:text-slate-700"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <p className="text-slate-400">Student</p>
                      <p className="font-bold text-slate-800 mt-0.5">{selectedSubmission.studentId?.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Assignment Topic</p>
                      <p className="font-semibold text-blue-600 mt-0.5">Week {selectedSubmission.weekNumber}, Day {selectedSubmission.dayNumber} Assignment</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Submission Link</p>
                      <a href={selectedSubmission.submissionLink} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline font-semibold mt-0.5 block truncate">
                        {selectedSubmission.submissionLink}
                      </a>
                    </div>

                    <form onSubmit={handleEvaluationSubmit} className="space-y-4 pt-2 border-t border-slate-100">
                      <div>
                        <label className="crm-label text-[10px]">Select Grade</label>
                        <select 
                          value={evalForm.grade} 
                          onChange={e => setEvalForm({ ...evalForm, grade: e.target.value })} 
                          className="crm-input bg-white text-xs h-9 py-1"
                        >
                          <option value="A">A (Excellent)</option>
                          <option value="B">B (Good)</option>
                          <option value="C">C (Needs Improvement)</option>
                        </select>
                      </div>

                      <div>
                        <label className="crm-label text-[10px]">Evaluation Status</label>
                        <select 
                          value={evalForm.status} 
                          onChange={e => setEvalForm({ ...evalForm, status: e.target.value })} 
                          className="crm-input bg-white text-xs h-9 py-1"
                        >
                          <option value="Completed">Approve & Complete</option>
                          <option value="Rejected">Reject & Require Changes</option>
                        </select>
                      </div>

                      <div>
                        <label className="crm-label text-[10px]">Mentor Feedback</label>
                        <textarea 
                          required
                          value={evalForm.mentorFeedback}
                          onChange={e => setEvalForm({ ...evalForm, mentorFeedback: e.target.value })}
                          className="crm-input min-h-[6rem] text-xs resize-none"
                          placeholder="Write detailed assessment feedback..."
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={submittingEval}
                        className="crm-btn-primary w-full py-2.5 font-bold shadow-xs text-xs"
                      >
                        {submittingEval ? 'Submitting...' : 'Confirm Evaluation'}
                      </button>
                    </form>
                  </div>
                </SurfaceCard>
              </div>
            )}
          </div>
        )}

        {/* FORCE ASSIGN OVERRIDE TAB */}
        {activeTab === 'direct' && (
          <div className="max-w-xl mx-auto">
            <SurfaceCard className="p-6 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Force Assign Custom Task</h3>
              
              <form onSubmit={handleCustomTaskSubmit} className="space-y-4">
                <div>
                  <label className="crm-label">Target Student</label>
                  <select 
                    value={customTask.studentId}
                    onChange={e => setCustomTask({ ...customTask, studentId: e.target.value })}
                    className="crm-input bg-white"
                    required
                  >
                    <option value="">Select Student</option>
                    {roster.map(r => (
                      <option key={r.studentId} value={r.studentId}>{r.name} ({r.track})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="crm-label">Task Topic Name</label>
                  <input 
                    type="text"
                    required
                    value={customTask.topicName}
                    onChange={e => setCustomTask({ ...customTask, topicName: e.target.value })}
                    className="crm-input" 
                    placeholder="e.g. Redux Toolkit Advanced CRUD" 
                  />
                </div>

                <div>
                  <label className="crm-label">Task Description</label>
                  <textarea 
                    required
                    value={customTask.description}
                    onChange={e => setCustomTask({ ...customTask, description: e.target.value })}
                    className="crm-input min-h-[6rem] resize-none" 
                    placeholder="Provide details of the assignment instructions..." 
                  />
                </div>

                <div>
                  <label className="crm-label">Expected Duration</label>
                  <input 
                    type="text"
                    required
                    value={customTask.expectedDuration}
                    onChange={e => setCustomTask({ ...customTask, expectedDuration: e.target.value })}
                    className="crm-input" 
                    placeholder="e.g. 3 Hours / 1 Day" 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submittingCustomTask}
                  className="crm-btn-primary w-full py-2.5 font-bold shadow-xs text-xs"
                >
                  {submittingCustomTask ? 'Assigning...' : 'Assign Custom Task'}
                </button>
              </form>
            </SurfaceCard>
          </div>
        )}

        {/* AI ENGINE SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-md mx-auto">
            <SurfaceCard className="p-6 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">AI Mentorship Engine Config</h3>
              
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Dynamic AI Generation</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Generates customized daily learning plan models upon page load.</p>
                  </div>
                  <div>
                    <input 
                      type="checkbox" 
                      checked={settings.aiGenerationEnabled}
                      onChange={handleToggleAi}
                      className="h-5 w-5 rounded border-slate-350 text-blue-650 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50 opacity-60">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Manual Admin Review</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Force generated topics to start in "Pending" until approved.</p>
                  </div>
                  <div>
                    <input 
                      type="checkbox" 
                      disabled
                      checked={settings.requireApproval}
                      className="h-5 w-5 rounded border-slate-350 text-blue-650 focus:ring-blue-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </SurfaceCard>
          </div>
        )}
      </div>
    </AppShell>
  );
}
