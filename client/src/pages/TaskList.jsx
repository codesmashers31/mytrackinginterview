import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, StatusBadge } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { Pencil, Trash2, ArrowLeft, Clock, AlertCircle, CheckCircle2, ChevronRight, MessageSquare, Search, Filter, X } from 'lucide-react';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Review', 'Blocked', 'Completed'];

export default function TaskList({ isEmbedded = false, onSwitchTab }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/tasks'), {
        headers: { ...authHeaders() }
      });
      if (!res.ok) throw new Error('Failed to load tasks');
      setTasks(await res.json());
    } catch (err) {
      toast.error('Could not load assigned tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = React.useMemo(() => {
    return tasks.filter(task => {
      // Date filter
      if (filterDate && (!task.dueDate || task.dueDate.split('T')[0] !== filterDate)) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'All' && task.overallStatus !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(query);
        const matchesStudent = task.studentName?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesStudent) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, filterDate, statusFilter, searchQuery]);

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task assignment?')) return;
    try {
      const res = await fetch(buildApiUrl(`/tasks/${taskId}`), {
        method: 'DELETE',
        headers: { ...authHeaders() }
      });
      if (!res.ok) throw new Error('Delete failed');
      setTasks(prev => prev.filter(item => item._id !== taskId));
      setSelectedTask(prev => (prev?._id === taskId ? null : prev));
      toast.success('Task removed');
    } catch (err) {
      toast.error('Could not delete task');
    }
  };

  const openTask = (task) => {
    setSelectedTask(task);
  };

  const updateQuestionStatus = (index, status) => {
    setSelectedTask(prev => {
      if (!prev) return prev;
      const nextQuestions = prev.questions.map((item, idx) => idx === index ? { ...item, status } : item);
      return { ...prev, questions: nextQuestions };
    });
  };

  const handleTaskUpdate = async () => {
    if (!selectedTask) return;

    try {
      const res = await fetch(buildApiUrl(`/tasks/${selectedTask._id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          title: selectedTask.title,
          description: selectedTask.description,
          dueDate: selectedTask.dueDate,
          overallStatus: selectedTask.overallStatus,
          questions: selectedTask.questions
        })
      });

      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setTasks(prev => prev.map(task => (task._id === updated._id ? updated : task)));
      setSelectedTask(updated);
      toast.success('Task updated');
    } catch (err) {
      toast.error('Could not save changes');
    }
  };

  const content = (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Assignments</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </span>
            {tasks.length !== filteredTasks.length && (
              <span className="text-xs text-slate-400 font-medium">
                (filtered from {tasks.length})
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">Monitor student progress and manage assigned tasks.</p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => isEmbedded ? onSwitchTab?.('assign') : navigate('/tasks')}
            className="crm-btn-primary px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 w-full sm:w-auto"
          >
            Assign New Task
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Modern Filters Toolbar */}
      <div className="grid gap-4 sm:grid-cols-12 items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6">
        <div className="relative sm:col-span-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search student or task title..."
            className="crm-input pl-10 h-10 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="relative sm:col-span-3">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            className="crm-input pl-10 h-10 rounded-xl bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="relative sm:col-span-3">
          <input
            type="date"
            className="crm-input h-10 rounded-xl"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        {(searchQuery || statusFilter !== 'All' || filterDate) ? (
          <div className="sm:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setFilterDate('');
              }}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : tasks.length === 0 ? (
        <SurfaceCard className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-200 bg-slate-50">
          <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No active tasks</h3>
          <p className="text-slate-500 max-w-md mb-6">You haven't assigned any tasks yet, or all assignments have been completed and deleted.</p>
          <button onClick={() => navigate('/tasks')} className="crm-btn-primary px-6 py-2">Create Assignment</button>
        </SurfaceCard>
      ) : filteredTasks.length === 0 ? (
        <SurfaceCard className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900 mb-2">No matching tasks</h3>
          <p className="text-slate-500 max-w-md mb-6">No assignments match your search query or selected filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('All');
              setFilterDate('');
            }}
            className="crm-btn-primary px-6 py-2"
          >
            Clear All Filters
          </button>
        </SurfaceCard>
      ) : (
        <SurfaceCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Candidate</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Task Detail</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Progress</th>
                  <th className="hidden sm:table-cell px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Due Date</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTasks.map((task, index) => {
                  const completedCount = task.questions?.filter(q => q.status === 'Completed').length || 0;
                  const totalCount = task.questions?.length || 0;
                  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

                  return (
                    <tr key={task._id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      {/* Candidate Column */}
                      <td className="px-3 py-2">
                        <div className="min-w-0 max-w-[150px] md:max-w-xs">
                          <p className="text-xs font-bold text-slate-900 truncate leading-tight">{task.studentName}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5 leading-none">{task.studentEmail || 'No email'}</p>
                        </div>
                      </td>

                      {/* Task Detail Column */}
                      <td className="px-3 py-2">
                        <div className="min-w-0 max-w-[180px] md:max-w-sm">
                          <p className="text-xs font-bold text-slate-805 truncate leading-tight">{task.title}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5 leading-none">{task.description || 'No description'}</p>
                        </div>
                      </td>

                      {/* Progress Column */}
                      <td className="px-3 py-2">
                        <div className="w-24 sm:w-32">
                          <div className="flex justify-between text-[10px] font-semibold mb-0.5 text-slate-500">
                            <span>{completedCount}/{totalCount} Done</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Due Date Column */}
                      <td className="hidden sm:table-cell px-3 py-2 text-xs text-slate-600 font-semibold">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date'}
                      </td>

                      {/* Status Column */}
                      <td className="px-3 py-2">
                        <StatusBadge 
                          status={task.overallStatus} 
                          tone={task.overallStatus === 'Completed' ? 'success' : task.overallStatus === 'Blocked' ? 'error' : task.overallStatus === 'In Progress' ? 'warning' : 'info'} 
                        />
                      </td>

                      {/* Actions Column */}
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            type="button"
                            onClick={() => openTask(task)} 
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-blue-100 bg-blue-50 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            <Pencil size={11} /> Monitor
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDelete(task._id)} 
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      )}

      {/* Slide-over Drawer for Task Details & Editing */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ease-out">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Monitor Task</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assigned to <span className="font-semibold text-slate-700">{selectedTask.studentName}</span> ({selectedTask.studentEmail})</p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedTask(null)} 
                className="rounded-full bg-slate-100 hover:bg-slate-200 p-2 text-slate-650 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Form details */}
              <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Task Details</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Task Title</label>
                    <input
                      type="text"
                      className="crm-input h-9 px-3 text-xs"
                      value={selectedTask.title}
                      onChange={(event) => setSelectedTask({ ...selectedTask, title: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Due Date</label>
                    <input
                      type="date"
                      className="crm-input h-9 px-3 text-xs"
                      value={selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : ''}
                      onChange={(event) => setSelectedTask({ ...selectedTask, dueDate: event.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Description</label>
                    <textarea
                      rows={2}
                      className="crm-input p-2 text-xs"
                      value={selectedTask.description || ''}
                      onChange={(event) => setSelectedTask({ ...selectedTask, description: event.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Questions Status ({selectedTask.questions?.filter(q => q.status === 'Completed').length || 0} of {selectedTask.questions?.length || 0} Done)</h4>
                </div>
                
                <div className="space-y-3">
                  {selectedTask.questions?.map((question, index) => (
                    <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-xs leading-relaxed">{question.question}</p>
                          {question.remarks && (
                            <div className="mt-2 bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex gap-2 text-xs">
                              <MessageSquare size={14} className="text-slate-400 shrink-0 mt-0.5" />
                              <div className="text-slate-700 text-[11px] truncate-3-lines">
                                <span className="font-bold text-slate-900 mr-1.5">Student Notes:</span>
                                {question.remarks.startsWith('http') ? (
                                  <a href={question.remarks} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">{question.remarks}</a>
                                ) : (
                                  <span className="italic">{question.remarks}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                        <StatusBadge status={question.status} tone={question.status === 'Completed' ? 'success' : ['Blocked', 'Not Completed', 'Doubt'].includes(question.status) ? 'error' : question.status === 'In Progress' ? 'warning' : 'info'} />
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Override Status:</span>
                          <select
                            className="crm-input text-xs py-1 px-2 min-w-[120px] h-8 bg-slate-50"
                            value={question.status}
                            onChange={(event) => updateQuestionStatus(index, event.target.value)}
                          >
                            {STATUS_OPTIONS.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                            {!STATUS_OPTIONS.includes('Not Completed') && <option value="Not Completed">Not Completed</option>}
                            {!STATUS_OPTIONS.includes('Doubt') && <option value="Doubt">Doubt</option>}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-slate-100 p-4 bg-slate-50 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTaskUpdate}
                className="px-4 py-2 crm-btn-primary rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                Save All Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isEmbedded) return content;

  return (
    <AppShell
      title="Assigned Tasks"
      subtitle="Review and update task assignments in a dedicated table view."
      searchPlaceholder="Search tasks..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {content}
    </AppShell>
  );
}
