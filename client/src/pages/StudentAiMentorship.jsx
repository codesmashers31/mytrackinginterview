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
  'MERN Stack': ['HTML5', 'CSS3', 'JavaScript (ES6+)', 'React.js', 'Node.js', 'Express.js', 'MongoDB', 'SQL Database', 'REST APIs', 'Redux / Context API', 'Git & GitHub', 'Tailwind CSS / Bootstrap'],
  'Java Full Stack': ['HTML5', 'CSS3', 'JavaScript', 'Core Java', 'Advanced Java', 'Spring Boot', 'Spring MVC', 'Hibernate ORM', 'SQL / MySQL', 'RESTful Web Services', 'Microservices', 'Git & GitHub', 'Maven / Gradle'],
  'Python Full Stack': ['HTML5', 'CSS3', 'JavaScript', 'Core Python', 'Django Framework', 'Flask Framework', 'SQL Database', 'PostgreSQL / MySQL', 'REST APIs', 'Git & GitHub', 'Data Structures & Algorithms'],
  'Data Analytics': ['SQL Database', 'Python Programming', 'Microsoft Excel (Advanced)', 'Tableau', 'Power BI', 'Statistics & Probability', 'Data Wrangling', 'Pandas & NumPy', 'Machine Learning Basics', 'Git'],
  'Testing': ['Manual Testing', 'Automation Testing', 'Selenium WebDriver', 'Java / Python Core', 'SQL Queries', 'API Testing (Postman)', 'TestNG / JUnit', 'Defect Tracking (Jira)', 'Git & GitHub'],
  'UI/UX': ['User Research', 'User Persona Creation', 'Wireframing', 'Figma', 'Adobe XD', 'Interactive Prototyping', 'UI Design Patterns', 'Information Architecture', 'Usability Testing', 'Design Systems']
};

