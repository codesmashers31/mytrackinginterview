import React, { useEffect, useState } from 'react';
import { fetchPlacements, createPlacement, updateUser, deleteUser } from '../utils/api';
import { toast } from 'react-hot-toast';
import { AppShell, SurfaceCard } from '../components/AppShell';
import { Edit2, Trash2, X } from 'lucide-react';

export default function PlacementManagement() {
  const [placements, setPlacements] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  
  // Edit modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '' });

  const loadPlacements = async () => {
    try {
      const data = await fetchPlacements();
      setPlacements(data);
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    loadPlacements();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPlacement(form);
      toast.success('Placement Support account created');
      setForm({ name: '', email: '', password: '' });
      loadPlacements();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleEditClick = (officer) => {
    setEditingPlacement(officer);
    setEditForm({ name: officer.name, email: officer.email, password: '' });
    setIsEditOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser(editingPlacement._id, editForm);
      toast.success('Placement Support account updated');
      setIsEditOpen(false);
      setEditingPlacement(null);
      loadPlacements();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this placement officer account?')) {
      try {
        await deleteUser(id);
        toast.success('Placement officer account deleted');
        loadPlacements();
      } catch (e) {
        toast.error(e.message);
      }
    }
  };

  return (
    <AppShell title="Placement Support Team" subtitle="Manage placement officer accounts and access.">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <SurfaceCard className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Create New Account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="crm-label font-medium">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  required
                  className="crm-input p-3"
                />
              </div>
              <div>
                <label className="crm-label font-medium">Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@placement.com"
                  required
                  className="crm-input p-3"
                />
              </div>
              <div>
                <label className="crm-label font-medium">Temporary Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter temporary password"
                  required
                  className="crm-input p-3"
                />
              </div>
              <button type="submit" className="crm-btn-primary w-full mt-2 py-3">
                Create Account
              </button>
            </form>
          </SurfaceCard>
        </div>

        <div className="md:col-span-2">
          <SurfaceCard className="overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Placement Team Roster</h2>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {placements.length} Total
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Officer Details</th>
                    <th className="px-6 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Role</th>
                    <th className="px-6 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Added On</th>
                    <th className="px-6 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {placements.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{c.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wide">
                          Placement
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {new Date(c.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleEditClick(c)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Account"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(c._id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Delete Account"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {placements.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-400 italic text-sm">
                        No placement officers registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        </div>
      </div>

      {/* Edit Modal Dialog */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 relative">
            <button 
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition"
            >
              <X size={18} />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-5">Edit Placement Officer</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="crm-label font-medium">Name</label>
                <input
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  placeholder="Full Name"
                  required
                  className="crm-input p-3"
                />
              </div>
              <div>
                <label className="crm-label font-medium">Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  placeholder="name@placement.com"
                  required
                  className="crm-input p-3"
                />
              </div>
              <div>
                <label className="crm-label font-medium flex justify-between">
                  <span>Reset Password</span>
                  <span className="text-[10px] text-slate-400 lowercase font-normal">Leave blank to keep current</span>
                </label>
                <input
                  name="password"
                  type="password"
                  value={editForm.password}
                  onChange={handleEditChange}
                  placeholder="Enter new password"
                  className="crm-input p-3"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="crm-btn-secondary flex-1 py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="crm-btn-primary flex-1 py-3"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
