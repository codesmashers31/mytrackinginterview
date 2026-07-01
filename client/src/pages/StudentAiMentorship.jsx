import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  AppShell, SurfaceCard, StatusBadge, SectionTabs 
} from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { 
  BookOpen, Code, FileText, CheckSquare, Calendar, Award, 
  ChevronRight, Sparkles, CheckCircle2, Clock, Globe, ArrowRight, 
  Edit2, Lock, User, Key, CheckSquare as CheckIcon, ShieldCheck, Play
} from 'lucide-react';

const TRACKS = ['MERN Stack', 'Java Full Stack', 'Python Full Stack', 'Testing', 'Data Analytics', 'UI/UX'];
const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Tamil', label: 'தமிழ் (Tamil)' },
  { value: 'Hindi', label: 'हिन्दी (Hindi)' },
  { value: 'Telugu', label: 'తెలుగు (Telugu)' },
  { value: 'Malayalam', label: 'മലയാളം (Malayalam)' }
];

const TRACK_SKILLS = {
  'MERN Stack': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'SQL', 'Git'],
  'Java Full Stack': ['HTML', 'CSS', 'JavaScript', 'Java Core', 'Spring Boot', 'Hibernate or SQL', 'Git'],
  'Python Full Stack': ['HTML', 'CSS', 'JavaScript', 'Python Core', 'Django or Flask', 'SQL Database', 'Git'],
  'Data Analytics': ['SQL Database', 'Python Programming', 'Microsoft Excel', 'Tableau or PowerBI', 'Statistics', 'Git'],
  'Testing': ['Manual Testing', 'Automation Testing', 'Selenium WebDriver', 'SQL Queries', 'Java or Python', 'Git'],
  'UI/UX': ['User Research', 'Wireframing', 'Figma or Adobe XD', 'Prototyping', 'UI Design Patterns', 'Information Architecture', 'Git']
};

