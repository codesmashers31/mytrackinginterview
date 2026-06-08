import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, StatusBadge, SectionTabs } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { ClipboardList, CheckCircle2 } from 'lucide-react';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Review', 'Blocked', 'Completed'];

export default function StudentTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMyTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/tasks/my/list'), {
        headers: { ...authHeaders() }
      });
      if (!res.ok) throw new Error('Failed to load your tasks');
      setTasks(await res.json());
    } catch (err) {
      toast.error('Unable to load your tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const updateQuestionStatus = async (taskId, questionIndex, status) => {
    const task = tasks.find(item => item._id === taskId);
    if (!task) return;
    const updatedQuestions = task.questions.map((question, index) =>
      index === questionIndex ? { ...question, status } : question
    );

    try {
      const res = await fetch(buildApiUrl(`/tasks/${taskId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ questions: updatedQuestions })
      });
      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();
      setTasks(prev => prev.map(item => (item._id === taskId ? data : item)));
      toast.success('Question status updated');
    } catch (err) {
      toast.error('Could not update question status');
    }
  };

  return (
    <AppShell
      title="Student Tasks"
      subtitle="Review your assigned tasks and update question-level progress." 
      searchPlaceholder="Search your tasks"
    >
      <SectionTabs items={[{ label: 'My Task List', active: true }]} />

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {tasks.length === 0 ? (
            <SurfaceCard className="p-8 text-center text-slate-600">
              <div className="mb-4 text-3xl">📭</div>
              <p className="text-lg font-semibold text-slate-900">No tasks assigned yet</p>
              <p className="mt-2 text-sm">Ask your administrator to assign task questions to you.</p>
            </SurfaceCard>
          ) : (
            tasks.map(task => (
              <SurfaceCard key={task._id} className="p-6">
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{task.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">Assigned by {task.assignedBy}</p>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <StatusBadge status={task.overallStatus} tone={task.overallStatus === 'Completed' ? 'success' : task.overallStatus === 'Blocked' ? 'error' : task.overallStatus === 'In Progress' ? 'warning' : 'info'} />
                    {task.dueDate && <p className="text-sm text-slate-500">Due {new Date(task.dueDate).toLocaleDateString()}</p>}
                  </div>
                </div>

                {task.description && <p className="mb-6 text-slate-600">{task.description}</p>}

                <div className="space-y-4">
                  {task.questions.map((question, index) => (
                    <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">Question {index + 1}</p>
                          <p className="text-sm text-slate-600">{question.question}</p>
                        </div>
                        <StatusBadge status={question.status} tone={question.status === 'Completed' ? 'success' : question.status === 'Blocked' ? 'error' : question.status === 'In Progress' ? 'warning' : 'info'} />
                      </div>

                      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                        <div>
                          <label className="crm-label">Update status</label>
                          <select
                            className="crm-input w-full"
                            value={question.status}
                            onChange={(event) => updateQuestionStatus(task._id, index, event.target.value)}
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
              </SurfaceCard>
            ))
          )}
        </div>
      )}
    </AppShell>
  );
}
