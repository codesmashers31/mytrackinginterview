import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  Sparkles, 
  Brain, 
  FileText, 
  UserCheck, 
  LineChart,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Cpu,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { buildApiUrl } from '../utils/api';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-cycle through the AI explanation steps if not hovered
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const handleSubmit = async event => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(buildApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userRole', data.user.role);
        if (data.user.studentType) {
          localStorage.setItem('userStudentType', data.user.studentType);
        } else {
          localStorage.removeItem('userStudentType');
        }
        toast.success(`Welcome back, ${data.user.name.split(' ')[0]}`);
        if (data.user.role === 'student') {
          navigate('/student/tasks');
        } else if (data.user.role === 'placement') {
          navigate('/placement/dashboard');
        } else if (data.user.role === 'coordinator') {
          navigate('/coordinator/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(data.message || 'Access Denied');
      }
    } catch (err) {
      toast.error('Network connect failure.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      id: 0,
      title: 'AI Resume Ingestion & Parsing',
      subtitle: 'Skill Profiling',
      shortDesc: 'Automated skill extraction & portfolio mapping.',
      icon: <FileText size={18} />,
      colorClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      id: 1,
      title: 'AI Mock Board Evaluation',
      subtitle: 'Evaluation Engine',
      shortDesc: 'Technical gap scoring and interview readiness.',
      icon: <Brain size={18} />,
      colorClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    },
    {
      id: 2,
      title: 'Recruitment Match Analytics',
      subtitle: 'Eligibility Screener',
      shortDesc: 'Instant alignment with company requirements.',
      icon: <UserCheck size={18} />,
      colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 3,
      title: 'Predictive Success Monitor',
      subtitle: 'Consistency & Attendance Tracking',
      shortDesc: 'Daily metric analysis and consistency scores.',
      icon: <LineChart size={18} />,
      colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    }
  ];

  const renderSimulation = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider font-mono">PDF Ingestion & NLP Scanner</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Parsing Active</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Dummy Resume doc */}
              <div className="relative p-3 rounded-xl bg-slate-950/60 border border-white/5 overflow-hidden h-40 text-[9px] font-mono text-slate-400 space-y-1.5">
                <div className="animate-scan-line" />
                <div className="flex items-center gap-2 mb-1.5 text-white font-semibold text-xs border-b border-white/5 pb-1">
                  <FileText size={12} className="text-blue-400" />
                  <span>Suresh_R_Resume.pdf</span>
                </div>
                <div className="text-white font-semibold text-[10px]">SURESH R (Regular Batch 2)</div>
                <div>Email: sureshr.dev@gmail.com</div>
                <div>Mobile: +91 98401 23456</div>
                <div className="mt-1 text-blue-300 font-semibold border-t border-white/5 pt-1 text-[8px] uppercase tracking-wider">Technical Stack:</div>
                <div className="text-slate-300 leading-tight">React, Redux, Node.js, Express, MongoDB, Tailwind, DSA, JavaScript (ES6+), Git</div>
              </div>

              {/* Parsed JSON Result */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 h-40 font-mono text-[8px] text-emerald-400 overflow-y-auto space-y-0.5 scrollbar-thin">
                <div className="text-[9px] text-slate-400 mb-1 border-b border-white/5 pb-1 flex justify-between font-sans">
                  <span>Structured Output</span>
                  <span className="text-emerald-400 font-semibold">98.4% Confidence</span>
                </div>
                <div>{"{"}</div>
                <div className="pl-4">"identity": {"{"}</div>
                <div className="pl-8">"name": <span className="text-amber-300">"Suresh R"</span>,</div>
                <div className="pl-8">"parsed_email": <span className="text-amber-300">"sureshr.dev@gmail.com"</span></div>
                <div className="pl-4">{"}"},</div>
                <div className="pl-4">"skills_extracted": [</div>
                <div className="pl-8"><span className="text-amber-300">"React"</span>, <span className="text-amber-300">"Node.js"</span>, <span className="text-amber-300">"MongoDB"</span>,</div>
                <div className="pl-8"><span className="text-amber-300">"Express"</span>, <span className="text-amber-300">"JavaScript"</span>, <span className="text-amber-300">"DSA"</span>]</div>
                <div className="pl-4">],</div>
                <div className="pl-4">"eligibility_flags": {"{"}</div>
                <div className="pl-8">"is_regular_batch": <span className="text-blue-300">true</span>,</div>
                <div className="pl-8">"ready_for_mocks": <span className="text-blue-300">true</span></div>
                <div className="pl-4">{"}"}</div>
                <div>{"}"}</div>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider font-mono">Mock Interview Board Report</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Evaluation Finished</span>
            </div>

            <div className="bg-slate-950/50 rounded-xl border border-white/5 p-3 space-y-2.5">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-white">Candidate: Saritha N</span>
                  <span className="block text-[10px] text-slate-400 font-mono">Batch 1 • Regular Batch</span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">GRADE A+</span>
                  <span className="block text-[9px] text-slate-500 mt-0.5 font-semibold">Placement Ready</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-400">Frontend Core</span>
                    <span className="text-white font-semibold">92%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-400">DSA & Problem Solving</span>
                    <span className="text-white font-semibold">85%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-400">System Design</span>
                    <span className="text-white font-semibold">78%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-400">Communication & Culture</span>
                    <span className="text-white font-semibold">90%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
              </div>

              <div className="text-[9px] leading-relaxed bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-2 text-slate-300">
                <span className="font-bold text-indigo-300 font-mono">AI Recommended Action:</span> "High proficiency in React, state lifecycle and custom hooks. Ready for premium interview slots. Keep revising complex database joins and schema design queries."
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider font-mono">Company Eligibility Screener</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Automatic Selection</span>
            </div>

            <div className="bg-slate-950/50 rounded-xl border border-white/5 overflow-hidden">
              <div className="p-2 bg-white/[0.02] border-b border-white/5 flex justify-between items-center text-[9px] font-semibold text-slate-400">
                <span>Role: Associate Software Engineer (React + Node)</span>
                <span className="text-emerald-400">Required Attendance: &gt;= 85%</span>
              </div>
              <div className="divide-y divide-white/5 text-[10px]">
                {[
                  { name: 'Suresh R', cohort: 'Regular Batch 2', match: '96% Match', status: 'Pre-Selected', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                  { name: 'Nithyasri K', cohort: 'Regular + SPL', match: '91% Match', status: 'Pre-Selected', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                  { name: 'Ashwith S', cohort: 'Regular Batch 4', match: '87% Match', status: 'Interviewing', badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                  { name: 'Swathi P', cohort: 'Regular Batch 2', match: '82% Match', status: 'Under Review', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center px-3 py-2 hover:bg-white/[0.01]">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <div>
                        <span className="font-semibold text-white block leading-tight">{item.name}</span>
                        <span className="text-[8px] text-slate-500 font-mono">{item.cohort}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <span className="font-bold text-emerald-400 font-mono">{item.match}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${item.badgeClass}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider font-mono">Daily Attendance & Metric Forecast</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Cohort Analyzer</span>
            </div>

            <div className="bg-slate-950/50 rounded-xl border border-white/5 p-3 space-y-2.5">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-white">Daily Check-in Verification</span>
                  <span className="block text-[10px] text-slate-400 font-mono">Nithyasri K • Regular + SPL batch</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-400 font-mono">98/100 Stability</span>
                  <span className="block text-[9px] text-slate-500 font-semibold mt-0.5">High Consistency</span>
                </div>
              </div>

              {/* Grid of days */}
              <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                {[
                  { day: 'Mon', checkin: '09:00 AM', status: 'OK', statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                  { day: 'Tue', checkin: '08:58 AM', status: 'OK', statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                  { day: 'Wed', checkin: '09:05 AM', status: 'OK', statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                  { day: 'Thu', checkin: '08:45 AM', status: 'OK', statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                  { day: 'Fri', checkin: '08:59 AM', status: 'OK', statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
                ].map((item, idx) => (
                  <div key={idx} className={`p-1 rounded-lg border ${item.statusColor} flex flex-col justify-between h-12`}>
                    <span className="font-bold text-[8px] text-slate-400 uppercase">{item.day}</span>
                    <span className="text-[8px] text-white font-mono leading-tight">{item.checkin}</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider">OK</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2.5 text-[9px] items-center bg-white/[0.02] border border-white/5 rounded-lg p-2 text-slate-300">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="leading-normal">
                  <span className="font-bold text-white font-mono">Prediction:</span> 99% task compliance observed. Dynamic rating triggers immediate promotion to mock tier groups.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 px-4 py-8 flex items-center justify-center font-sans">
      
      {/* Custom Styles Injection */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.8; }
          100% { top: 0%; opacity: 0.8; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-scan-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #3b82f6, #10b981, #3b82f6, transparent);
          box-shadow: 0 0 8px #3b82f6, 0 0 14px #10b981;
          animation: scan 3s infinite linear;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 99px;
        }
      `}</style>

      {/* Decorative ambient background assets */}
      <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      
      {/* Subtle dots grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] pointer-events-none" />

      <div className="relative w-full max-w-6xl grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] z-10 my-auto">
        
        {/* Left Side: Product Branding & Interactive AI Control Center */}
        <div className="hidden lg:block text-slate-100 pr-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 backdrop-blur-md font-outfit uppercase tracking-wider">
              <Sparkles size={12} className="animate-pulse" />
              PlaceX AI engine integration
            </div>
            
            <h1 className="mt-4 text-4xl xl:text-5xl font-extrabold tracking-tight text-white font-outfit leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
              AI-Driven Placement & Training Operations
            </h1>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed max-w-lg">
              Maximize success rates using artificial intelligence designed to profile skills, verify attendance, match candidates to requirements, and streamline mock evaluations.
            </p>

            {/* Simulated Live Visual Terminal */}
            <div 
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="mt-6 rounded-2xl bg-slate-900/60 border border-white/[0.08] p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl transition duration-300 hover:border-slate-800/80"
            >
              {/* Header inside the simulator box */}
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold font-mono tracking-widest pl-2">PLACEX_AI_DAEMON_V2.0</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-500 font-mono">
                  <Cpu size={12} className="text-blue-500 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>SYSTEM ONLINE</span>
                </div>
              </div>

              {/* Dynamic simulation render */}
              <div className="min-h-[175px] bg-slate-950/40 rounded-xl border border-white/[0.04] p-4 flex flex-col justify-center transition duration-200">
                {renderSimulation()}
              </div>

              {/* Timeline selector steps under the box */}
              <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/5">
                {steps.map((step) => {
                  const isActive = activeStep === step.id;
                  return (
                    <button
                      key={step.id}
                      onClick={() => setActiveStep(step.id)}
                      className={`flex flex-col text-left p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                        isActive 
                          ? 'bg-white/[0.03] border-white/15 shadow-[0_4px_12px_rgba(0,0,0,0.35)]' 
                          : 'bg-transparent border-transparent opacity-50 hover:opacity-80 hover:bg-white/[0.01]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${step.colorClass}`}>
                          {step.icon}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Step 0{step.id + 1}</span>
                      </div>
                      <span className="text-[10px] font-bold text-white mt-1.5 block truncate">{step.title}</span>
                      <span className="text-[8px] text-slate-500 mt-0.5 block truncate">{step.subtitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Professional Glassmorphic Login Card */}
        <div className="mx-auto w-full max-w-md">
          <div className="relative rounded-3xl bg-slate-900/40 border border-white/[0.08] p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden">
            {/* Glowing blur ball inside card */}
            <div className="absolute top-[-20%] right-[-20%] h-48 w-48 rounded-full bg-blue-500/10 blur-[45px] pointer-events-none" />
            
            <div className="relative mb-8 text-center sm:text-left">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-500 mb-4 shadow-[0_4px_12px_rgba(37,99,235,0.15)]">
                <ShieldCheck size={26} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white font-outfit">Sign in to PlaceX</h2>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Provide your registered mobile number or email address to authenticate.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 font-mono">Registered Identity</label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="text"
                    required
                    value={formData.email}
                    onChange={event => setFormData({ ...formData, email: event.target.value })}
                    className="w-full h-11 bg-slate-950/50 border border-white/[0.08] focus:border-blue-500 focus:bg-slate-950 rounded-2xl pl-11 pr-4 text-sm font-medium text-white outline-none transition duration-200 focus:ring-4 focus:ring-blue-500/10"
                    placeholder="email@example.com or Mobile"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 font-mono">Password</label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={event => setFormData({ ...formData, password: event.target.value })}
                    className="w-full h-11 bg-slate-950/50 border border-white/[0.08] focus:border-blue-500 focus:bg-slate-950 rounded-2xl pl-11 pr-11 text-sm font-medium text-white outline-none transition duration-200 focus:ring-4 focus:ring-blue-500/10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(value => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-sm font-bold text-white transition duration-200 shadow-lg shadow-blue-500/20 mt-2 cursor-pointer border border-blue-500/30"
              >
                {loading ? 'Verifying profile...' : 'Access Dashboard'}
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>

            {/* Login help card */}
            <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Student Sign-In Default Credentials</h4>
              <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
                Log in using your registered mobile number or email. The default password is set as your registered mobile number (unless you updated it).
              </p>
            </div>
          </div>
        </div>

        {/* Small Screen Footer details: Shown only on mobile for access to information */}
        <div className="block lg:hidden mt-4 text-slate-100 px-2 space-y-4">
          <div className="border-t border-white/5 pt-6">
            <h2 className="text-xl font-bold tracking-tight text-white font-outfit mb-3">
              PlaceX AI Engine Process Flow
            </h2>
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.id} className="flex gap-3.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${step.colorClass}`}>
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                      {step.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400 leading-normal">{step.shortDesc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

