import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, StatusBadge } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { Pencil, Trash2, CheckCircle2 } from 'lucide-react';

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
        <SurfaceCard className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Assigned Task Table</h2>
              <p className="text-sm text-slate-500">Use this page to view all tasks, edit status, and delete assignments.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="crm-btn-secondary"
            >
              Back to Task Assignment
            </button>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          {loading ? (
            <div className="mt-8 flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-700">
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Task</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Questions</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">{task.studentName}</td>
                      <td className="px-4 py-3 text-slate-600">{task.title}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={task.overallStatus} tone={task.overallStatus === 'Completed' ? 'success' : task.overallStatus === 'Blocked' ? 'error' : task.overallStatus === 'In Progress' ? 'warning' : 'info'} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {task.questions?.map((question, index) => (
                          <div key={index} className="mb-1 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                            <span>{index + 1}</span>
                            <span>{question.status}</span>
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openTask(task)}
                          className="crm-button crm-button-secondary mr-2"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(task._id)}
                          className="crm-button crm-button-danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tasks.length === 0 && <p className="mt-6 text-center text-slate-500">No tasks assigned yet.</p>}
            </div>
          )}
        </SurfaceCard>

        {selectedTask && (
          <SurfaceCard className="p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Edit Task</h3>
                <p className="text-sm text-slate-500">Update the assignment details and question statuses.</p>
              </div>
              <button type="button" onClick={() => setSelectedTask(null)} className="text-sm text-slate-500 hover:text-slate-900">Close</button>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div>
                <label className="crm-label">Task Title</label>
                <input
                  type="text"
                  className="crm-input"
                  value={selectedTask.title}
                  onChange={(event) => setSelectedTask({ ...selectedTask, title: event.target.value })}
                />
              </div>
              <div>
                <label className="crm-label">Due Date</label>
                <input
                  type="date"
                  className="crm-input"
                  value={selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : ''}
                  onChange={(event) => setSelectedTask({ ...selectedTask, dueDate: event.target.value })}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="crm-label">Task Description</label>
              <textarea
                rows={4}
                className="crm-input"
                value={selectedTask.description}
                onChange={(event) => setSelectedTask({ ...selectedTask, description: event.target.value })}
              />
            </div>

            <div className="mt-4">
              <label className="crm-label">Overall Status</label>
              <select
                className="crm-input"
                value={selectedTask.overallStatus}
                onChange={(event) => setSelectedTask({ ...selectedTask, overallStatus: event.target.value })}
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="mt-6">
              <h4 className="mb-3 text-base font-semibold text-slate-900">Question Statuses</h4>
              <div className="space-y-4">
                {selectedTask.questions.map((question, index) => (
                  <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{question.question}</p>
                        <p className="text-sm text-slate-500">Question {index + 1}</p>
                      </div>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <select
                          className="crm-input min-w-45"
                          value={question.status}
                          onChange={(event) => updateQuestionStatus(index, event.target.value)}
                        >
                          {STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={handleTaskUpdate} className="crm-btn-primary px-5 py-3">
                Save Changes
              </button>
            </div>
          </SurfaceCard>
        )}
      </div>
    </AppShell>
  );
}
