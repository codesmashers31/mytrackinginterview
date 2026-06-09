import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, StatusBadge } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { Pencil, Trash2, ArrowLeft, Clock, AlertCircle, CheckCircle2, ChevronRight, MessageSquare } from 'lucide-react';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Review', 'Blocked', 'Completed'];

export default function TaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

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

  return (
    <AppShell
      title="Assigned Tasks"
      subtitle="Review and update task assignments in a dedicated table view."
      searchPlaceholder="Search tasks"
    >
      <div className="space-y-6">
        {!selectedTask ? (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Assignments</h2>
                <p className="mt-1 text-sm text-slate-500">Monitor student progress and manage assigned tasks.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/tasks')}
                className="crm-btn-primary px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2"
              >
                Assign New Task
                <ChevronRight size={16} />
              </button>
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
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {tasks.map(task => {
                  const completedCount = task.questions?.filter(q => q.status === 'Completed').length || 0;
                  const totalCount = task.questions?.length || 0;
                  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
                  
                  return (
                    <SurfaceCard key={task._id} className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-t-4 border-t-blue-500 flex flex-col">
                      <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <StatusBadge status={task.overallStatus} tone={task.overallStatus === 'Completed' ? 'success' : task.overallStatus === 'Blocked' ? 'error' : task.overallStatus === 'In Progress' ? 'warning' : 'info'} />
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openTask(task)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Monitor & Edit">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => handleDelete(task._id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Delete Task">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-slate-900 mb-1 line-clamp-1">{task.title}</h3>
                        <p className="text-sm font-medium text-blue-600 mb-4 bg-blue-50 inline-block px-3 py-1 rounded-full">{task.studentName}</p>
                        
                        <div className="space-y-4 mb-6">
                          <div>
                            <div className="flex justify-between text-xs font-semibold mb-1.5">
                              <span className="text-slate-600">Completion Progress</span>
                              <span className="text-blue-600">{progress}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm border-t border-slate-100 pt-4 mt-auto">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Clock size={16} className="text-slate-400" />
                            <span className="truncate">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <CheckCircle2 size={16} className="text-slate-400" />
                            <span>{completedCount} / {totalCount} Done</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => openTask(task)} className="w-full py-3 bg-slate-50 border-t border-slate-100 text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                        Monitor Details
                        <ChevronRight size={16} />
                      </button>
                    </SurfaceCard>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedTask(null)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Monitor Task: {selectedTask.title}</h2>
                <p className="text-sm text-slate-500">Assigned to <span className="font-semibold text-slate-700">{selectedTask.studentName}</span></p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1 space-y-6">
                <SurfaceCard className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">Assignment Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="crm-label text-xs uppercase tracking-wider text-slate-500">Task Title</label>
                      <input
                        type="text"
                        className="crm-input font-medium"
                        value={selectedTask.title}
                        onChange={(event) => setSelectedTask({ ...selectedTask, title: event.target.value })}
                      />
                    </div>
                    <div>
                      <label className="crm-label text-xs uppercase tracking-wider text-slate-500">Due Date</label>
                      <input
                        type="date"
                        className="crm-input"
                        value={selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : ''}
                        onChange={(event) => setSelectedTask({ ...selectedTask, dueDate: event.target.value })}
                      />
                    </div>
                    <div>
                      <label className="crm-label text-xs uppercase tracking-wider text-slate-500">Overall Status</label>
                      <select
                        className="crm-input bg-slate-50"
                        value={selectedTask.overallStatus}
                        onChange={(event) => setSelectedTask({ ...selectedTask, overallStatus: event.target.value })}
                      >
                        {STATUS_OPTIONS.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="crm-label text-xs uppercase tracking-wider text-slate-500">Description</label>
                      <textarea
                        rows={4}
                        className="crm-input text-sm"
                        value={selectedTask.description}
                        onChange={(event) => setSelectedTask({ ...selectedTask, description: event.target.value })}
                      />
                    </div>
                    <button type="button" onClick={handleTaskUpdate} className="w-full crm-btn-primary py-3 rounded-xl mt-4">
                      Save All Changes
                    </button>
                  </div>
                </SurfaceCard>
              </div>

              <div className="lg:col-span-2">
                <SurfaceCard className="p-6 h-full">
                  <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-900">Question Monitor</h3>
                    <div className="text-sm font-semibold text-slate-500">
                      {selectedTask.questions?.filter(q => q.status === 'Completed').length || 0} of {selectedTask.questions?.length || 0} Completed
                    </div>
                  </div>
                  
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedTask.questions.map((question, index) => (
                      <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start gap-4">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800 text-base">{question.question}</p>
                              
                              {question.remarks && (
                                <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3 flex gap-3 text-sm">
                                  <MessageSquare size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                  <div className="text-slate-700">
                                    <span className="font-semibold text-slate-900 mr-2">Student Notes:</span>
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
                          
                          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                            <StatusBadge status={question.status} tone={question.status === 'Completed' ? 'success' : ['Blocked', 'Not Completed', 'Doubt'].includes(question.status) ? 'error' : question.status === 'In Progress' ? 'warning' : 'info'} />
                            
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Override Status:</span>
                              <select
                                className="crm-input text-sm py-1.5 px-3 min-w-[140px] bg-slate-50"
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
                      </div>
                    ))}
                  </div>
                </SurfaceCard>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