export default function StudentAiMentorship() {
  const [activeTab, setActiveTab] = useState('study'); // 'study' | 'roadmap' | 'readiness' | 'mocks'
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [profile, setProfile] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  
  // Onboarding Wizard State
  const [onboardStep, setOnboardStep] = useState(1);
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    mobile: '',
    email: '',
    degree: '',
    department: '',
    passedOutYear: '',
    experience: 'Fresher',
    language: 'English',
    techTrack: 'MERN Stack',
    skillLevel: {},
    commLevel: { speaking: 3, listening: 3, reading: 3, writing: 3 },
    aptitudeLevel: { logical: 3, quantitative: 3, verbal: 3 },
    dailyAvailability: '4 Hours',
    targetRole: '',
    targetPackage: '5 LPA'
  });
  const [onboardSubmit, setOnboardSubmit] = useState(false);

  // Active Day Progress State
  const [selectedDay, setSelectedDay] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [dailyPlan, setDailyPlan] = useState(null);
  const [dailyPlanError, setDailyPlanError] = useState(null);
  const [dayProgress, setDayProgress] = useState(null);
  const [submissionLink, setSubmissionLink] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // Weekly Assessment State
  const [assessmentScore, setAssessmentScore] = useState(null);
  const [submittingAssessment, setSubmittingAssessment] = useState(false);

  // Readiness State
  const [readiness, setReadiness] = useState(null);

  // Mocks State
  const [mocks, setMocks] = useState([]);
  const [mockForm, setMockForm] = useState({ type: 'Technical', scheduledAt: '' });
  const [bookingMock, setBookingMock] = useState(false);

  const fetchProfileAndStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/ai/profile'), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.onboarded) {
          setIsOnboarded(true);
          setProfile(data.profile);
          await Promise.all([
            fetchRoadmap(),
            fetchReadiness(),
            fetchMocks()
          ]);
        } else if (data.prefilledData) {
          const track = data.prefilledData.techTrack || 'MERN Stack';
          const defaultSkills = {};
          (TRACK_SKILLS[track] || TRACK_SKILLS['MERN Stack']).forEach(skill => {
            defaultSkills[skill] = 3;
          });

          setOnboardForm(prev => ({
            ...prev,
            name: localStorage.getItem('userName') || '',
            email: data.prefilledData.email || localStorage.getItem('userEmail') || '',
            mobile: data.prefilledData.mobile || '',
            degree: data.prefilledData.degree || prev.degree,
            passedOutYear: data.prefilledData.passedOutYear || prev.passedOutYear,
            experience: data.prefilledData.experience || prev.experience,
            currentStatus: data.prefilledData.currentStatus || prev.currentStatus,
            techTrack: track,
            skillLevel: defaultSkills,
            targetRole: data.prefilledData.targetRole || prev.targetRole
          }));
        }
      }
    } catch (err) {
      toast.error('Unable to establish connection with AI server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoadmap = async () => {
    try {
      const res = await fetch(buildApiUrl('/ai/roadmap'), { headers: authHeaders() });
      if (res.ok) {
        const path = await res.json();
        setRoadmap(path);
        setCurrentDay(path.currentDay);
        setCurrentWeek(path.currentWeek);
        setSelectedDay(path.currentDay);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDailyPlanForDay = async (day) => {
    setDailyPlanError(null);
    setDailyPlan(null);
    setDayProgress(null);
    try {
      const res = await fetch(buildApiUrl(`/ai/daily-plan?day=${day}`), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDailyPlan(data.dailyTopic);
        setDayProgress(data.progress);
        if (data.progress && data.progress.submissionLink) {
          setSubmissionLink(data.progress.submissionLink);
        } else {
          setSubmissionLink('');
        }
      } else {
        const err = await res.json();
        setDailyPlanError(err.message || 'Failed to generate study plan.');
      }
    } catch (err) {
      setDailyPlanError('Network error loading study plan.');
    }
  };

  const fetchReadiness = async () => {
    try {
      const res = await fetch(buildApiUrl('/ai/readiness'), { headers: authHeaders() });
      if (res.ok) {
        setReadiness(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMocks = async () => {
    try {
      const res = await fetch(buildApiUrl('/ai/mocks'), { headers: authHeaders() });
      if (res.ok) {
        setMocks(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfileAndStatus();
  }, []);

  useEffect(() => {
    if (isOnboarded && selectedDay) {
      fetchDailyPlanForDay(selectedDay);
    }
  }, [isOnboarded, selectedDay]);

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setOnboardSubmit(true);
    const loadToast = toast.loading('Compiling career roadmap & setting up daily tasks...');
    try {
      const res = await fetch(buildApiUrl('/ai/onboard'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(onboardForm)
      });
      if (res.ok) {
        toast.dismiss(loadToast);
        toast.success('Onboarding complete! Your personalized roadmap is ready.');
        const data = await res.json();
        setIsOnboarded(true);
        setProfile(data.profile);
        setRoadmap(data.path);
        setCurrentDay(data.path.currentDay);
        setCurrentWeek(data.path.currentWeek);
        setSelectedDay(data.path.currentDay);
        await Promise.all([
          fetchReadiness(),
          fetchMocks()
        ]);
      } else {
        toast.dismiss(loadToast);
        const err = await res.json();
        toast.error(err.message || 'Roadmap compilation failed.');
      }
    } catch (err) {
      toast.dismiss(loadToast);
      toast.error('Network failure during onboarding.');
    } finally {
      setOnboardSubmit(false);
    }
  };

  const handleToggleTask = async (taskKey, currentStatus) => {
    const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    try {
      const res = await fetch(buildApiUrl('/ai/toggle-task'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ dayNumber: selectedDay, taskKey, status: nextStatus })
      });
      if (res.ok) {
        const data = await res.json();
        setDayProgress(data.progress);
        toast.success(`Task marked as ${nextStatus.toLowerCase()}`);
        fetchReadiness();
      }
    } catch (err) {
      toast.error('Failed to update task.');
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!submissionLink.trim()) return toast.error('Please enter a submission URL.');
    setSubmittingAssignment(true);
    try {
      const res = await fetch(buildApiUrl('/ai/submit-assignment'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ dayNumber: selectedDay, submissionLink })
      });
      if (res.ok) {
        const data = await res.json();
        setDayProgress(data.progress);
        toast.success('Assignment submitted for mentor review.');
        fetchReadiness();
      } else {
        toast.error('Failed to submit assignment.');
      }
    } catch (err) {
      toast.error('Network disconnect during submission.');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleUnlockNextDay = async () => {
    try {
      const res = await fetch(buildApiUrl('/ai/unlock-next-day'), {
        method: 'POST',
        headers: authHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Day Completed! Lock opened for tomorrow\'s roadmap.');
        setCurrentDay(data.path.currentDay);
        setCurrentWeek(data.path.currentWeek);
        setSelectedDay(data.path.currentDay);
        fetchReadiness();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Complete all tasks first.');
      }
    } catch (err) {
      toast.error('Failed to unlock next day.');
    }
  };

  const handleAssessmentSubmit = async (score) => {
    setSubmittingAssessment(true);
    try {
      const res = await fetch(buildApiUrl('/ai/submit-assessment'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          weekNumber: currentWeek,
          score,
          questions: [
            { question: 'Technical Concepts Test', category: 'Technical', score },
            { question: 'Communication Interview Readiness', category: 'Communication', score }
          ]
        })
      });
      if (res.ok) {
        toast.success('Weekly Assessment submitted and graded!');
        fetchDailyPlanForDay(selectedDay);
        fetchReadiness();
      }
    } catch (err) {
      toast.error('Failed to save assessment.');
    } finally {
      setSubmittingAssessment(false);
    }
  };

  const handleMockBooking = async (e) => {
    e.preventDefault();
    if (!mockForm.scheduledAt) return toast.error('Please choose a schedule date and time.');
    setBookingMock(true);
    try {
      const res = await fetch(buildApiUrl('/ai/schedule-mock'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(mockForm)
      });
      if (res.ok) {
        toast.success('Mock interview scheduled successfully!');
        setMockForm({ type: 'Technical', scheduledAt: '' });
        fetchMocks();
      } else {
        toast.error('Failed to book mock interview slot.');
      }
    } catch (err) {
      toast.error('Network disconnect during slot booking.');
    } finally {
      setBookingMock(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="AI Learning Journey & Mentorship" subtitle="Preparing customized roadmap...">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  // ONBOARDING WIZARD INTERFACE
  if (!isOnboarded) {
    const isEditing = !!profile;
    return (
      <AppShell 
        title={isEditing ? "Re-configure AI Learning Profile" : "AI Learning Onboarding Wizard"} 
        subtitle="Let our AI coordinator map your customized day-by-day learning journey."
        headerActions={isEditing ? (
          <button 
            onClick={() => setIsOnboarded(true)}
            className="px-3.5 py-1.5 text-xs font-bold bg-slate-100 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-200 transition"
          >
            Cancel Edit
          </button>
        ) : null}
      >
        <div className="max-w-2xl mx-auto py-4">
          <SurfaceCard className="p-8 border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{isEditing ? "Modify Learning Journey Inputs" : "AI Learning Assessment"}</h3>
                <p className="text-xs text-slate-500">Step {onboardStep} of 3</p>
              </div>
            </div>

            <form onSubmit={handleOnboardSubmit}>
              {onboardStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Personal & Department Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="crm-label">Full Name</label>
                      <input 
                        required 
                        value={onboardForm.name} 
                        onChange={e => setOnboardForm({...onboardForm, name: e.target.value})} 
                        className="crm-input" 
                        placeholder="e.g. Saritha" 
                      />
                    </div>
                    <div>
                      <label className="crm-label">Department / Stream</label>
                      <input 
                        required 
                        value={onboardForm.department} 
                        onChange={e => setOnboardForm({...onboardForm, department: e.target.value})} 
                        className="crm-input" 
                        placeholder="e.g. Information Technology" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="crm-label">Degree</label>
                      <input 
                        required 
                        value={onboardForm.degree} 
                        onChange={e => setOnboardForm({...onboardForm, degree: e.target.value})} 
                        className="crm-input" 
                        placeholder="e.g. B.Tech" 
                      />
                    </div>
                    <div>
                      <label className="crm-label">Passed Out Year</label>
                      <input 
                        required 
                        value={onboardForm.passedOutYear} 
                        onChange={e => setOnboardForm({...onboardForm, passedOutYear: e.target.value})} 
                        className="crm-input" 
                        placeholder="e.g. 2024" 
                      />
                    </div>
                    <div>
                      <label className="crm-label">Academic CGPA / %</label>
                      <input 
                        required 
                        value={onboardForm.cgpa} 
                        onChange={e => setOnboardForm({...onboardForm, cgpa: e.target.value})} 
                        className="crm-input" 
                        placeholder="e.g. 8.5 CGPA or 85%" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="crm-label">Email Address</label>
                      <input 
                        required 
                        type="email"
                        value={onboardForm.email} 
                        onChange={e => setOnboardForm({...onboardForm, email: e.target.value})} 
                        className="crm-input" 
                        placeholder="e.g. student@domain.com" 
                      />
                    </div>
                    <div>
                      <label className="crm-label">Mobile Number</label>
                      <input 
                        required 
                        value={onboardForm.mobile} 
                        onChange={e => setOnboardForm({...onboardForm, mobile: e.target.value})} 
                        className="crm-input" 
                        placeholder="e.g. 9876543210" 
                      />
                    </div>
                    <div>
                      <label className="crm-label">Preferred Language</label>
                      <select 
                        value={onboardForm.language} 
                        onChange={e => setOnboardForm({...onboardForm, language: e.target.value})} 
                        className="crm-input bg-white"
                      >
                        {LANGUAGES.map(lang => (
                          <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      type="button" 
                      onClick={() => setOnboardStep(2)} 
                      className="crm-btn-primary px-6 py-2.5 flex items-center gap-2"
                    >
                      Next Step <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {onboardStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Track & Skill Assessment</h4>
                  
                  <div>
                    <label className="crm-label">Target Technology Track</label>
                    <select 
                      value={onboardForm.techTrack} 
                      onChange={e => {
                        const newTrack = e.target.value;
                        const defaultSkills = {};
                        (TRACK_SKILLS[newTrack] || []).forEach(skill => {
                          defaultSkills[skill] = 3;
                        });
                        setOnboardForm({
                          ...onboardForm, 
                          techTrack: newTrack,
                          skillLevel: defaultSkills
                        });
                      }} 
                      className="crm-input bg-white"
                    >
                      {TRACKS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="crm-label mb-2 block">Rate technical skills (1 = Beginner, 5 = Expert)</label>
                    <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      {(TRACK_SKILLS[onboardForm.techTrack] || []).map(skill => (
                        <div key={skill} className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{skill}</label>
                          <select 
                            value={onboardForm.skillLevel[skill] || 3} 
                            onChange={e => setOnboardForm({
                              ...onboardForm, 
                              skillLevel: { ...onboardForm.skillLevel, [skill]: Number(e.target.value) }
                            })} 
                            className="crm-input bg-white text-xs py-1 h-8"
                          >
                            {[1, 2, 3, 4, 5].map(v => (
                              <option key={v} value={v}>{v}/5</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="crm-label">Coding Projects Experience</label>
                      <select 
                        value={onboardForm.codingProjectsExperience || 'None'} 
                        onChange={e => setOnboardForm({...onboardForm, codingProjectsExperience: e.target.value})} 
                        className="crm-input bg-white"
                      >
                        <option value="None">None (Just starting)</option>
                        <option value="1-2 Small Projects">1-2 Small Projects</option>
                        <option value="3+ Structured Projects">3+ Structured Projects</option>
                      </select>
                    </div>

                    <div>
                      <label className="crm-label">Problem Solving Experience</label>
                      <select 
                        value={onboardForm.problemSolvingExperience || 'Never practiced'} 
                        onChange={e => setOnboardForm({...onboardForm, problemSolvingExperience: e.target.value})} 
                        className="crm-input bg-white"
                      >
                        <option value="Never practiced">Never practiced</option>
                        <option value="Solved basic puzzles">Solved basic puzzles</option>
                        <option value="LeetCode/HackerRank regular">LeetCode/HackerRank regular</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="crm-label">Certifications Completed</label>
                      <input 
                        value={onboardForm.certifications || ''} 
                        onChange={e => setOnboardForm({...onboardForm, certifications: e.target.value})} 
                        className="crm-input" 
                        placeholder="e.g. AWS Certified, Udemy Course" 
                      />
                    </div>

                    <div>
                      <label className="crm-label">Familiar Databases</label>
                      <div className="flex flex-wrap gap-2.5 mt-1">
                        {['MySQL', 'MongoDB', 'PostgreSQL', 'SQLite'].map(db => {
                          const hasDb = (onboardForm.familiarDatabases || []).includes(db);
                          return (
                            <button
                              type="button"
                              key={db}
                              onClick={() => {
                                const current = onboardForm.familiarDatabases || [];
                                const next = current.includes(db) 
                                  ? current.filter(x => x !== db)
                                  : [...current, db];
                                setOnboardForm({ ...onboardForm, familiarDatabases: next });
                              }}
                              className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all ${
                                hasDb ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              {db}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button 
                      type="button" 
                      onClick={() => setOnboardStep(1)} 
                      className="px-6 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition font-semibold"
                    >
                      Back
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setOnboardStep(3)} 
                      className="crm-btn-primary px-6 py-2.5 flex items-center gap-2"
                    >
                      Next Step <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {onboardStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Communication, Aptitude & Target Goals</h4>
                  
                  <div>
                    <label className="crm-label mb-2 block">Rate Communication (Speaking, Listening, Reading, Writing)</label>
                    <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      {['speaking', 'listening', 'reading', 'writing'].map(field => (
                        <div key={field} className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{field}</label>
                          <select 
                            value={onboardForm.commLevel[field]} 
                            onChange={e => setOnboardForm({
                              ...onboardForm,
                              commLevel: { ...onboardForm.commLevel, [field]: Number(e.target.value) }
                            })} 
                            className="crm-input bg-white text-xs py-1 h-8"
                          >
                            {[1, 2, 3, 4, 5].map(v => (
                              <option key={v} value={v}>{v}/5</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="crm-label mb-2 block">Rate Aptitude (Logical, Quantitative, Verbal)</label>
                    <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      {['logical', 'quantitative', 'verbal'].map(field => (
                        <div key={field} className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{field}</label>
                          <select 
                            value={onboardForm.aptitudeLevel[field]} 
                            onChange={e => setOnboardForm({
                              ...onboardForm,
                              aptitudeLevel: { ...onboardForm.aptitudeLevel, [field]: Number(e.target.value) }
                            })} 
                            className="crm-input bg-white text-xs py-1 h-8"
                          >
                            {[1, 2, 3, 4, 5].map(v => (
                              <option key={v} value={v}>{v}/5</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="crm-label">Daily Available Hours</label>
                      <select 
                        value={onboardForm.dailyAvailability} 
                        onChange={e => setOnboardForm({...onboardForm, dailyAvailability: e.target.value})} 
                        className="crm-input bg-white"
                      >
                        <option value="2 Hours">2 Hours</option>
                        <option value="4 Hours">4 Hours</option>
                        <option value="6 Hours">6 Hours</option>
                        <option value="8 Hours">8 Hours</option>
                      </select>
                    </div>
                    <div>
                      <label className="crm-label">Target Role</label>
                      <input 
                        required 
                        value={onboardForm.targetRole} 
                        onChange={e => setOnboardForm({...onboardForm, targetRole: e.target.value})} 
                        className="crm-input" 
                        placeholder="e.g. MERN Stack Developer" 
                      />
                    </div>
                    <div>
                      <label className="crm-label">Target Package</label>
                      <select 
                        value={onboardForm.targetPackage} 
                        onChange={e => setOnboardForm({...onboardForm, targetPackage: e.target.value})} 
                        className="crm-input bg-white"
                      >
                        <option value="3 LPA">3 LPA</option>
                        <option value="5 LPA">5 LPA</option>
                        <option value="8 LPA">8 LPA</option>
                        <option value="10+ LPA">10+ LPA</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button 
                      type="button" 
                      onClick={() => setOnboardStep(2)} 
                      className="px-6 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition font-semibold"
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      disabled={onboardSubmit}
                      className={`crm-btn-primary px-8 py-2.5 font-bold ${onboardSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {onboardSubmit ? 'Compiling Journey...' : 'Create Career Journey'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </SurfaceCard>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell 
      title="AI Learning Journey & Mentorship" 
      subtitle={`Active Level: ${roadmap?.level || 'Beginner'} | Track: ${profile?.techTrack}`}
      headerActions={(
        <button 
          onClick={() => {
            setOnboardForm({
              name: profile.name || '',
              mobile: profile.mobile || '',
              email: profile.email || '',
              degree: profile.degree || '',
              department: profile.department || '',
              passedOutYear: profile.passedOutYear || '',
              experience: profile.experience || 'Fresher',
              language: profile.language || 'English',
              techTrack: profile.techTrack || 'MERN Stack',
              skillLevel: profile.skillLevel || {},
              commLevel: profile.commLevel || { speaking: 3, listening: 3, reading: 3, writing: 3 },
              aptitudeLevel: profile.aptitudeLevel || { logical: 3, quantitative: 3, verbal: 3 },
              dailyAvailability: profile.dailyAvailability || '4 Hours',
              targetRole: profile.targetRole || '',
              targetPackage: profile.targetPackage || '5 LPA',
              cgpa: profile.cgpa || '',
              codingProjectsExperience: profile.codingProjectsExperience || 'None',
              familiarDatabases: profile.familiarDatabases || [],
              problemSolvingExperience: profile.problemSolvingExperience || 'Never practiced',
              certifications: profile.certifications || ''
            });
            setOnboardStep(1);
            setIsOnboarded(false);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition shadow-2xs font-medium"
        >
          <Edit2 size={12} className="text-slate-500" />
          Edit profile
        </button>
      )}
    >
      {/* TIMELINE DAY SELECTOR WIDGET */}
      <div className="flex gap-2.5 overflow-x-auto pb-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200 scrollbar-none">
        {Array.from({ length: 30 }).map((_, idx) => {
          const dayNum = idx + 1;
          const isCurrent = dayNum === currentDay;
          const isSelected = dayNum === selectedDay;
          const isCompleted = dayNum < currentDay;
          const isLocked = dayNum > currentDay;

          return (
            <button
              key={dayNum}
              onClick={() => {
                if (isLocked) {
                  toast.error(`Day ${dayNum} is locked. Complete all previous days first.`);
                } else {
                  setSelectedDay(dayNum);
                }
              }}
              className={`flex-none flex flex-col items-center justify-center h-16 w-14 rounded-xl border transition-all ${
                isSelected ? 'bg-blue-600 border-blue-600 text-white font-extrabold shadow-sm' :
                isCurrent ? 'bg-blue-50 border-blue-200 text-blue-700' :
                isCompleted ? 'bg-emerald-50 border-emerald-250 text-emerald-700' :
                'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">Day</span>
              <span className="text-lg font-black mt-0.5">{dayNum}</span>
              {isLocked && <Lock size={10} className="mt-1" />}
            </button>
          );
        })}
      </div>

      <SectionTabs
        items={[
          { label: 'Today\'s Learning Plan', active: activeTab === 'study', onClick: () => setActiveTab('study') },
          { label: 'Career Roadmap', active: activeTab === 'roadmap', onClick: () => setActiveTab('roadmap') },
          { label: 'Interview Mock Board', active: activeTab === 'mocks', onClick: () => setActiveTab('mocks') },
          { label: 'Readiness Metrics', active: activeTab === 'readiness', onClick: () => setActiveTab('readiness') }
        ]}
      />

      <div className="mt-6">
        {activeTab === 'study' && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* STUDY PLAN PANEL */}
            <div className="lg:col-span-2 space-y-6">
              {dailyPlanError ? (
                <SurfaceCard className="p-8 text-center border-rose-350 bg-rose-50/20">
                  <div className="mb-4 text-3xl">⚠️</div>
                  <p className="text-lg font-bold text-rose-800">Plan Generation Error</p>
                  <p className="mt-2 text-xs text-slate-600">{dailyPlanError}</p>
                  <button onClick={() => fetchDailyPlanForDay(selectedDay)} className="crm-btn-primary mt-4 px-6 py-2 text-xs font-bold">Retry Generation</button>
                </SurfaceCard>
              ) : dailyPlan ? (
                <>

                  {/* Day 6 weekend assessment trigger */}
                  {dailyPlan.isAssessmentDay ? (
                    <SurfaceCard className="p-8 text-center border-blue-200 bg-blue-50/10">
                      <div className="mb-4 text-3xl">🏁</div>
                      <p className="text-lg font-bold text-slate-800">Weekly Learning Review</p>
                      <p className="mt-2 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        Congratulations on completing 5 full technical and aptitude study days. Please complete the assessment test to unlock next week's track.
                      </p>
                      
                      <div className="mt-6 max-w-sm mx-auto p-4 border border-blue-100 rounded-2xl bg-white shadow-xs">
                        <label className="crm-label text-left text-[11px]">Input Mock Assessment Score (0-100)</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="100"
                          className="crm-input h-10 py-1.5" 
                          placeholder="e.g. 85"
                          onChange={e => setAssessmentScore(Number(e.target.value))}
                        />
                        <button
                          onClick={() => handleAssessmentSubmit(assessmentScore)}
                          disabled={submittingAssessment}
                          className="crm-btn-primary w-full mt-3 py-2.5 font-bold"
                        >
                          {submittingAssessment ? 'Submitting...' : 'Submit Assessment'}
                        </button>
                      </div>
                    </SurfaceCard>
                  ) : (
                    <>
                      {/* Reading section */}
                      <SurfaceCard className="p-6 border border-slate-200">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="text-blue-600" size={18} />
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">1. Communication & Reading Practice</h3>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-full">{dailyPlan.readingTopic.duration}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mb-2">{dailyPlan.readingTopic.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{dailyPlan.readingTopic.description}</p>
                      </SurfaceCard>

                      {/* Technical study notes */}
                      <SurfaceCard className="p-6 border border-slate-200">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-4">
                          <div className="flex items-center gap-2">
                            <CheckIcon className="text-blue-600" size={18} />
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">2. Technical Topic Complete Notes</h3>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-full">{dailyPlan.techTopic.duration}</span>
                        </div>

                        <div className="space-y-4 text-xs text-slate-650 leading-relaxed">
                          <div>
                            <h4 className="font-bold text-slate-800 mb-1">{dailyPlan.techTopic.title}</h4>
                            <p>{dailyPlan.techTopic.explanation}</p>
                          </div>

                          {dailyPlan.techTopic.syntax && (
                            <div>
                              <p className="font-extrabold text-slate-400 uppercase tracking-wider text-[9px] mb-1.5">Code Syntax Structure</p>
                              <pre className="bg-slate-950 text-slate-100 rounded-xl p-3.5 font-mono overflow-x-auto">{dailyPlan.techTopic.syntax}</pre>
                            </div>
                          )}

                          {dailyPlan.techTopic.examples && dailyPlan.techTopic.examples.map((ex, i) => (
                            <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-3">
                              <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono">{ex.code}</pre>
                              <div className="mt-2 text-slate-500 font-mono">Output: {ex.output}</div>
                              <div className="mt-1.5 text-slate-650 italic">Details: {ex.explanation}</div>
                            </div>
                          ))}

                          {dailyPlan.techTopic.revisionNotes && (
                            <div className="bg-blue-50/40 border border-blue-100/50 rounded-2xl p-4">
                              <h5 className="font-bold text-blue-900 mb-1.5">Revision Summary</h5>
                              <p className="text-[11px] text-blue-700 leading-relaxed">{dailyPlan.techTopic.revisionNotes}</p>
                            </div>
                          )}

                          {dailyPlan.techTopic.commonMistakes && dailyPlan.techTopic.commonMistakes.length > 0 && (
                            <div className="bg-rose-50/40 border border-rose-100/50 rounded-2xl p-4">
                              <h5 className="font-bold text-rose-900 mb-2">Common Mistakes & Pitfalls</h5>
                              <div className="space-y-2">
                                {dailyPlan.techTopic.commonMistakes.map((m, i) => (
                                  <div key={i}>
                                    <p className="font-bold text-rose-700">❌ Error: {m.mistake}</p>
                                    <p className="text-slate-600 font-medium ml-4">✔️ Correct: {m.fix}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </SurfaceCard>

                      {/* Daily Coding Module */}
                      <SurfaceCard className="p-6 border border-slate-200">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-4">
                          <div className="flex items-center gap-2">
                            <Code className="text-blue-600" size={18} />
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">3. Daily Coding Challenge</h3>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-full">{dailyPlan.codingTask.duration}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-xs font-bold text-slate-800">{dailyPlan.codingTask.title}</h4>
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800`}>
                            {dailyPlan.codingTask.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{dailyPlan.codingTask.description}</p>
                      </SurfaceCard>

                      {/* Logical Thinking Module */}
                      <SurfaceCard className="p-6 border border-slate-200">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-4">
                          <div className="flex items-center gap-2">
                            <Award className="text-blue-600" size={18} />
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">4. Logical Reasoning Challenge</h3>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-full">{dailyPlan.logicalTask.duration}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mb-2">{dailyPlan.logicalTask.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3">{dailyPlan.logicalTask.description}</p>
                        {dailyPlan.logicalTask.inputOutput && (
                          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-250 font-mono text-[10px] text-slate-500">
                            {dailyPlan.logicalTask.inputOutput}
                          </div>
                        )}
                      </SurfaceCard>

                      {/* Task list summary progress check list */}
                      {dayProgress && (
                        <SurfaceCard className="p-5 border border-slate-200 bg-slate-50/30">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Daily Task Completion checklist</h4>
                          
                          <div className="grid gap-3 sm:grid-cols-3">
                            {[
                              { key: 'reading', label: '1. Reading Practice' },
                              { key: 'comm', label: '2. Comm Practice' },
                              { key: 'tech', label: '3. Technical Notes' },
                              { key: 'coding', label: '4. Coding Task' },
                              { key: 'logical', label: '5. Logical Puzzles' }
                            ].map(t => {
                              const isDone = dayProgress.tasks[t.key] === 'Completed';
                              return (
                                <button
                                  key={t.key}
                                  onClick={() => handleToggleTask(t.key, dayProgress.tasks[t.key])}
                                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                                    isDone ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  <span>{t.label}</span>
                                  <CheckCircle2 size={14} className={isDone ? 'text-emerald-600' : 'text-slate-300'} />
                                </button>
                              );
                            })}
                            
                            <div className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold ${
                              ['Submitted', 'Completed', 'Reviewed'].includes(dayProgress.tasks.assignment)
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}>
                              <span>6. Assignment Submission</span>
                              <StatusBadge status={dayProgress.tasks.assignment} />
                            </div>
                          </div>

                          {/* LOCK BUTTON POPUP GATES */}
                          {dayProgress.tasks.reading === 'Completed' &&
                           dayProgress.tasks.comm === 'Completed' &&
                           dayProgress.tasks.tech === 'Completed' &&
                           dayProgress.tasks.coding === 'Completed' &&
                           dayProgress.tasks.logical === 'Completed' &&
                           ['Submitted', 'Completed', 'Reviewed'].includes(dayProgress.tasks.assignment) && (
                            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-center">
                              <button
                                onClick={handleUnlockNextDay}
                                className="crm-btn-primary px-8 py-3 bg-gradient-to-r from-blue-650 to-indigo-650 font-black shadow-md rounded-xl flex items-center gap-2 animate-bounce"
                              >
                                <ShieldCheck size={16} />
                                Continue Learning Journey (Day {selectedDay + 1})
                              </button>
                            </div>
                          )}
                        </SurfaceCard>
                      )}
                    </>
                  )}
                </>
              ) : (
                <SurfaceCard className="p-8 text-center text-slate-600">
                  <div className="mb-4 text-3xl">📝</div>
                  <p className="text-lg font-semibold text-slate-900">Compiling Journey Dashboard</p>
                  <p className="mt-2 text-sm text-slate-400">Roadmap index details are updating...</p>
                </SurfaceCard>
              )}
            </div>

            {/* ASSIGNMENTS & COMMUNICATION PRACTICE (Right Column) */}
            <div className="space-y-6">
              {dailyPlan && !dailyPlan.isAssessmentDay && (
                <>
                  {/* Comm Practice details */}
                  <SurfaceCard className="p-6 border border-slate-200">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-4">
                      <div className="flex items-center gap-2">
                        <Globe className="text-blue-600" size={18} />
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Communication Practice</h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-full">{dailyPlan.commPractice.duration}</span>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase bg-indigo-150 text-indigo-850 px-2 py-0.5 rounded block w-fit mb-2">
                      {dailyPlan.commPractice.type} Challenge
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 mb-2">{dailyPlan.commPractice.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{dailyPlan.commPractice.description}</p>
                  </SurfaceCard>

                  {/* Assignment engine */}
                  <SurfaceCard className="p-6 border border-slate-200">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="text-blue-600" size={18} />
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Assignment Project</h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-full">{dailyPlan.assignment.duration}</span>
                    </div>

                    <div className="space-y-3.5 text-xs text-slate-650">
                      <div>
                        <h4 className="font-bold text-slate-800">{dailyPlan.assignment.title}</h4>
                        <p className="text-slate-500 mt-1 leading-relaxed">{dailyPlan.assignment.description}</p>
                      </div>

                      {dailyPlan.assignment.objectives && dailyPlan.assignment.objectives.length > 0 && (
                        <div>
                          <p className="font-bold text-slate-700">Project Objectives:</p>
                          <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-500">
                            {dailyPlan.assignment.objectives.map((obj, idx) => (
                              <li key={idx}>{obj}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {dailyPlan.assignment.expectedOutput && (
                        <div>
                          <p className="font-bold text-slate-700">Expected Outputs:</p>
                          <p className="text-slate-500 italic mt-0.5">{dailyPlan.assignment.expectedOutput}</p>
                        </div>
                      )}

                      <form onSubmit={handleAssignmentSubmit} className="pt-2 border-t border-slate-100">
                        <label className="crm-label">Paste Submission URL (GitHub / Live Link)</label>
                        <input 
                          type="url"
                          required
                          value={submissionLink}
                          onChange={e => setSubmissionLink(e.target.value)}
                          className="crm-input py-2 text-xs" 
                          placeholder="https://github.com/..." 
                          disabled={dayProgress?.tasks?.assignment === 'Completed'}
                        />

                        {dayProgress && (
                          <div className="mt-3 flex items-center justify-between">
                            <StatusBadge status={dayProgress.tasks.assignment} />
                            {dayProgress.tasks.assignment !== 'Completed' && (
                              <button 
                                type="submit" 
                                disabled={submittingAssignment}
                                className="crm-btn-primary px-4 py-1.5 text-xs font-bold"
                              >
                                {submittingAssignment ? 'Saving...' : 'Upload Link'}
                              </button>
                            )}
                          </div>
                        )}
                      </form>

                      {dayProgress && dayProgress.mentorFeedback && (
                        <div className="mt-4 p-3.5 bg-indigo-50/50 border border-indigo-150 rounded-xl">
                          <p className="font-bold text-indigo-900">Grader Evaluation Notes:</p>
                          <p className="italic mt-1 leading-relaxed">{dayProgress.mentorFeedback}</p>
                          <p className="font-extrabold text-indigo-700 mt-2">Grade Assigned: {dayProgress.grade || 'A'}</p>
                        </div>
                      )}
                    </div>
                  </SurfaceCard>
                </>
              )}
            </div>
          </div>
        )}

        {/* ROADMAP TIMELINE VIEW */}
        {activeTab === 'roadmap' && (
          <SurfaceCard className="p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6">Structured Career Roadmap</h3>
            {roadmap ? (
              <div className="space-y-8 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-150">
                {roadmap.stages.map((stage, idx) => (
                  <div key={idx} className="relative pl-12">
                    <div className="absolute left-3.5 top-0.5 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-blue-50 border-2 border-blue-600 text-blue-700 font-extrabold text-[10px] shadow-xs">
                      {idx + 1}
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{stage.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{stage.description}</p>
                      
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {stage.weeks.map(week => {
                          const isActive = currentWeek === week.weekNumber;
                          const isPassed = currentWeek > week.weekNumber;
                          return (
                            <div 
                              key={week.weekNumber} 
                              className={`p-4 rounded-xl border ${isActive ? 'bg-blue-50/30 border-blue-400 shadow-xs' : isPassed ? 'bg-slate-50/50 border-slate-200 opacity-70' : 'bg-white border-slate-200'} transition-all`}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Week {week.weekNumber}</span>
                                {isPassed ? (
                                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">Completed</span>
                                ) : isActive ? (
                                  <span className="text-[9px] font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded-full">Active</span>
                                ) : null}
                              </div>
                              <h5 className="text-xs font-bold text-slate-800 leading-tight">{week.title}</h5>
                              <ul className="mt-2.5 space-y-1 text-[11px] text-slate-500">
                                {week.topics.map((t, idx) => (
                                  <li key={idx} className="flex items-center gap-1.5">
                                    <ChevronRight size={10} className="text-slate-400" />
                                    <span className="truncate">{t}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs">Loading roadmap indices...</p>
            )}
          </SurfaceCard>
        )}



        {/* PLACEMENT READINESS SCORE GAUGES */}
        {activeTab === 'readiness' && readiness && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <SurfaceCard className="p-6 border border-slate-200 text-center flex flex-col items-center justify-center min-h-[320px]">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Readiness Valuation</h3>
                
                <div className="relative flex items-center justify-center mt-4">
                  <div className="h-32 w-32 rounded-full border-8 border-slate-100 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-3xl font-black text-slate-800">{readiness.scores.overallScore}%</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Weighted Score</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <span className={`text-xs font-bold text-white px-4 py-1.5 rounded-full shadow-xs ${
                    readiness.scores.status === 'Placement Ready' ? 'bg-emerald-600' :
                    readiness.scores.status === 'Interview Ready' ? 'bg-blue-600' :
                    readiness.scores.status === 'Interview Preparation Stage' ? 'bg-indigo-600' :
                    readiness.scores.status === 'Learning Stage' ? 'bg-amber-600' : 'bg-rose-600'
                  }`}>
                    {readiness.scores.status}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-4 font-semibold">Active Streak: {readiness.dailyStreak} days</p>
                </div>
              </SurfaceCard>
            </div>

            <div className="md:col-span-2">
              <SurfaceCard className="p-6 border border-slate-200 min-h-[320px]">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 pb-2 border-b border-slate-100">Weighted Parameter Breakdowns</h3>
                
                <div className="space-y-5">
                  {[
                    { label: 'Technical Core Skills (30%)', value: readiness.scores.learningScore, color: 'bg-blue-600' },
                    { label: 'Practical Coding Exercises (20%)', value: readiness.scores.codingScore, color: 'bg-indigo-600' },
                    { label: 'Communication Practice (15%)', value: readiness.scores.communicationScore, color: 'bg-purple-600' },
                    { label: 'Diligence & Assignments (15%)', value: readiness.scores.assignmentScore, color: 'bg-emerald-600' },
                    { label: 'Attendance & consistency (10%)', value: readiness.scores.attendanceScore, color: 'bg-amber-600' },
                    { label: 'Completed Mock Interviews (10%)', value: readiness.scores.mockScore, color: 'bg-rose-600' }
                  ].map((metric, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">{metric.label}</span>
                        <span className="font-black text-slate-900">{metric.value}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${metric.color} rounded-full`} style={{ width: `${metric.value}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
