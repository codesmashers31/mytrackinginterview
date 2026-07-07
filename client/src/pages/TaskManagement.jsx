import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, SectionTabs } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { Plus, ClipboardList, Trash2 } from 'lucide-react';
import TaskList from './TaskList';
import AdminMockBoard from './AdminMockBoard';

export default function TaskManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.selectedStudentIds ? 'assign' : 'list');
  const [students, setStudents] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [stackFilter, setStackFilter] = useState('');
  const [prevTypeFilter, setPrevTypeFilter] = useState('');
  const [formData, setFormData] = useState({
    studentIds: [],
    title: '',
    description: '',
    dueDate: '',
    questions: ['']
  });
  const [submitting, setSubmitting] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);

  const filteredStudents = students.filter(student => {
    const matchesSearch = (student.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (student.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (student.mobile || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter ? student.grade === gradeFilter : true;
    const matchesType = typeFilter ? student.type === typeFilter : true;
    const matchesBatch = batchFilter ? student.batch === batchFilter : true;
    const matchesStack = stackFilter ? student.stack === stackFilter : true;
    return matchesSearch && matchesGrade && matchesType && matchesBatch && matchesStack;
  });

  const uniqueBatches = Array.from(new Set(students.map(s => s.batch).filter(Boolean)))
    .filter(b => /^(Batch\s*[1-9]\b|Frontend)$/i.test(b.trim()))
    .sort((a, b) => {
      if (a === 'Frontend') return 1;
      if (b === 'Frontend') return -1;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  const uniqueStacks = Array.from(new Set(students.map(s => s.stack).filter(Boolean))).sort();

  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const res = await fetch(buildApiUrl('/auth/task-students'), {
        headers: { ...authHeaders() }
      });
      if (!res.ok) throw new Error('Failed to load students');
      setStudents(await res.json());
    } catch (err) {
      toast.error('Unable to load student accounts');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (students.length > 0 && location.state?.selectedStudentIds) {
      const mappedUserIds = students
        .filter(s => 
          (s.studentId && location.state.selectedStudentIds.includes(s.studentId.toString())) || 
          location.state.selectedStudentIds.includes(s._id.toString())
        )
        .map(s => s._id);
      setFormData(prev => ({
        ...prev,
        studentIds: mappedUserIds
      }));
    }
  }, [students, location.state]);

  useEffect(() => {
    if (typeFilter !== prevTypeFilter) {
      setFormData(prev => ({ ...prev, studentIds: [] }));
      setPrevTypeFilter(typeFilter);
    }
  }, [typeFilter, prevTypeFilter]);

  useEffect(() => {
    if (cooldownTime <= 0) return;
    const timer = setInterval(() => {
      setCooldownTime(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownTime]);

  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (submitting || cooldownTime > 0) return;

    const validQuestions = formData.questions
      .map(q => q.trim())
      .filter(Boolean)
      .map(question => ({ question, status: 'Pending' }));

    if (formData.studentIds.length === 0 || !formData.title || validQuestions.length === 0) {
      return toast.error('Please choose at least one student, a title, and at least one valid question');
    }

    setSubmitting(true);
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
      setCooldownTime(30);
    } catch (err) {
      toast.error('Could not assign some or all tasks');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <AppShell
      title="Tasks & Mock Board"
      subtitle="Manage task assignments, track progress, and coordinate mock interviews."
    >
      <SectionTabs
        items={[
          {
            label: 'Active Assignments',
            active: activeTab === 'list',
            onClick: () => setActiveTab('list')
          },
          {
            label: 'Assign New Task',
            active: activeTab === 'assign',
            onClick: () => setActiveTab('assign')
          },
          {
            label: 'Mock Interview Board',
            active: activeTab === 'mock',
            onClick: () => setActiveTab('mock')
          }
        ]}
      />

      <div className="mt-6">
        {activeTab === 'list' && (
          <TaskList isEmbedded={true} onSwitchTab={setActiveTab} />
        )}

        {activeTab === 'mock' && (
          <AdminMockBoard isEmbedded={true} />
        )}

        {activeTab === 'assign' && (
          <div className="w-full">
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <div>
                  <label className="text-base font-semibold text-slate-800">Select Students</label>
                  <p className="text-sm text-slate-500">Choose who should receive this task</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search name, email, mobile..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="crm-input h-9 py-1 px-3 text-sm flex-1 sm:flex-none w-full sm:w-48"
                  />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="crm-input h-9 py-1 px-3 text-sm flex-1 sm:flex-none w-full sm:w-36"
                  >
                    <option value="">All Types</option>
                    <option value="SPL Class Student">SPL Class</option>
                    <option value="Directory Student">Directory</option>
                  </select>
                  <select
                    value={stackFilter}
                    onChange={(e) => setStackFilter(e.target.value)}
                    className="crm-input h-9 py-1 px-3 text-sm flex-1 sm:flex-none w-full sm:w-32"
                  >
                    <option value="">All Stacks</option>
                    {uniqueStacks.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                    className="crm-input h-9 py-1 px-3 text-sm flex-1 sm:flex-none w-full sm:w-32"
                  >
                    <option value="">All Batches</option>
                    {uniqueBatches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="crm-input h-9 py-1 px-3 text-sm flex-1 sm:flex-none w-full sm:w-32"
                  >
                    <option value="">All Grades</option>
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const currentSelectedFiltered = filteredStudents.filter(s => formData.studentIds.includes(s._id));
                      if (currentSelectedFiltered.length === filteredStudents.length && filteredStudents.length > 0) {
                        // Deselect all filtered
                        const filteredIds = filteredStudents.map(s => s._id);
                        setFormData({ ...formData, studentIds: formData.studentIds.filter(id => !filteredIds.includes(id)) });
                      } else {
                        // Select all filtered (keeping already selected ones)
                        const newIds = new Set([...formData.studentIds, ...filteredStudents.map(s => s._id)]);
                        setFormData({ ...formData, studentIds: Array.from(newIds) });
                      }
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {filteredStudents.length > 0 && filteredStudents.every(s => formData.studentIds.includes(s._id)) ? 'Deselect Filtered' : 'Select Filtered'}
                  </button>
                </div>
              </div>
              {formData.studentIds.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-800">Selected Candidates ({formData.studentIds.length})</span>
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, studentIds: [] })} 
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Clear Selection
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar p-1">
                    {formData.studentIds.map(id => {
                      const student = students.find(s => s._id === id);
                      if (!student) return null;
                      return (
                        <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-blue-700 border border-blue-200 shadow-sm">
                          {student.name}
                          <button 
                            type="button" 
                            onClick={() => setFormData({ ...formData, studentIds: formData.studentIds.filter(x => x !== id) })}
                            className="text-blue-400 hover:text-red-500 font-bold transition-colors"
                          >
                            &times;
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50/50 min-h-[150px]">
                {isLoadingStudents ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3"></div>
                    <span className="text-sm text-slate-500 font-medium">Loading students...</span>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 italic">No matching students found.</div>
                ) : (
                  filteredStudents.map(student => (
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
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-semibold text-slate-800">{student.name}</span>
                        <span className="text-xs text-slate-500">
                          {student.email} {student.mobile ? `• ${student.mobile}` : ''}
                          {student.batch ? ` • Batch: ${student.batch}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {student.stack && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            {student.stack}
                          </span>
                        )}
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium ${
                          student.type === 'SPL Class Student' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-50 text-slate-700 border border-slate-100'
                        }`}>
                          {student.type === 'SPL Class Student' ? 'SPL Class' : 'Directory'}
                        </span>
                        {student.grade && (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            student.grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                            student.grade === 'B' ? 'bg-amber-100 text-amber-700' :
                            student.grade === 'C' ? 'bg-rose-100 text-rose-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            Grade {student.grade}
                          </span>
                        )}
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
                      <Plus size={16} /> Add Task Box
                    </button>
                  </div>
                  
                  <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    {formData.questions.map((q, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-blue-300">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
                          {i + 1}
                        </div>
                        <textarea
                          rows={2}
                          value={q}
                          onChange={(e) => {
                            const newQs = [...formData.questions];
                            newQs[i] = e.target.value;
                            setFormData({ ...formData, questions: newQs });
                          }}
                          className="crm-input flex-1 border-transparent bg-transparent shadow-none focus:border-transparent focus:ring-0 px-2 py-2 resize-y min-h-[60px]"
                          placeholder={`Enter question or task detail ${i + 1}...`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newQs = formData.questions.filter((_, idx) => idx !== i);
                            setFormData({ ...formData, questions: newQs.length ? newQs : [''] });
                          }}
                          className="flex h-10 w-10 shrink-0 items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              <button 
                type="submit" 
                disabled={submitting || cooldownTime > 0}
                className={`w-full sm:w-auto crm-btn-primary flex items-center justify-center gap-2 px-8 py-3 text-base font-medium ${(submitting || cooldownTime > 0) ? 'opacity-50 cursor-not-allowed bg-slate-400' : ''}`}
              >
                {submitting ? (
                  <>
                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                    Assigning Tasks...
                  </>
                ) : cooldownTime > 0 ? (
                  <>
                    <Plus size={20} /> Assign Task to Selected Students (Wait {cooldownTime}s)
                  </>
                ) : (
                  <>
                    <Plus size={20} /> Assign Task to Selected Students
                  </>
                )}
              </button>
            </div>
          </form>
            </SurfaceCard>
          </div>
        )}
      </div>
    </AppShell>
  );
}
