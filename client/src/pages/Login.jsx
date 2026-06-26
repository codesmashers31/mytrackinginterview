import React, { useState, useEffect, useRef } from 'react';
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
  Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';
import { buildApiUrl } from '../utils/api';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  // Particle connection canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = [];
    const particleCount = Math.min(50, Math.floor((width * height) / 30000));
    
    let mouse = { x: null, y: null, radius: 140 };
    
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 2 + 1.2;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx = -this.vx;
        if (this.y < 0 || this.y > height) this.vy = -this.vy;

        // Push away from mouse
        if (mouse.x !== null) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * force * 1.5;
            this.y += Math.sin(angle) * force * 1.5;
          }
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(79, 70, 229, 0.25)'; // Soft indigo dot
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const drawLines = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            const alpha = ((110 - dist) / 110) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(79, 70, 229, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      drawLines();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);



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
        
        // Redirect to student/dashboard directly for students so they see the premium student dashboard
        if (data.user.role === 'student') {
          navigate('/student/dashboard');
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

  const cards = [
    {
      title: 'Daily Consistency',
      desc: 'Maintain >90% daily check-in habits to build professional discipline.',
      icon: <LineChart size={18} className="text-amber-650" />,
      bg: 'bg-amber-50/50 border-amber-100'
    },
    {
      title: 'Code Mastery',
      desc: 'Engage with core team challenges to sharpen real-world systems logic.',
      icon: <Brain size={18} className="text-indigo-655" />,
      bg: 'bg-indigo-50/50 border-indigo-100'
    },
    {
      title: 'Interview Grit',
      desc: 'Evaluate technical readiness with expert mock boards to conquer actual drives.',
      icon: <UserCheck size={18} className="text-emerald-650" />,
      bg: 'bg-emerald-50/50 border-emerald-100'
    },
    {
      title: 'Career Launch',
      desc: 'Unlock direct matching matches with 150+ premier hiring partners.',
      icon: <Sparkles size={18} className="text-violet-655" />,
      bg: 'bg-violet-50/50 border-violet-100'
    }
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#fafbfe] px-4 py-8 flex items-center justify-center font-sans">
      
      {/* Interactive connection network canvas background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-70"
      />

      {/* Decorative gradients */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none animate-pulse-slow" />
      
      {/* Soft CSS mesh grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#eef2f7_1px,transparent_1px),linear-gradient(to_bottom,#eef2f7_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] pointer-events-none z-0" />

      {/* Keyframe animation styles */}
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
          background: linear-gradient(90deg, transparent, #4f46e5, #10b981, #4f46e5, transparent);
          box-shadow: 0 0 6px rgba(79, 70, 229, 0.3), 0 0 10px rgba(16, 185, 129, 0.3);
          animation: scan 3.5s infinite linear;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.08);
          border-radius: 99px;
        }
        .animate-pulse-slow {
          animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      <div className="relative w-full max-w-6xl grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] z-10 my-auto">
        
        {/* Left Side: Product Branding & Platform Workspace Simulator */}
        <div className="hidden lg:block text-slate-800 pr-6">
          <div className="max-w-2xl">
            {/* Logo and Brand Title */}
            <div className="flex items-center gap-3.5 mb-6">
              <img src="/logo.png" alt="PlaceX Logo" className="h-11 w-11 object-contain shrink-0" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black tracking-tight text-slate-900">Place<span className="text-indigo-600">X</span></span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">v2.1</span>
                </div>
                <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 font-mono">Placement & Training Ecosystem</span>
              </div>
            </div>

            <h1 className="text-4xl xl:text-[44px] font-black tracking-tight leading-[1.15] text-slate-900">
              The Intelligent Infrastructure for Professional Placements.
            </h1>
            <p className="mt-4 text-slate-500 text-sm leading-relaxed max-w-lg">
              Empower student preparation workflows, daily metrics monitoring, mock assessment cycles, and automatic recruitment matchers using unified ledger logic.
            </p>

            {/* Small Milestone Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              {cards.map((card, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-slate-200/60 shadow-[0_2px_8px_rgba(15,23,42,0.01)] hover:shadow-[0_10px_25px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-350 flex flex-col justify-between text-left"
                >
                  <div>
                    <div className={`p-2 rounded-xl border ${card.bg} w-fit mb-3`}>
                      {card.icon}
                    </div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{card.title}</h3>
                    <p className="mt-1 text-[11px] text-slate-500 leading-relaxed font-medium">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Professional Glassmorphic White Login Card */}
        <div className="mx-auto w-full max-w-[440px]">
          <div className="relative rounded-[32px] bg-white border border-slate-200/90 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.05)] backdrop-blur-xl transition-all duration-300">
            {/* Subtle floating glow orb */}
            <div className="absolute top-[-10%] right-[-10%] h-40 w-40 rounded-full bg-indigo-500/5 blur-[45px] pointer-events-none" />
            
            {/* Card header with always-visible Logo */}
            <div className="relative mb-6">
              <div className="flex items-center gap-3.5 mb-6">
                <img src="/logo.png" alt="PlaceX Logo" className="h-11 w-11 object-contain shrink-0" />
                <div className="text-left">
                  <span className="text-2xl font-black tracking-tight text-slate-900">Place<span className="text-indigo-600">X</span></span>
                  <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-450 font-mono">Placement Ecosystem</span>
                </div>
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-900 font-sans">Access Platform Gate</h2>
              <p className="mt-1.5 text-xs text-slate-450 leading-relaxed font-medium">
                Enter your registered email address or mobile number to authenticate.
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1.5 font-mono">Registered Identity</label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors"
                  />
                  <input
                    type="text"
                    required
                    value={formData.email}
                    onChange={event => setFormData({ ...formData, email: event.target.value })}
                    className="w-full h-11 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition duration-205 focus:ring-4 focus:ring-indigo-50"
                    placeholder="Email or mobile number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1.5 font-mono">Access Passcode</label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={event => setFormData({ ...formData, password: event.target.value })}
                    className="w-full h-11 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl pl-11 pr-11 text-sm font-semibold text-slate-800 outline-none transition duration-205 focus:ring-4 focus:ring-indigo-50"
                    placeholder="Enter account password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(value => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-650/60 disabled:cursor-not-allowed text-sm font-bold text-white transition-all duration-200 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 mt-2 cursor-pointer group"
              >
                {loading ? 'Verifying profile...' : 'Access Dashboard'}
                {!loading && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          </div>
        </div>

        {/* Small Screen Platform Feature List */}
        <div className="block lg:hidden mt-6 text-slate-855 px-2 space-y-4">
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-lg font-bold text-slate-900 font-sans mb-3">
              PlaceX Success Milestones
            </h2>
            <div className="space-y-3">
              {cards.map((card, idx) => (
                <div key={idx} className="flex gap-3.5 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${card.bg}`}>
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide text-left">
                      {card.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 leading-normal font-medium text-left">{card.desc}</p>
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
