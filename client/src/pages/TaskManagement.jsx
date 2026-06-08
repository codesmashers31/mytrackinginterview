import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { Plus, ClipboardList } from 'lucide-react';

export default function TaskManagement() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    studentId: '',
    title: '',
    description: '',
    dueDate: '',
    questionsText: 'Question 1\nQuestion 2\nQuestion 3'
  });

  const fetchStudents = async () => {
    try {
      const res = await fetch(buildApiUrl('/auth/spl-students'), {
        headers: { ...authHeaders() }
      });
      if (!res.ok) throw new Error('Failed to load students');
      setStudents(await res.json());
    } catch (err) {
      toast.error('Unable to load student accounts');
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (!formData.studentId || !formData.title || !formData.questionsText.trim()) {
      return toast.error('Please choose a student, title, and at least one question');
    }

    const questions = formData.questionsText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(question => ({ question, status: 'Pending' }));

    try {
      const res = await fetch(buildApiUrl('/tasks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          studentId: formData.studentId,
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate,
          questions
        })
      });

      if (!res.ok) throw new Error('Failed to create task');
      const newTask = await res.json();
      setTasks(prev => [newTask, ...prev]);
      toast.success('Task assigned successfully');
      setFormData({ studentId: '', title: '', description: '', dueDate: '', questionsText: 'Question 1\nQuestion 2\nQuestion 3' });
    } catch (err) {
      toast.error('Could not assign task');
    }
  };

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

  const openTask = async (task) => {
    setSelectedTask(task);
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

  const updateQuestionStatus = (index, status) => {
    setSelectedTask(prev => {
      if (!prev) return prev;
      const nextQuestions = prev.questions.map((item, idx) => idx === index ? { ...item, status } : item);
      return { ...prev, questions: nextQuestions };
    });
  };

  return (
    <AppShell
      title="Task Assignment"
      subtitle="Assign new tasks to registered SPL students."
      searchPlaceholder="Search students"
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SurfaceCard className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <ClipboardList size={22} className="text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">New Task Assignment</h2>
              <p className="text-sm text-slate-500">Create tasks with question-level status tracking for student account owners.</p>
            </div>
          </div>

          <form onSubmit={handleCreateTask} className="space-y-5">
            <div>
              <label className="crm-label">Student</label>
              <select
                value={formData.studentId}
                onChange={(event) => setFormData({ ...formData, studentId: event.target.value })}
                className="crm-input"
              >
                <option value="">Select a registered student</option>
                {students.map(student => (
                  <option key={student._id} value={student._id}>
                    {student.name} — {student.email} {student.mobile ? `(${student.mobile})` : ''}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-slate-500">Student accounts are synced from SPL registrations. Initial password is the mobile number from registration.</p>
            </div>

            <div>
              <label className="crm-label">Task Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                className="crm-input"
                placeholder="Example: Weekly coding review"
              />
            </div>

            <div>
              <label className="crm-label">Task Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                className="crm-input"
                placeholder="Add context for the task assignment"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="crm-label">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(event) => setFormData({ ...formData, dueDate: event.target.value })}
                  className="crm-input"
                />
              </div>
              <div>
                <label className="crm-label">Questions</label>
                <textarea
                  rows={4}
                  value={formData.questionsText}
                  onChange={(event) => setFormData({ ...formData, questionsText: event.target.value })}
                  className="crm-input"
                  placeholder="Write one question per line"
                />
              </div>
            </div>

            <button type="submit" className="crm-btn-primary flex items-center justify-center gap-2 px-4 py-3">
              <Plus size={16} /> Assign Task
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Assigned Task List</h2>
              <p className="text-sm text-slate-500">The assigned tasks table has been moved to its own page for better visibility.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/tasks/list')}
              className="crm-btn-secondary"
            >
              Open Assigned Tasks
            </button>
          </div>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
