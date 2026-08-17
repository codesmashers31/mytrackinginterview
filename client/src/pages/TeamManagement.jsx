import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  AppShell, 
  SurfaceCard, 
  SectionTabs 
} from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { 
  Trophy, 
  Users, 
  Plus, 
  Trash2, 
  Edit,
  X,
  CheckSquare, 
  Award, 
  Search, 
  Star, 
  Clock, 
  UserCheck, 
  Crown,
  ChevronRight,
  Flame,
  ArrowRight,
  BookOpen
} from 'lucide-react';

export default function TeamManagement() {
  const [activeTab, setActiveTab] = useState('Teams');
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [teamPerformances, setTeamPerformances] = useState([]);

  // Create/Edit Team state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamTrack, setNewTeamTrack] = useState('Regular');
  const [newTeamBatch, setNewTeamBatch] = useState('');
  const [newTeamStatus, setNewTeamStatus] = useState('Active');
  const [newTeamPrize, setNewTeamPrize] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Filters for team list
  const [filterTeamTrack, setFilterTeamTrack] = useState('All');
  const [filterTeamBatch, setFilterTeamBatch] = useState('All');
  const [filterTeamStatus, setFilterTeamStatus] = useState('Active');

  // Filters for leaderboard
  const [filterLeaderboardTrack, setFilterLeaderboardTrack] = useState('All');
  const [filterLeaderboardBatch, setFilterLeaderboardBatch] = useState('All');

  // Filters for student selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDegree, setSelectedDegree] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Create/Edit Challenge state
  const [editingChallengeId, setEditingChallengeId] = useState(null);
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDesc, setChallengeDesc] = useState('');
  const [challengeMaxMarks, setChallengeMaxMarks] = useState(100);
  const [challengeDueDate, setChallengeDueDate] = useState('');
  const [challengeTeams, setChallengeTeams] = useState([]);

  // Grading state
  const [selectedGradeTeam, setSelectedGradeTeam] = useState('');
  const [selectedGradeChallenge, setSelectedGradeChallenge] = useState('');
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeRemarks, setGradeRemarks] = useState('');

  // Fetch all necessary data
  const fetchData = async () => {
    setLoading(true);
    try {
      const leadUrl = buildApiUrl(`/teams/leaderboard?track=${filterLeaderboardTrack}&batch=${filterLeaderboardBatch}`);
      const [teamsRes, chalRes, leadRes, frontRes, perfRes] = await Promise.all([
        fetch(buildApiUrl('/teams'), { headers: authHeaders() }),
        fetch(buildApiUrl('/teams/tasks'), { headers: authHeaders() }),
        fetch(leadUrl, { headers: authHeaders() }),
        fetch(buildApiUrl('/students?all=true'), { headers: authHeaders() }),
        fetch(buildApiUrl('/teams/performances'), { headers: authHeaders() })
      ]);

      if (teamsRes.ok) setTeams(await teamsRes.json());
      if (chalRes.ok) setChallenges(await chalRes.json());
      if (leadRes.ok) setLeaderboard(await leadRes.json());
      if (perfRes.ok) setTeamPerformances(await perfRes.json());

      const allStudentsData = frontRes.ok ? await frontRes.json() : [];
      setStudents(allStudentsData.map(s => {
        let track = 'Regular';
        if (s.isFrontend) track = 'Frontend';
        else if (s.enrollments && s.enrollments.includes('SPL')) track = 'SPL';
        else if (s.studentType === 'SPL') track = 'SPL';
        return { ...s, track };
      }));
    } catch (err) {
      toast.error('Failed to sync team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, filterLeaderboardTrack, filterLeaderboardBatch]);

  // Handle Team Creation / Modification
  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }
    if (newTeamTrack === 'Regular' && !newTeamBatch) {
      toast.error('Please select a batch for the team');
      return;
    }
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student for the team');
      return;
    }

    try {
      const url = editingTeamId 
        ? buildApiUrl(`/teams/${editingTeamId}`) 
        : buildApiUrl('/teams');
      const method = editingTeamId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          name: newTeamName.trim(),
          members: selectedStudents,
          track: newTeamTrack,
          batch: newTeamBatch,
          status: newTeamStatus,
          prize: newTeamPrize
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Saving failed');

      toast.success(editingTeamId ? `Team "${data.name}" modified successfully!` : `Team "${data.name}" created successfully!`);
      setNewTeamName('');
      setSelectedStudents([]);
      setNewTeamTrack('Regular');
      setNewTeamBatch('');
      setNewTeamStatus('Active');
      setNewTeamPrize('');
      setEditingTeamId(null);
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Open Edit Mode for a Team
  const handleEditTeam = (team) => {
    setEditingTeamId(team._id);
    setNewTeamName(team.name);
    setSelectedStudents(team.members.map(m => m._id));
    setNewTeamTrack(team.track || 'Regular');
    setNewTeamBatch(team.batch || '');
    setNewTeamStatus(team.status || 'Active');
    setNewTeamPrize(team.prize || '');
    setShowCreateModal(true);
  };

  // Handle Team Deletion
  const handleDeleteTeam = async (teamId, teamName) => {
    if (!confirm(`Are you sure you want to delete "${teamName}"? All performance records will also be deleted.`)) return;

    try {
      const res = await fetch(buildApiUrl(`/teams/${teamId}`), {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Deletion failed');

      toast.success(data.message || 'Team deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Handle Challenge Creation / Modification
  const handleSaveChallenge = async (e) => {
    e.preventDefault();
    if (!challengeTitle.trim() || !challengeDueDate) {
      toast.error('Title and Due Date/Time are required');
      return;
    }

    try {
      const url = editingChallengeId 
        ? buildApiUrl(`/teams/tasks/${editingChallengeId}`) 
        : buildApiUrl('/teams/tasks');
      const method = editingChallengeId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          title: challengeTitle.trim(),
          description: challengeDesc.trim(),
          maxMarks: Number(challengeMaxMarks),
          dueDate: challengeDueDate,
          associatedTeams: challengeTeams
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Saving challenge failed');

      toast.success(editingChallengeId ? `Challenge "${data.title}" updated!` : `Challenge "${data.title}" added!`);
      setChallengeTitle('');
      setChallengeDesc('');
      setChallengeMaxMarks(100);
      setChallengeDueDate('');
      setChallengeTeams([]);
      setEditingChallengeId(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Open Edit Mode for a Challenge
  const handleEditChallenge = (chal) => {
    setEditingChallengeId(chal._id);
    setChallengeTitle(chal.title);
    setChallengeDesc(chal.description || '');
    setChallengeMaxMarks(chal.maxMarks);
    // Convert to datetime-local friendly string (YYYY-MM-DDThh:mm)
    const d = new Date(chal.dueDate);
    const tzoffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
    setChallengeDueDate(localISOTime);
    setChallengeTeams(chal.associatedTeams ? chal.associatedTeams.map(t => typeof t === 'object' ? t._id : t) : []);
  };

  const handleCancelChallengeEdit = () => {
    setEditingChallengeId(null);
    setChallengeTitle('');
    setChallengeDesc('');
    setChallengeMaxMarks(100);
    setChallengeDueDate('');
    setChallengeTeams([]);
  };

  // Handle Challenge Deletion
  const handleDeleteChallenge = async (id, title) => {
    if (!confirm(`Are you sure you want to delete challenge "${title}"? All grades recorded for this challenge will be deleted.`)) return;

    try {
      const res = await fetch(buildApiUrl(`/teams/tasks/${id}`), {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete challenge');

      toast.success(data.message || 'Challenge deleted');
      if (editingChallengeId === id) handleCancelChallengeEdit();
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Handle Grading Submission / Update
  const handleGrading = async (e) => {
    e.preventDefault();
    if (!selectedGradeTeam || !selectedGradeChallenge || gradeMarks === '') {
      toast.error('Team, Challenge, and Score are required');
      return;
    }

    const selectedChallenge = challenges.find(c => c._id === selectedGradeChallenge);
    if (selectedChallenge && Number(gradeMarks) > selectedChallenge.maxMarks) {
      toast.error(`Score cannot exceed max marks of ${selectedChallenge.maxMarks}`);
      return;
    }

    try {
      const res = await fetch(buildApiUrl('/teams/performances'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          teamId: selectedGradeTeam,
          taskId: selectedGradeChallenge,
          marksObtained: Number(gradeMarks),
          remarks: gradeRemarks.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Grading failed');

      toast.success('Challenge scored successfully!');
      setGradeMarks('');
      setGradeRemarks('');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Open Edit Mode for Graded Performance
  const handleEditPerformance = (perf) => {
    setSelectedGradeChallenge(perf.taskId?._id || '');
    setSelectedGradeTeam(perf.teamId?._id || '');
    setGradeMarks(perf.marksObtained);
    setGradeRemarks(perf.remarks || '');
    toast.success('Loaded score details into grading form above.');
    // Scroll to top of the page/grading card
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Grade Deletion
  const handleDeletePerformance = async (perfId) => {
    if (!confirm('Are you sure you want to delete this recorded score?')) return;

    try {
      const res = await fetch(buildApiUrl(`/teams/performances/${perfId}`), {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete score record');

      toast.success(data.message || 'Score deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Student list filtered for team assignment
  const filteredStudents = students.filter(student => {
    // 1. Search Query
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (student.name || '').toLowerCase().includes(searchLower) ||
      (student.email && student.email.toLowerCase().includes(searchLower)) ||
      (student.mobile || '').includes(searchLower);

    // 2. Degree Filter
    const matchesDegree = selectedDegree === 'All' || student.degree === selectedDegree;

    // 3. Status Filter
    const matchesStatus = selectedStatus === 'All' || student.currentStatus === selectedStatus;

    // 4. Team Track and Batch Constraints
    let matchesTrackAndBatch = false;
    if (newTeamTrack === 'Frontend') {
      matchesTrackAndBatch = student.track === 'Frontend';
    } else if (newTeamTrack === 'SPL') {
      matchesTrackAndBatch = student.track === 'SPL';
    } else {
      // Regular track: student must be Regular or SPL, and match the selected team batch
      const isRegularOrSpl = student.track === 'Regular' || student.track === 'SPL';
      const matchesBatch = student.batch === newTeamBatch;
      matchesTrackAndBatch = isRegularOrSpl && matchesBatch;
    }

    return matchesSearch && matchesDegree && matchesStatus && matchesTrackAndBatch;
  });

  // Extract unique degrees/statuses for filters
  const uniqueDegrees = [...new Set(students.map(s => s.degree).filter(Boolean))];
  const uniqueStatuses = [...new Set(students.map(s => s.currentStatus).filter(Boolean))];

  // Get unique batches from student list (filtering out 4-digit years)
  const uniqueBatches = [...new Set(students.map(s => s.batch ? s.batch.trim() : '').filter(Boolean))]
    .filter(b => !/^\d{4}$/.test(b))
    .sort();

  // Filtered teams list for Teams list view
  const filteredTeams = teams.filter(team => {
    const matchesTrack = filterTeamTrack === 'All' || team.track === filterTeamTrack;
    const matchesBatch = filterTeamTrack === 'Frontend' || filterTeamTrack === 'SPL' || filterTeamBatch === 'All' || team.batch === filterTeamBatch;
    const matchesStatus = filterTeamStatus === 'All' || (team.status || 'Active') === filterTeamStatus;
    return matchesTrack && matchesBatch && matchesStatus;
  });

  const handleStudentSelect = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    } else {
      setSelectedStudents(prev => [...prev, studentId]);
    }
  };

  // Format date safely
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Find which team a student belongs to (excluding currently edited team)
  const getStudentTeamName = (studentId) => {
    const team = teams.find(t => t.status !== 'Completed' && t._id !== editingTeamId && t.members.some(m => m._id === studentId));
    return team ? team.name : null;
  };

  return (
    <AppShell
      title="Team & Game Activity Hub"
      subtitle="Assemble student guilds, organize challenges, and drive engagement with real-time leaderboards."
    >
      <SectionTabs
        items={[
          { label: 'Teams', active: activeTab === 'Teams', onClick: () => setActiveTab('Teams') },
          { label: 'Team Challenges', active: activeTab === 'Challenges', onClick: () => setActiveTab('Challenges') },
          { label: 'Grade Challenge', active: activeTab === 'Grade', onClick: () => setActiveTab('Grade') },
          { label: 'Leaderboard', active: activeTab === 'Leaderboard', onClick: () => setActiveTab('Leaderboard') }
        ]}
      />

      {/* TEAMS TAB */}
      {activeTab === 'Teams' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="text-indigo-600" />
              Active Teams ({teams.length})
            </h2>
            <button
              onClick={() => {
                setEditingTeamId(null);
                setNewTeamName('');
                setSelectedStudents([]);
                setNewTeamTrack('Regular');
                setNewTeamBatch('');
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 transition"
            >
              <Plus size={16} /> Create Team
            </button>
          </div>

          {loading && teams.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Teams Filter Bar */}
              <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Filter Track:</span>
                  <select
                    value={filterTeamTrack}
                    onChange={(e) => {
                      setFilterTeamTrack(e.target.value);
                      if (e.target.value === 'Frontend' || e.target.value === 'SPL') {
                        setFilterTeamBatch('All');
                      }
                    }}
                    className="h-9 px-3 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700 focus:border-indigo-600 outline-none transition"
                  >
                    <option value="All">All Tracks</option>
                    <option value="Regular">Regular</option>
                    <option value="Frontend">Frontend</option>
                    <option value="SPL">SPL</option>
                  </select>
                </div>

                {filterTeamTrack !== 'Frontend' && filterTeamTrack !== 'SPL' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Filter Batch:</span>
                    <select
                      value={filterTeamBatch}
                      onChange={(e) => setFilterTeamBatch(e.target.value)}
                      className="h-9 px-3 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700 focus:border-indigo-600 outline-none transition"
                    >
                      <option value="All">All Batches</option>
                      {uniqueBatches.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
                  <select
                    value={filterTeamStatus}
                    onChange={(e) => setFilterTeamStatus(e.target.value)}
                    className="h-9 px-3 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700 focus:border-indigo-600 outline-none transition"
                  >
                    <option value="Active">Active Teams</option>
                    <option value="Completed">Completed Teams</option>
                    <option value="All">All Statuses</option>
                  </select>
                </div>
              </div>

              {filteredTeams.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
                    <Users size={28} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">No Teams Found</h3>
                  <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">No teams match your active Track and Batch filters.</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTeams.map(team => {
                    const totalScore = leaderboard.find(l => l._id === team._id)?.totalScore || 0;
                    return (
                      <SurfaceCard key={team._id} className="p-6 relative group overflow-hidden border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all duration-300">
                        <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-bl from-indigo-50/30 to-transparent rounded-bl-full pointer-events-none" />
                        
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition truncate pr-16">{team.name}</h3>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
                                <Trophy size={10} /> {totalScore} pts
                              </span>
                              <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                team.track === 'Frontend' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                              }`}>
                                {team.track}
                              </span>
                              {team.batch && (
                                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                  {team.batch}
                                </span>
                              )}
                              <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                (team.status || 'Active') === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50/70 text-indigo-600 border border-indigo-100/50'
                              }`}>
                                {team.status || 'Active'}
                              </span>
                              {team.prize && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-full shadow-3xs">
                                  <Crown size={10} className="text-amber-500 shrink-0" /> {team.prize}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => handleEditTeam(team)}
                              className="rounded-xl p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                              title="Modify Team"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team._id, team.name)}
                              className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Delete Team"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4 mt-2">
                          <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Members ({team.members.length})</p>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                            {team.members.map(member => (
                              <div key={member._id} className="flex items-center justify-between text-sm py-1.5 px-2 bg-slate-50 rounded-xl hover:bg-slate-100/50 transition">
                                <span className="font-semibold text-slate-700 truncate pr-2">{member.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded font-medium shrink-0">
                                  {member.degree || 'Track'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </SurfaceCard>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* CREATE / EDIT TEAM DRAWER MODAL */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
              <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {editingTeamId ? 'Modify Guild / Team' : 'Assemble New Team'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {editingTeamId ? 'Edit team name and re-assign members.' : 'Define a team name and select students to form a crew.'}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingTeamId(null);
                      setNewTeamName('');
                      setSelectedStudents([]);
                    }}
                    className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-800 rounded-xl transition"
                  >
                    Close
                  </button>
                </div>

                <div className="flex-1 overflow-hidden grid lg:grid-cols-[320px_1fr]">
                  {/* Left Column: Name and Selected Checkbox Info */}
                  <div className="p-6 border-r border-slate-100 bg-slate-50/50 overflow-y-auto space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Team Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Nexus Squad, Binary Titans"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="w-full h-11 px-4 border border-slate-200 bg-white rounded-2xl text-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Track</label>
                      <select
                        value={newTeamTrack}
                        onChange={(e) => {
                          setNewTeamTrack(e.target.value);
                          if (e.target.value === 'Frontend' || e.target.value === 'SPL') {
                            setNewTeamBatch('');
                          }
                          setSelectedStudents([]);
                        }}
                        className="w-full h-11 px-4 border border-slate-200 bg-white rounded-2xl text-sm focus:border-indigo-600 outline-none transition font-semibold text-slate-700"
                      >
                        <option value="Regular">Regular</option>
                        <option value="Frontend">Frontend</option>
                        <option value="SPL">SPL</option>
                      </select>
                    </div>

                    {newTeamTrack === 'Regular' && (
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Batch</label>
                        <select
                          value={newTeamBatch}
                          onChange={(e) => {
                            setNewTeamBatch(e.target.value);
                            setSelectedStudents([]);
                          }}
                          className="w-full h-11 px-4 border border-slate-200 bg-white rounded-2xl text-sm focus:border-indigo-600 outline-none transition font-semibold text-slate-700"
                        >
                          <option value="">-- Select Batch --</option>
                          {uniqueBatches.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                      <select
                        value={newTeamStatus}
                        onChange={(e) => {
                          setNewTeamStatus(e.target.value);
                          if (e.target.value === 'Active') {
                            setNewTeamPrize('');
                          }
                        }}
                        className="w-full h-11 px-4 border border-slate-200 bg-white rounded-2xl text-sm focus:border-indigo-600 outline-none transition font-semibold text-slate-700"
                      >
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    {newTeamStatus === 'Completed' && (
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Prize Announced</label>
                        <input
                          type="text"
                          placeholder="e.g., 1st Prize, Winner, Runner Up"
                          value={newTeamPrize}
                          onChange={(e) => setNewTeamPrize(e.target.value)}
                          className="w-full h-11 px-4 border border-slate-200 bg-white rounded-2xl text-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-bold text-slate-700">Selected Crew ({selectedStudents.length})</label>
                        {selectedStudents.length > 0 && (
                          <button 
                            type="button"
                            onClick={() => setSelectedStudents([])}
                            className="text-xs text-rose-600 hover:underline"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {selectedStudents.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                          <Users size={20} className="mx-auto mb-2 text-slate-300" />
                          <p className="text-xs">No members selected. Pick students from the list on the right.</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                          {selectedStudents.map(id => {
                            const student = students.find(s => s._id === id);
                            return student ? (
                              <div key={id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-sm">
                                <span className="font-bold text-slate-800 truncate pr-2">{student.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleStudentSelect(id)}
                                  className="text-xs text-rose-500 hover:text-rose-700 font-semibold"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSaveTeam}
                      className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                    >
                      <UserCheck size={18} /> {editingTeamId ? 'Save Changes' : 'Deploy Team'}
                    </button>
                  </div>

                  {/* Right Column: Student Selection with Filters */}
                  <div className="p-6 flex flex-col overflow-hidden">
                    <div className="space-y-4 mb-4 shrink-0">
                      {/* Search and Filters */}
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        <div className="relative col-span-2">
                          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 border border-slate-200 bg-slate-50/50 rounded-xl text-xs focus:border-indigo-600 focus:bg-white outline-none transition"
                          />
                        </div>

                        <div>
                          <select
                            value={selectedDegree}
                            onChange={(e) => setSelectedDegree(e.target.value)}
                            className="w-full h-10 px-3 border border-slate-200 bg-slate-50/50 rounded-xl text-xs focus:border-indigo-600 outline-none transition font-semibold text-slate-700"
                          >
                            <option value="All">All Degrees</option>
                            {uniqueDegrees.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Student List */}
                    <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl custom-scrollbar">
                      {newTeamTrack === 'Regular' && !newTeamBatch ? (
                        <div className="text-center py-20 text-slate-400">
                          <p className="font-semibold text-slate-600">Please select a Batch on the left to see eligible students.</p>
                        </div>
                      ) : filteredStudents.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                          <p>No available students match the active filters.</p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                            <tr>
                              <th className="p-3 w-12 text-center">Pick</th>
                              <th className="p-3">Name</th>
                              <th className="p-3">Degree</th>
                              <th className="p-3">Current Team</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {filteredStudents.map(student => {
                              const isChecked = selectedStudents.includes(student._id);
                              const currentTeamName = getStudentTeamName(student._id);
                              
                              return (
                                <tr 
                                  key={student._id} 
                                  className={`hover:bg-slate-50/80 cursor-pointer transition ${isChecked ? 'bg-indigo-50/20' : ''}`}
                                  onClick={() => handleStudentSelect(student._id)}
                                >
                                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleStudentSelect(student._id)}
                                      className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-3 font-semibold text-slate-800">
                                    <div>
                                      <p className="flex items-center gap-2">
                                        {student.name}
                                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                                          student.track === 'Frontend' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/30' :
                                          student.track === 'SPL' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/30' :
                                          'bg-slate-100 text-slate-600 border border-slate-200/50'
                                        }`}>
                                          {student.track}
                                        </span>
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-normal">{student.email || student.mobile}</p>
                                    </div>
                                  </td>

                                  <td className="p-3 text-slate-600">{student.degree || 'N/A'}</td>
                                  <td className="p-3">
                                    {currentTeamName ? (
                                      <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-[10px]" title="Selecting this student will move them to this team">
                                        in {currentTeamName}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic">None</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TEAM CHALLENGES TAB */}
      {activeTab === 'Challenges' && (
        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Challenge Creator Form */}
          <div>
            <SurfaceCard className="p-6 border border-slate-100 sticky top-4">
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Plus className="text-indigo-600" size={20} />
                {editingChallengeId ? 'Update Challenge' : 'New Activity Challenge'}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                {editingChallengeId ? 'Edit challenge values and limits.' : 'Create a gamified team challenge or task activity.'}
              </p>

              <form onSubmit={handleSaveChallenge} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Challenge Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., CodeSprint Phase 1, UI Prototyping"
                    value={challengeTitle}
                    onChange={(e) => setChallengeTitle(e.target.value)}
                    className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    placeholder="Challenge rules, requirements, submission links, etc."
                    rows={3}
                    value={challengeDesc}
                    onChange={(e) => setChallengeDesc(e.target.value)}
                    className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Max Score</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={challengeMaxMarks}
                      onChange={(e) => setChallengeMaxMarks(e.target.value)}
                      className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Due Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={challengeDueDate}
                      onChange={(e) => setChallengeDueDate(e.target.value)}
                      className="w-full h-11 px-3 border border-slate-200 rounded-xl text-xs focus:border-indigo-600 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Associated Teams (Only these teams will see/do this task)</label>
                  {teams.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No teams available</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                      {teams.filter(t => t.status !== 'Completed').map(team => (
                        <label key={team._id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-indigo-600 transition">
                          <input
                            type="checkbox"
                            checked={challengeTeams.includes(team._id)}
                            onChange={() => {
                              if (challengeTeams.includes(team._id)) {
                                setChallengeTeams(challengeTeams.filter(id => id !== team._id));
                              } else {
                                setChallengeTeams([...challengeTeams, team._id]);
                              }
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="font-semibold">{team.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({team.track}{team.batch ? ` - Batch ${team.batch}` : ''})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  {editingChallengeId && (
                    <button
                      type="button"
                      onClick={handleCancelChallengeEdit}
                      className="flex-1 h-11 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-[2] h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow transition"
                  >
                    {editingChallengeId ? 'Save Changes' : 'Publish Challenge'}
                  </button>
                </div>
              </form>
            </SurfaceCard>
          </div>

          {/* Challenges List */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="text-indigo-600" />
              Published Challenges ({challenges.length})
            </h2>

            {loading && challenges.length === 0 ? (
              <div className="flex justify-center items-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              </div>
            ) : challenges.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <CheckSquare size={28} className="mx-auto mb-3 text-slate-400" />
                <h3 className="font-bold text-slate-800 text-lg">No Challenges Published</h3>
                <p className="text-slate-500 text-sm mt-1">Publish an activity to score teams and build the leaderboard.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {challenges.map(chal => (
                  <SurfaceCard key={chal._id} className="p-5 border border-slate-100 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{chal.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <Clock size={12} /> Due: {formatDateTime(chal.dueDate)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full border border-slate-200/55">
                          Max Score: {chal.maxMarks}
                        </span>
                        <button
                          onClick={() => handleEditChallenge(chal)}
                          className="p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition"
                          title="Modify Challenge"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteChallenge(chal._id, chal.title)}
                          className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition"
                          title="Delete Challenge"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {chal.description && (
                      <p className="text-sm text-slate-600 mt-3 border-l-2 border-slate-200 pl-3 leading-relaxed whitespace-pre-wrap">{chal.description}</p>
                    )}

                    {chal.associatedTeams && chal.associatedTeams.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Teams:</span>
                        {chal.associatedTeams.map(t => {
                          const teamName = typeof t === 'object' ? t.name : (teams.find(team => team._id === t)?.name || 'Unknown');
                          return (
                            <span key={typeof t === 'object' ? t._id : t} className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100/50">
                              {teamName}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </SurfaceCard>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GRADE/SCORE CHALLENGE TAB */}
      {activeTab === 'Grade' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          <SurfaceCard className="p-6 border border-slate-100 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Award className="text-indigo-600" size={20} />
              Award Marks & Activity Feedback
            </h3>
            <p className="text-xs text-slate-500 mb-6">Select a challenge and a team, then award points with specific remarks on completion.</p>

            <form onSubmit={handleGrading} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Challenge</label>
                  <select
                    required
                    value={selectedGradeChallenge}
                    onChange={(e) => {
                      const chalId = e.target.value;
                      setSelectedGradeChallenge(chalId);
                      // Reset selected grade team if it's not associated with the new challenge
                      const newChal = challenges.find(c => c._id === chalId);
                      if (newChal && newChal.associatedTeams && newChal.associatedTeams.length > 0) {
                        const associatedIds = newChal.associatedTeams.map(at => typeof at === 'object' ? at._id : at);
                        if (!associatedIds.includes(selectedGradeTeam)) {
                          setSelectedGradeTeam('');
                        }
                      }
                    }}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition"
                  >
                    <option value="">-- Choose Challenge --</option>
                    {challenges.map(c => (
                      <option key={c._id} value={c._id}>{c.title} (Max: {c.maxMarks} pts)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Team</label>
                  <select
                    required
                    value={selectedGradeTeam}
                    onChange={(e) => setSelectedGradeTeam(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition"
                  >
                    <option value="">-- Choose Team --</option>
                    {(() => {
                      const currentChal = challenges.find(c => c._id === selectedGradeChallenge);
                      const displayTeams = (currentChal && currentChal.associatedTeams && currentChal.associatedTeams.length > 0
                        ? teams.filter(t => currentChal.associatedTeams.some(at => (typeof at === 'object' ? at._id : at) === t._id))
                        : teams).filter(t => t.status !== 'Completed');
                      
                      return displayTeams.map(t => (
                        <option key={t._id} value={t._id}>{t.name} ({t.members.length} members)</option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Score Obtained</label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="Points awarded"
                  value={gradeMarks}
                  onChange={(e) => setGradeMarks(e.target.value)}
                  className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Evaluator Feedback / Remarks</label>
                <textarea
                  placeholder="Feedback on team performance..."
                  rows={4}
                  value={gradeRemarks}
                  onChange={(e) => setGradeRemarks(e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition"
              >
                Submit Score
              </button>
            </form>
          </SurfaceCard>

          {/* Graded Performance Logs List */}
          <SurfaceCard className="p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Star className="text-indigo-600 animate-pulse" size={20} />
              Activity Score Registry
            </h3>

            {teamPerformances.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p>No activity challenges have been scored yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-3">Challenge Task</th>
                      <th className="p-3">Team</th>
                      <th className="p-3 text-center">Score Awarded</th>
                      <th className="p-3">Remarks / Feedback</th>
                      <th className="p-3">Graded By</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {teamPerformances.map(perf => (
                      <tr key={perf._id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-semibold text-slate-800">
                          {perf.taskId?.title || <span className="text-slate-400 italic">Deleted Task</span>}
                        </td>
                        <td className="p-3 font-semibold text-indigo-600">
                          {perf.teamId?.name || <span className="text-slate-400 italic">Deleted Team</span>}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-600 text-sm">
                          {perf.marksObtained} <span className="text-[10px] text-slate-400 font-normal">/ {perf.taskId?.maxMarks || 100}</span>
                        </td>
                        <td className="p-3 max-w-xs truncate" title={perf.remarks}>
                          {perf.remarks || '-'}
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-semibold text-slate-700">{perf.markedBy}</p>
                            <p className="text-[9px] text-slate-400">{new Date(perf.markedAt).toLocaleDateString()}</p>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => handleEditPerformance(perf)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit Grade"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeletePerformance(perf._id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                              title="Delete Grade"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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

      {/* LEADERBOARD TAB */}
      {activeTab === 'Leaderboard' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Leaderboard Filters Bar */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter Track:</span>
              <select
                value={filterLeaderboardTrack}
                onChange={(e) => {
                  setFilterLeaderboardTrack(e.target.value);
                  if (e.target.value === 'Frontend' || e.target.value === 'SPL') {
                    setFilterLeaderboardBatch('All');
                  }
                }}
                className="h-9 px-3 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700 focus:border-indigo-600 outline-none transition"
              >
                <option value="All">All Tracks</option>
                <option value="Regular">Regular</option>
                <option value="Frontend">Frontend</option>
                <option value="SPL">SPL</option>
              </select>
            </div>

            {filterLeaderboardTrack !== 'Frontend' && filterLeaderboardTrack !== 'SPL' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Filter Batch:</span>
                <select
                  value={filterLeaderboardBatch}
                  onChange={(e) => setFilterLeaderboardBatch(e.target.value)}
                  className="h-9 px-3 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700 focus:border-indigo-600 outline-none transition"
                >
                  <option value="All">All Batches</option>
                  {uniqueBatches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Top 3 Podiums */}
          {leaderboard.length >= 1 && (
            <div className="flex flex-col sm:flex-row items-end justify-center gap-4 sm:gap-6 pt-10 pb-4">
              
              {/* 2nd Place */}
              {leaderboard[1] && (
                <div className="w-full sm:w-48 flex flex-col items-center order-2 sm:order-1 mt-6 sm:mt-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 font-bold border-2 border-slate-200 mb-2">2</div>
                  <div className="bg-gradient-to-t from-slate-100 to-white border border-slate-200 rounded-t-2xl p-4 w-full text-center shadow-md h-32 flex flex-col justify-center">
                    <p className="font-bold text-slate-800 text-sm truncate">{leaderboard[1].name}</p>
                    <p className="text-indigo-600 font-black text-lg mt-1">{leaderboard[1].totalScore} <span className="text-[10px] font-medium text-slate-400">pts</span></p>
                    <p className="text-[10px] text-slate-400 mt-1">{leaderboard[1].tasksCompleted} activities</p>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              <div className="w-full sm:w-56 flex flex-col items-center order-1 sm:order-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500 font-bold border-2 border-amber-300 mb-2 animate-bounce">
                  <Crown size={22} />
                </div>
                <div className="bg-gradient-to-t from-indigo-50/50 to-white border-2 border-indigo-200 rounded-t-3xl p-5 w-full text-center shadow-lg h-40 flex flex-col justify-center relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">Leader</span>
                  <p className="font-black text-slate-900 text-base truncate">{leaderboard[0].name}</p>
                  <p className="text-indigo-600 font-black text-2xl mt-1">{leaderboard[0].totalScore} <span className="text-[10px] font-medium text-slate-400">pts</span></p>
                  <p className="text-xs text-slate-500 mt-1">{leaderboard[0].tasksCompleted} activities</p>
                </div>
              </div>

              {/* 3rd Place */}
              {leaderboard[2] && (
                <div className="w-full sm:w-48 flex flex-col items-center order-3 mt-6 sm:mt-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-700 font-bold border-2 border-amber-600/30 mb-2">3</div>
                  <div className="bg-gradient-to-t from-amber-50/10 to-white border border-amber-100 rounded-t-2xl p-4 w-full text-center shadow-md h-28 flex flex-col justify-center">
                    <p className="font-bold text-slate-800 text-sm truncate">{leaderboard[2].name}</p>
                    <p className="text-indigo-600 font-black text-lg mt-1">{leaderboard[2].totalScore} <span className="text-[10px] font-medium text-slate-400">pts</span></p>
                    <p className="text-[10px] text-slate-400 mt-1">{leaderboard[2].tasksCompleted} activities</p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Full Leaderboard List */}
          <SurfaceCard className="p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Trophy className="text-indigo-600" />
              {filterLeaderboardTrack === 'All' ? 'Guild Standing' : `${filterLeaderboardTrack} Standing`} Leaderboard
            </h3>

            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p>No score logs generated. Score challenge tasks to see rankings.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-4 w-16 text-center">Rank</th>
                      <th className="p-4">Guild / Team Name</th>
                      <th className="p-4 text-center">Crew Size</th>
                      <th className="p-4 text-center">Activities Completed</th>
                      <th className="p-4 text-right">Aggregate Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {leaderboard.map((row, idx) => {
                      const rank = idx + 1;
                      
                      return (
                        <tr 
                          key={row._id} 
                          className={`hover:bg-slate-50/50 transition ${rank === 1 ? 'bg-indigo-50/5' : ''}`}
                        >
                          <td className="p-4 text-center font-bold">
                            {rank === 1 ? (
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs">🥇</span>
                            ) : rank === 2 ? (
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-xs">🥈</span>
                            ) : rank === 3 ? (
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-800 text-xs">🥉</span>
                            ) : (
                              <span className="text-slate-500 font-medium">#{rank}</span>
                            )}
                          </td>
                          <td className="p-4 font-bold text-slate-800">
                            {row.name}
                          </td>
                          <td className="p-4 text-center text-slate-500 font-medium">{row.memberCount}</td>
                          <td className="p-4 text-center text-slate-500">
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                              <Star size={10} className="text-indigo-500 fill-indigo-500" /> {row.tasksCompleted}
                            </span>
                          </td>
                          <td className="p-4 text-right font-black text-indigo-600 text-base">
                            {row.totalScore} <span className="text-[10px] font-normal text-slate-400">pts</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SurfaceCard>
        </div>
      )}
    </AppShell>
  );
}