export default function StudentAiMentorship() {
  const [activeTab, setActiveTab] = useState('roadmap'); // default to 'roadmap'
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [profile, setProfile] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [languageInput, setLanguageInput] = useState('English');
  const [expandStep1, setExpandStep1] = useState(true);
  const [expandStep2, setExpandStep2] = useState(false);
  const [expandStep3, setExpandStep3] = useState(false);
  const [expandStep4, setExpandStep4] = useState(false);
  const [revealedQuestions, setRevealedQuestions] = useState({});
  
  // Onboarding Wizard State
  const [onboardStep, setOnboardStep] = useState(1);
  const [selectedTrack, setSelectedTrack] = useState('MERN Stack');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkills, setCustomSkills] = useState([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [dailyHours, setDailyHours] = useState(4);
  const [skillRatings, setSkillRatings] = useState({});
  const [onboardSubmit, setOnboardSubmit] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);

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
        setStudentDetails(data.studentDetails || null);
        if (data.onboarded) {
          setIsOnboarded(true);
          setProfile(data.profile);
          await Promise.all([
            fetchRoadmap(),
            fetchReadiness(),
            fetchMocks()
          ]);
        } else {
          setIsOnboarded(false);
          const track = data.studentDetails?.techStack || 'MERN Stack';
          setSelectedTrack(track);
          const skills = TRACK_SKILLS[track] || TRACK_SKILLS['MERN Stack'];
          setSelectedSkills(skills);
          const initialRatings = {};
          skills.forEach(s => {
            initialRatings[s] = 3;
          });
          setSkillRatings(initialRatings);
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
    setGeneratingPlan(true);
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
    } finally {
      setGeneratingPlan(false);
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

  const handleTrackChange = (track) => {
    setSelectedTrack(track);
    setCustomSkills([]);
    const skills = TRACK_SKILLS[track] || [];
    setSelectedSkills(skills);
    
    const newRatings = { ...skillRatings };
    skills.forEach(s => {
      if (newRatings[s] === undefined) {
        newRatings[s] = 3;
      }
    });
    setSkillRatings(newRatings);
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    
    const trackSkillsList = TRACK_SKILLS[selectedTrack] || [];
    if (trackSkillsList.some(s => s.toLowerCase() === trimmed.toLowerCase()) || customSkills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Skill is already in the list.');
      return;
    }
    
    setCustomSkills([...customSkills, trimmed]);
    setSelectedSkills([...selectedSkills, trimmed]);
    
    setSkillRatings({
      ...skillRatings,
      [trimmed]: 3
    });
    
    setCustomSkillInput('');
    toast.success(`"${trimmed}" added successfully!`);
  };

  const handleOnboardSubmit = async (e) => {
    if (e) e.preventDefault();
    setOnboardSubmit(true);
    const loadToast = toast.loading('Analyzing profile & compiling personalized learning journey...');
    try {
      const filteredSkillRatings = {};
      selectedSkills.forEach(s => {
        filteredSkillRatings[s] = skillRatings[s] !== undefined ? skillRatings[s] : 3;
      });

      const res = await fetch(buildApiUrl('/ai/onboard'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ 
          language: languageInput, 
          dailyAvailability: dailyHours, 
          skillLevel: filteredSkillRatings,
          techTrack: selectedTrack
        })
      });
      if (res.ok) {
        toast.dismiss(loadToast);
        toast.success('Your AI Mentorship & Career Journey has been successfully initialized!');
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
        toast.error(err.message || 'Learning roadmap generation failed.');
      }
    } catch (err) {
      toast.dismiss(loadToast);
      toast.error('Network failure during initialization.');
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

  const handleCompleteTopicStep = async () => {
    try {
      await fetch(buildApiUrl('/ai/toggle-task'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ dayNumber: selectedDay, taskKey: 'reading', status: 'Completed' })
      });
      const res = await fetch(buildApiUrl('/ai/toggle-task'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ dayNumber: selectedDay, taskKey: 'tech', status: 'Completed' })
      });
      if (res.ok) {
        toast.success('Topic study notes completed!');
        const data = await res.json();
        setDayProgress(data.progress);
        fetchReadiness();
      }
    } catch (err) {
      toast.error('Failed to complete topic step.');
    }
  };

  const handleCompleteTaskStep = async () => {
    try {
      await fetch(buildApiUrl('/ai/toggle-task'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ dayNumber: selectedDay, taskKey: 'coding', status: 'Completed' })
      });
      const res = await fetch(buildApiUrl('/ai/toggle-task'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ dayNumber: selectedDay, taskKey: 'logical', status: 'Completed' })
      });
      if (res.ok) {
        toast.success('Practice tasks completed!');
        const data = await res.json();
        setDayProgress(data.progress);
        fetchReadiness();
      }
    } catch (err) {
      toast.error('Failed to complete practice task step.');
    }
  };

  const handleCompleteInterviewStep = async () => {
    try {
      const res = await fetch(buildApiUrl('/ai/toggle-task'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ dayNumber: selectedDay, taskKey: 'comm', status: 'Completed' })
      });
      if (res.ok) {
        toast.success('Interview preparation completed!');
        const data = await res.json();
        setDayProgress(data.progress);
        fetchReadiness();
      }
    } catch (err) {
      toast.error('Failed to complete interview preparation.');
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

  if (!isOnboarded) {
    const studentName = studentDetails?.name || localStorage.getItem('userName') || 'Student';
    const techStack = studentDetails?.techStack || 'MERN Stack';

    return (
      <AppShell
        title="AI Mentorship & Placement Readiness System"
        subtitle="Embark on a customized, day-by-day learning journey mapped to your career goals."
      >
        <div className="max-w-4xl mx-auto space-y-8 py-6">
          {/* Welcome Dashboard Card */}
          <SurfaceCard className="p-8 border border-slate-200 bg-gradient-to-br from-slate-900 to-indigo-950 text-white relative overflow-hidden rounded-3xl shadow-xl">
            {/* Ambient gradients */}
            <div className="absolute top-[-20%] right-[-10%] h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] h-[300px] w-[300px] rounded-full bg-indigo-50/10 blur-[80px] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold w-fit">
                  <Sparkles size={12} className="animate-pulse" />
                  Premium AI Mentorship
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight">Welcome back, {studentName}</h2>
                <p className="text-sm text-slate-350">
                  Current Track Stack: <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">{techStack}</span>
                </p>
              </div>

              {/* Progress metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-800 w-full md:w-auto">
                <div className="text-center px-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Progress</p>
                  <p className="text-lg font-black text-emerald-400">0%</p>
                </div>
                <div className="text-center px-2 border-l border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Week / Day</p>
                  <p className="text-lg font-black text-blue-400">Week 1 / Day 1</p>
                </div>
                <div className="text-center px-2 border-l border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Streak</p>
                  <p className="text-lg font-black text-amber-400">🔥 0 Days</p>
                </div>
                <div className="text-center px-2 border-l border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Readiness</p>
                  <p className="text-lg font-black text-indigo-400">0%</p>
                </div>
              </div>
            </div>
          </SurfaceCard>

          {/* Setup / Onboarding Input */}
          <div className="max-w-xl mx-auto">
            <SurfaceCard className="p-8 border border-slate-200 rounded-3xl bg-white shadow-md space-y-6">
              {onboardStep === 1 && (
                <>
                  <div className="text-center space-y-2">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mx-auto animate-pulse">
                      <Sparkles size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 font-sans">Choose Your Target Tech Track</h3>
                    <p className="text-xs text-slate-500">
                      Select your target track to filter related core skills and projects.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {TRACKS.map(track => {
                        const isSelected = selectedTrack === track;
                        return (
                          <button
                            type="button"
                            key={track}
                            onClick={() => handleTrackChange(track)}
                            className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between h-20 ${
                              isSelected 
                                ? 'bg-indigo-50/50 border-indigo-500 text-indigo-950 font-bold shadow-xs scale-[1.02]' 
                                : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">Track</span>
                            <span className="text-xs font-black">{track}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                      <label className="crm-label text-slate-900 font-sans font-bold block mb-3 text-sm">
                        Select Familiar Skills
                      </label>
                      <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-sans">
                        Toggle skills you have some prior knowledge or basic understanding in. Unselected skills will not need rating.
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {[...(TRACK_SKILLS[selectedTrack] || []), ...customSkills].map(skill => {
                          const isSelected = selectedSkills.includes(skill);
                          return (
                            <button
                              type="button"
                              key={skill}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedSkills(selectedSkills.filter(s => s !== skill));
                                } else {
                                  setSelectedSkills([...selectedSkills, skill]);
                                }
                              }}
                              className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all ${
                                isSelected 
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-xs scale-102' 
                                  : 'bg-slate-100 border-transparent text-slate-650 hover:bg-slate-200'
                              }`}
                            >
                              {skill} {isSelected ? '✓' : ''}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Skill Input */}
                      <div className="flex gap-2 mt-4 items-center">
                        <input
                          type="text"
                          value={customSkillInput}
                          onChange={e => setCustomSkillInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomSkill();
                            }
                          }}
                          className="crm-input flex-1 h-10 py-1.5 px-3.5 text-xs rounded-xl border border-slate-200 focus:bg-white"
                          placeholder="Add custom skill (e.g. Docker, TypeScript)"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomSkill}
                          className="px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition shadow-sm h-10 flex items-center justify-center"
                        >
                          + Add Skill
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedSkills.length === 0) {
                          toast.error('Please select at least one familiar skill to continue.');
                        } else {
                          setOnboardStep(2);
                        }
                      }}
                      className="crm-btn-primary w-full py-3.5 font-bold flex items-center justify-center gap-2 text-sm shadow-md bg-gradient-to-r from-blue-650 to-indigo-650 rounded-xl"
                    >
                      Continue to Skill Ratings <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}

              {onboardStep === 2 && (
                <>
                  <div className="text-center space-y-2">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mx-auto">
                      <Award size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 font-sans">Rate Your Technical Skills</h3>
                    <p className="text-xs text-slate-500">
                      Rate your level in key core competencies of <span className="font-bold text-indigo-600">{selectedTrack}</span> (1 = Beginner, 5 = Expert).
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div className="max-h-72 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                      {selectedSkills.map(skill => {
                        const currentVal = skillRatings[skill] || 3;
                        return (
                          <div key={skill} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-100 p-3 bg-slate-50/55 rounded-2xl">
                            <span className="text-xs font-bold text-slate-700">{skill}</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(starVal => (
                                <button
                                  type="button"
                                  key={starVal}
                                  onClick={() => setSkillRatings({ ...skillRatings, [skill]: starVal })}
                                  className={`h-7 w-7 text-[10px] font-black rounded-lg border transition ${
                                    currentVal >= starVal 
                                      ? 'bg-amber-500 border-amber-500 text-white shadow-xs' 
                                      : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                                  }`}
                                >
                                  {starVal}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between gap-3 border-t border-slate-100 pt-6">
                      <button
                        type="button"
                        onClick={() => setOnboardStep(1)}
                        className="px-6 py-3.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition text-xs font-bold"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setOnboardStep(3)}
                        className="crm-btn-primary flex-1 py-3.5 font-bold flex items-center justify-center gap-2 text-sm shadow-md bg-gradient-to-r from-blue-650 to-indigo-650 rounded-xl"
                      >
                        Continue to Settings <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {onboardStep === 3 && (
                <>
                  <div className="text-center space-y-2">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mx-auto">
                      <Globe size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 font-sans">Preferred Learning Language</h3>
                    <p className="text-xs text-slate-500">
                      Your AI Mentor will explain topics, write notes, and formulate exercises in this language.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <input
                        type="text"
                        value={languageInput}
                        onChange={e => setLanguageInput(e.target.value)}
                        className="crm-input text-center font-bold text-sm tracking-wide bg-slate-50 border border-slate-200 py-3.5 focus:bg-white transition-all rounded-xl w-full"
                        placeholder="e.g. Tamil + English, Hindi, Telugu"
                      />
                      <div className="flex flex-wrap justify-center gap-1.5 mt-2.5">
                        {['English', 'Tamil', 'Tamil + English', 'Hindi', 'Telugu'].map(lang => (
                          <button
                            type="button"
                            key={lang}
                            onClick={() => setLanguageInput(lang)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                              languageInput === lang 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                      <label className="crm-label text-center block mb-3 font-sans text-sm font-bold text-slate-900">
                        Daily Available Study Hours (1 to 10 Hours)
                      </label>
                      <div className="flex flex-wrap justify-between gap-1.5 max-w-md mx-auto">
                        {Array.from({ length: 10 }).map((_, idx) => {
                          const val = idx + 1;
                          const isSelected = dailyHours === val;
                          return (
                            <button
                              type="button"
                              key={val}
                              onClick={() => setDailyHours(val)}
                              className={`h-9 w-9 text-xs font-black rounded-full border transition flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-110' 
                                  : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-center text-slate-400 mt-2 font-semibold">
                        Target commitment: <span className="text-blue-600 font-extrabold">{dailyHours} hours per day</span>
                      </p>
                    </div>

                    <div className="flex justify-between gap-3 border-t border-slate-100 pt-6">
                      <button
                        type="button"
                        onClick={() => setOnboardStep(2)}
                        className="px-6 py-3.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition text-xs font-bold"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleOnboardSubmit}
                        disabled={onboardSubmit}
                        className="crm-btn-primary flex-1 py-3.5 font-bold flex items-center justify-center gap-2 text-sm shadow-md bg-gradient-to-r from-blue-650 to-indigo-650 rounded-xl"
                      >
                        {onboardSubmit ? (
                          'Initializing AI Journey...'
                        ) : (
                          <>
                            Start AI Journey <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </SurfaceCard>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell 
      title="AI Learning Journey & Mentorship" 
      subtitle={`Track Stack: ${studentDetails?.techStack || 'MERN Stack'} | Student: ${studentDetails?.name || 'User'}`}
      headerActions={(
        <button 
          onClick={() => {
            setLanguageInput(profile?.language || 'English');
            setIsOnboarded(false);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition shadow-2xs font-medium"
        >
          <Edit2 size={12} className="text-slate-500" />
          Language Settings
        </button>
      )}
    >
      {/* TIMELINE DAY SELECTOR WIDGET */}
      <div className="flex gap-2.5 overflow-x-auto pb-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200 scrollbar-none"> {Array.from({ length: 30 }).map((_, idx) => {
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
          { label: 'Readiness Metrics', active: activeTab === 'readiness', onClick: () => setActiveTab('readiness') }
        ]}
      />

      <div className="mt-6">
        {activeTab === 'study' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {dailyPlanError ? (
                <SurfaceCard className="p-8 text-center border-rose-350 bg-rose-50/20">
                  <div className="mb-4 text-3xl">⚠️</div>
                  <p className="text-lg font-bold text-rose-800">Plan Generation Error</p>
                  <p className="mt-2 text-xs text-slate-655">{dailyPlanError}</p>
                  <button onClick={() => fetchDailyPlanForDay(selectedDay)} className="crm-btn-primary mt-4 px-6 py-2 text-xs font-bold">Retry Generation</button>
                </SurfaceCard>
              ) : !dailyPlan ? (
                <SurfaceCard className="p-8 text-center border-slate-200 bg-white rounded-3xl shadow-sm space-y-6">
                  {generatingPlan ? (
                    <div className="py-6 space-y-4">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
                      <h3 className="text-lg font-bold text-slate-900">AI Mentor is Preparing Today's Content...</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        This takes about 10-15 seconds. We are building personalized technical notes, coding challenges, aptitude puzzles, and placement preparation questions for you.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-center space-y-2">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-full w-fit mx-auto animate-pulse">
                          <Sparkles size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Today's Topic: {roadmap?.stages[0]?.weeks[0]?.topics[0] || 'Getting Started'}</h3>
                        <p className="text-xs text-slate-500">
                          Your AI Mentor is ready. Click below to compile today's technical study notes, practice challenges, assignments, and interview questions.
                        </p>
                      </div>
                      <button
                        onClick={() => fetchDailyPlanForDay(selectedDay)}
                        className="crm-btn-primary px-8 py-3 bg-gradient-to-r from-blue-650 to-indigo-650 font-bold rounded-xl flex items-center justify-center gap-2 mx-auto shadow-md"
                      >
                        <Play size={14} fill="currentColor" /> Generate Today's Topic
                      </button>
                    </>
                  )}
                </SurfaceCard>
              ) : dailyPlan.isAssessmentDay ? (
                <SurfaceCard className="p-8 text-center border-blue-200 bg-blue-50/10 rounded-3xl shadow-sm">
                  <div className="mb-4 text-3xl">🏁</div>
                  <p className="text-lg font-bold text-slate-800">Weekly Learning Review</p>
                  <p className="mt-2 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Congratulations on completing 5 full technical and aptitude study days. Please complete the assessment test to unlock next week's track.
                  </p>
                  
                  <div className="mt-6 max-w-sm mx-auto p-4 border border-blue-105 rounded-2xl bg-white shadow-xs">
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
              ) : (() => {
                const isPreviousDay = selectedDay < currentDay;
                const step1Done = isPreviousDay || (dayProgress?.tasks?.reading === 'Completed' && dayProgress?.tasks?.tech === 'Completed');
                const step2Done = isPreviousDay || (dayProgress?.tasks?.coding === 'Completed' && dayProgress?.tasks?.logical === 'Completed');
                const step3Done = isPreviousDay || ['Submitted', 'Completed', 'Reviewed'].includes(dayProgress?.tasks?.assignment);
                const step4Done = isPreviousDay || (dayProgress?.tasks?.comm === 'Completed');
                
                let currentStep = 1;
                if (isPreviousDay) {
                  currentStep = 5;
                } else if (!step1Done) {
                  currentStep = 1;
                } else if (!step2Done) {
                  currentStep = 2;
                } else if (!step3Done) {
                  currentStep = 3;
                } else if (!step4Done) {
                  currentStep = 4;
                } else {
                  currentStep = 5;
                }

                const questionsList = dailyPlan.interviewQuestions || [];
                const hrQuestions = questionsList.slice(0, 5);
                const techQuestions = questionsList.slice(5);

                return (
                  <div className="space-y-4">
                    {/* STEP 1: TOPIC STUDY NOTES */}
                    <div className={`border rounded-2xl overflow-hidden transition-all bg-white shadow-xs ${step1Done ? 'border-slate-200' : currentStep === 1 ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-100 opacity-60'}`}>
                      <button 
                        type="button"
                        onClick={() => setExpandStep1(!expandStep1)}
                        className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${step1Done ? 'bg-emerald-100 text-emerald-800' : currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {step1Done ? '✓' : '1'}
                          </span>
                          <span className="text-sm">Phase 1: Explanation & Core Notes</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-450">{step1Done ? 'Completed' : 'Pending'}</span>
                      </button>

                      {expandStep1 && (
                        <div className="p-5 border-t border-slate-100 bg-slate-50/20 space-y-5 text-xs text-slate-650">
                          <div className="border border-slate-200/60 rounded-xl bg-white p-4">
                            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                              <BookOpen size={14} className="text-blue-500" /> Reading Foundation: {dailyPlan.readingTopic?.title}
                            </h4>
                            <p className="leading-relaxed text-slate-500">{dailyPlan.readingTopic?.description}</p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h4 className="font-bold text-slate-800 mb-1">{dailyPlan.techTopic?.title}</h4>
                              <p className="leading-relaxed">{dailyPlan.techTopic?.explanation}</p>
                            </div>

                            {dailyPlan.techTopic?.syntax && (
                              <div>
                                <p className="font-extrabold text-slate-400 uppercase tracking-wider text-[9px] mb-1.5">Code Syntax Structure</p>
                                <pre className="bg-slate-950 text-slate-100 rounded-xl p-3.5 font-mono overflow-x-auto">{dailyPlan.techTopic.syntax}</pre>
                              </div>
                            )}

                            {dailyPlan.techTopic?.examples && dailyPlan.techTopic.examples.map((ex, i) => (
                              <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-3">
                                <pre className="bg-slate-900 text-slate-100 p-2 rounded-lg font-mono overflow-x-auto">{ex.code}</pre>
                                <div className="mt-2 text-slate-500 font-mono">Output: {ex.output}</div>
                                <div className="mt-1 text-slate-650 italic">Details: {ex.explanation}</div>
                              </div>
                            ))}

                            {dailyPlan.techTopic?.revisionNotes && (
                              <div className="bg-blue-50/40 border border-blue-100/50 rounded-xl p-4">
                                <h5 className="font-bold text-blue-900 mb-1">Revision Summary</h5>
                                <p className="text-[11px] text-blue-700 leading-relaxed">{dailyPlan.techTopic.revisionNotes}</p>
                              </div>
                            )}

                            {dailyPlan.techTopic?.commonMistakes && dailyPlan.techTopic.commonMistakes.length > 0 && (
                              <div className="bg-rose-50/40 border border-rose-100/50 rounded-xl p-4">
                                <h5 className="font-bold text-rose-900 mb-2">Common Mistakes & Pitfalls</h5>
                                <div className="space-y-2">
                                  {dailyPlan.techTopic.commonMistakes.map((m, i) => (
                                    <div key={i} className="text-[11px]">
                                      <p className="font-bold text-rose-700">❌ Error: {m.mistake}</p>
                                      <p className="text-slate-600 font-medium ml-4">✔️ Correct: {m.fix}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {currentStep === 1 && !isPreviousDay && (
                            <button 
                              type="button"
                              onClick={handleCompleteTopicStep}
                              className="crm-btn-primary w-full py-3 font-bold bg-blue-600 text-white rounded-xl shadow-xs"
                            >
                              Mark Topic Completed & Proceed
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* STEP 2: DAILY PRACTICE TASKS */}
                    {(currentStep >= 2 || isPreviousDay) && (
                      <div className={`border rounded-2xl overflow-hidden transition-all bg-white shadow-xs ${step2Done ? 'border-slate-200' : currentStep === 2 ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-100 opacity-60'}`}>
                        <button 
                          type="button"
                          onClick={() => setExpandStep2(!expandStep2)}
                          className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${step2Done ? 'bg-emerald-100 text-emerald-800' : currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {step2Done ? '✓' : '2'}
                            </span>
                            <span className="text-sm">Phase 2: Practice Task & Analytical Puzzles</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-slate-450">{step2Done ? 'Completed' : 'Pending'}</span>
                        </button>

                        {expandStep2 && (
                          <div className="p-5 border-t border-slate-100 bg-slate-50/20 space-y-4 text-xs text-slate-650">
                            <div className="border border-slate-200/60 rounded-xl bg-white p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                                  <Code size={14} className="text-blue-500" /> Coding Task: {dailyPlan.codingTask?.title}
                                </h5>
                                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-800">{dailyPlan.codingTask?.difficulty}</span>
                              </div>
                              <p className="leading-relaxed text-slate-500">{dailyPlan.codingTask?.description}</p>
                            </div>

                            <div className="border border-slate-200/60 rounded-xl bg-white p-4 space-y-2">
                              <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                                <Award size={14} className="text-blue-500" /> Logical Puzzle: {dailyPlan.logicalTask?.title}
                              </h5>
                              <p className="leading-relaxed text-slate-500">{dailyPlan.logicalTask?.description}</p>
                              {dailyPlan.logicalTask?.inputOutput && (
                                <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[10px] overflow-x-auto mt-2">{dailyPlan.logicalTask.inputOutput}</pre>
                              )}
                            </div>

                            {currentStep === 2 && !isPreviousDay && (
                              <button 
                                type="button"
                                onClick={handleCompleteTaskStep}
                                className="crm-btn-primary w-full py-3 font-bold bg-blue-600 text-white rounded-xl shadow-xs"
                              >
                                Submit Practice Tasks & Proceed
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* STEP 3: DAILY ASSIGNMENT */}
                    {(currentStep >= 3 || isPreviousDay) && (
                      <div className={`border rounded-2xl overflow-hidden transition-all bg-white shadow-xs ${step3Done ? 'border-slate-200' : currentStep === 3 ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-100 opacity-60'}`}>
                        <button 
                          type="button"
                          onClick={() => setExpandStep3(!expandStep3)}
                          className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${step3Done ? 'bg-emerald-100 text-emerald-800' : currentStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {step3Done ? '✓' : '3'}
                            </span>
                            <span className="text-sm">Phase 3: Daily Assignment Project</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-slate-450">
                            {dayProgress ? dayProgress.tasks.assignment : 'Pending'}
                          </span>
                        </button>

                        {expandStep3 && (
                          <div className="p-5 border-t border-slate-100 bg-slate-50/20 space-y-4 text-xs text-slate-650">
                            <div className="border border-slate-200/60 rounded-xl bg-white p-4 space-y-3">
                              <h5 className="font-bold text-slate-800">{dailyPlan.assignment?.title}</h5>
                              <p className="leading-relaxed text-slate-500">{dailyPlan.assignment?.description}</p>
                              
                              {dailyPlan.assignment?.objectives && dailyPlan.assignment.objectives.length > 0 && (
                                <div className="space-y-1 pt-1">
                                  <p className="font-bold text-slate-700 text-[11px]">Core Deliverables:</p>
                                  <ul className="list-disc pl-4 space-y-0.5 text-slate-500 text-[11px]">
                                    {dailyPlan.assignment.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                                  </ul>
                                </div>
                              )}

                              {dailyPlan.assignment?.expectedOutput && (
                                <div className="pt-1">
                                  <p className="font-bold text-slate-700 text-[11px]">Expected Output:</p>
                                  <p className="text-slate-500 italic text-[11px]">{dailyPlan.assignment.expectedOutput}</p>
                                </div>
                              )}
                            </div>

                            {currentStep === 3 && !isPreviousDay && (
                              <form onSubmit={handleAssignmentSubmit} className="space-y-2">
                                <label className="crm-label font-bold text-slate-700">Paste Submission URL (GitHub or Live URL)</label>
                                <div className="flex gap-2">
                                  <input 
                                    type="url"
                                    required
                                    value={submissionLink}
                                    onChange={e => setSubmissionLink(e.target.value)}
                                    className="crm-input h-10 py-1"
                                    placeholder="https://github.com/..."
                                  />
                                  <button
                                    type="submit"
                                    disabled={submittingAssignment}
                                    className="crm-btn-primary px-6 h-10 font-bold flex-none"
                                  >
                                    {submittingAssignment ? 'Uploading...' : 'Submit Link'}
                                  </button>
                                </div>
                              </form>
                            )}

                            {dayProgress && dayProgress.mentorFeedback && (
                              <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-1">
                                <p className="font-bold text-indigo-950">Grader Evaluation Notes:</p>
                                <p className="italic text-slate-650 leading-relaxed">{dayProgress.mentorFeedback}</p>
                                <p className="font-extrabold text-indigo-700 mt-1">Grade Assigned: {dayProgress.grade || 'A'}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* STEP 4: DAILY INTERVIEW PREPARATION */}
                    {(currentStep >= 4 || isPreviousDay) && (
                      <div className={`border rounded-2xl overflow-hidden transition-all bg-white shadow-xs ${step4Done ? 'border-slate-200' : currentStep === 4 ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-100 opacity-60'}`}>
                        <button 
                          type="button"
                          onClick={() => setExpandStep4(!expandStep4)}
                          className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${step4Done ? 'bg-emerald-100 text-emerald-800' : currentStep === 4 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {step4Done ? '✓' : '4'}
                            </span>
                            <span className="text-sm">Phase 4: Placement Preparation Questions (5 HR, 10 Tech)</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-slate-450">{step4Done ? 'Completed' : 'Pending'}</span>
                        </button>

                        {expandStep4 && (
                          <div className="p-5 border-t border-slate-100 bg-slate-50/20 space-y-4 text-xs text-slate-650">
                            <div className="space-y-3">
                              <h5 className="font-bold text-slate-900 uppercase tracking-widest text-[10px] text-indigo-650">Section A: HR/Behavioral Questions (5)</h5>
                              {hrQuestions.map((q, idx) => {
                                const globalIdx = idx;
                                const isRevealed = !!revealedQuestions[globalIdx];
                                return (
                                  <div key={idx} className="border border-slate-200 rounded-xl bg-white p-3 space-y-2">
                                    <p className="font-bold text-slate-800">Q: {q.question}</p>
                                    {isRevealed ? (
                                      <p className="text-indigo-700 bg-indigo-50/30 p-2.5 rounded-lg italic">Hint/Guidelines: {q.hint}</p>
                                    ) : (
                                      <button 
                                        type="button"
                                        onClick={() => toggleRevealQuestion(globalIdx)}
                                        className="text-[10px] font-extrabold text-blue-600 hover:underline"
                                      >
                                        Reveal Answer Hint
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="space-y-3">
                              <h5 className="font-bold text-slate-900 uppercase tracking-widest text-[10px] text-indigo-650">Section B: Core Technical Questions (10)</h5>
                              {techQuestions.map((q, idx) => {
                                const globalIdx = idx + 5;
                                const isRevealed = !!revealedQuestions[globalIdx];
                                return (
                                  <div key={idx} className="border border-slate-200 rounded-xl bg-white p-3 space-y-2">
                                    <p className="font-bold text-slate-800">Q: {q.question}</p>
                                    {isRevealed ? (
                                      <p className="text-indigo-700 bg-indigo-50/30 p-2.5 rounded-lg italic">Hint/Guidelines: {q.hint}</p>
                                    ) : (
                                      <button 
                                        type="button"
                                        onClick={() => toggleRevealQuestion(globalIdx)}
                                        className="text-[10px] font-extrabold text-blue-600 hover:underline"
                                      >
                                        Reveal Answer Hint
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {currentStep === 4 && !isPreviousDay && (
                              <button 
                                type="button"
                                onClick={handleCompleteInterviewStep}
                                className="crm-btn-primary w-full py-3 font-bold bg-blue-600 text-white rounded-xl shadow-xs"
                              >
                                Mark Interview Preparation Completed
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUCCESS CELEBRATION CARD */}
                    {currentStep === 5 && selectedDay === currentDay && (
                      <SurfaceCard className="p-8 text-center border-emerald-300 bg-emerald-50/15 rounded-3xl shadow-sm space-y-4">
                        <div className="text-4xl">🎉</div>
                        <h4 className="text-lg font-black text-emerald-800">Day Completed Successfully!</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                          You have successfully completed today's explanation, practice tasks, assignment project, and mock interview questions. 
                        </p>
                        <button
                          type="button"
                          onClick={handleUnlockNextDay}
                          className="crm-btn-primary px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-650 font-black shadow-md rounded-xl flex items-center justify-center gap-2 mx-auto animate-bounce"
                        >
                          <ShieldCheck size={16} /> Continue To Next Day
                        </button>
                      </SurfaceCard>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* AI JOURNEY DASHBOARD (Right Column) */}
            <div className="space-y-6">
              <SurfaceCard className="p-6 border border-slate-200 bg-slate-900 text-white rounded-3xl relative overflow-hidden shadow-lg">
                <div className="absolute top-[-10%] right-[-10%] h-36 w-36 rounded-full bg-blue-600/20 blur-2xl pointer-events-none" />
                <h3 className="text-sm font-bold tracking-widest text-slate-400 uppercase border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-400" />
                  AI Journey Dashboard
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Current Week</span>
                    <span className="font-bold text-white bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">Week {currentWeek}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Current Day</span>
                    <span className="font-bold text-white bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">Day {currentDay}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Learning Streak</span>
                    <span className="font-bold text-white bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">🔥 {roadmap?.dailyStreak || 0} Days</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Placement Readiness</span>
                    <span className="font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25">
                      {readiness?.overallScore !== undefined ? `${readiness.overallScore}%` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-800 mt-5 pt-5 space-y-3.5">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Roadmap Progress</span>
                      <span className="font-bold text-white">{roadmap?.overallProgress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-50 h-full rounded-full transition-all duration-500" style={{ width: `${roadmap?.overallProgress || 0}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-[10px]">
                    <div className="bg-slate-850/50 p-2.5 rounded-xl border border-slate-800">
                      <p className="text-slate-450 uppercase font-bold tracking-wider">Topics</p>
                      <p className="text-lg font-black text-white mt-0.5">
                        {dayProgress && (dayProgress.tasks.reading === 'Completed' ? 1 : 0) + (dayProgress.tasks.tech === 'Completed' ? 1 : 0)} Completed
                      </p>
                    </div>
                    <div className="bg-slate-850/50 p-2.5 rounded-xl border border-slate-800">
                      <p className="text-slate-450 uppercase font-bold tracking-wider">Tasks</p>
                      <p className="text-lg font-black text-white mt-0.5">
                        {dayProgress && (dayProgress.tasks.coding === 'Completed' ? 1 : 0) + (dayProgress.tasks.logical === 'Completed' ? 1 : 0)} Completed
                      </p>
                    </div>
                    <div className="bg-slate-850/50 p-2.5 rounded-xl border border-slate-800">
                      <p className="text-slate-450 uppercase font-bold tracking-wider">Assignments</p>
                      <p className="text-lg font-black text-white mt-0.5">
                        {dayProgress && ['Submitted', 'Completed', 'Reviewed'].includes(dayProgress.tasks.assignment) ? '1' : '0'} Completed
                      </p>
                    </div>
                    <div className="bg-slate-850/50 p-2.5 rounded-xl border border-slate-800">
                      <p className="text-slate-450 uppercase font-bold tracking-wider">Interview Prep</p>
                      <p className="text-lg font-black text-white mt-0.5">
                        {dayProgress && dayProgress.tasks.comm === 'Completed' ? 'Completed' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            </div>
          </div>
        )}

        {/* ROADMAP TIMELINE VIEW */}
        {activeTab === 'roadmap' && (
          <SurfaceCard className="p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6">Structured Career Roadmap</h3>
            
            <div className="space-y-6 relative before:absolute before:left-8 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {[
                { week: 1, title: 'HTML', desc: 'Structure & Web Semantics', icon: '🌐', topics: ['HTML Document Structure', 'Semantic tags & Metadata', 'Forms & validations', 'DOM element relationships'] },
                { week: 2, title: 'CSS', desc: 'Layouts & Design Systems', icon: '🎨', topics: ['CSS Selectors & Box model', 'Flexbox & CSS Grid layouts', 'Responsive design & Media queries', 'CSS Variables & Animation basics'] },
                { week: 3, title: 'JavaScript', desc: 'Logic & Programming Foundation', icon: '⚡', topics: ['Data types, scopes & closures', 'ES6+ Features & arrow functions', 'Asynchronous JS (Promises & async/await)', 'Callbacks & Event loops'] },
                { week: 4, title: 'DOM', desc: 'Interactive Browser UIs', icon: '🖱️', topics: ['DOM manipulation & Event listeners', 'Event bubbling & capturing', 'Browser Web APIs', 'Local storage & fetch operations'] },
                { week: 5, title: 'React', desc: 'Modern Web Apps', icon: '⚛️', topics: ['Components, JSX & props', 'State management & Hooks', 'React Router & page navigation', 'REST API integrations'] },
                { week: 6, title: 'Projects', desc: 'Real-world Work Portfolio', icon: '🚀', topics: ['Frontend portfolio setup', 'Integrating backend data services', 'Interactive UI project release', 'Testing and debugging apps'] },
                { week: 7, title: 'Interview Preparation', desc: 'Coding & HR Interviews', icon: '🎓', topics: ['DSA interview question patterns', 'React architecture conceptual prep', 'System design basics', 'HR behavioral case prep'] },
                { week: 8, title: 'Placement Readiness', desc: 'Job Applications & Mocks', icon: '💼', topics: ['Technical Mock Interviews', 'Resume optimization & Github review', 'Mock Board evaluations', 'Direct recruiter matchings'] }
              ].map(stage => {
                const isActive = currentWeek === stage.week;
                const isPassed = currentWeek > stage.week;
                return (
                  <div key={stage.week} className="relative pl-16">
                    <div className={`absolute left-4 top-1 flex h-9 w-9 items-center justify-center rounded-full border-2 transition shadow-sm text-base z-10 ${
                      isActive ? 'bg-blue-600 border-blue-600 text-white animate-pulse' :
                      isPassed ? 'bg-emerald-100 border-emerald-500 text-emerald-800' :
                      'bg-slate-50 border-slate-350 text-slate-400'
                    }`}>
                      {isPassed ? '✓' : stage.icon}
                    </div>

                    <div className={`p-5 rounded-2xl border transition ${
                      isActive ? 'bg-blue-50/30 border-blue-400 shadow-sm' :
                      isPassed ? 'bg-slate-50/50 border-slate-200 opacity-80' :
                      'bg-white border-slate-200'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Week {stage.week}</span>
                        {isPassed ? (
                          <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">Completed</span>
                        ) : isActive ? (
                          <span className="text-[9px] font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded-full">Current Week</span>
                        ) : (
                          <span className="text-[9px] font-bold bg-slate-100 text-slate-450 px-2.5 py-0.5 rounded-full">Locked</span>
                        )}
                      </div>
                      
                      <h4 className="font-extrabold text-slate-900 text-sm">{stage.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{stage.desc}</p>
                      
                      <ul className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-4 text-[11px] text-slate-650">
                        {stage.topics.map((t, i) => (
                          <li key={i} className="flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                            <span className="text-slate-450">•</span>
                            <span className="truncate">{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
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
