import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, StatusBadge } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { Edit, Check, X } from 'lucide-react';

export default function SplRegistrations() {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [newReason, setNewReason] = useState('');

  const fetchRegs = async () => {
    setLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || '/api'}/spl-registration`;
      const res = await fetch(apiUrl, { headers: { ...authHeaders() } });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRegs(data);
    } catch (err) {
      toast.error('Could not load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRegs(); }, []);

  const startEdit = (reg) => {
    setEditingId(reg._id);
    setNewStatus(reg.status || 'New');
    setNewReason(reg.statusReason || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewStatus('');
    setNewReason('');
  };

  const saveEdit = async (id) => {
    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || '/api'}/spl-registration/${id}`;
      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status: newStatus, statusReason: newReason }),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      toast.success('Updated');
      setRegs(prev => prev.map(r => r._id === id ? updated : r));
      cancelEdit();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  return (
    <AppShell title="SPL Registrations" subtitle="Submitted SPL class registrations">
      <SurfaceCard>
        <div className="p-4">
          {loading ? (
            <div>Loading...</div>
          ) : regs.length === 0 ? (
            <div>No registrations found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Mobile</th>
                    <th className="px-3 py-2">Degree</th>
                    <th className="px-3 py-2">Batch</th>
                    <th className="px-3 py-2">Willing</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Submitted</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {regs.map(r => (
                    <tr key={r._id} className="border-t">
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2">{r.email}</td>
                      <td className="px-3 py-2">{r.mobile}</td>
                      <td className="px-3 py-2">{r.degree}</td>
                      <td className="px-3 py-2">{r.batch}</td>
                      <td className="px-3 py-2">{r.willingCompanyProcess ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                      <td className="px-3 py-2">{new Date(r.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        {editingId === r._id ? (
                          <div className="flex items-center gap-2">
                            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="px-2 py-1 border rounded">
                              <option>New</option>
                              <option>Reviewed</option>
                              <option>Shortlisted</option>
                              <option>Rejected</option>
                              <option>Placed</option>
                            </select>
                            <input value={newReason} onChange={e => setNewReason(e.target.value)} placeholder="Reason (optional)" className="px-2 py-1 border rounded" />
                            <button onClick={() => saveEdit(r._id)} className="px-2 py-1 bg-emerald-500 text-white rounded"><Check size={14} /></button>
                            <button onClick={cancelEdit} className="px-2 py-1 bg-slate-200 rounded"><X size={14} /></button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(r)} className="px-2 py-1 bg-blue-600 text-white rounded flex items-center gap-2"><Edit size={14} /> Edit</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SurfaceCard>
    </AppShell>
  );
}
