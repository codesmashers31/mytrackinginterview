import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, StatusBadge } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { Pencil, Trash2, ArrowLeft, ArrowRight, Clock, AlertCircle, CheckCircle2, ChevronRight, MessageSquare, Search, Filter, X, SlidersHorizontal, ChevronDown, Mail, Calendar, ClipboardList } from 'lucide-react';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Review', 'Blocked', 'Completed'];
const ITEMS_PER_PAGE = 8;

export default function TaskList({ isEmbedded = false, onSwitchTab }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    candidate: true,
    taskDetail: true,
    progress: true,
    dueDate: true,
    status: true
  });
  const [students, setStudents] = useState([]);
  const [batchFilter, setBatchFilter] = useState('All');
  const [stackFilter, setStackFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

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

  const fetchStudents = async () => {
    try {
      const res = await fetch(buildApiUrl('/auth/task-students'), {
        headers: { ...authHeaders() }
      });
      if (res.ok) {
        setStudents(await res.json());
      }
    } catch (err) {
      console.error('Failed to load student details for filtering:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchStudents();
  }, []);

  const enrichedTasks = React.useMemo(() => {
    return tasks.map(task => {
      const student = students.find(s => 
        s.email?.toLowerCase() === task.studentEmail?.toLowerCase() ||
        s._id === task.studentId ||
        s.studentId === task.studentId
      );
      return {
        ...task,
        studentBatch: student?.batch || 'No Batch',
        studentStack: student?.stack || 'No Stack',
        studentType: student?.type || (student?.studentType === 'SPL' ? 'SPL Class Student' : 'Directory Student')
      };
    });
  }, [tasks, students]);

  const uniqueBatches = React.useMemo(() => {
    const batches = students.map(s => s.batch).filter(Boolean);
    return Array.from(new Set(batches)).sort();
  }, [students]);

  const uniqueStacks = React.useMemo(() => {
    const stacks = students.map(s => s.stack).filter(Boolean);
    return Array.from(new Set(stacks)).sort();
  }, [students]);

  const filteredTasks = React.useMemo(() => {
    return enrichedTasks.filter(task => {
      // Date filter
      if (filterDate && (!task.dueDate || task.dueDate.split('T')[0] !== filterDate)) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'All' && task.overallStatus !== statusFilter) {
        return false;
      }
      // Batch filter
      if (batchFilter !== 'All' && task.studentBatch !== batchFilter) {
        return false;
      }
      // Stack filter
      if (stackFilter !== 'All' && task.studentStack !== stackFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'All' && task.studentType !== typeFilter) {
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
  }, [enrichedTasks, filterDate, statusFilter, batchFilter, stackFilter, typeFilter, searchQuery]);

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = React.useMemo(() => Math.max(1, Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)), [filteredTasks]);
  const currentItems = React.useMemo(() => filteredTasks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [filteredTasks, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, filterDate, batchFilter, stackFilter, typeFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

      {/* Compact Filters Toolbar */}
      <div className="flex flex-wrap gap-2 items-center bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs mb-6">
        {/* Search Input */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search student or task..."
            className="w-full pl-8.5 pr-8 h-9 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-auto min-w-[130px]">
          <select
            className="w-full h-9 py-1.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-xs font-semibold text-slate-700 cursor-pointer transition-shadow"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Student Type Filter */}
        <div className="w-full sm:w-auto min-w-[135px]">
          <select
            className="w-full h-9 py-1.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-xs font-semibold text-slate-700 cursor-pointer transition-shadow"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="SPL Class Student">SPL Class</option>
            <option value="Directory Student">Directory Student</option>
            <option value="Frontend Student">Frontend Student</option>
          </select>
        </div>

        {/* Batch Filter */}
        <div className="w-full sm:w-auto min-w-[130px]">
          <select
            className="w-full h-9 py-1.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-xs font-semibold text-slate-700 cursor-pointer transition-shadow"
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
          >
            <option value="All">All Batches</option>
            {uniqueBatches.map(batch => (
              <option key={batch} value={batch}>{batch}</option>
            ))}
          </select>
        </div>

        {/* Tech Stack Filter */}
        <div className="w-full sm:w-auto min-w-[130px]">
          <select
            className="w-full h-9 py-1.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-xs font-semibold text-slate-700 cursor-pointer transition-shadow"
            value={stackFilter}
            onChange={(e) => setStackFilter(e.target.value)}
          >
            <option value="All">All Stacks</option>
            {uniqueStacks.map(stack => (
              <option key={stack} value={stack}>{stack}</option>
            ))}
          </select>
        </div>

        {/* Due Date Filter */}
        <div className="w-full sm:w-auto min-w-[130px]">
          <input
            type="date"
            className="w-full h-9 py-1.5 px-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-xs font-semibold text-slate-700 cursor-pointer transition-all"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        {/* Clear Filters Button */}
        {(searchQuery || statusFilter !== 'All' || filterDate || batchFilter !== 'All' || stackFilter !== 'All' || typeFilter !== 'All') ? (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('All');
              setFilterDate('');
              setBatchFilter('All');
              setStackFilter('All');
              setTypeFilter('All');
            }}
            className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
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
          <div className="px-4 md:px-5 py-3 border-b border-slate-100 bg-white flex flex-col gap-2 md:flex-row md:items-center md:justify-between relative">
             <div>
                <h3 className="text-sm md:text-base font-bold text-[#1e293b]">Active Assignments</h3>
                <p className="text-[11px] md:text-xs font-medium text-slate-550">
                  Showing <span className="font-bold text-slate-700">{filteredTasks.length}</span> task{filteredTasks.length === 1 ? '' : 's'}
                </p>
             </div>

             {/* Column Visibility Selector */}
             <div className="relative">
               <button 
                 onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                 className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
               >
                 <SlidersHorizontal size={13} />
                 <span>Columns</span>
                 <ChevronDown size={12} className={`transition-transform duration-200 ${showColumnDropdown ? 'rotate-180' : ''}`} />
               </button>

               {showColumnDropdown && (
                 <>
                   <div className="fixed inset-0 z-10" onClick={() => setShowColumnDropdown(false)}></div>
                   <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-2 text-left">
                     <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1.5">
                       Toggle Columns
                     </div>
                     {Object.keys(visibleColumns).map((col) => (
                       <label key={col} className="flex items-center px-3 py-1.5 hover:bg-slate-50 cursor-pointer select-none text-xs font-medium text-slate-700 gap-2">
                         <input 
                           type="checkbox"
                           checked={visibleColumns[col]}
                           onChange={() => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))}
                           className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                         />
                         <span>{col === 'candidate' ? 'Candidate' : 
                                col === 'taskDetail' ? 'Task Detail' : 
                                col === 'progress' ? 'Progress' : 
                                col === 'dueDate' ? 'Due Date' : 
                                col === 'status' ? 'Status' : col}</span>
                       </label>
                     ))}
                   </div>
                 </>
               )}
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left divide-y divide-slate-100">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {visibleColumns.candidate && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Candidate</th>}
                  {visibleColumns.taskDetail && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Task Detail</th>}
                  {visibleColumns.progress && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Progress</th>}
                  {visibleColumns.dueDate && <th className="hidden sm:table-cell px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Due Date</th>}
                  {visibleColumns.status && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>}
                  <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {currentItems.map((task) => {
                  const completedCount = task.questions?.filter(q => q.status === 'Completed').length || 0;
                  const totalCount = task.questions?.length || 0;
                  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

                  return (
                    <tr key={task._id} className="transition-all hover:bg-slate-50/70 border-l-2 border-l-transparent hover:border-l-blue-600 duration-150">
                      {/* Candidate Column */}
                      {visibleColumns.candidate && (
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shadow-xs shrink-0 select-none">
                              {task.studentName ? task.studentName.slice(0, 2).toUpperCase() : 'ST'}
                            </div>
                            <div className="min-w-0 max-w-[130px]">
                              <p className="text-xs font-bold text-slate-800 truncate leading-tight hover:text-blue-600 transition-colors cursor-pointer" title={task.studentName}>{task.studentName}</p>
                              <p className="text-[10px] text-slate-450 truncate mt-0.5 leading-none flex items-center gap-1" title={task.studentEmail || 'No email'}>
                                <Mail size={10} className="shrink-0 text-slate-400/85" />
                                <span>{task.studentEmail || 'No email'}</span>
                              </p>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Task Detail Column */}
                      {visibleColumns.taskDetail && (
                        <td className="px-3 py-2.5 text-xs text-slate-650">
                          <div className="flex items-center gap-1.5">
                            <div className="p-1 rounded-md bg-slate-100/80 text-slate-500 shrink-0">
                              <ClipboardList size={11} />
                            </div>
                            <div className="min-w-0 max-w-[180px]">
                              <p className="font-bold text-slate-700 leading-tight truncate" title={task.title}>{task.title}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-none truncate" title={task.description || 'No description'}>{task.description || 'No description'}</p>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Progress Column */}
                      {visibleColumns.progress && (
                        <td className="px-3 py-2.5 text-xs">
                          <div className="w-24 sm:w-28">
                            <div className="flex justify-between text-[10px] font-bold mb-1 text-slate-500">
                              <span>{completedCount}/{totalCount} Done</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-150 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Due Date Column */}
                      {visibleColumns.dueDate && (
                        <td className="hidden sm:table-cell px-3 py-2.5 text-xs font-semibold text-slate-600">
                          <div className="flex items-center gap-1.5 text-slate-650">
                            <div className="p-1 rounded-md bg-slate-100/80 text-slate-500 shrink-0">
                              <Calendar size={11} />
                            </div>
                            <span className="truncate max-w-[90px] block" title={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date'}>
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date'}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Status Column */}
                      {visibleColumns.status && (
                        <td className="px-3 py-2.5">
                          <StatusBadge 
                            status={task.overallStatus} 
                            tone={task.overallStatus === 'Completed' ? 'success' : task.overallStatus === 'Blocked' ? 'error' : task.overallStatus === 'In Progress' ? 'warning' : 'info'} 
                          />
                        </td>
                      )}

                      {/* Actions Column */}
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-1.5">
                          <button 
                            type="button"
                            onClick={() => openTask(task)} 
                            className="p-1.5 text-blue-600 hover:text-white bg-blue-50/50 hover:bg-blue-600 rounded-lg transition-all duration-200 border border-blue-100/50 hover:border-blue-600 hover:scale-105 active:scale-95 shadow-2xs hover:shadow-[0_4px_12px_rgba(37,99,235,0.2)] cursor-pointer"
                            title="Monitor Task"
                          >
                            <Pencil size={13} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDelete(task._id)} 
                            className="p-1.5 text-rose-650 hover:text-white bg-rose-50/30 hover:bg-rose-600 rounded-lg transition-all duration-200 border border-rose-100/50 hover:border-rose-600 hover:scale-105 active:scale-95 shadow-2xs hover:shadow-[0_4px_12px_rgba(225,29,72,0.2)] cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-4 md:px-5 py-4 border-t border-slate-100 bg-white flex flex-col gap-3 text-xs text-slate-650 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing <span className="font-semibold text-slate-900">{currentItems.length}</span> of <span className="font-semibold text-slate-900">{filteredTasks.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <ArrowLeft size={14} /> Previous
              </button>
              <span className="text-slate-800">Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span></span>
              <button
                type="button"
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                Next <ArrowRight size={14} />
              </button>
            </div>
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
