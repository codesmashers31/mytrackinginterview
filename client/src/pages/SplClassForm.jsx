import React, { useState } from 'react';
import toast from 'react-hot-toast';
// No auth headers needed for public SPL submission
import { CheckCircle2, User, Mail, Phone, Award } from 'lucide-react';

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
  const [submitted, setSubmitted] = useState(false);
  const [successQuote, setSuccessQuote] = useState('');
  const [loading, setLoading] = useState(false);

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
      const res = await fetch('/api/spl-registration', {
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
      const quotes = [
        'Keep going — great things take time.',
        'Believe you can and you’re halfway there.',
        'Small steps every day lead to big results.',
        'Your effort today builds tomorrow’s success.',
        'Stay curious, keep learning, keep growing.'
      ];
      setSuccessQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      setSubmitted(true);
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
      setTimeout(() => setSubmitted(false), 15000);
      setErrors({});
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
      <header className="mb-6 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 p-6 text-white shadow-md">
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

      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-md w-full rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-emerald-50 p-3">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Registration received</h3>
                <p className="mt-1 text-sm text-slate-600">Thanks — your registration is successful. Please follow the schedule below strictly.</p>
                <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Daily schedule</p>
                  <ul className="mt-3 space-y-2 list-disc pl-5">
                    <li>10:00 - 11:00: Class</li>
                    <li>11:00 - 13:00: Working time</li>
                    <li>13:00 - 14:00: Task allocate</li>
                    <li>14:00 - 15:00: Lunch break</li>
                    <li>15:00 - 17:00: Task work</li>
                    <li>17:00 - 18:00: Class</li>
                  </ul>
                  <p className="mt-3">This is an 8-hour working process. Classes run Monday to Friday.</p>
                  <p className="mt-2 font-semibold">Strictly follow this schedule.</p>
                  <p className="mt-3 text-slate-600">If you have any doubts, call your mentor.</p>
                </div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Join the WhatsApp group</p>
                  <p className="mt-2">Stay connected for updates, support, and announcements. Click the link below to join:</p>
                  <a
                    href="https://chat.whatsapp.com/Jce5J71wE4BJJgM9c5TUgA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Join WhatsApp Group
                  </a>
                </div>
                {successQuote && <blockquote className="mt-4 rounded-md border-l-4 border-slate-100 bg-slate-50 p-3 italic text-sm text-slate-700">“{successQuote}”</blockquote>}
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setSubmitted(false)} className="rounded-md border px-4 py-2">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-lg">
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
                placeholder="Enter your full name"
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
                name="mobile"
                placeholder="10-digit mobile number"
                value={form.mobile}
                onChange={handleChange}
                className="mt-0 w-full rounded-md border pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Degree <span className="text-rose-500">*</span></span>
            <div className="relative mt-1">
              <Award size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input name="degree" placeholder="Ex. B.Tech (CSE)" value={form.degree} onChange={handleChange} aria-invalid={errors.degree ? 'true' : 'false'} className="mt-0 w-full rounded-md border pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-200" />
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
          <button type="submit" disabled={loading} className={`rounded-md px-4 py-2 text-white shadow ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-95'}`}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}
