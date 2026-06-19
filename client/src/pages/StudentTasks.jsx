import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, StatusBadge, SectionTabs } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import StudentMockScheduler from './StudentMockScheduler';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'Not Completed', 'Doubt'];

const QuestionItem = ({ task, question, index, onUpdate }) => {
  const [status, setStatus] = useState(question.status);
  const [remarks, setRemarks] = useState(question.remarks || '');

  useEffect(() => {
    setStatus(question.status);
    setRemarks(question.remarks || '');
  }, [question.status, question.remarks]);

  const handleSave = () => {
    if (['Doubt', 'Not Completed'].includes(status) && !remarks.trim()) {
      return toast.error('Please provide a reason for this status');
    }
    if (status === 'Completed' && !remarks.trim()) {
      return toast.error('Please provide a link to your completed work');
    }
    onUpdate(task._id, index, { status, remarks });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">Question {index + 1}</p>
          <p className="text-sm text-slate-600">{question.question}</p>
        </div>
        <StatusBadge status={question.status} tone={question.status === 'Completed' ? 'success' : ['Blocked', 'Not Completed', 'Doubt'].includes(question.status) ? 'error' : question.status === 'In Progress' ? 'warning' : 'info'} />
      </div>

      <div className="grid gap-3 md:grid-cols-[200px_1fr_auto] mt-4">
        <div>
          <label className="crm-label">Update status</label>
          <select
            className="crm-input w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="crm-label">Link / Reason {['Completed', 'Not Completed', 'Doubt'].includes(status) && <span className="text-red-500">*</span>}</label>
          <input
            type="text"
            className="crm-input w-full"
            placeholder={status === 'Completed' ? "Paste link to work..." : "Enter reason/link..."}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button 
            onClick={handleSave}
            className="crm-btn-primary w-full md:w-auto px-6 py-2 text-sm h-[42px]"
          >
            Save Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default function StudentTasks() {
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'mocks'
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('All');

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

  const updateQuestionData = async (taskId, questionIndex, updates) => {
    const task = tasks.find(item => item._id === taskId);
    if (!task) return;
    const updatedQuestions = task.questions.map((question, index) =>
      index === questionIndex ? { ...question, ...updates } : question
    );

    const allCompleted = updatedQuestions.length > 0 && updatedQuestions.every(q => q.status === 'Completed');
    const anyInProgress = updatedQuestions.some(q => q.status === 'In Progress');
    const anyBlocked = updatedQuestions.some(q => ['Blocked', 'Doubt'].includes(q.status));
    
    let overallStatus = task.overallStatus;
    if (allCompleted) {
      overallStatus = 'Completed';
    } else if (anyBlocked) {
      overallStatus = 'Blocked';
    } else if (anyInProgress || updatedQuestions.some(q => q.status === 'Completed')) {
      overallStatus = 'In Progress';
    }

    try {
      const res = await fetch(buildApiUrl(`/tasks/${taskId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ questions: updatedQuestions, overallStatus })
      });
      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();
      setTasks(prev => prev.map(item => (item._id === taskId ? data : item)));
      toast.success('Question updated successfully');
    } catch (err) {
      toast.error('Could not update question');
    }
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    const dateStr = task.assignedAt 
      ? new Date(task.assignedAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : new Date(task.createdAt || Date.now()).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(task);
    return acc;
  }, {});
  
  const dateGroups = Object.entries(groupedTasks);
  const availableDates = Object.keys(groupedTasks);

  const filteredGroups = selectedDate === 'All' 
    ? dateGroups 
    : dateGroups.filter(([dateString]) => dateString === selectedDate);

  return (
    <AppShell
      title="Tasks & Mock Board"
      subtitle="Review your assigned tasks and coordinate mock interviews." 
    >
      <SectionTabs
        items={[
          {
            label: 'My Tasks',
            active: activeTab === 'tasks',
            onClick: () => setActiveTab('tasks')
          },
          {
            label: 'Mock Interviews',
            active: activeTab === 'mocks',
            onClick: () => setActiveTab('mocks')
          }
        ]}
      />

      <div className="mt-6">
        {activeTab === 'tasks' && (
          <>
            {!loading && availableDates.length > 0 && (
              <div className="flex justify-end mb-6">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-700">Filter by Date:</label>
                  <select
                    className="crm-input py-2 min-w-[220px] bg-white shadow-sm cursor-pointer"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  >
                    <option value="All">All Dates</option>
                    {availableDates.map(date => (
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-10">
                {tasks.length === 0 ? (
                  <SurfaceCard className="p-8 text-center text-slate-600">
                    <div className="mb-4 text-3xl">📭</div>
                    <p className="text-lg font-semibold text-slate-900">No tasks assigned yet</p>
                    <p className="mt-2 text-sm">Ask your administrator to assign task questions to you.</p>
                  </SurfaceCard>
                ) : (
                  filteredGroups.map(([dateString, dateTasks]) => (
                    <div key={dateString} className="space-y-5">
                      <div className="flex items-center gap-4 pt-2">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 bg-white px-5 py-1.5 rounded-full border border-slate-200 shadow-sm">{dateString}</h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
                      </div>
                      
                      <div className="space-y-6">
                        {dateTasks.map(task => (
                          <SurfaceCard key={task._id} className="p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                              <div>
                                <h2 className="text-xl font-bold text-slate-900">{task.title}</h2>
                                <p className="mt-1 text-sm text-slate-500">Assigned by <span className="font-medium text-slate-700">{task.assignedBy || 'Admin'}</span></p>
                              </div>
                              <div className="flex flex-col items-start gap-2 sm:items-end">
                                <StatusBadge status={task.overallStatus} tone={task.overallStatus === 'Completed' ? 'success' : ['Blocked', 'Not Completed', 'Doubt'].includes(task.overallStatus) ? 'error' : task.overallStatus === 'In Progress' ? 'warning' : 'info'} />
                                {task.dueDate && <p className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Due {new Date(task.dueDate).toLocaleDateString()}</p>}
                              </div>
                            </div>

                            {task.description && <p className="mb-6 text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">{task.description}</p>}

                            <div className="space-y-4">
                              {task.questions.map((question, index) => (
                                <QuestionItem 
                                  key={index} 
                                  task={task} 
                                  question={question} 
                                  index={index} 
                                  onUpdate={updateQuestionData} 
                                />
                              ))}
                            </div>
                          </SurfaceCard>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'mocks' && (
          <StudentMockScheduler isEmbedded={true} />
        )}
      </div>
    </AppShell>
  );
}
