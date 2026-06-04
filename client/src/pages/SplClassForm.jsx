import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
// No auth headers needed for public SPL submission
import { User, Mail, Phone, Award } from 'lucide-react';

export default function SplClassForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    degree: '',
    batch: '',
    willingCompanyProcess: false,
    willing30Days: '',
    acceptOffer: '',
    fullEffort: '',
    issues: '',
    needMost: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Basic validation
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) newErrors.email = 'Enter a valid email';
    // normalize mobile - accept formats like +91 98765 43210 but validate 10 digits
    const cleanedMobile = (form.mobile || '').replace(/\D/g, '');
    if (!cleanedMobile) newErrors.mobile = 'Mobile number is required';
    if (cleanedMobile && cleanedMobile.length !== 10) newErrors.mobile = 'Enter a valid 10-digit mobile number';
    if (!form.degree.trim()) newErrors.degree = 'Degree is required';
    if (form.batch && !/^\d{4}$/.test(form.batch)) newErrors.batch = 'Enter a valid 4-digit year';
    if (!form.willing30Days) newErrors.willing30Days = 'Please choose an option';
    if (!form.acceptOffer) newErrors.acceptOffer = 'Please choose an option';
    if (!form.fullEffort) newErrors.fullEffort = 'Please choose an option';
    // `issues` and `needMost` are optional; validate only when provided
    if (form.issues.trim() && form.issues.trim().length < 5) newErrors.issues = 'Please provide more details';
    if (form.needMost.trim() && form.needMost.trim().length < 3) newErrors.needMost = 'Please be more specific';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // Prepare payload aligned with server Student model
    const payload = {
      name: form.name,
      mobile: cleanedMobile || 'Not Provided',
      degree: form.degree || 'Not Provided',
      willingCompanyProcess: form.willingCompanyProcess,
      passedOutYear: form.batch || 'Need to filled',
      batch: form.batch || '',
      // store extra form details in `others`
      others: JSON.stringify({
        email: form.email,
        willing30Days: form.willing30Days,
        acceptOffer: form.acceptOffer,
        fullEffort: form.fullEffort,
        issues: form.issues,
        needMost: form.needMost,
      }),
    };

    console.log('Submitting SPL form', payload);
    setLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || '/api'}/spl-registration`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Submission failed');
      }

      const data = await res.json();
      console.log('SPL registration submitted', data);
      toast.success('Registration submitted');
      setForm({
        name: '',
        email: '',
        mobile: '',
        degree: '',
        batch: '',
        willingCompanyProcess: false,
        willing30Days: '',
        acceptOffer: '',
        fullEffort: '',
        issues: '',
        needMost: '',
      });
      setErrors({});
      navigate('/spl-registration/success');
    } catch (err) {
      console.error('Submission error', err);
      if (err.message && err.message.toLowerCase().includes('access')) {
        toast.error('Submission requires admin authentication. Please login first.');
      } else {
        toast.error(err.message || 'Submission failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-6 rounded-xl bg-linear-to-r from-blue-600 to-violet-600 p-6 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-white/20 p-2">
            <Award size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">SPL Class Registration</h2>
            <p className="text-sm opacity-90">Fill this standalone form to register for the SPL class process.</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} autoComplete="on" className="space-y-6 bg-white p-6 rounded-2xl shadow-lg">
        <div className="mb-2">
          <h3 className="text-lg font-bold text-slate-800">Personal Details</h3>
          <p className="text-sm text-slate-500">Provide your contact and academic details below.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Name <span className="text-rose-500">*</span></span>
            <div className="relative mt-1">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                onInput={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                aria-required
                aria-invalid={errors.name ? 'true' : 'false'}
                className="mt-0 w-full rounded-md border pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            {errors.name && <p className="mt-1 text-rose-600 text-sm">{errors.name}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-medium">Email <span className="text-rose-500">*</span></span>
            <div className="relative mt-1">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                placeholder="your.name@example.com"
                value={form.email}
                onChange={handleChange}
                onInput={handleChange}
                autoComplete="email"
                aria-required
                aria-invalid={errors.email ? 'true' : 'false'}
                className="mt-0 w-full rounded-md border pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            {errors.email && <p className="mt-1 text-rose-600 text-sm">{errors.email}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-medium">Mobile</span>
            <div className="relative mt-1">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                name="mobile"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                placeholder="Enter 10-digit mobile number"
                value={form.mobile}
                onChange={handleChange}
                onInput={handleChange}
                autoComplete="tel"
                className="mt-0 w-full rounded-md border pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            {errors.mobile && <p className="mt-1 text-rose-600 text-sm">{errors.mobile}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-medium">Degree <span className="text-rose-500">*</span></span>
            <div className="relative mt-1">
              <Award size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                name="degree"
                placeholder="Ex. B.Tech (CSE)"
                value={form.degree}
                onChange={handleChange}
                onInput={handleChange}
                autoComplete="off"
                aria-invalid={errors.degree ? 'true' : 'false'}
                className="mt-0 w-full rounded-md border pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            {errors.degree && <p className="mt-1 text-rose-600 text-sm">{errors.degree}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-medium">Batch (Passed Out year)</span>
            <input
              name="batch"
              placeholder="2025"
              value={form.batch}
              onChange={handleChange}
              onInput={handleChange}
              autoComplete="off"
              aria-invalid={errors.batch ? 'true' : 'false'}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
            {errors.batch && <p className="mt-1 text-rose-600 text-sm">{errors.batch}</p>}
          </label>

          
        </div>

        <div>
          <h4 className="text-md font-semibold text-slate-800">Assessment</h4>
          <p className="text-sm text-slate-500 mb-2">Answer the questions below. The full process is required to complete this registration.</p>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Please fill all fields in this section before submitting.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm">Are you willing to come 30 days?</span>
              <select name="willing30Days" value={form.willing30Days} onChange={handleChange} aria-invalid={errors.willing30Days ? 'true' : 'false'} className="mt-1 w-40 rounded-md border px-3 py-2">
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            {errors.willing30Days && <p className="mt-1 text-rose-600 text-sm">{errors.willing30Days}</p>}
          </label>

          <label className="block">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm">Are you accept this Offer?</span>
              <select name="acceptOffer" value={form.acceptOffer} onChange={handleChange} aria-invalid={errors.acceptOffer ? 'true' : 'false'} className="mt-1 w-40 rounded-md border px-3 py-2">
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            {errors.acceptOffer && <p className="mt-1 text-rose-600 text-sm">{errors.acceptOffer}</p>}
          </label>

          <label className="block">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm">Did you give your full effort?</span>
              <select name="fullEffort" value={form.fullEffort} onChange={handleChange} aria-invalid={errors.fullEffort ? 'true' : 'false'} className="mt-1 w-40 rounded-md border px-3 py-2">
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            {errors.fullEffort && <p className="mt-1 text-rose-600 text-sm">{errors.fullEffort}</p>}
          </label>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-700">
          <input type="checkbox" name="willingCompanyProcess" checked={form.willingCompanyProcess} onChange={handleChange} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          <span className="font-medium">Willing to join the Company Process</span>
        </div>

        <label className="block">
          <span className="text-sm">Did you have any issues? Tell me</span>
          <textarea name="issues" value={form.issues} onChange={handleChange} aria-invalid={errors.issues ? 'true' : 'false'} className="mt-1 w-full rounded-md border px-3 py-2" rows={3} placeholder="Describe any blockers, environment issues, or support needed" />
          {errors.issues && <p className="mt-1 text-rose-600 text-sm">{errors.issues}</p>}
        </label>

        <label className="block">
          <span className="text-sm">What do you need the most?</span>
          <textarea name="needMost" value={form.needMost} onChange={handleChange} aria-invalid={errors.needMost ? 'true' : 'false'} className="mt-1 w-full rounded-md border px-3 py-2" rows={3} placeholder="E.g., mentorship, placement help, study material" />
          {errors.needMost && <p className="mt-1 text-rose-600 text-sm">{errors.needMost}</p>}
        </label>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setForm({ name: '', email: '', mobile: '', degree: '', batch: '', willingCompanyProcess: false, willing30Days: '', acceptOffer: '', fullEffort: '', issues: '', needMost: '' })}
            className="rounded-md border px-4 py-2 hover:bg-slate-50"
          >
            Reset
          </button>
          <button type="submit" disabled={loading} className={`rounded-md px-4 py-2 text-white shadow ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-linear-to-r from-blue-600 to-violet-600 hover:opacity-95'}`}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}
