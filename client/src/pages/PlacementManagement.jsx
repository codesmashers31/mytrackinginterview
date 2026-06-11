import React, { useEffect, useState } from 'react';
import { fetchPlacements, createPlacement } from '../utils/api';
import { toast } from 'react-hot-toast';
import { AppShell, SurfaceCard } from '../components/AppShell';

export default function PlacementManagement() {
  const [placements, setPlacements] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

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
                    <th className="px-6 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px] text-right">Added On</th>
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
                      <td className="px-6 py-4 text-right text-slate-500 font-medium">
                        {new Date(c.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                  {placements.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-slate-400 italic text-sm">
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
    </AppShell>
  );
}
