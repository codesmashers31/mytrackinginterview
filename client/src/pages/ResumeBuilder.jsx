import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { AppShell, SurfaceCard } from '../components/AppShell';
import { getTemplateById, Templates } from '../components/ResumeTemplates';
import { 
  Download, Plus, Trash2, Save, Loader2, Upload, Sparkles, History, 
  User, GraduationCap, Briefcase, Award, Languages, Check, FileText
} from 'lucide-react';
import { getUserName, getUserEmail, authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import toast from 'react-hot-toast';

export default function ResumeBuilder() {
  const [step, setStep] = useState('form');
  const [activeTemplate, setActiveTemplate] = useState('1');
  const printRef = useRef();

  const [data, setData] = useState({
    basicInfo: {
      name: getUserName() || '',
      email: getUserEmail() || '',
      phone: '',
      linkedin: '',
      github: '',
      summary: ''
    },
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    languages: [],
    awards: '',
    history: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef(null);

  const parseProfileSkills = (skills) => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills.map(s => String(s).trim()).filter(Boolean);
    return String(skills)
      .split(',')
      .map(skill => skill.trim())
      .filter(Boolean);
  };

  const buildResumeDefaultsFromProfile = (profile = {}) => {
    const basicInfo = {
      name: profile.name || getUserName() || '',
      email: profile.email || getUserEmail() || '',
      phone: profile.mobile || '',
      linkedin: profile.linkedin || '',
      github: profile.github || '',
      summary: profile.others || profile.statusReason || ''
    };

    const education = [];
    if (profile.degree) {
      education.push({
        degree: profile.degree,
        institution: '',
        year: profile.passedOutYear || profile.batch || '',
        score: ''
      });
    }

    const experience = [];
    if (profile.currentStatus?.toLowerCase() === 'placed' && profile.companyName) {
      experience.push({
        role: 'Placed Candidate',
        company: profile.companyName,
        duration: '',
        description: `Package: ${profile.packageLpa || 'N/A'}; Mode: ${profile.jobGetMode || 'N/A'}`
      });
    }

    return {
      basicInfo,
      education,
      experience,
      projects: [],
      skills: parseProfileSkills(profile.skills),
      certifications: [],
      languages: [],
      awards: ''
    };
  };

  const mergeResumeData = (profileDefaults, savedData) => ({
    basicInfo: {
      name: savedData.basicInfo?.name || profileDefaults.basicInfo.name || '',
      email: savedData.basicInfo?.email || profileDefaults.basicInfo.email || '',
      phone: savedData.basicInfo?.phone || profileDefaults.basicInfo.phone || '',
      linkedin: savedData.basicInfo?.linkedin || profileDefaults.basicInfo.linkedin || '',
      github: savedData.basicInfo?.github || profileDefaults.basicInfo.github || '',
      summary: savedData.basicInfo?.summary || profileDefaults.basicInfo.summary || ''
    },
    education: (savedData.education && savedData.education.length > 0)
      ? savedData.education
      : profileDefaults.education,
    experience: (savedData.experience && savedData.experience.length > 0)
      ? savedData.experience
      : profileDefaults.experience,
    projects: (savedData.projects && savedData.projects.length > 0)
      ? savedData.projects
      : profileDefaults.projects,
    skills: (savedData.skills && savedData.skills.length > 0)
      ? savedData.skills
      : profileDefaults.skills,
    certifications: (savedData.certifications && savedData.certifications.length > 0)
      ? savedData.certifications
      : profileDefaults.certifications,
    languages: (savedData.languages && savedData.languages.length > 0)
      ? savedData.languages
      : profileDefaults.languages,
    awards: savedData.awards || profileDefaults.awards || '',
    history: savedData.history || []
  });

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isTxt = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');

    if (!isPdf && !isTxt) {
      toast.error('Only PDF and TXT files are supported.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsParsing(true);
    const toastId = toast.loading('Extracting data from your resume...');

    try {
      const res = await fetch(buildApiUrl('/auth/parse-resume'), {
        method: 'POST',
        headers: {
          ...authHeaders()
        },
        body: formData
      });

      const result = await res.json();

      if (res.ok) {
        setData(prev => ({
          ...prev,
          basicInfo: {
            name: result.basicInfo?.name || prev.basicInfo.name,
            email: result.basicInfo?.email || prev.basicInfo.email,
            phone: result.basicInfo?.phone || prev.basicInfo.phone || '',
            linkedin: result.basicInfo?.linkedin || prev.basicInfo.linkedin || '',
            github: result.basicInfo?.github || prev.basicInfo.github || '',
            summary: result.basicInfo?.summary || prev.basicInfo.summary || ''
          },
          education: result.education || [],
          experience: result.experience || [],
          projects: result.projects || [],
          skills: result.skills || [],
          certifications: result.certifications || [],
          languages: result.languages || [],
          awards: result.awards || ''
        }));
        toast.success('Resume parsed and loaded successfully!', { id: toastId });
      } else {
        toast.error(result.message || 'Failed to parse resume.', { id: toastId });
      }
    } catch (error) {
      console.error('Resume upload error:', error);
      toast.error('Network error. Failed to upload and parse resume.', { id: toastId });
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResumeTextParse = async () => {
    if (!pastedText.trim()) return;

    setIsParsing(true);
    const toastId = toast.loading('Extracting data from text...');

    try {
      const res = await fetch(buildApiUrl('/auth/parse-resume'), {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: pastedText })
      });

      const result = await res.json();

      if (res.ok) {
        setData(prev => ({
          ...prev,
          basicInfo: {
            name: result.basicInfo?.name || prev.basicInfo.name,
            email: result.basicInfo?.email || prev.basicInfo.email,
            phone: result.basicInfo?.phone || prev.basicInfo.phone || '',
            linkedin: result.basicInfo?.linkedin || prev.basicInfo.linkedin || '',
            github: result.basicInfo?.github || prev.basicInfo.github || '',
            summary: result.basicInfo?.summary || prev.basicInfo.summary || ''
          },
          education: result.education || [],
          experience: result.experience || [],
          projects: result.projects || [],
          skills: result.skills || [],
          certifications: result.certifications || [],
          languages: result.languages || [],
          awards: result.awards || ''
        }));
        toast.success('Resume text parsed and loaded successfully!', { id: toastId });
        setPastedText('');
        setIsPasteMode(false);
      } else {
        toast.error(result.message || 'Failed to parse text.', { id: toastId });
      }
    } catch (error) {
      console.error('Resume text parsing error:', error);
      toast.error('Network error. Failed to parse text.', { id: toastId });
    } finally {
      setIsParsing(false);
    }
  };

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const [profileRes, resumeRes] = await Promise.all([
          fetch(buildApiUrl('/auth/me'), { headers: authHeaders() }),
          fetch(buildApiUrl('/auth/my-resume'), { headers: authHeaders() })
        ]);

        const profileData = profileRes.ok ? await profileRes.json() : {};
        const savedData = resumeRes.ok ? await resumeRes.json() : {};

        const defaults = buildResumeDefaultsFromProfile(profileData.studentProfile || {});

        setData(mergeResumeData(defaults, savedData));
      } catch (error) {
        console.error('Failed to load resume or profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResume();
  }, []);

  const [lastSaved, setLastSaved] = useState(null);

  const handleSave = async (silent = false) => {
    setIsSaving(true);
    try {
      const res = await fetch(buildApiUrl('/auth/my-resume'), {
        method: 'PUT',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        if (!silent) toast.success('Resume saved successfully!');
        setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        return true;
      } else {
        if (!silent) toast.error('Failed to save resume.');
        return false;
      }
    } catch (error) {
      if (!silent) toast.error('Network error. Could not save.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewAndGenerate = async () => {
    const success = await handleSave(true);
    if (success) {
      setStep('preview');
    } else {
      toast.error('Could not save your latest progress. Please check your network and try again.');
    }
  };

  const handleLoadHistoryVersion = (version) => {
    setData(prev => ({
      ...prev,
      ...version.dataSnapshot,
      history: prev.history
    }));
    toast.success('Restored selected version to editor!');
  };

  const handleDeleteHistoryVersion = async (versionId) => {
    const updatedHistory = (data.history || []).filter(v => v.id !== versionId);
    const updatedData = { ...data, history: updatedHistory };
    setData(updatedData);

    try {
      await fetch(buildApiUrl('/auth/my-resume'), {
        method: 'PUT',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });
      toast.success('Version deleted.');
    } catch (err) {
      toast.error('Failed to save changes.');
    }
  };

  const triggerSaveHistory = async () => {
    const newVersion = {
      id: Date.now().toString(),
      filename: `${data.basicInfo.name || 'Resume'}_Resume_${new Date().toISOString().slice(0, 10)}.pdf`,
      timestamp: new Date().toISOString(),
      templateId: activeTemplate,
      dataSnapshot: {
        basicInfo: data.basicInfo,
        education: data.education,
        experience: data.experience,
        projects: data.projects,
        skills: data.skills,
        certifications: data.certifications,
        languages: data.languages,
        awards: data.awards
      }
    };

    const updatedHistory = [newVersion, ...(data.history || [])];
    const updatedData = { ...data, history: updatedHistory };
    setData(updatedData);

    try {
      await fetch(buildApiUrl('/auth/my-resume'), {
        method: 'PUT',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });
    } catch (err) {
      console.error('Failed to save version to history:', err);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${data.basicInfo.name || 'Resume'}_Resume`,
  });

  const handleExportPDF = async () => {
    await triggerSaveHistory();
    handlePrint();
  };

  const updateBasicInfo = (field, value) => {
    setData(prev => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, [field]: value }
    }));
  };

  const addEducation = () => {
    setData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', year: '', score: '' }]
    }));
  };

  const updateEducation = (index, field, value) => {
    const newEdu = [...data.education];
    newEdu[index][field] = value;
    setData(prev => ({ ...prev, education: newEdu }));
  };

  const removeEducation = (index) => {
    setData(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
  };

  const addExperience = () => {
    setData(prev => ({
      ...prev,
      experience: [...prev.experience, { role: '', company: '', duration: '', description: '' }]
    }));
  };

  const updateExperience = (index, field, value) => {
    const newExp = [...data.experience];
    newExp[index][field] = value;
    setData(prev => ({ ...prev, experience: newExp }));
  };

  const removeExperience = (index) => {
    setData(prev => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }));
  };

  const addProject = () => {
    setData(prev => ({
      ...prev,
      projects: [...prev.projects, { title: '', techStack: '', link: '', description: '' }]
    }));
  };

  const updateProject = (index, field, value) => {
    const newProj = [...data.projects];
    newProj[index][field] = value;
    setData(prev => ({ ...prev, projects: newProj }));
  };

  const removeProject = (index) => {
    setData(prev => ({ ...prev, projects: prev.projects.filter((_, i) => i !== index) }));
  };

  const handleSkillsChange = (e) => {
    const rawValue = e.target.value;
    const skillsArray = rawValue.split(',').map(s => s.trim()).filter(s => s);
    setData(prev => ({ ...prev, skillsRaw: rawValue, skills: skillsArray }));
  };

  const handleLanguagesChange = (e) => {
    const rawValue = e.target.value;
    const langsArray = rawValue.split(',').map(s => s.trim()).filter(s => s);
    setData(prev => ({ ...prev, languagesRaw: rawValue, languages: langsArray }));
  };

  const updateAwards = (value) => {
    setData(prev => ({ ...prev, awards: value }));
  };

  const addCertification = () => {
    setData(prev => ({
      ...prev,
      certifications: [...prev.certifications, { title: '', issuer: '', year: '', link: '' }]
    }));
  };

  const updateCertification = (index, field, value) => {
    const newCerts = [...data.certifications];
    newCerts[index][field] = value;
    setData(prev => ({ ...prev, certifications: newCerts }));
  };

  const removeCertification = (index) => {
    setData(prev => ({ ...prev, certifications: prev.certifications.filter((_, i) => i !== index) }));
  };

  const SelectedTemplate = getTemplateById(activeTemplate).component;

  return (
    <AppShell
      title="Resume Builder"
      subtitle="Craft and download your custom professional curriculum vitae."
    >
      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-64">
          <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
          <span className="text-sm font-semibold text-slate-500">Loading resume workspace...</span>
        </div>
      ) : step === 'form' ? (
        <div className="flex flex-col gap-6 pb-12">
          
          {/* Header Action / Auto-Save Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Resume Form Editor</h1>
              <p className="text-xs text-slate-500">Fill in your information to compile a customized CV.</p>
            </div>
            <div className="flex items-center gap-3">
              {lastSaved && (
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-xl">
                  <Check size={12} className="text-emerald-500" />
                  Saved at {lastSaved}
                </span>
              )}
              <button 
                onClick={() => handleSave(false)} 
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold shadow-[0_8px_20px_rgba(16,185,129,0.15)] hover:scale-[1.02] active:scale-[0.98] px-5 py-2.5 text-sm transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin text-white" /> : <Save size={16} className="text-white" />}
                <span>Save Progress</span>
              </button>
            </div>
          </div>

          {/* Import Previous Resume Widget */}
          <SurfaceCard className="p-6 md:p-8 border-dashed border-2 border-slate-200 hover:border-blue-400 transition-colors bg-blue-50/10 rounded-2xl shadow-sm">
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl mb-3">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <h3 className="text-md font-bold text-slate-800 mb-1">Import details from Previous Resume</h3>
              <p className="text-xs text-slate-500 max-w-lg mb-5 leading-relaxed">
                Upload your existing PDF or TXT resume, or paste the raw text. Our engine parses the basic information, experiences, and academic metrics to auto-fill the form below.
              </p>
              
              <div className="flex gap-2.5 mb-5 bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setIsPasteMode(false)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${!isPasteMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Upload File (PDF/TXT)
                </button>
                <button 
                  onClick={() => setIsPasteMode(true)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${isPasteMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Paste Raw Text
                </button>
              </div>

              {!isPasteMode ? (
                <div className="w-full">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleResumeUpload}
                    accept=".pdf,.txt"
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isParsing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    <span>{isParsing ? 'Extracting Resume...' : 'Choose File & Auto-fill'}</span>
                  </button>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-3">
                  <textarea 
                    className="crm-input h-28 text-left py-3 resize-none focus:ring-2" 
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    placeholder="Paste the raw text of your current resume here..."
                  ></textarea>
                  <button 
                    onClick={handleResumeTextParse}
                    disabled={isParsing || !pastedText.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50"
                  >
                    {isParsing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    <span>{isParsing ? 'Parsing Details...' : 'Parse Text & Auto-fill'}</span>
                  </button>
                </div>
              )}
            </div>
          </SurfaceCard>

          {/* Exported Versions History */}
          {data.history && data.history.length > 0 && (
            <SurfaceCard className="p-6 bg-slate-50/50 border border-slate-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <History className="text-blue-600" size={18} />
                <h2 className="text-md font-bold text-slate-800">Export History</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {data.history.map((version) => (
                  <div key={version.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-400 transition-colors">
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-slate-800 truncate" title={version.filename}>
                        {version.filename}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(version.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-1.5 mt-3">
                      <button
                        onClick={() => handleLoadHistoryVersion(version)}
                        className="flex-1 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-[10px] font-bold transition-colors"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleDeleteHistoryVersion(version.id)}
                        className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-md transition-colors"
                        title="Delete Version"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}

          {/* Form Panel: Basic Info */}
          <SurfaceCard className="p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 bg-white">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Basic Info</h2>
                <p className="text-xs text-slate-400">Your profile contact info and summary</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="crm-label">Full Name</label>
                <input 
                  type="text" 
                  className="crm-input focus:border-blue-500" 
                  value={data.basicInfo.name} 
                  onChange={e => updateBasicInfo('name', e.target.value)} 
                  placeholder="e.g. John Doe" 
                />
              </div>
              <div>
                <label className="crm-label">Email Address</label>
                <input 
                  type="email" 
                  className="crm-input focus:border-blue-500" 
                  value={data.basicInfo.email} 
                  onChange={e => updateBasicInfo('email', e.target.value)} 
                  placeholder="e.g. john@example.com" 
                />
              </div>
              <div>
                <label className="crm-label">Phone Contact</label>
                <input 
                  type="text" 
                  className="crm-input focus:border-blue-500" 
                  value={data.basicInfo.phone} 
                  onChange={e => updateBasicInfo('phone', e.target.value)} 
                  placeholder="e.g. +91 9876543210" 
                />
              </div>
              <div>
                <label className="crm-label">LinkedIn URL</label>
                <input 
                  type="text" 
                  className="crm-input focus:border-blue-500" 
                  value={data.basicInfo.linkedin} 
                  onChange={e => updateBasicInfo('linkedin', e.target.value)} 
                  placeholder="e.g. linkedin.com/in/johndoe" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="crm-label">GitHub / Portfolio URL</label>
                <input 
                  type="text" 
                  className="crm-input focus:border-blue-500" 
                  value={data.basicInfo.github} 
                  onChange={e => updateBasicInfo('github', e.target.value)} 
                  placeholder="e.g. github.com/johndoe" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="crm-label">Professional Summary</label>
                <textarea 
                  className="crm-input h-28 py-3 resize-none focus:border-blue-500" 
                  value={data.basicInfo.summary} 
                  onChange={e => updateBasicInfo('summary', e.target.value)} 
                  placeholder="A brief summary detailing your professional career, key expertise, and drive..."
                ></textarea>
              </div>
            </div>
          </SurfaceCard>

          {/* Form Panel: Experience */}
          <SurfaceCard className="p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Work Experience</h2>
                  <p className="text-xs text-slate-400">Add internships, freelance, or full-time roles</p>
                </div>
              </div>
              <button 
                onClick={addExperience} 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition"
              >
                <Plus size={14} /> Add Experience
              </button>
            </div>

            {data.experience.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No experience listed yet. Click 'Add Experience' above.</p>
            ) : (
              <div className="space-y-6">
                {data.experience.map((exp, index) => (
                  <div key={index} className="bg-slate-50/50 border border-slate-200/80 p-5 rounded-2xl relative transition hover:border-slate-300">
                    <button 
                      onClick={() => removeExperience(index)} 
                      className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Remove experience"
                    >
                      <Trash2 size={15} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                      <div>
                        <label className="crm-label">Role / Job Title</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          value={exp.role} 
                          onChange={e => updateExperience(index, 'role', e.target.value)} 
                          placeholder="e.g. Software Engineer Intern" 
                        />
                      </div>
                      <div>
                        <label className="crm-label">Company / Organization</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          value={exp.company} 
                          onChange={e => updateExperience(index, 'company', e.target.value)} 
                          placeholder="e.g. Tech Corp Inc." 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="crm-label">Duration / Period</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          value={exp.duration} 
                          onChange={e => updateExperience(index, 'duration', e.target.value)} 
                          placeholder="e.g. Jan 2021 - Present" 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="crm-label">Description & Achievements (bullet points, separated by newlines)</label>
                        <textarea 
                          className="crm-input h-28 py-3 resize-none" 
                          value={exp.description} 
                          onChange={e => updateExperience(index, 'description', e.target.value)} 
                          placeholder="Developed web modules...&#10;Optimized REST APIs reducing latency..."
                        ></textarea>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>

          {/* Form Panel: Projects */}
          <SurfaceCard className="p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Projects</h2>
                  <p className="text-xs text-slate-400">Describe projects you built individually or as a team</p>
                </div>
              </div>
              <button 
                onClick={addProject} 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition"
              >
                <Plus size={14} /> Add Project
              </button>
            </div>

            {data.projects.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No projects listed yet. Click 'Add Project' above.</p>
            ) : (
              <div className="space-y-6">
                {data.projects.map((proj, index) => (
                  <div key={index} className="bg-slate-50/50 border border-slate-200/80 p-5 rounded-2xl relative transition hover:border-slate-300">
                    <button 
                      onClick={() => removeProject(index)} 
                      className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Remove project"
                    >
                      <Trash2 size={15} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                      <div>
                        <label className="crm-label">Project Title</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          value={proj.title} 
                          onChange={e => updateProject(index, 'title', e.target.value)} 
                          placeholder="e.g. E-Commerce Platform" 
                        />
                      </div>
                      <div>
                        <label className="crm-label">Link (Optional)</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          value={proj.link} 
                          onChange={e => updateProject(index, 'link', e.target.value)} 
                          placeholder="e.g. github.com/username/project" 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="crm-label">Tech Stack (comma separated)</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          value={proj.techStack} 
                          onChange={e => updateProject(index, 'techStack', e.target.value)} 
                          placeholder="e.g. React, Node.js, Express, MongoDB" 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="crm-label">Description</label>
                        <textarea 
                          className="crm-input h-28 py-3 resize-none" 
                          value={proj.description} 
                          onChange={e => updateProject(index, 'description', e.target.value)} 
                          placeholder="Describe the project goal, your implementation, and design architecture..."
                        ></textarea>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>

          {/* Form Panel: Education */}
          <SurfaceCard className="p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Education</h2>
                  <p className="text-xs text-slate-400">Add degree programs, schools, and academic marks</p>
                </div>
              </div>
              <button 
                onClick={addEducation} 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition"
              >
                <Plus size={14} /> Add Education
              </button>
            </div>

            {data.education.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No education records listed yet. Click 'Add Education' above.</p>
            ) : (
              <div className="space-y-6">
                {data.education.map((edu, index) => (
                  <div key={index} className="bg-slate-50/50 border border-slate-200/80 p-5 rounded-2xl relative transition hover:border-slate-300">
                    <button 
                      onClick={() => removeEducation(index)} 
                      className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Remove education"
                    >
                      <Trash2 size={15} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                      <div>
                        <label className="crm-label">Degree / Course</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          value={edu.degree} 
                          onChange={e => updateEducation(index, 'degree', e.target.value)} 
                          placeholder="e.g. B.Tech Computer Science" 
                        />
                      </div>
                      <div>
                        <label className="crm-label">Institution / Board</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          value={edu.institution} 
                          onChange={e => updateEducation(index, 'institution', e.target.value)} 
                          placeholder="e.g. Anna University" 
                        />
                      </div>
                      <div>
                        <label className="crm-label">Passing Year</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          value={edu.year} 
                          onChange={e => updateEducation(index, 'year', e.target.value)} 
                          placeholder="e.g. 2018 - 2022" 
                        />
                      </div>
                      <div>
                        <label className="crm-label">Score / CGPA / %</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          value={edu.score} 
                          onChange={e => updateEducation(index, 'score', e.target.value)} 
                          placeholder="e.g. 8.5 CGPA" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>

          {/* Form Panel: Certifications */}
          <SurfaceCard className="p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Award size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Certifications</h2>
                  <p className="text-xs text-slate-400">Add course certificates and technical credentials</p>
                </div>
              </div>
              <button 
                onClick={addCertification} 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition"
              >
                <Plus size={14} /> Add Certification
              </button>
            </div>

            {data.certifications.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No certifications listed yet. Click 'Add Certification' above.</p>
            ) : (
              <div className="space-y-6">
                {data.certifications.map((cert, index) => (
                  <div key={index} className="bg-slate-50/50 border border-slate-200/80 p-5 rounded-2xl relative transition hover:border-slate-300">
                    <button 
                      onClick={() => removeCertification(index)} 
                      className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Remove certification"
                    >
                      <Trash2 size={15} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                      <div>
                        <label className="crm-label">Certification Title</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          value={cert.title} 
                          onChange={e => updateCertification(index, 'title', e.target.value)} 
                          placeholder="e.g. AWS Certified Developer" 
                        />
                      </div>
                      <div>
                        <label className="crm-label">Issuing Organization</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          value={cert.issuer} 
                          onChange={e => updateCertification(index, 'issuer', e.target.value)} 
                          placeholder="e.g. Amazon Web Services" 
                        />
                      </div>
                      <div>
                        <label className="crm-label">Date / Year</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          value={cert.year} 
                          onChange={e => updateCertification(index, 'year', e.target.value)} 
                          placeholder="e.g. 2023" 
                        />
                      </div>
                      <div>
                        <label className="crm-label">Credential Link (Optional)</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          value={cert.link} 
                          onChange={e => updateCertification(index, 'link', e.target.value)} 
                          placeholder="e.g. https://aws.amazon.com/..." 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>

          {/* Form Panel: Skills */}
          <SurfaceCard className="p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 bg-white">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Languages size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Skills</h2>
                <p className="text-xs text-slate-400">Technical domains, frameworks, and tools</p>
              </div>
            </div>
            
            <div>
              <label className="crm-label flex justify-between">
                <span>Enter skills separated by commas</span>
                <span className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">e.g. React, Python</span>
              </label>
              <textarea 
                className="crm-input h-24 py-3 resize-none focus:border-blue-500" 
                value={data.skillsRaw !== undefined ? data.skillsRaw : (data.skills || []).join(', ')} 
                onChange={handleSkillsChange} 
                placeholder="JavaScript, React, Node.js, Python, SQL"
              ></textarea>
            </div>
          </SurfaceCard>

          {/* Form Panel: Languages */}
          <SurfaceCard className="p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 bg-white">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Languages size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Languages</h2>
                <p className="text-xs text-slate-400">Speakable and native languages</p>
              </div>
            </div>
            
            <div>
              <label className="crm-label flex justify-between">
                <span>Enter languages separated by commas</span>
                <span className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">e.g. English, Tamil</span>
              </label>
              <textarea 
                className="crm-input h-24 py-3 resize-none focus:border-blue-500" 
                value={data.languagesRaw !== undefined ? data.languagesRaw : (data.languages || []).join(', ')} 
                onChange={handleLanguagesChange} 
                placeholder="English, Spanish, Hindi, French"
              ></textarea>
            </div>
          </SurfaceCard>

          {/* Form Panel: Awards & Achievements */}
          <SurfaceCard className="p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 bg-white">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Award size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Awards & Achievements</h2>
                <p className="text-xs text-slate-400">Competitive achievements, rankings, and merits</p>
              </div>
            </div>
            
            <div>
              <label className="crm-label">Enter awards and achievements (bullet points, separated by newlines)</label>
              <textarea 
                className="crm-input h-28 py-3 resize-none focus:border-blue-500" 
                value={data.awards} 
                onChange={e => updateAwards(e.target.value)} 
                placeholder="Won 1st place in Hackathon 2023...&#10;Awarded Best Student Merit Scholarship..."
              ></textarea>
            </div>
          </SurfaceCard>

          {/* Preview & Generate Resume Button */}
          <div className="flex justify-end mt-6">
            <button 
              onClick={handlePreviewAndGenerate} 
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-8 py-3.5 text-md font-bold text-white shadow-[0_12px_24px_rgba(37,99,235,0.2)] hover:shadow-[0_16px_32px_rgba(37,99,235,0.3)] transition-all cursor-pointer"
            >
              <span>Preview & Generate Resume</span>
            </button>
          </div>
        </div>
      ) : (
        /* Preview Panel */
        <div className="flex flex-col h-[calc(100vh-180px)] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shrink-0 select-none">
            <button 
              onClick={() => setStep('form')} 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition"
            >
              &larr; Back to Edit
            </button>
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Template:</label>
              <select 
                className="crm-input h-9 px-3 text-xs min-w-[200px] bg-slate-50 border-slate-200"
                value={activeTemplate}
                onChange={e => setActiveTemplate(e.target.value)}
              >
                {Templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={handleExportPDF} 
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition"
            >
              <Download size={16} /> Export PDF
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar bg-slate-200/50">
            {/* The A4 Container */}
            <div 
              ref={printRef}
              className="bg-white shadow-xl w-full max-w-[800px] min-h-[1131px] print:shadow-none print:m-0 print:w-full"
              style={{ minHeight: '1131px' }} // Approx A4 ratio
            >
              <SelectedTemplate data={data} />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
