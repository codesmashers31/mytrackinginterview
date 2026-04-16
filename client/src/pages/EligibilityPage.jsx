import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Download, Search, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { AppShell, SectionTabs, StatusBadge, SurfaceCard } from '../components/AppShell';

export default function EligibilityPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [parsedCriteria, setParsedCriteria] = useState(null);

  const loadDemo = () => {
    setJobDescription(
      "We are looking for software engineering freshers to join our rapidly growing backend team.\n\n" +
      "Eligibility Criteria:\n" +
      "- Must hold a B.E, B.Tech, or MCA degree.\n" +
      "- Passing out batch should be 2023 or 2024.\n" +
      "- Immediate joiners are preferred.\n\n" +
      "If you fit these requirements, we would love to review your application!"
    );
  };

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    
    // Define robust matchers for various spellings/synonyms of degrees
    const degreeMappings = [
      { display: 'B.Tech / B.E', regex: /\b(b\.?tech|b\.?e\.?|be|bachelor of technology)\b/i, variants: ['B.Tech', 'BTech', 'B.E', 'BE', 'B.E.'] },
      { display: 'M.Tech / M.E', regex: /\b(m\.?tech|m\.?e\.?|me|master of technology)\b/i, variants: ['M.Tech', 'MTech', 'M.E', 'ME', 'M.E.'] },
      { display: 'BCA', regex: /\b(bca|b\.c\.a\.?|bachelor of computer applications)\b/i, variants: ['BCA', 'B.C.A'] },
      { display: 'MCA', regex: /\b(mca|m\.c\.a\.?|master of computer applications)\b/i, variants: ['MCA', 'M.C.A'] },
      { display: 'B.Sc', regex: /\b(bsc|b\.sc\.?|b\.s\.?|bachelor of science)\b/i, variants: ['B.Sc', 'BSc', 'B.S.'] },
      { display: 'M.Sc', regex: /\b(msc|m\.sc\.?|m\.s\.?|master of science)\b/i, variants: ['M.Sc', 'MSc', 'M.S.'] },
      { display: 'B.Com', regex: /\b(bcom|b\.com\.?|bachelor of commerce)\b/i, variants: ['B.Com', 'BCom'] },
      { display: 'M.Com', regex: /\b(mcom|m\.com\.?|master of commerce)\b/i, variants: ['M.Com', 'MCom'] },
      { display: 'BBA', regex: /\b(bba|b\.b\.a\.?|business administration)\b/i, variants: ['BBA', 'B.B.A'] },
      { display: 'MBA', regex: /\b(mba|m\.b\.a\.?|master of business administration)\b/i, variants: ['MBA', 'M.B.A'] },
    ];
    
    let matchedVariations = new Set();
    let displayDegrees = [];
    
    degreeMappings.forEach(mapping => {
       if (mapping.regex.test(jobDescription)) {
           displayDegrees.push(mapping.display);
           mapping.variants.forEach(v => matchedVariations.add(v));
       }
    });

    const finalDegreesPayload = Array.from(matchedVariations);
    
    const yearMatches = jobDescription.match(/\b(20[1-3][0-9])\b/g) || [];
    const years = [...new Set(yearMatches)].map(Number);
    
    let minYear = '';
    let maxYear = '';
    
    if (years.length > 0) {
      minYear = Math.min(...years).toString();
      maxYear = Math.max(...years).toString();
    }

    setParsedCriteria({ 
      degreesForDisplay: displayDegrees, 
      degreesPayload: finalDegreesPayload,
      minYear, 
      maxYear 
    });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/students/eligible`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ degrees: finalDegreesPayload, minYear, maxYear }),
      });
      const data = await res.json();
      setResults(data.students);
      toast.success(`Matched ${data.count} candidates`);
    } catch (err) {
      toast.error('Search query failed');
    } finally {
      setLoading(false);
    }
  };

  const copyAllNumbers = () => {
    if (results.length === 0) return;
    navigator.clipboard.writeText(results.map(student => student.mobile).join(', '));
    toast.success('Copied mobile list');
  };

  const exportResults = () => {
    if (results.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(
      results.map(student => ({
        Name: student.name,
        Mobile: student.mobile,
        Degree: student.degree,
        'Batch Year': student.passedOutYear,
        Status: student.currentStatus,
        Batch: student.batch || '',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Eligible');
    XLSX.writeFile(wb, 'Eligible_Candidates.xlsx');
  };

  return (
    <AppShell
      title="Eligibility Engine"
      subtitle="Filter students by degree and graduation years to generate targeted outreach lists."
      searchPlaceholder="Search saved filters or candidate segments"
    >
      <SectionTabs
        items={[
          { label: 'Overview', onClick: () => navigate('/dashboard') },
          { label: 'Students', onClick: () => navigate('/students') },
          { label: 'Eligibility', active: true },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
        <SurfaceCard className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Smart Filter Builder</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Target candidate pool</h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Sparkles size={20} />
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                 <label className="crm-label !mb-0">Job Description / Requirements</label>
                 <button onClick={loadDemo} className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition">
                    + Load Demo JD
                 </button>
              </div>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="h-56 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-[13px] leading-relaxed font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 resize-none shadow-inner"
              />
            </div>

            {parsedCriteria && (
               <div className="rounded-xl bg-blue-50/70 p-4 border border-blue-100/50">
                  <p className="text-[11px] font-extrabold text-blue-600 uppercase tracking-widest mb-3">AI Parsed Criteria</p>
                  <div className="space-y-2">
                     <p className="text-sm text-blue-900 flex items-start gap-2">
                       <span className="font-bold w-16 shrink-0 mt-0.5">Degrees:</span> 
                       <span className="bg-white px-2 py-0.5 rounded-md shadow-sm border border-blue-100 text-[13px]">
                         {parsedCriteria.degreesForDisplay.length > 0 ? parsedCriteria.degreesForDisplay.join(', ') : 'Any / Not Detected'}
                       </span>
                     </p>
                     <p className="text-sm text-blue-900 flex items-start gap-2">
                       <span className="font-bold w-16 shrink-0 mt-0.5">Years:</span> 
                       <span className="bg-white px-2 py-0.5 rounded-md shadow-sm border border-blue-100 text-[13px]">
                         {parsedCriteria.minYear ? (parsedCriteria.minYear === parsedCriteria.maxYear ? parsedCriteria.minYear : `${parsedCriteria.minYear} out to ${parsedCriteria.maxYear}`) : 'Any / Not Detected'}
                       </span>
                     </p>
                  </div>
               </div>
            )}

            <button type="button" onClick={handleSearch} disabled={loading} className="crm-btn-primary w-full h-12 text-sm shadow-md shadow-blue-200 hover:shadow-lg transition-shadow">
              {loading ? 'Analyzing Content...' : 'Auto-Parse & Filter Candidates'}
            </button>
          </div>
        </SurfaceCard>

        <SurfaceCard className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
            <div>
              <p className="text-sm font-medium text-slate-500">Eligible Candidates</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Filtered results</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={copyAllNumbers} disabled={results.length === 0} className="crm-btn-secondary">
                <Copy size={16} />
                <span>Copy Phones</span>
              </button>
              <button type="button" onClick={exportResults} disabled={results.length === 0} className="crm-btn-secondary">
                <Download size={16} />
                <span>Export Sheet</span>
              </button>
            </div>
          </div>

          <div className="min-h-[420px] overflow-auto">
            {!searched ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Search size={26} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">Run a filter to view results</h3>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  Select degrees and year range to generate a refined list of candidates for outreach.
                </p>
              </div>
            ) : results.length > 0 ? (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Candidate
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Degree / Batch
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Contact
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {results.map(student => (
                    <tr key={student._id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.batch || 'Batch not added'}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        <p>{student.degree}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Batch Year: {student.passedOutYear || 'Not added'}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-blue-700">{student.mobile}</td>
                      <td className="px-5 py-4 text-right">
                        <StatusBadge status={student.currentStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                <h3 className="text-lg font-semibold text-slate-900">No candidates matched</h3>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  Try widening the graduation range or selecting more degrees.
                </p>
              </div>
            )}
          </div>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
