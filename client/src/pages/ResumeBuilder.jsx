import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { AppShell, SurfaceCard } from '../components/AppShell';
import { getTemplateById, Templates } from '../components/ResumeTemplates';
import { Download, Plus, Trash2, Save, Loader2 } from 'lucide-react';
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
    certifications: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const res = await fetch(buildApiUrl('/auth/my-resume'), {
          headers: authHeaders()
        });
        if (res.ok) {
          const savedData = await res.json();
          if (Object.keys(savedData).length > 0) {
            // Merge saved data with default structure to prevent missing keys
            setData(prev => ({
              basicInfo: savedData.basicInfo || prev.basicInfo,
              education: savedData.education || [],
              experience: savedData.experience || [],
              projects: savedData.projects || [],
              skills: savedData.skills || [],
              certifications: savedData.certifications || []
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load resume data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResume();
  }, []);

  const handleSave = async () => {
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
        toast.success('Resume saved successfully!');
      } else {
        toast.error('Failed to save resume.');
      }
    } catch (error) {
      toast.error('Network error. Could not save.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${data.basicInfo.name || 'Resume'}_Resume`,
  });

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
    const skillsArray = e.target.value.split(',').map(s => s.trim()).filter(s => s);
    setData(prev => ({ ...prev, skills: skillsArray }));
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
      subtitle="Create and download your professional resume."
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
          <span className="text-slate-600">Loading your resume...</span>
        </div>
      ) : step === 'form' ? (
        <div className="flex flex-col gap-6 pb-10">
          <div className="flex justify-end">
             <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="crm-button flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? 'Saving...' : 'Save Progress'}
              </button>
          </div>
          {/* Form Panel */}
          <SurfaceCard className="p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Basic Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input type="text" className="crm-input" value={data.basicInfo.name} onChange={e => updateBasicInfo('name', e.target.value)} placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input type="email" className="crm-input" value={data.basicInfo.email} onChange={e => updateBasicInfo('email', e.target.value)} placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                <input type="text" className="crm-input" value={data.basicInfo.phone} onChange={e => updateBasicInfo('phone', e.target.value)} placeholder="+1 234 567 890" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">LinkedIn URL</label>
                <input type="text" className="crm-input" value={data.basicInfo.linkedin} onChange={e => updateBasicInfo('linkedin', e.target.value)} placeholder="linkedin.com/in/johndoe" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">GitHub / Portfolio URL</label>
                <input type="text" className="crm-input" value={data.basicInfo.github} onChange={e => updateBasicInfo('github', e.target.value)} placeholder="github.com/johndoe" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Professional Summary</label>
                <textarea className="crm-input h-24" value={data.basicInfo.summary} onChange={e => updateBasicInfo('summary', e.target.value)} placeholder="A brief summary of your professional background..."></textarea>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-bold text-slate-800">Experience</h2>
              <button onClick={addExperience} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                <Plus size={14} /> Add Experience
              </button>
            </div>
            {data.experience.map((exp, index) => (
              <div key={index} className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100 relative">
                <button onClick={() => removeExperience(index)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Role / Job Title</label>
                    <input type="text" className="crm-input" value={exp.role} onChange={e => updateExperience(index, 'role', e.target.value)} placeholder="Software Engineer" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Company</label>
                    <input type="text" className="crm-input" value={exp.company} onChange={e => updateExperience(index, 'company', e.target.value)} placeholder="Tech Corp Inc." />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Duration</label>
                    <input type="text" className="crm-input" value={exp.duration} onChange={e => updateExperience(index, 'duration', e.target.value)} placeholder="Jan 2020 - Present" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Description (Bullet points, separated by newlines)</label>
                    <textarea className="crm-input h-24" value={exp.description} onChange={e => updateExperience(index, 'description', e.target.value)} placeholder="Developed REST APIs...&#10;Optimized database queries..."></textarea>
                  </div>
                </div>
              </div>
            ))}
            {data.experience.length === 0 && <p className="text-sm text-slate-500 italic">No experience added yet.</p>}
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-bold text-slate-800">Projects</h2>
              <button onClick={addProject} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                <Plus size={14} /> Add Project
              </button>
            </div>
            {data.projects.map((proj, index) => (
              <div key={index} className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100 relative">
                <button onClick={() => removeProject(index)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Project Title</label>
                    <input type="text" className="crm-input" value={proj.title} onChange={e => updateProject(index, 'title', e.target.value)} placeholder="E-commerce Platform" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Link (Optional)</label>
                    <input type="text" className="crm-input" value={proj.link} onChange={e => updateProject(index, 'link', e.target.value)} placeholder="github.com/project" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Tech Stack</label>
                    <input type="text" className="crm-input" value={proj.techStack} onChange={e => updateProject(index, 'techStack', e.target.value)} placeholder="React, Node.js, MongoDB" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                    <textarea className="crm-input h-24" value={proj.description} onChange={e => updateProject(index, 'description', e.target.value)} placeholder="Describe what you built and your role..."></textarea>
                  </div>
                </div>
              </div>
            ))}
            {data.projects.length === 0 && <p className="text-sm text-slate-500 italic">No projects added yet.</p>}
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-bold text-slate-800">Education</h2>
              <button onClick={addEducation} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                <Plus size={14} /> Add Education
              </button>
            </div>
            {data.education.map((edu, index) => (
              <div key={index} className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100 relative">
                <button onClick={() => removeEducation(index)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Degree / Course</label>
                    <input type="text" className="crm-input" value={edu.degree} onChange={e => updateEducation(index, 'degree', e.target.value)} placeholder="B.Tech Computer Science" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Institution</label>
                    <input type="text" className="crm-input" value={edu.institution} onChange={e => updateEducation(index, 'institution', e.target.value)} placeholder="University Name" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Year</label>
                    <input type="text" className="crm-input" value={edu.year} onChange={e => updateEducation(index, 'year', e.target.value)} placeholder="2018 - 2022" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Score (CGPA/%)</label>
                    <input type="text" className="crm-input" value={edu.score} onChange={e => updateEducation(index, 'score', e.target.value)} placeholder="8.5 CGPA" />
                  </div>
                </div>
              </div>
            ))}
            {data.education.length === 0 && <p className="text-sm text-slate-500 italic">No education added yet.</p>}
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-bold text-slate-800">Certifications</h2>
              <button onClick={addCertification} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                <Plus size={14} /> Add Certification
              </button>
            </div>
            {data.certifications.map((cert, index) => (
              <div key={index} className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100 relative">
                <button onClick={() => removeCertification(index)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Certification Title</label>
                    <input type="text" className="crm-input" value={cert.title} onChange={e => updateCertification(index, 'title', e.target.value)} placeholder="AWS Certified Solutions Architect" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Issuing Organization</label>
                    <input type="text" className="crm-input" value={cert.issuer} onChange={e => updateCertification(index, 'issuer', e.target.value)} placeholder="Amazon Web Services" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Year / Date</label>
                    <input type="text" className="crm-input" value={cert.year} onChange={e => updateCertification(index, 'year', e.target.value)} placeholder="2023" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Credential Link (Optional)</label>
                    <input type="text" className="crm-input" value={cert.link} onChange={e => updateCertification(index, 'link', e.target.value)} placeholder="https://..." />
                  </div>
                </div>
              </div>
            ))}
            {data.certifications.length === 0 && <p className="text-sm text-slate-500 italic">No certifications added yet.</p>}
          </SurfaceCard>

            <SurfaceCard className="p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Skills</h2>
              <label className="block text-xs font-medium text-slate-700 mb-1">Enter skills separated by commas</label>
              <textarea 
                className="crm-input h-24" 
                value={data.skills.join(', ')} 
                onChange={handleSkillsChange} 
                placeholder="JavaScript, React, Node.js, Python, SQL"
              ></textarea>
            </SurfaceCard>

            <div className="flex justify-end mt-6">
              <button 
                onClick={() => setStep('preview')} 
                className="crm-button text-lg px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md"
              >
                Preview & Generate Resume
              </button>
            </div>
        </div>
      ) : (
        /* Preview Panel */
        <div className="flex flex-col h-[calc(100vh-180px)] bg-slate-200 rounded-2xl overflow-hidden border border-slate-300 shadow-inner">
          <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shrink-0">
            <button onClick={() => setStep('form')} className="text-slate-600 hover:text-slate-800 text-sm font-medium">
              &larr; Back to Edit
            </button>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">Template:</label>
              <select 
                className="crm-input py-1.5 min-w-[200px]"
                value={activeTemplate}
                onChange={e => setActiveTemplate(e.target.value)}
              >
                {Templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <button onClick={() => handlePrint()} className="crm-button flex items-center gap-2">
              <Download size={16} /> Export PDF
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar">
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
