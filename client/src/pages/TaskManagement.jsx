import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { Plus, ClipboardList, Trash2 } from 'lucide-react';

export default function TaskManagement() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    studentIds: [],
    description: '',
    dueDate: '',
    questions: ['']
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

    const validQuestions = formData.questions
      .map(q => q.trim())
      .filter(Boolean)
      .map(question => ({ question, status: 'Pending' }));

    if (formData.studentIds.length === 0 || !formData.title || validQuestions.length === 0) {
      return toast.error('Please choose at least one student, a title, and at least one valid question');
    }

    try {
      const promises = formData.studentIds.map(studentId => 
        fetch(buildApiUrl('/tasks'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({
            studentId,
            title: formData.title,
            description: formData.description,
            dueDate: formData.dueDate,
            questions: validQuestions
          })
        }).then(res => {
          if (!res.ok) throw new Error('Failed to create task for a student');
          return res.json();
        })
      );

      await Promise.all(promises);

      toast.success(`Tasks assigned successfully to ${formData.studentIds.length} student(s)`);
      setFormData({ studentIds: [], title: '', description: '', dueDate: '', questions: [''] });
    } catch (err) {
      toast.error('Could not assign some or all tasks');
    }
  };


  return (
    <AppShell
      title="Task Assignment"
      subtitle="Assign new tasks to registered SPL students."
      searchPlaceholder="Search students"
    >
      <div className="max-w-4xl mx-auto">
        <SurfaceCard className="p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <ClipboardList size={26} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">New Task Assignment</h2>
              <p className="text-slate-500 mt-1">Create tasks with question-level status tracking for student account owners.</p>
            </div>
          </div>

          <form onSubmit={handleCreateTask} className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="text-base font-semibold text-slate-800">Select Students</label>
                  <p className="text-sm text-slate-500">Choose who should receive this task</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (formData.studentIds.length === students.length && students.length > 0) {
                      setFormData({ ...formData, studentIds: [] });
                    } else {
                      setFormData({ ...formData, studentIds: students.map(s => s._id) });
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  {formData.studentIds.length === students.length && students.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50/50">
                {students.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 italic">No students available.</div>
                ) : (
                  students.map(student => (
                    <label key={student._id} className="flex items-center gap-4 p-3 hover:bg-white rounded-md cursor-pointer transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm">
                      <input
                        type="checkbox"
                        checked={formData.studentIds.includes(student._id)}
                        onChange={(e) => {
                          const newIds = e.target.checked
                            ? [...formData.studentIds, student._id]
                            : formData.studentIds.filter(id => id !== student._id);
                          setFormData({ ...formData, studentIds: newIds });
                        }}
                        className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">{student.name}</span>
                        <span className="text-xs text-slate-500">{student.email} {student.mobile ? `• ${student.mobile}` : ''}</span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="crm-label font-medium text-slate-800">Task Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                  className="crm-input p-3"
                  placeholder="Example: Weekly coding review"
                />
              </div>

              <div>
                <label className="crm-label font-medium text-slate-800">Task Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  className="crm-input p-3"
                  placeholder="Add context for the task assignment"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="crm-label font-medium text-slate-800">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(event) => setFormData({ ...formData, dueDate: event.target.value })}
                    className="crm-input p-3"
                  />
                </div>
                
                <div className="md:col-span-2 mt-2 border-t border-slate-100 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="text-base font-semibold text-slate-800">Questions List</label>
                      <p className="text-sm text-slate-500">Add individual tasks or questions for this assignment</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, questions: [...formData.questions, ''] })}
                      className="text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <Plus size={16} /> Add Question
                    </button>
                  </div>
                  
                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    {formData.questions.map((q, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-blue-300">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
                          {i + 1}
                        </div>
                        <input
                          type="text"
                          value={q}
                          onChange={(e) => {
                            const newQs = [...formData.questions];
                            newQs[i] = e.target.value;
                            setFormData({ ...formData, questions: newQs });
                          }}
                          className="crm-input flex-1 h-10 border-transparent bg-transparent shadow-none focus:border-transparent focus:ring-0 px-2"
                          placeholder={`Enter question or task detail ${i + 1}...`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newQs = formData.questions.filter((_, idx) => idx !== i);
                            setFormData({ ...formData, questions: newQs.length ? newQs : [''] });
                          }}
                          className="flex h-10 w-10 items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-100">
              <button type="submit" className="w-full sm:w-auto crm-btn-primary flex items-center justify-center gap-2 px-8 py-3 text-base font-medium">
                <Plus size={20} /> Assign Task to Selected Students
              </button>
            </div>
          </form>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
