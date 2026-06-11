import React, { useEffect, useState } from 'react';
import { fetchCoordinators, createCoordinator } from '../utils/api';
import { toast } from 'react-hot-toast';

export default function CoordinatorManagement() {
  const [coordinators, setCoordinators] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const loadCoordinators = async () => {
    try {
      const data = await fetchCoordinators();
      setCoordinators(data);
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    loadCoordinators();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCoordinator(form);
      toast.success('Coordinator created');
      setForm({ name: '', email: '', password: '' });
      loadCoordinators();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Placement Coordinators</h1>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Create New Coordinator</h2>
        <form onSubmit={handleSubmit} className="grid gap-4 max-w-md">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Name"
            required
            className="rounded border p-2"
          />
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className="rounded border p-2"
          />
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            required
            className="rounded border p-2"
          />
          <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
            Create Coordinator
          </button>
        </form>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">Existing Coordinators</h2>
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Created At</th>
            </tr>
          </thead>
          <tbody>
            {coordinators.map((c) => (
              <tr key={c._id} className="border-t">
                <td className="p-2">{c.name}</td>
                <td className="p-2">{c.email}</td>
                <td className="p-2">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
