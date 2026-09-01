import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, MetricCard } from '../components/AppShell';
import { authHeaders, logout, getUserId } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { 
  Clock, 
  Calendar, 
  Plus, 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  Award, 
  Sparkles, 
  Flame, 
  Code2, 
  MessageSquare, 
  Calculator, 
  SlidersHorizontal, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  Moon, 
  Briefcase, 
  Coffee, 
  Target, 
  Check,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const STANDARD_SKILLS = [
  'HTML',
  'CSS',
  'JavaScript',
  'React',
  'SQL',
  'Java',
  'Python',
  'Node.js',
  'DSA',
  'Aptitude',
  'Communication'
];

export default function StudentTimetable() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [timetable, setTimetable] = useState(null);
  const [todayChecklist, setTodayChecklist] = useState({
    completedSlotIds: [],
    totalCount: 0,
    completedCount: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('checklist'); // 'checklist' | 'customize'

  // Filter for checklist
  const [slotFilter, setSlotFilter] = useState('All'); // 'All' | 'Pending' | 'Completed'

  // Form State for Customizer
  const [commitments, setCommitments] = useState({
    sleepHours: 7,
    sleepStartTime: '23:00',
    sleepEndTime: '06:00',
    workOrJobHours: 0,
    workDetails: '',
    personalRoutineHours: 2,
    technicalClassHours: 2,
    communicationClassHours: 1,
    aptitudeClassHours: 1,
    selectedSubjects: ['JavaScript', 'React', 'SQL', 'Aptitude', 'Communication'],
    customSkillInput: '',
    slots: []
  });

  const [savingTimetable, setSavingTimetable] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);

  // Edit / Add Custom Slot Modal
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState(-1);
  const [slotForm, setSlotForm] = useState({
    title: '',
    category: 'Technical Practice',
    subject: '',
    startTime: '14:00',
    endTime: '16:00',
    targetDescription: ''
  });

  const fetchTimetable = async (targetDate = selectedDate) => {
    try {
      const res = await fetch(buildApiUrl(`/timetables/my?date=${targetDate}`), {
        headers: authHeaders()
      });

      if (res.status === 401) {
        logout();
        return;
      }

      if (res.ok) {
        let data = null;
        try {
          data = await res.json();
        } catch (e) {
          return;
        }

        if (data) {
          setTimetable(data);
          if (data.todayChecklist) {
            setTodayChecklist(data.todayChecklist);
          }
          setCommitments({
            sleepHours: data.sleepHours || 7,
            sleepStartTime: data.sleepStartTime || '23:00',
            sleepEndTime: data.sleepEndTime || '06:00',
            workOrJobHours: data.workOrJobHours || 0,
            workDetails: data.workDetails || '',
            personalRoutineHours: data.personalRoutineHours || 2,
            technicalClassHours: data.technicalClassHours || 2,
            communicationClassHours: data.communicationClassHours || 1,
            aptitudeClassHours: data.aptitudeClassHours || 1,
            selectedSubjects: data.selectedSubjects || ['JavaScript', 'React', 'SQL', 'Aptitude', 'Communication'],
            customSkillInput: '',
            slots: data.slots || []
          });
        }
      }
    } catch (err) {
      toast.error('Failed to load study timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable(selectedDate);
  }, [selectedDate]);

  // Date Navigation Handlers
  const handleShiftDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const newDateStr = d.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
  };

  // Compute remaining study hours
  const calculatedStudyHours = Math.max(
    0,
    24 - (
      Number(commitments.sleepHours || 0) +
      Number(commitments.workOrJobHours || 0) +
      Number(commitments.personalRoutineHours || 0) +
      Number(commitments.technicalClassHours || 0) +
      Number(commitments.communicationClassHours || 0) +
      Number(commitments.aptitudeClassHours || 0)
    )
  );

  // Toggle Slot Check for Selected Date
  const handleToggleSlotCheck = async (slotId) => {
    try {
      const res = await fetch(buildApiUrl('/timetables/my/check-slot'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ slotId, date: selectedDate })
      });

      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error('Failed to parse response');
      }

      if (!res.ok) throw new Error(data?.message || 'Failed to update progress');

      setTodayChecklist(data.todayChecklist);
      if (data.todayChecklist.completedSlotIds.includes(slotId)) {
        toast.success('🎯 Great job! Slot completed!');
      } else {
        toast('Slot unchecked', { icon: '↩️' });
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Helper to generate unique slot IDs
  const generateSlotId = () => 'slot_' + Math.random().toString(36).substr(2, 9);

  // Instant Client-Side Smart Schedule Builder
  const generateSmartSlots = ({
    sleepStartTime = '23:00',
    sleepEndTime = '06:00',
    workOrJobHours = 0,
    technicalClassHours = 2,
    communicationClassHours = 1,
    aptitudeClassHours = 1,
    selectedSubjects = ['JavaScript', 'React', 'SQL', 'Aptitude', 'Communication']
  }) => {
    const slots = [];

    // 1. Sleep Block
    slots.push({
      id: generateSlotId(),
      title: 'Rest & Deep Sleep',
      category: 'Sleep',
      subject: 'Rest',
      startTime: sleepStartTime,
      endTime: sleepEndTime,
      durationMinutes: 420,
      targetDescription: 'Recharge body and mind for high-focus learning',
      daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    });

    // 2. Early Morning: Aptitude & Logical Reasoning (Fresh Mind)
    slots.push({
      id: generateSlotId(),
      title: 'Aptitude & Quantitative Problem Solving',
      category: 'Aptitude Practice',
      subject: 'Aptitude',
      startTime: '06:30',
      endTime: '07:45',
      durationMinutes: 75,
      targetDescription: 'Solve 15-20 Quant & Logical reasoning questions + Speed Math',
      daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    });

    // 3. Morning: Communication & English Speaking Practice
    slots.push({
      id: generateSlotId(),
      title: 'Communication & Verbal English Practice',
      category: 'Communication Practice',
      subject: 'Communication',
      startTime: '08:00',
      endTime: '09:00',
      durationMinutes: 60,
      targetDescription: 'Self-intro practice, JAM / Extempore topic recording, vocabulary drill',
      daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    });

    // 4. Morning Technical Class
    slots.push({
      id: generateSlotId(),
      title: 'Technical Masterclass & Core Lecture',
      category: 'Technical Class',
      subject: selectedSubjects[0] || 'Technical Training',
      startTime: '09:30',
      endTime: '11:30',
      durationMinutes: 120,
      targetDescription: 'Attend live lecture, take notes, understand architecture & concepts',
      daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    });

    // 5. Midday: Concept Review & Theory Revision
    const theorySub = selectedSubjects[1] || selectedSubjects[0] || 'Web Technologies';
    slots.push({
      id: generateSlotId(),
      title: `${theorySub} Theory & Documentation Revision`,
      category: 'Theory & Concepts',
      subject: theorySub,
      startTime: '11:45',
      endTime: '12:45',
      durationMinutes: 60,
      targetDescription: `Review official documentation, syntax notes, and interview flashcards for ${theorySub}`,
      daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    });

    // 6. Lunch & Routine Break
    slots.push({
      id: generateSlotId(),
      title: 'Lunch & Recharge Break',
      category: 'Break / Meals',
      subject: 'Nutrition',
      startTime: '13:00',
      endTime: '14:00',
      durationMinutes: 60,
      targetDescription: 'Healthy meal, light walk, and mental relaxation',
      daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    });

    // 7. Afternoon: Technical Hands-on Coding Practice
    const codeSub = selectedSubjects[0] || 'React';
    slots.push({
      id: generateSlotId(),
      title: `${codeSub} Hands-on Coding & Project Building`,
      category: 'Technical Practice',
      subject: codeSub,
      startTime: '14:30',
      endTime: '17:00',
      durationMinutes: 150,
      targetDescription: `Build interactive components, write clean modular code, and commit to GitHub`,
      daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    });

    // 8. Late Afternoon / Evening Work / College or Secondary Subject
    if (workOrJobHours > 0) {
      slots.push({
        id: generateSlotId(),
        title: 'Work / Part-time / College Commitment',
        category: 'Work / College',
        subject: 'Work',
        startTime: '17:00',
        endTime: '19:00',
        durationMinutes: workOrJobHours * 60,
        targetDescription: 'Professional or educational commitments',
        daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
      });
    } else {
      const dbSub = selectedSubjects.find(s => ['SQL', 'Java', 'Python', 'Node.js', 'DSA'].includes(s)) || 'SQL';
      slots.push({
        id: generateSlotId(),
        title: `${dbSub} Problem Solving & Practice`,
        category: 'Technical Practice',
        subject: dbSub,
        startTime: '17:30',
        endTime: '19:00',
        durationMinutes: 90,
        targetDescription: `Execute queries, solve algorithm challenges, and practice interview code`,
        daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
      });
    }

    // 9. Night: Daily Review, Mock Assessment & Tomorrow Planning
    slots.push({
      id: generateSlotId(),
      title: 'Daily Review, Mock Challenge & Task Logging',
      category: 'Technical Practice',
      subject: 'Daily Review',
      startTime: '20:30',
      endTime: '22:00',
      durationMinutes: 90,
      targetDescription: 'Log daily company applications, complete day activity notes, prepare for tomorrow',
      daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    });

    return slots;
  };

  // Generate Smart Timetable Slots (Instant Local Generation)
  const handleGenerateSmartTimetable = () => {
    setGeneratingPreview(true);
    try {
      const generatedSlots = generateSmartSlots({
        sleepStartTime: commitments.sleepStartTime,
        sleepEndTime: commitments.sleepEndTime,
        workOrJobHours: Number(commitments.workOrJobHours),
        technicalClassHours: Number(commitments.technicalClassHours),
        communicationClassHours: Number(commitments.communicationClassHours),
        aptitudeClassHours: Number(commitments.aptitudeClassHours),
        selectedSubjects: commitments.selectedSubjects
      });

      setCommitments(prev => ({
        ...prev,
        slots: generatedSlots
      }));

      toast.success('✨ Smart timetable generated! Click "Save & Activate Timetable" below.');
    } catch (err) {
      toast.error('Failed to generate timetable: ' + err.message);
    } finally {
      setGeneratingPreview(false);
    }
  };

  // Save Timetable
  const handleSaveTimetable = async () => {
    if (commitments.slots.length === 0) {
      toast.error('Please generate or add time slots first');
      return;
    }

    setSavingTimetable(true);
    try {
      const res = await fetch(buildApiUrl('/timetables/my'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          sleepHours: Number(commitments.sleepHours),
          sleepStartTime: commitments.sleepStartTime,
          sleepEndTime: commitments.sleepEndTime,
          workOrJobHours: Number(commitments.workOrJobHours),
          workDetails: commitments.workDetails.trim(),
          personalRoutineHours: Number(commitments.personalRoutineHours),
          technicalClassHours: Number(commitments.technicalClassHours),
          communicationClassHours: Number(commitments.communicationClassHours),
          aptitudeClassHours: Number(commitments.aptitudeClassHours),
          selectedSubjects: commitments.selectedSubjects,
          slots: commitments.slots
        })
      });

      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error(`Server returned status ${res.status}. Please check backend connection.`);
      }

      if (!res.ok) throw new Error(data?.message || 'Saving timetable failed');

      setTimetable(data);
      toast.success('🎉 Study timetable saved and activated!');
      setActiveTab('checklist');
      fetchTimetable();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingTimetable(false);
    }
  };

  // Skill Toggle
  const handleToggleSkill = (skill) => {
    setCommitments(prev => {
      const exists = prev.selectedSubjects.includes(skill);
      const updated = exists 
        ? prev.selectedSubjects.filter(s => s !== skill)
        : [...prev.selectedSubjects, skill];
      return { ...prev, selectedSubjects: updated };
    });
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    const skill = commitments.customSkillInput.trim();
    if (!skill) return;
    if (!commitments.selectedSubjects.includes(skill)) {
      setCommitments(prev => ({
        ...prev,
        selectedSubjects: [...prev.selectedSubjects, skill],
        customSkillInput: ''
      }));
    }
  };

  // Slot Management Modal Handlers
  const handleOpenSlotModal = (index = -1) => {
    setEditingSlotIndex(index);
    if (index >= 0) {
      const s = commitments.slots[index];
      setSlotForm({
        title: s.title || '',
        category: s.category || 'Technical Practice',
        subject: s.subject || '',
        startTime: s.startTime || '14:00',
        endTime: s.endTime || '16:00',
        targetDescription: s.targetDescription || ''
      });
    } else {
      setSlotForm({
        title: '',
        category: 'Technical Practice',
        subject: commitments.selectedSubjects[0] || 'React',
        startTime: '14:00',
        endTime: '16:00',
        targetDescription: ''
      });
    }
    setIsSlotModalOpen(true);
  };

  const handleSaveSlotModal = (e) => {
    e.preventDefault();
    if (!slotForm.title.trim()) {
      toast.error('Slot title is required');
      return;
    }

    const updatedSlots = [...commitments.slots];
    if (editingSlotIndex >= 0) {
      updatedSlots[editingSlotIndex] = {
        ...updatedSlots[editingSlotIndex],
        ...slotForm
      };
    } else {
      updatedSlots.push({
        id: 'slot_' + Math.random().toString(36).substr(2, 9),
        ...slotForm,
        daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      });
    }

    // Sort slots chronologically by startTime
    updatedSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    setCommitments(prev => ({ ...prev, slots: updatedSlots }));
    setIsSlotModalOpen(false);
    toast.success(editingSlotIndex >= 0 ? 'Slot updated' : 'New slot added');
  };

  const handleDeleteSlot = (index) => {
    setCommitments(prev => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index)
    }));
    toast('Slot removed', { icon: '🗑️' });
  };

  // Category Badges Styling
  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Technical Practice':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Technical Class':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Aptitude Practice':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Communication Practice':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Theory & Concepts':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Work / College':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Sleep':
        return 'bg-slate-800 text-slate-200 border-slate-700';
      case 'Break / Meals':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const dateSlots = (timetable?.dateSlots && timetable.dateSlots.length > 0)
    ? timetable.dateSlots
    : (timetable?.slots || []);
  const activeSlots = dateSlots.filter(s => s.category !== 'Sleep');
  const filteredChecklistSlots = activeSlots.filter(s => {
    const isCompleted = todayChecklist.completedSlotIds?.includes(s.id);
    if (slotFilter === 'Pending') return !isCompleted;
    if (slotFilter === 'Completed') return isCompleted;
    return true;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="crm-surface flex items-center gap-3 px-6 py-4 rounded-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-bold text-slate-700">Loading personalized timetable...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      title="Personalized Study Timetable & Daily Routine"
      subtitle="Budget your 24-hour daily commitments, customize topic focus, and tick off tasks as you finish them."
      searchPlaceholder="Search study slots..."
    >
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Daily Study Budget"
          value={`${timetable ? timetable.availableSelfStudyHours : calculatedStudyHours} hrs / day`}
          helper="Dedicated practice time out of 24h"
          tone="primary"
          icon={<Clock size={20} />}
        />
        <MetricCard
          title="Day's Completion"
          value={`${todayChecklist.completionRate || 0}%`}
          helper={`${todayChecklist.completedCount || 0} of ${todayChecklist.totalCount || activeSlots.length} tasks completed`}
          tone="success"
          icon={<CheckCircle2 size={20} />}
        />
        <MetricCard
          title="Target Skills"
          value={`${commitments.selectedSubjects.length} Skills`}
          helper="HTML, React, SQL, Aptitude..."
          tone="warning"
          icon={<Target size={20} />}
        />
        <MetricCard
          title="Consistency Streak"
          value={`${timetable?.streak || 0} Days`}
          helper="Consecutive daily routine progress"
          tone="neutral"
          icon={<Flame size={20} />}
        />
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm ${
            activeTab === 'checklist'
              ? 'bg-blue-600 text-white shadow-blue-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <CheckCircle2 size={16} />
          <span>Daily Action Plan & Checklist</span>
        </button>

        <button
          onClick={() => setActiveTab('customize')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm ${
            activeTab === 'customize'
              ? 'bg-blue-600 text-white shadow-blue-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <SlidersHorizontal size={16} />
          <span>24h Routine Calculator & Timetable Builder</span>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* VIEW 1: TODAY'S INTERACTIVE ACTION PLAN & CHECKLIST */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          {/* Interactive Date Selector & Day Versioning Bar */}
          <SurfaceCard className="p-4 border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Calendar size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Checklist Date: <span className="text-blue-600">{new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </h3>
                    {selectedDate === todayStr ? (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        🌟 Today
                      </span>
                    ) : selectedDate < todayStr ? (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        📜 Past Log (Preserved)
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        🔮 Future Day
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {selectedDate < todayStr 
                      ? 'Viewing historical completion records. Past days keep their original schedule.' 
                      : selectedDate === todayStr 
                      ? 'Active today. Edit routine tab to adjust future schedule.' 
                      : 'Upcoming day plan using your active timetable schedule.'}
                  </p>
                </div>
              </div>

              {/* Quick Date Shift Buttons & Native Date Input */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShiftDate(-1)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  ← Prev Day
                </button>

                {selectedDate !== todayStr && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayStr)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition"
                  >
                    Go to Today
                  </button>
                )}

                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                />

                <button
                  type="button"
                  onClick={() => handleShiftDate(1)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Next Day →
                </button>
              </div>
            </div>
          </SurfaceCard>

          {/* Visual 24-Hour Day Budget Bar */}
          <SurfaceCard className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-600" />
                  <span>24-Hour Daily Commitment Allocation</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">How your full 24-hour day is divided between routine and learning</p>
              </div>

              <div className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-xl">
                {timetable?.availableSelfStudyHours || calculatedStudyHours}h Dedicated Study Time
              </div>
            </div>

            {/* Segmented Color Bar */}
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
              <div 
                title={`Sleep: ${commitments.sleepHours}h`}
                style={{ width: `${(commitments.sleepHours / 24) * 100}%` }}
                className="bg-slate-800 transition-all duration-500" 
              />
              {commitments.workOrJobHours > 0 && (
                <div 
                  title={`Work/Job: ${commitments.workOrJobHours}h`}
                  style={{ width: `${(commitments.workOrJobHours / 24) * 100}%` }}
                  className="bg-amber-500 transition-all duration-500" 
                />
              )}
              <div 
                title={`Classes: ${Number(commitments.technicalClassHours) + Number(commitments.communicationClassHours) + Number(commitments.aptitudeClassHours)}h`}
                style={{ width: `${((Number(commitments.technicalClassHours) + Number(commitments.communicationClassHours) + Number(commitments.aptitudeClassHours)) / 24) * 100}%` }}
                className="bg-indigo-600 transition-all duration-500" 
              />
              <div 
                title={`Routine/Meals: ${commitments.personalRoutineHours}h`}
                style={{ width: `${(commitments.personalRoutineHours / 24) * 100}%` }}
                className="bg-emerald-500 transition-all duration-500" 
              />
              <div 
                title={`Dedicated Study: ${calculatedStudyHours}h`}
                style={{ width: `${(calculatedStudyHours / 24) * 100}%` }}
                className="bg-blue-500 transition-all duration-500" 
              />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-3 text-[11px] font-semibold text-slate-600">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-800" /> Sleep ({commitments.sleepHours}h)</span>
              {commitments.workOrJobHours > 0 && <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Work / Job ({commitments.workOrJobHours}h)</span>}
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-indigo-600" /> Classes ({Number(commitments.technicalClassHours) + Number(commitments.communicationClassHours) + Number(commitments.aptitudeClassHours)}h)</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Routine / Meals ({commitments.personalRoutineHours}h)</span>
              <span className="flex items-center gap-1.5 font-bold text-blue-600"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Self-Study & Practice ({calculatedStudyHours}h)</span>
            </div>
          </SurfaceCard>

          {/* Today's Checklist Progress Bar */}
          <SurfaceCard className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-blue-200">Daily Study Milestone</span>
                <h3 className="text-xl font-black mt-0.5">{selectedDate === todayStr ? "Today's Study Checklist" : `Checklist for ${selectedDate}`}</h3>
                <p className="text-xs text-blue-100 mt-1">Check off each session as you finish it to maintain your daily streak!</p>
              </div>

              <div className="text-right shrink-0">
                <div className="text-3xl font-black">{todayChecklist.completionRate || 0}%</div>
                <div className="text-xs font-bold text-blue-200">{todayChecklist.completedCount || 0} of {todayChecklist.totalCount || activeSlots.length} Slots Done</div>
              </div>
            </div>

            <div className="h-2.5 rounded-full bg-white/20 mt-4 overflow-hidden">
              <div 
                className="h-full bg-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${todayChecklist.completionRate || 0}%` }}
              />
            </div>
          </SurfaceCard>

          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setSlotFilter('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  slotFilter === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Slots ({activeSlots.length})
              </button>
              <button
                onClick={() => setSlotFilter('Pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  slotFilter === 'Pending' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pending ({activeSlots.filter(s => !todayChecklist.completedSlotIds?.includes(s.id)).length})
              </button>
              <button
                onClick={() => setSlotFilter('Completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  slotFilter === 'Completed' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Completed ({todayChecklist.completedCount || 0})
              </button>
            </div>

            <button
              onClick={() => setActiveTab('customize')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Edit Routine / Times</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Checklist Slot Cards */}
          {filteredChecklistSlots.length === 0 ? (
            <SurfaceCard className="p-12 text-center text-slate-500">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-base font-bold text-slate-800">No study timetable configured yet</p>
              <p className="text-xs text-slate-400 mt-1">Set your daily hours and generate your smart timetable in the customizer tab.</p>
              <button
                onClick={() => setActiveTab('customize')}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Create My Study Timetable
              </button>
            </SurfaceCard>
          ) : (
            <div className="space-y-3">
              {filteredChecklistSlots.map((slot, index) => {
                const isCompleted = todayChecklist.completedSlotIds?.includes(slot.id);
                return (
                  <SurfaceCard 
                    key={slot.id || index} 
                    className={`p-4 md:p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 ${
                      isCompleted 
                        ? 'border-l-emerald-500 bg-emerald-50/20 opacity-90' 
                        : 'border-l-blue-500 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Interactive Checkbox Button */}
                      <button
                        onClick={() => handleToggleSlotCheck(slot.id)}
                        className={`h-7 w-7 rounded-xl flex items-center justify-center transition shrink-0 mt-0.5 ${
                          isCompleted
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                            : 'border-2 border-slate-300 hover:border-blue-500 text-transparent hover:text-slate-300'
                        }`}
                        title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                      >
                        <Check size={16} strokeWidth={3} />
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-sm font-black ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {slot.title}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadge(slot.category)}`}>
                            {slot.category}
                          </span>
                          {slot.subject && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {slot.subject}
                            </span>
                          )}
                        </div>

                        {slot.targetDescription && (
                          <p className="text-xs text-slate-600 mb-1">{slot.targetDescription}</p>
                        )}

                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <Clock size={13} />
                          <span>{slot.startTime} – {slot.endTime} ({slot.durationMinutes || 60} mins)</span>
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-xl">
                          <CheckCircle2 size={14} />
                          <span>Done for Today</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                          <span>Pending</span>
                        </span>
                      )}
                    </div>
                  </SurfaceCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* VIEW 2: 24-HOUR ROUTINE CALCULATOR & CUSTOMIZER */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'customize' && (
        <div className="space-y-8">
          {/* Section 1: 24-Hour Daily Commitment Calculator */}
          <SurfaceCard className="p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Calculator size={18} className="text-blue-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">Step 1: 24-Hour Daily Commitment Breakdown</h3>
                <p className="text-xs text-slate-400">Specify your non-negotiable commitments to discover your available study time</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Sleep Duration */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Moon size={14} className="text-indigo-600" />
                  <span>Sleep & Rest (Hours)</span>
                </label>
                <input
                  type="number"
                  min="4"
                  max="12"
                  value={commitments.sleepHours}
                  onChange={e => setCommitments({...commitments, sleepHours: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500"
                />
                <div className="flex gap-2 text-[10px] text-slate-500">
                  <span>Bedtime: <strong>{commitments.sleepStartTime}</strong></span>
                  <span>•</span>
                  <span>Wake: <strong>{commitments.sleepEndTime}</strong></span>
                </div>
              </div>

              {/* Work / Part-time Job */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Briefcase size={14} className="text-amber-600" />
                  <span>Job / College Hours</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="14"
                  value={commitments.workOrJobHours}
                  onChange={e => setCommitments({...commitments, workOrJobHours: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Job/College details (optional)"
                  value={commitments.workDetails}
                  onChange={e => setCommitments({...commitments, workDetails: e.target.value})}
                  className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 outline-none"
                />
              </div>

              {/* Class Hours */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-blue-600" />
                  <span>Mandatory Classes (Hours)</span>
                </label>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-600">Technical Class:</span>
                    <input
                      type="number"
                      min="0"
                      max="6"
                      value={commitments.technicalClassHours}
                      onChange={e => setCommitments({...commitments, technicalClassHours: e.target.value})}
                      className="w-14 px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-bold text-right"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-600">Aptitude:</span>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      value={commitments.aptitudeClassHours}
                      onChange={e => setCommitments({...commitments, aptitudeClassHours: e.target.value})}
                      className="w-14 px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-bold text-right"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-600">Communication:</span>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      value={commitments.communicationClassHours}
                      onChange={e => setCommitments({...commitments, communicationClassHours: e.target.value})}
                      className="w-14 px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-bold text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Routine & Calculation Gauge */}
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-blue-900 flex items-center gap-1.5 mb-1">
                    <Coffee size={14} className="text-emerald-600" />
                    <span>Personal Routine / Meals</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={commitments.personalRoutineHours}
                    onChange={e => setCommitments({...commitments, personalRoutineHours: e.target.value})}
                    className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  />
                </div>

                <div className="pt-2 border-t border-blue-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">Available Study Time</span>
                  <span className="text-2xl font-black text-blue-900">{calculatedStudyHours} Hours</span>
                </div>
              </div>
            </div>
          </SurfaceCard>

          {/* Section 2: Target Skills & Subjects */}
          <SurfaceCard className="p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Code2 size={18} className="text-blue-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">Step 2: Choose Target Skills & Subjects</h3>
                <p className="text-xs text-slate-400">Select the topics to include in your daily study slots</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {STANDARD_SKILLS.map(skill => {
                const isSelected = commitments.selectedSubjects.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleToggleSkill(skill)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? `✓ ${skill}` : `+ ${skill}`}
                  </button>
                );
              })}
            </div>

            {/* Custom Skill Input */}
            <form onSubmit={handleAddCustomSkill} className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder="Add custom skill (e.g. Node.js, Next.js, Redux)..."
                value={commitments.customSkillInput}
                onChange={e => setCommitments({...commitments, customSkillInput: e.target.value})}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
              >
                Add Skill
              </button>
            </form>
          </SurfaceCard>

          {/* Section 3: Smart Timetable Generator & Slot List */}
          <SurfaceCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">Step 3: Daily Schedule & Time Slots</h3>
                <p className="text-xs text-slate-400">Auto-generate based on your commitments or customize each time slot</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateSmartTimetable}
                  disabled={generatingPreview}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition"
                >
                  <Sparkles size={14} />
                  <span>{generatingPreview ? 'Generating...' : 'Auto-Generate Smart Schedule'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenSlotModal()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
                >
                  <Plus size={14} />
                  <span>Add Custom Slot</span>
                </button>
              </div>
            </div>

            {/* Slots List */}
            {commitments.slots.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                Click <strong>"Auto-Generate Smart Schedule"</strong> above to construct your personalized 24-hour study plan.
              </div>
            ) : (
              <div className="space-y-3">
                {commitments.slots.map((slot, index) => (
                  <div 
                    key={slot.id || index}
                    className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 flex items-start justify-between gap-4 transition"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-black text-slate-900">{slot.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadge(slot.category)}`}>
                          {slot.category}
                        </span>
                        {slot.subject && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                            {slot.subject}
                          </span>
                        )}
                      </div>

                      {slot.targetDescription && (
                        <p className="text-xs text-slate-600 mb-1.5">{slot.targetDescription}</p>
                      )}

                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Clock size={12} />
                        <span>{slot.startTime} – {slot.endTime} ({slot.durationMinutes || 60} mins)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenSlotModal(index)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Slot"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Slot"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Save Timetable Button */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleSaveTimetable}
                disabled={savingTimetable || commitments.slots.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-200 transition active:scale-95 disabled:opacity-50"
              >
                <Check size={16} />
                <span>{savingTimetable ? 'Saving Routine...' : 'Save & Activate Timetable'}</span>
              </button>
            </div>
          </SurfaceCard>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD / EDIT SLOT */}
      {/* ---------------------------------------------------- */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-900">{editingSlotIndex >= 0 ? 'Edit Time Slot' : 'Add Custom Time Slot'}</h3>
                <p className="text-xs text-slate-400">Configure learning goals and time duration</p>
              </div>
              <button onClick={() => setIsSlotModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveSlotModal} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Slot Title <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. React Component Practice & Redux Review"
                  value={slotForm.title}
                  onChange={e => setSlotForm({...slotForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={slotForm.category}
                    onChange={e => setSlotForm({...slotForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="Technical Practice">Technical Practice</option>
                    <option value="Technical Class">Technical Class</option>
                    <option value="Aptitude Practice">Aptitude Practice</option>
                    <option value="Communication Practice">Communication Practice</option>
                    <option value="Theory & Concepts">Theory & Concepts</option>
                    <option value="Work / College">Work / College</option>
                    <option value="Break / Meals">Break / Meals</option>
                    <option value="Sleep">Sleep</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Focus</label>
                  <input
                    type="text"
                    placeholder="e.g. React, SQL, Java"
                    value={slotForm.subject}
                    onChange={e => setSlotForm({...slotForm, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time (24h)</label>
                  <input
                    type="time"
                    required
                    value={slotForm.startTime}
                    onChange={e => setSlotForm({...slotForm, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time (24h)</label>
                  <input
                    type="time"
                    required
                    value={slotForm.endTime}
                    onChange={e => setSlotForm({...slotForm, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Goals / Tasks Description</label>
                <textarea
                  placeholder="e.g. Complete 3 coding challenges on arrays and watch 1 tutorial video..."
                  value={slotForm.targetDescription}
                  onChange={e => setSlotForm({...slotForm, targetDescription: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-blue-500 min-h-[60px] resize-y"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Save Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
