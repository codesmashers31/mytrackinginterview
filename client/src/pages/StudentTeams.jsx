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
  CheckSquare, 
  Award, 
  Star, 
  Clock, 
  Crown,
  Flame,
  ArrowRight,
  BookOpen,
  UserCheck
} from 'lucide-react';

export default function StudentTeams() {
  const [activeTab, setActiveTab] = useState('My Team');
  const [loading, setLoading] = useState(false);
  const [myTeam, setMyTeam] = useState(null);
  const [myPerformances, setMyPerformances] = useState([]);
  const [allChallenges, setAllChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [profile, setProfile] = useState(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Fetch student's team and performance data
  const fetchStudentTeamData = async () => {
    setLoading(true);
    try {
      const [teamPerfRes, chalRes, leadRes] = await Promise.all([
        fetch(buildApiUrl('/teams/performances/my-team'), { headers: authHeaders() }),
        fetch(buildApiUrl('/teams/tasks'), { headers: authHeaders() }),
        fetch(buildApiUrl('/teams/leaderboard'), { headers: authHeaders() })
      ]);

      if (teamPerfRes.ok) {
        const data = await teamPerfRes.json();
        setMyTeam(data.team);
        setMyPerformances(data.performances);
      } else {
        setMyTeam(null);
        setMyPerformances([]);
      }

      if (chalRes.ok) setAllChallenges(await chalRes.json());
      if (leadRes.ok) setLeaderboard(await leadRes.json());
    } catch (err) {
      toast.error('Failed to sync team performance telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch(buildApiUrl('/auth/me'), {
          headers: authHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.studentProfile);
          if (data.studentProfile) {
            fetchStudentTeamData();
          }
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      } finally {
        setCheckingAccess(false);
      }
    };
    checkAccess();
  }, [activeTab]);

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

  // Check if a challenge has been graded for this team
  const getChallengePerformance = (challengeId) => {
    return myPerformances.find(p => p.taskId && p.taskId._id === challengeId);
  };

  if (checkingAccess) {
    return (
      <AppShell title="Team Activity">
        <div className="flex justify-center items-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell 
        title="Team Activity"
        subtitle="Guild activities and challenges dashboard."
      >
        <div className="text-center py-16 border border-slate-200 rounded-3xl bg-slate-50/50 max-w-2xl mx-auto mt-8 text-slate-500 font-medium">
          Loading candidate profile details...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Team & Game Activity Dashboard"
      subtitle="Track your guild's active challenges, check grades, and see where your team stands on the leaderboard."
    >
      <SectionTabs
        items={[
          { label: 'My Team', active: activeTab === 'My Team', onClick: () => setActiveTab('My Team') },
          { label: 'Team Challenges', active: activeTab === 'Challenges', onClick: () => setActiveTab('Challenges') },
          { label: 'Leaderboard', active: activeTab === 'Leaderboard', onClick: () => setActiveTab('Leaderboard') }
        ]}
      />

      {/* MY TEAM TAB */}
      {activeTab === 'My Team' && (
        <div className="space-y-6">
          {loading && !myTeam ? (
            <div className="flex justify-center items-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : !myTeam ? (
            <div className="text-center py-16 border border-slate-200 rounded-3xl bg-slate-50/50">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
                <Users size={28} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">No Team Assigned</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                You are not currently member of any team. Ask your administrator to add you to a team guild.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Guild Summary Card */}
              <SurfaceCard className="p-6 md:col-span-1 border border-slate-100 flex flex-col justify-between bg-gradient-to-br from-white to-indigo-50/10">
                <div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    My Guild
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-3">{myTeam.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">Formed on {new Date(myTeam.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="border-t border-slate-100 pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-slate-500">Global Score</span>
                    <span className="text-2xl font-black text-indigo-600 flex items-center gap-1.5">
                      <Trophy size={20} className="text-indigo-500" />
                      {leaderboard.find(l => l._id === myTeam._id)?.totalScore || 0} <span className="text-xs font-normal text-slate-400">pts</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500 font-medium">Rank</span>
                    <span className="text-lg font-bold text-slate-800">
                      #{leaderboard.findIndex(l => l._id === myTeam._id) + 1 || 'N/A'} of {leaderboard.length}
                    </span>
                  </div>
                </div>
              </SurfaceCard>

              {/* Guild Members Card */}
              <SurfaceCard className="p-6 md:col-span-2 border border-slate-100">
                <h4 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                  <Users className="text-indigo-600" size={20} />
                  Guild Companions ({myTeam.members.length})
                </h4>

                <div className="grid gap-4 sm:grid-cols-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  {myTeam.members.map(member => member && (
                    <div key={member._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100/50 hover:bg-white transition shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{member.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{member.email || 'No email'}</p>
                          <p className="text-[10px] text-slate-400">{member.mobile || 'No mobile'}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md shrink-0">
                          {member.degree || 'Student'}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-medium text-slate-500">{member.currentStatus || 'No Status'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            </div>
          )}
        </div>
      )}

      {/* TEAM CHALLENGES TAB */}
      {activeTab === 'Challenges' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="text-indigo-600" />
            Activity Challenges ({allChallenges.length})
          </h2>

          {loading && allChallenges.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : allChallenges.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
              <CheckSquare size={28} className="mx-auto mb-3 text-slate-400" />
              <h3 className="font-bold text-slate-800 text-lg">No Challenges Published</h3>
              <p className="text-slate-500 text-sm mt-1">There are no team challenges assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allChallenges.map(chal => {
                const perf = getChallengePerformance(chal._id);
                const isGraded = !!perf;

                return (
                  <SurfaceCard key={chal._id} className="p-5 border border-slate-100 hover:shadow-md transition">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{chal.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <Clock size={12} /> Due: {formatDateTime(chal.dueDate)}
                        </p>
                        {chal.description && (
                          <p className="text-sm text-slate-600 mt-3 border-l-2 border-slate-200 pl-3 leading-relaxed whitespace-pre-wrap">{chal.description}</p>
                        )}
                      </div>
                      
                      <div className="shrink-0 flex sm:flex-col items-end gap-2">
                        {isGraded ? (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                              Graded: {perf.marksObtained} / {chal.maxMarks} pts
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">By {perf.markedBy || 'Admin'}</p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">
                            Pending Evaluation
                          </span>
                        )}
                      </div>
                    </div>

                    {isGraded && perf.remarks && (
                      <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Feedback</p>
                        <p className="text-sm text-slate-700 italic">"{perf.remarks}"</p>
                      </div>
                    )}
                  </SurfaceCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LEADERBOARD TAB */}
      {activeTab === 'Leaderboard' && (
        <div className="space-y-8 max-w-4xl mx-auto">
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
              Guild Standing Leaderboard
            </h3>

            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p>No score logs generated yet.</p>
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
                      const isMyTeam = myTeam && String(row._id) === String(myTeam._id);
                      
                      return (
                        <tr 
                          key={row._id} 
                          className={`hover:bg-slate-50/50 transition ${isMyTeam ? 'bg-indigo-50/40 border-y-2 border-indigo-200/50 font-bold' : ''}`}
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
                          <td className="p-4 text-slate-800">
                            <span className="flex items-center gap-2">
                              {row.name}
                              {isMyTeam && (
                                <span className="bg-indigo-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded">MY GUILD</span>
                              )}
                            </span>
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
