import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export default function SplSuccess() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-emerald-100 p-3 text-emerald-700">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Registration Successful</h1>
            <p className="mt-2 text-sm text-slate-600">Thank you for submitting your SPL registration. Your details have been recorded successfully.</p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-slate-700">
          <h2 className="text-lg font-semibold text-slate-900">What happens next?</h2>
          <ul className="mt-4 space-y-3 list-disc pl-5 text-sm">
            <li>We will review your registration and reach out with the next steps.</li>
            <li>Please follow the process schedule strictly once selected.</li>
            <li>Keep your contact details active so we can connect with you.</li>
          </ul>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-700">
          <h2 className="text-lg font-semibold text-slate-900">Daily schedule</h2>
          <ul className="mt-4 space-y-2 list-disc pl-5 text-sm">
            <li>10:00 - 11:00: Class</li>
            <li>11:00 - 13:00: Working time</li>
            <li>13:00 - 14:00: Task allocation</li>
            <li>14:00 - 15:00: Lunch break</li>
            <li>15:00 - 17:00: Task work</li>
            <li>17:00 - 18:00: Class</li>
          </ul>
          <p className="mt-3 text-sm text-slate-600">This is an 8-hour working process from Monday to Friday. Strictly follow this schedule.</p>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-700">
          <h2 className="text-lg font-semibold text-slate-900">Join the WhatsApp group</h2>
          <p className="mt-2 text-sm text-slate-600">Stay connected for updates, support, and announcements.</p>
          <a
            href="https://chat.whatsapp.com/Jce5J71wE4BJJgM9c5TUgA"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Join WhatsApp Group
          </a>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/spl-registration" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Submit another response
          </Link>
          <Link to="/" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
