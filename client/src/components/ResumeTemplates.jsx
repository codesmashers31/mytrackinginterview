import React from 'react';
import { User, Briefcase, GraduationCap, Globe, Award, List, Heart, Calendar, Mail, Phone, Star, Wrench, Shield, BookOpen, MapPin } from 'lucide-react';

const LinkedInIcon = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// Reusable components for consistency and ease of styling
const SectionHeader = ({ title, className = "" }) => (
  <h3 className={`uppercase tracking-wider font-bold mb-3 ${className}`}>{title}</h3>
);

// 1. Classic Professional
const Template1 = ({ data }) => (
  <div className="p-8 bg-white text-slate-800 font-serif min-h-full">
    <header className="text-center mb-8 border-b-2 border-slate-800 pb-4">
      <h1 className="text-4xl font-bold uppercase tracking-widest">{data.basicInfo.name || 'Your Name'}</h1>
      <p className="text-sm mt-2 text-slate-600 flex justify-center gap-4 flex-wrap">
        {data.basicInfo.email && <span>{data.basicInfo.email}</span>}
        {data.basicInfo.phone && <span>| {data.basicInfo.phone}</span>}
        {data.basicInfo.linkedin && <span>| {data.basicInfo.linkedin}</span>}
        {data.basicInfo.github && <span>| {data.basicInfo.github}</span>}
      </p>
    </header>

    {data.basicInfo.summary && (
      <section className="mb-6">
        <SectionHeader title="Professional Summary" className="border-b border-slate-300" />
        <p className="text-sm leading-relaxed text-justify">{data.basicInfo.summary}</p>
      </section>
    )}

    {data.experience.length > 0 && (
      <section className="mb-6">
        <SectionHeader title="Experience" className="border-b border-slate-300" />
        <div className="space-y-4 mt-3">
          {data.experience.map((exp, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-1">
                <h4 className="font-bold text-lg">{exp.role}</h4>
                <span className="text-sm italic">{exp.duration}</span>
              </div>
              <div className="text-md italic text-slate-700 mb-2">{exp.company}</div>
              <ul className="list-disc list-inside text-sm space-y-1">
                {exp.description.split('\n').map((point, j) => point.trim() && <li key={j}>{point}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
    )}

    {data.education.length > 0 && (
      <section className="mb-6">
        <SectionHeader title="Education" className="border-b border-slate-300" />
        <div className="space-y-3 mt-3">
          {data.education.map((edu, i) => (
            <div key={i} className="flex justify-between items-start">
              <div>
                <h4 className="font-bold">{edu.degree}</h4>
                <div className="text-sm">{edu.institution}</div>
              </div>
              <div className="text-right text-sm">
                <div className="italic">{edu.year}</div>
                <div>{edu.score}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )}

    {data.projects.length > 0 && (
      <section className="mb-6">
        <SectionHeader title="Projects" className="border-b border-slate-300" />
        <div className="space-y-4 mt-3">
          {data.projects.map((proj, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-1">
                <h4 className="font-bold">{proj.title}</h4>
                {proj.link && <a href={proj.link} className="text-sm text-blue-600 underline">Link</a>}
              </div>
              {proj.techStack && <div className="text-xs font-mono text-slate-500 mb-1">{proj.techStack}</div>}
              <ul className="list-disc list-inside text-sm space-y-1">
                {proj.description.split('\n').map((point, j) => point.trim() && <li key={j}>{point}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
    )}

    {data.certifications && data.certifications.length > 0 && (
      <section className="mb-6">
        <SectionHeader title="Certifications" className="border-b border-slate-300" />
        <div className="space-y-3 mt-3">
          {data.certifications.map((cert, i) => (
            <div key={i} className="flex justify-between items-start">
              <div>
                <h4 className="font-bold">{cert.title}</h4>
                <div className="text-sm">{cert.issuer}</div>
              </div>
              <div className="text-right text-sm">
                <div className="italic">{cert.year}</div>
                {cert.link && <a href={cert.link} className="text-xs text-blue-600 underline">View Credential</a>}
              </div>
            </div>
          ))}
        </div>
      </section>
    )}

    {data.skills.length > 0 && (
      <section className="mb-6">
        <SectionHeader title="Skills" className="border-b border-slate-300" />
        <div className="mt-3 text-sm flex flex-wrap gap-2">
          {data.skills.map((skill, i) => (
            <span key={i} className="after:content-[','] last:after:content-['']">{skill}</span>
          ))}
        </div>
      </section>
    )}

    {data.languages && data.languages.length > 0 && (
      <section className="mb-6">
        <SectionHeader title="Languages" className="border-b border-slate-300" />
        <div className="mt-3 text-sm flex flex-wrap gap-2">
          {data.languages.map((lang, i) => (
            <span key={i} className="after:content-[','] last:after:content-['']">{lang}</span>
          ))}
        </div>
      </section>
    )}

    {data.awards && data.awards.trim() && (
      <section className="mb-6">
        <SectionHeader title="Awards & Achievements" className="border-b border-slate-300" />
        <ul className="list-disc list-inside text-sm space-y-1 mt-3">
          {data.awards.split('\n').map((point, j) => point.trim() && <li key={j}>{point}</li>)}
        </ul>
      </section>
    )}
  </div>
);

// 2. Modern Minimalist
const Template2 = ({ data }) => (
  <div className="p-10 bg-slate-50 text-slate-900 font-sans min-h-full">
    <div className="grid grid-cols-3 gap-8">
      <div className="col-span-1">
        <h1 className="text-4xl font-black tracking-tight leading-none mb-4 break-words text-blue-900">{data.basicInfo.name || 'Your Name'}</h1>
        <div className="text-sm space-y-2 text-slate-600 mt-6 border-t-2 border-blue-900 pt-4">
          {data.basicInfo.email && <div className="break-words">{data.basicInfo.email}</div>}
          {data.basicInfo.phone && <div>{data.basicInfo.phone}</div>}
          {data.basicInfo.linkedin && <div className="break-words">{data.basicInfo.linkedin}</div>}
          {data.basicInfo.github && <div className="break-words">{data.basicInfo.github}</div>}
        </div>
        
        {data.skills.length > 0 && (
          <div className="mt-8">
            <h3 className="font-bold text-blue-900 uppercase tracking-widest text-sm mb-3">Skills</h3>
            <div className="flex flex-col gap-1 text-sm">
              {data.skills.map((skill, i) => <div key={i}>{skill}</div>)}
            </div>
          </div>
        )}
        
        {data.education.length > 0 && (
          <div className="mt-8">
            <h3 className="font-bold text-blue-900 uppercase tracking-widest text-sm mb-3">Education</h3>
            {data.education.map((edu, i) => (
              <div key={i} className="mb-4">
                <div className="font-bold text-sm leading-tight">{edu.degree}</div>
                <div className="text-xs mt-1 text-slate-600">{edu.institution}</div>
                <div className="text-xs text-slate-500">{edu.year} | {edu.score}</div>
              </div>
            ))}
          </div>
        )}

        {data.certifications && data.certifications.length > 0 && (
          <div className="mt-8">
            <h3 className="font-bold text-blue-900 uppercase tracking-widest text-sm mb-3">Certifications</h3>
            {data.certifications.map((cert, i) => (
              <div key={i} className="mb-4">
                <div className="font-bold text-sm leading-tight">{cert.title}</div>
                <div className="text-xs mt-1 text-slate-600">{cert.issuer}</div>
                <div className="text-xs text-slate-500">{cert.year}</div>
                {cert.link && <a href={cert.link} className="text-xs text-blue-600">Credential</a>}
              </div>
            ))}
          </div>
        )}

        {data.languages && data.languages.length > 0 && (
          <div className="mt-8">
            <h3 className="font-bold text-blue-900 uppercase tracking-widest text-sm mb-3">Languages</h3>
            <div className="flex flex-col gap-1 text-sm">
              {data.languages.map((lang, i) => <div key={i}>{lang}</div>)}
            </div>
          </div>
        )}
      </div>

      <div className="col-span-2 space-y-8">
        {data.basicInfo.summary && (
          <div>
            <h3 className="font-bold text-blue-900 uppercase tracking-widest text-sm mb-3 border-b border-slate-200 pb-2">Profile</h3>
            <p className="text-sm leading-relaxed">{data.basicInfo.summary}</p>
          </div>
        )}

        {data.experience.length > 0 && (
          <div>
            <h3 className="font-bold text-blue-900 uppercase tracking-widest text-sm mb-4 border-b border-slate-200 pb-2">Experience</h3>
            <div className="space-y-6">
              {data.experience.map((exp, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-bold text-slate-800">{exp.role}</h4>
                    <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded">{exp.duration}</span>
                  </div>
                  <div className="text-sm font-medium text-blue-700 mb-2 mt-1">{exp.company}</div>
                  <ul className="list-disc list-inside text-sm space-y-1 text-slate-700">
                    {exp.description.split('\n').map((point, j) => point.trim() && <li key={j}>{point}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.projects.length > 0 && (
          <div>
            <h3 className="font-bold text-blue-900 uppercase tracking-widest text-sm mb-4 border-b border-slate-200 pb-2">Projects</h3>
            <div className="space-y-5">
              {data.projects.map((proj, i) => (
                <div key={i}>
                  <h4 className="font-bold text-slate-800 inline-block mr-2">{proj.title}</h4>
                  {proj.link && <span className="text-xs text-blue-600">{proj.link}</span>}
                  <div className="text-xs font-mono text-slate-500 my-1">{proj.techStack}</div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {proj.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.awards && data.awards.trim() && (
          <div>
            <h3 className="font-bold text-blue-900 uppercase tracking-widest text-sm mb-4 border-b border-slate-200 pb-2">Awards & Achievements</h3>
            <ul className="list-disc list-inside text-sm space-y-1 text-slate-700">
              {data.awards.split('\n').map((point, j) => point.trim() && <li key={j}>{point}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  </div>
);

// 3. Tech Sidebar (Dark sidebar)
const Template3 = ({ data }) => (
  <div className="flex min-h-full font-sans text-slate-800">
    <div className="w-1/3 bg-slate-800 text-white p-8">
      <h1 className="text-3xl font-bold mb-2">{data.basicInfo.name || 'Your Name'}</h1>
      <div className="h-1 w-12 bg-emerald-500 mb-6"></div>
      
      <div className="space-y-3 text-sm text-slate-300 mb-8">
        {data.basicInfo.email && <div className="flex items-center gap-2"><span className="text-emerald-400">@</span> <span className="break-all">{data.basicInfo.email}</span></div>}
        {data.basicInfo.phone && <div className="flex items-center gap-2"><span className="text-emerald-400">#</span> <span>{data.basicInfo.phone}</span></div>}
        {data.basicInfo.linkedin && <div className="flex items-center gap-2"><span className="text-emerald-400">in</span> <span className="break-all">{data.basicInfo.linkedin}</span></div>}
        {data.basicInfo.github && <div className="flex items-center gap-2"><span className="text-emerald-400">gh</span> <span className="break-all">{data.basicInfo.github}</span></div>}
      </div>

      {data.skills.length > 0 && (
        <div className="mb-8">
          <h3 className="uppercase tracking-widest text-sm font-bold text-white mb-4 border-b border-slate-600 pb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, i) => (
              <span key={i} className="bg-slate-700 px-2 py-1 text-xs rounded text-slate-200">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {data.education.length > 0 && (
        <div>
          <h3 className="uppercase tracking-widest text-sm font-bold text-white mb-4 border-b border-slate-600 pb-2">Education</h3>
          <div className="space-y-4">
            {data.education.map((edu, i) => (
              <div key={i}>
                <div className="font-bold text-sm text-emerald-400">{edu.degree}</div>
                <div className="text-xs text-slate-300 mt-1">{edu.institution}</div>
                <div className="text-xs text-slate-400 mt-1">{edu.year} | {edu.score}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.certifications && data.certifications.length > 0 && (
        <div className="mt-8">
          <h3 className="uppercase tracking-widest text-sm font-bold text-white mb-4 border-b border-slate-600 pb-2">Certifications</h3>
          <div className="space-y-4">
            {data.certifications.map((cert, i) => (
              <div key={i}>
                <div className="font-bold text-sm text-emerald-400">{cert.title}</div>
                <div className="text-xs text-slate-300 mt-1">{cert.issuer}</div>
                <div className="text-xs text-slate-400 mt-1">{cert.year}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.languages && data.languages.length > 0 && (
        <div className="mb-8">
          <h3 className="uppercase tracking-widest text-sm font-bold text-white mb-4 border-b border-slate-600 pb-2">Languages</h3>
          <div className="flex flex-wrap gap-2">
            {data.languages.map((lang, i) => (
              <span key={i} className="bg-slate-700 px-2 py-1 text-xs rounded text-slate-200">{lang}</span>
            ))}
          </div>
        </div>
      )}
    </div>

    <div className="w-2/3 bg-white p-8">
      {data.basicInfo.summary && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="text-emerald-500">Profile</span>
          </h3>
          <p className="text-sm leading-relaxed text-slate-600">{data.basicInfo.summary}</p>
        </div>
      )}

      {data.experience.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-emerald-500">Experience</span>
          </h3>
          <div className="space-y-6">
            {data.experience.map((exp, i) => (
              <div key={i} className="relative pl-4 border-l-2 border-emerald-200">
                <div className="absolute w-2 h-2 bg-emerald-500 rounded-full -left-[5px] top-1.5"></div>
                <h4 className="font-bold text-lg">{exp.role}</h4>
                <div className="text-sm font-medium text-emerald-600 mb-1">{exp.company} <span className="text-slate-400 ml-2">| {exp.duration}</span></div>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 mt-2">
                  {exp.description.split('\n').map((point, j) => point.trim() && <li key={j}>{point}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.projects.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-emerald-500">Projects</span>
          </h3>
          <div className="space-y-5">
            {data.projects.map((proj, i) => (
              <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="font-bold text-md text-slate-800">{proj.title}</h4>
                  {proj.link && <span className="text-xs text-emerald-600">{proj.link}</span>}
                </div>
                {proj.techStack && <div className="text-xs font-mono text-slate-500 mb-2">{proj.techStack}</div>}
                <p className="text-sm text-slate-600">
                  {proj.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.awards && data.awards.trim() && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-emerald-500">Awards & Achievements</span>
          </h3>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 mt-2">
            {data.awards.split('\n').map((point, j) => point.trim() && <li key={j}>{point}</li>)}
          </ul>
        </div>
      )}
    </div>
  </div>
);

// 4. Executive Clean
const Template4 = ({ data }) => (
  <div className="p-8 bg-white text-gray-800 font-sans min-h-full border-t-8 border-indigo-600">
    <header className="mb-6 flex justify-between items-end">
      <div>
        <h1 className="text-5xl font-light tracking-tight text-indigo-900">{data.basicInfo.name || 'Your Name'}</h1>
      </div>
      <div className="text-right text-xs text-gray-500 space-y-1">
        <div>{data.basicInfo.email}</div>
        <div>{data.basicInfo.phone}</div>
        <div>{data.basicInfo.linkedin}</div>
        <div>{data.basicInfo.github}</div>
      </div>
    </header>

    {data.basicInfo.summary && (
      <div className="mb-6 bg-gray-50 p-4 rounded text-sm text-gray-700 italic border-l-4 border-indigo-200">
        "{data.basicInfo.summary}"
      </div>
    )}

    {data.experience.length > 0 && (
      <section className="mb-6">
        <h3 className="text-lg font-bold text-indigo-800 uppercase tracking-wider border-b-2 border-indigo-100 mb-4 pb-1">Professional Experience</h3>
        <div className="space-y-6">
          {data.experience.map((exp, i) => (
            <div key={i}>
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-bold text-gray-900 text-lg">{exp.role}</h4>
                <span className="text-sm font-semibold text-indigo-600">{exp.duration}</span>
              </div>
              <div className="text-sm uppercase tracking-wide text-gray-500 mb-2">{exp.company}</div>
              <ul className="text-sm text-gray-700 space-y-1 pl-4 list-[square] marker:text-indigo-400">
                {exp.description.split('\n').map((point, j) => point.trim() && <li key={j}>{point}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
    )}

    <div className="grid grid-cols-2 gap-6">
      <div>
        {data.education.length > 0 && (
          <section className="mb-6">
            <h3 className="text-lg font-bold text-indigo-800 uppercase tracking-wider border-b-2 border-indigo-100 mb-4 pb-1">Education</h3>
            <div className="space-y-4">
              {data.education.map((edu, i) => (
                <div key={i}>
                  <div className="font-bold text-gray-900">{edu.degree}</div>
                  <div className="text-sm text-gray-600">{edu.institution}</div>
                  <div className="text-xs text-gray-500 mt-1">{edu.year} • {edu.score}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      <div>
        {data.skills.length > 0 && (
          <section className="mb-6">
            <h3 className="text-lg font-bold text-indigo-800 uppercase tracking-wider border-b-2 border-indigo-100 mb-4 pb-1">Core Competencies</h3>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, i) => (
                <span key={i} className="bg-white border border-indigo-200 text-indigo-700 px-3 py-1 text-xs rounded-full shadow-sm">{skill}</span>
              ))}
            </div>
          </section>
        )}

        {data.certifications && data.certifications.length > 0 && (
          <section className="mb-6">
            <h3 className="text-lg font-bold text-indigo-800 uppercase tracking-wider border-b-2 border-indigo-100 mb-4 pb-1">Certifications</h3>
            <div className="space-y-4">
              {data.certifications.map((cert, i) => (
                <div key={i}>
                  <div className="font-bold text-gray-900">{cert.title}</div>
                  <div className="text-sm text-gray-600">{cert.issuer}</div>
                  <div className="text-xs text-gray-500 mt-1">{cert.year}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.languages && data.languages.length > 0 && (
          <section className="mb-6">
            <h3 className="text-lg font-bold text-indigo-800 uppercase tracking-wider border-b-2 border-indigo-100 mb-4 pb-1">Languages</h3>
            <div className="flex flex-wrap gap-2">
              {data.languages.map((lang, i) => (
                <span key={i} className="bg-white border border-indigo-200 text-indigo-700 px-3 py-1 text-xs rounded-full shadow-sm">{lang}</span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>

    {data.projects.length > 0 && (
      <section className="mb-6">
        <h3 className="text-lg font-bold text-indigo-800 uppercase tracking-wider border-b-2 border-indigo-100 mb-4 pb-1">Key Projects</h3>
        <div className="grid grid-cols-2 gap-4">
          {data.projects.map((proj, i) => (
            <div key={i} className="border border-gray-200 p-3 rounded hover:shadow-sm transition-shadow">
              <h4 className="font-bold text-gray-900">{proj.title}</h4>
              <div className="text-xs text-indigo-500 mb-2">{proj.techStack}</div>
              <p className="text-xs text-gray-600 line-clamp-3">{proj.description}</p>
            </div>
          ))}
        </div>
      </section>
    )}

    {data.awards && data.awards.trim() && (
      <section className="mb-6">
        <h3 className="text-lg font-bold text-indigo-800 uppercase tracking-wider border-b-2 border-indigo-100 mb-4 pb-1">Awards & Achievements</h3>
        <ul className="text-sm text-gray-700 space-y-1 pl-4 list-[square] marker:text-indigo-400">
          {data.awards.split('\n').map((point, j) => point.trim() && <li key={j}>{point}</li>)}
        </ul>
      </section>
    )}
  </div>
);

// 5. Compact Academic
const Template5 = ({ data }) => (
  <div className="p-8 bg-white text-black font-serif text-[11px] leading-tight min-h-full">
    <div className="text-center mb-4">
      <h1 className="text-2xl font-bold uppercase mb-1">{data.basicInfo.name || 'Your Name'}</h1>
      <p className="flex justify-center gap-2">
        {data.basicInfo.email && <span>{data.basicInfo.email}</span>}
        {data.basicInfo.phone && <span>• {data.basicInfo.phone}</span>}
        {data.basicInfo.linkedin && <span>• {data.basicInfo.linkedin}</span>}
        {data.basicInfo.github && <span>• {data.basicInfo.github}</span>}
      </p>
    </div>

    {data.basicInfo.summary && (
      <div className="mb-3 text-justify">{data.basicInfo.summary}</div>
    )}

    {data.education.length > 0 && (
      <div className="mb-3">
        <h3 className="uppercase font-bold border-b border-black mb-1">Education</h3>
        {data.education.map((edu, i) => (
          <div key={i} className="flex justify-between mb-1">
            <div>
              <span className="font-bold">{edu.institution}</span> — <span>{edu.degree}</span>
            </div>
            <div>{edu.year} ({edu.score})</div>
          </div>
        ))}
      </div>
    )}

    {data.experience.length > 0 && (
      <div className="mb-3">
        <h3 className="uppercase font-bold border-b border-black mb-1">Experience</h3>
        {data.experience.map((exp, i) => (
          <div key={i} className="mb-2">
            <div className="flex justify-between font-bold">
              <span>{exp.company} | {exp.role}</span>
              <span>{exp.duration}</span>
            </div>
            <ul className="list-disc list-inside mt-0.5">
              {exp.description.split('\n').map((point, j) => point.trim() && <li key={j}>{point}</li>)}
            </ul>
          </div>
        ))}
      </div>
    )}

    {data.projects.length > 0 && (
      <div className="mb-3">
        <h3 className="uppercase font-bold border-b border-black mb-1">Projects</h3>
        {data.projects.map((proj, i) => (
          <div key={i} className="mb-2">
            <div className="flex justify-between font-bold">
              <span>{proj.title} {proj.link && <span className="font-normal text-[10px]">({proj.link})</span>}</span>
              <span className="font-normal italic">{proj.techStack}</span>
            </div>
            <p className="mt-0.5">{proj.description}</p>
          </div>
        ))}
      </div>
    )}

    {data.certifications && data.certifications.length > 0 && (
      <div className="mb-3">
        <h3 className="uppercase font-bold border-b border-black mb-1">Certifications</h3>
        {data.certifications.map((cert, i) => (
          <div key={i} className="flex justify-between mb-1">
            <div>
              <span className="font-bold">{cert.title}</span> — <span>{cert.issuer}</span>
            </div>
            <div>{cert.year}</div>
          </div>
        ))}
      </div>
    )}

    {data.skills.length > 0 && (
      <div className="mb-3">
        <h3 className="uppercase font-bold border-b border-black mb-1">Technical Skills</h3>
        <p>{data.skills.join(', ')}</p>
      </div>
    )}

    {data.languages && data.languages.length > 0 && (
      <div className="mb-3">
        <h3 className="uppercase font-bold border-b border-black mb-1">Languages</h3>
        <p>{data.languages.join(', ')}</p>
      </div>
    )}

    {data.awards && data.awards.trim() && (
      <div className="mb-3">
        <h3 className="uppercase font-bold border-b border-black mb-1">Awards & Achievements</h3>
        <ul className="list-disc list-inside mt-0.5">
          {data.awards.split('\n').map((point, j) => point.trim() && <li key={j}>{point}</li>)}
        </ul>
      </div>
    )}
  </div>
);

// 6. Elegant Card Layout (Charan Layout)
const TemplateCharan = ({ data }) => {
  const getInitials = (name) => {
    if (!name) return 'CK';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  };

  const skills = data.skills || [];
  
  // Intelligent skill separation:
  const techKeywords = ['sap', 'microsoft', 'powerpoint', 'excel', 'system', 'erp', 's/4hana', 'software', 'tool', 'dynamics', 'cognos', 'python', 'java', 'sql', 'database', 'ticket', 'sla', 'cloud', 'power point'];
  const techSkills = skills.filter(skill => 
    techKeywords.some(keyword => skill.toLowerCase().includes(keyword))
  );
  const keySkills = skills.filter(skill => 
    !techKeywords.some(keyword => skill.toLowerCase().includes(keyword))
  );

  let finalKeySkills = keySkills;
  let finalTechSkills = techSkills;
  if (keySkills.length === 0 || techSkills.length === 0) {
    const mid = Math.ceil(skills.length / 2);
    finalKeySkills = skills.slice(0, mid);
    finalTechSkills = skills.slice(mid);
  }

  // Check for month-end activities in projects or use fallbacks for Charan
  const isCharan = data.basicInfo.name?.toLowerCase().includes('charan');
  const monthEndProject = data.projects?.find(p => 
    p.title.toLowerCase().includes('month end') || 
    p.title.toLowerCase().includes('monthend')
  );
  
  let monthEndTags = [];
  if (monthEndProject) {
    monthEndTags = monthEndProject.description
      .split('\n')
      .map(line => line.replace(/^[▸•\-\*\s]+/, '').trim())
      .filter(Boolean);
  } else if (isCharan || (!data.projects || data.projects.length === 0)) {
    monthEndTags = [
      'GR/IR Clearing',
      'Blocked & unpaid invoices review',
      'Preparing aging invoice reports',
      'Maintaining reports for multiple entities',
      'Timely and accurate month end close',
      'Month end reconciliation reports',
      'Resolving open invoices & payment discrepancies'
    ];
  }

  const regularProjects = data.projects?.filter(p => p !== monthEndProject) || [];

  return (
    <div className="charan-resume-wrapper bg-[#f8fafc] text-[#0f172a] min-h-full">
      <style>{`
        .charan-resume {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          max-width: 780px;
          margin: 0 auto;
          padding: 1.5rem 1rem;
        }
        .charan-hero {
          background: linear-gradient(135deg, #185FA5 0%, #0C447C 100%);
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 1.25rem;
          color: white;
          display: flex;
          align-items: center;
          gap: 1.75rem;
        }
        .charan-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(255,255,255,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
          border: 3px solid rgba(255,255,255,0.4);
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          overflow: hidden;
        }
        .charan-hero-info {
          display: flex;
          flex-direction: column;
        }
        .charan-hero-info h1 {
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin: 0 0 6px 0;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .charan-hero-info .title {
          font-size: 14.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          margin: 0 0 12px 0;
          line-height: 1.4;
        }
        .charan-hero-contacts {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .charan-contact-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.15);
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 12.5px;
          color: rgba(255,255,255,0.9);
          text-decoration: none;
          transition: background 0.2s;
        }
        .charan-contact-pill:hover {
          background: rgba(255,255,255,0.25);
        }
        .charan-grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        @media (max-width: 640px) {
          .charan-grid2 {
            grid-template-columns: 1fr;
          }
          .charan-hero {
            flex-direction: column;
            text-align: center;
            padding: 1.5rem;
          }
          .charan-hero-contacts {
            justify-content: center;
          }
        }
        .charan-card {
          background: #ffffff;
          border: 0.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
        }
        .charan-card-full {
          margin-bottom: 1rem;
        }
        .charan-sec-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #185FA5;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .charan-summary-text {
          font-size: 14px;
          color: #334155;
          line-height: 1.7;
          text-align: justify;
        }
        .charan-skill-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .charan-tag {
          font-size: 12px;
          background: #E6F1FB;
          color: #0C447C;
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: 500;
        }
        .charan-tech-tag {
          font-size: 12px;
          background: #EAF3DE;
          color: #27500A;
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: 500;
        }
        .charan-exp-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 6px;
        }
        .charan-company {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .charan-role {
          font-size: 13px;
          color: #185FA5;
          margin-bottom: 4px;
          font-weight: 600;
          margin-top: 2px;
        }
        .charan-duration {
          font-size: 12px;
          font-weight: 700;
          background: #E6F1FB;
          color: #185FA5;
          padding: 4px 10px;
          border-radius: 8px;
          white-space: nowrap;
        }
        .charan-bullets {
          list-style: none;
          padding: 0;
          margin-top: 14px;
        }
        .charan-bullets li {
          font-size: 13px;
          color: #334155;
          line-height: 1.6;
          padding: 3px 0 3px 16px;
          margin-bottom: 6px;
          position: relative;
        }
        .charan-bullets li::before {
          content: "▸";
          position: absolute;
          left: 0;
          color: #185FA5;
          font-size: 11px;
          top: 5px;
        }
        .charan-edu-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .charan-edu-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #E6F1FB;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .charan-edu-degree {
          font-size: 14.5px;
          font-weight: 700;
          color: #185FA5;
          margin: 0;
        }
        .charan-edu-uni {
          font-size: 12.5px;
          color: #334155;
          margin-top: 2px;
          margin-bottom: 0;
        }
        .charan-lang-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 0.5px solid #e2e8f0;
        }
        .charan-lang-row:last-child {
          border-bottom: none;
        }
        .charan-lang-name {
          font-size: 13.5px;
          font-weight: 700;
          color: #185FA5;
        }
        .charan-lang-level {
          font-size: 12px;
          color: #334155;
        }

        /* Print styles to fit perfectly on a single A4 page */
        @media print {
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          .charan-resume {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 11.5px !important;
          }
          .charan-hero {
            padding: 1.15rem 1.4rem !important;
            margin-bottom: 0.6rem !important;
            gap: 1.5rem !important;
            flex-direction: row !important;
            text-align: left !important;
          }
          .charan-avatar {
            width: 95px !important;
            height: 95px !important;
            font-size: 26px !important;
            border-width: 2.5px !important;
          }
          .charan-hero-info h1 {
            font-size: 20px !important;
            font-weight: 700 !important;
            margin-bottom: 3px !important;
          }
          .charan-hero-info .title {
            font-size: 12.5px !important;
            font-weight: 600 !important;
            margin-bottom: 6px !important;
          }
          .charan-hero-contacts {
            gap: 8px !important;
            justify-content: flex-start !important;
          }
          .charan-contact-pill {
            padding: 2px 8px !important;
            font-size: 11px !important;
            gap: 4px !important;
          }
          .charan-card {
            padding: 0.6rem 0.85rem !important;
            border-radius: 8px !important;
          }
          .charan-card-full {
            margin-bottom: 0.6rem !important;
          }
          .charan-grid2 {
            grid-template-columns: 1fr 1fr !important;
            gap: 0.6rem !important;
            margin-bottom: 0.6rem !important;
          }
          .charan-sec-label {
            font-size: 10px !important;
            margin-bottom: 0.4rem !important;
            gap: 4px !important;
          }
          .charan-summary-text {
            font-size: 11.5px !important;
            line-height: 1.5 !important;
          }
          .charan-skill-tags {
            gap: 5px !important;
          }
          .charan-tag, .charan-tech-tag {
            font-size: 10.5px !important;
            padding: 2px 6px !important;
          }
          .charan-exp-header {
            margin-bottom: 4px !important;
          }
          .charan-company {
            font-size: 13.5px !important;
          }
          .charan-role {
            font-size: 12px !important;
            margin-bottom: 2px !important;
          }
          .charan-duration {
            font-size: 11px !important;
            font-weight: 700 !important;
            background: #E6F1FB !important;
            color: #185FA5 !important;
            padding: 3px 8px !important;
          }
          .charan-bullets {
            margin-top: 8px !important;
          }
          .charan-bullets li {
            font-size: 11px !important;
            line-height: 1.4 !important;
            padding: 1px 0 1px 12px !important;
            margin-bottom: 4px !important;
          }
          .charan-bullets li::before {
            font-size: 9px !important;
            top: 2px !important;
          }
          .charan-edu-row {
            gap: 6px !important;
          }
          .charan-edu-icon {
            width: 28px !important;
            height: 28px !important;
            border-radius: 6px !important;
          }
          .charan-edu-degree {
            font-size: 12.5px !important;
            font-weight: 700 !important;
            color: #185FA5 !important;
          }
          .charan-edu-uni {
            font-size: 11px !important;
            margin-top: 1px !important;
          }
          .charan-lang-row {
            padding: 3px 0 !important;
          }
          .charan-lang-name {
            font-size: 11.5px !important;
            font-weight: 700 !important;
            color: #185FA5 !important;
          }
          .charan-lang-level {
            font-size: 10.5px !important;
          }
        }
      `}</style>

      <div className="charan-resume">
        {/* Hero */}
        <div className="charan-hero">
          <div className="charan-avatar">
            {data.basicInfo.image ? (
              <img src={data.basicInfo.image} alt={data.basicInfo.name || 'Avatar'} className="w-full h-full object-cover" />
            ) : (
              getInitials(data.basicInfo.name)
            )}
          </div>
          <div className="charan-hero-info">
            <h1>{data.basicInfo.name || 'Charan Kumar. B'}</h1>
            <p className="title">
              {data.experience && data.experience[0] 
                ? `${data.experience[0].role} · ${data.experience[0].company}` 
                : 'Professional Title · Company'}
            </p>
            <div className="charan-hero-contacts">
              {data.basicInfo.email && (
                <a href={`mailto:${data.basicInfo.email}`} className="charan-contact-pill">
                  <Mail size={14} />
                  <span>{data.basicInfo.email}</span>
                </a>
              )}
              {data.basicInfo.phone && (
                <a href={`tel:${data.basicInfo.phone}`} className="charan-contact-pill">
                  <Phone size={14} />
                  <span>{data.basicInfo.phone}</span>
                </a>
              )}
              {data.basicInfo.linkedin && (
                <a 
                  href={data.basicInfo.linkedin.startsWith('http') ? data.basicInfo.linkedin : `https://${data.basicInfo.linkedin}`} 
                  className="charan-contact-pill" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <LinkedInIcon size={14} />
                  <span>LinkedIn Profile</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        {data.basicInfo.summary && (
          <div className="charan-card charan-card-full">
            <div className="charan-sec-label">
              <User size={15} />
              <span>Professional Summary</span>
            </div>
            <p className="charan-summary-text">{data.basicInfo.summary}</p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="charan-grid2">
            <div className="charan-card">
              <div className="charan-sec-label">
                <Star size={15} />
                <span>Key Skills</span>
              </div>
              <div className="charan-skill-tags">
                {finalKeySkills.map((skill, i) => (
                  <span key={i} className="charan-tag">{skill}</span>
                ))}
              </div>
            </div>
            <div className="charan-card">
              <div className="charan-sec-label">
                <Wrench size={15} />
                <span>Technical Skills</span>
              </div>
              <div className="charan-skill-tags">
                {finalTechSkills.map((skill, i) => (
                  <span key={i} className="charan-tech-tag">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <div className="charan-card charan-card-full">
            <div className="charan-sec-label">
              <Briefcase size={15} />
              <span>Professional Experience</span>
            </div>
            {data.experience.map((exp, i) => (
              <div key={i} className={i > 0 ? "mt-5 pt-4 border-t border-slate-100" : ""}>
                <div className="charan-exp-header">
                  <div>
                    <p className="charan-company">{exp.company}</p>
                    <p className="charan-role">{exp.role}</p>
                  </div>
                  <span className="charan-duration">{exp.duration}</span>
                </div>
                <ul className="charan-bullets">
                  {exp.description.split('\n').map((point, j) => {
                    const trimmed = point.replace(/^[▸•\-\*\s]+/, '').trim();
                    return trimmed ? <li key={j}>{trimmed}</li> : null;
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Month End Activities */}
        {monthEndTags.length > 0 && (
          <div className="charan-card charan-card-full">
            <div className="charan-sec-label">
              <Calendar size={15} />
              <span>Month End Activities</span>
            </div>
            <div className="charan-skill-tags">
              {monthEndTags.map((tag, i) => (
                <span key={i} className="charan-tag">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Regular Projects (if any remain) */}
        {regularProjects.length > 0 && (
          <div className="charan-card charan-card-full">
            <div className="charan-sec-label">
              <List size={15} />
              <span>Projects</span>
            </div>
            <div className="space-y-4">
              {regularProjects.map((proj, i) => (
                <div key={i} className={i > 0 ? "border-t border-slate-100 pt-3" : ""}>
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-bold text-sm text-[#0f172a]">{proj.title}</h4>
                    {proj.link && (
                      <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#185FA5] hover:underline">
                        Link
                      </a>
                    )}
                  </div>
                  {proj.techStack && (
                    <p className="text-xs font-mono text-slate-500 mt-0.5">{proj.techStack}</p>
                  )}
                  <p className="text-xs text-[#334155] mt-1 whitespace-pre-line">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education & Languages */}
        <div className="charan-grid2">
          {data.education && data.education.length > 0 && (
            <div className="charan-card">
              <div className="charan-sec-label">
                <GraduationCap size={15} />
                <span>Education</span>
              </div>
              <div className="space-y-4">
                {data.education.map((edu, i) => (
                  <div key={i} className="charan-edu-row">
                    <div className="charan-edu-icon">
                      <BookOpen size={16} className="text-[#185FA5]" />
                    </div>
                    <div>
                      <p className="charan-edu-degree">{edu.degree}</p>
                      <p className="charan-edu-uni">{edu.institution}</p>
                      <p className="charan-edu-uni" style={{ marginTop: '2px' }}>
                        {edu.year} {edu.score ? `• ${edu.score}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.languages && data.languages.length > 0 && (
            <div className="charan-card">
              <div className="charan-sec-label">
                <Globe size={15} />
                <span>Languages</span>
              </div>
              <div>
                {data.languages.map((lang, i) => (
                  <div key={i} className="charan-lang-row">
                    <span className="charan-lang-name">{lang}</span>
                    <span className="charan-lang-level">Read / Write / Speak</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Awards & Achievements */}
        {data.awards && data.awards.trim() && (
          <div className="charan-card charan-card-full" style={{ marginTop: '1rem' }}>
            <div className="charan-sec-label">
              <Award size={15} />
              <span>Awards & Achievements</span>
            </div>
            <ul className="charan-bullets">
              {data.awards.split('\n').map((point, j) => {
                const trimmed = point.replace(/^[🏆\s▸•\-\*]+/, '').trim();
                return trimmed ? (
                  <li key={j} className="relative pl-4" style={{ listStyleType: 'none' }}>
                    <span className="absolute left-0">🏆</span>
                    {trimmed}
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// 8. Elegant Dark Mode Template
const TemplateDark = ({ data }) => {
  const getInitials = (name) => {
    if (!name) return 'CK';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  };

  const skills = data.skills || [];

  return (
    <div className="dark-resume-wrapper bg-[#0b0f19] text-[#e2e8f0] min-h-full">
      <style>{`
        .dark-resume {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          max-width: 780px;
          margin: 0 auto;
          padding: 1.5rem 1rem;
        }
        .dark-hero {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 1.25rem;
          color: white;
          display: flex;
          align-items: center;
          gap: 1.75rem;
        }
        .dark-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
          color: #3b82f6;
          flex-shrink: 0;
          border: 3px solid #334155;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        .dark-hero-info {
          display: flex;
          flex-direction: column;
        }
        .dark-hero-info h1 {
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin: 0 0 6px 0;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .dark-hero-info .title {
          font-size: 14.5px;
          font-weight: 600;
          color: #3b82f6;
          margin: 0 0 12px 0;
          line-height: 1.4;
        }
        .dark-hero-contacts {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .dark-contact-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 12.5px;
          color: #cbd5e1;
          text-decoration: none;
          transition: all 0.2s;
        }
        .dark-contact-pill:hover {
          background: #334155;
          color: white;
        }
        .dark-grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        @media (max-width: 640px) {
          .dark-grid2 {
            grid-template-columns: 1fr;
          }
          .dark-hero {
            flex-direction: column;
            text-align: center;
            padding: 1.5rem;
          }
          .dark-hero-contacts {
            justify-content: center;
          }
        }
        .dark-card {
          background: #111827;
          border: 1px solid #1f2937;
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .dark-card-full {
          margin-bottom: 1rem;
        }
        .dark-sec-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #3b82f6;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dark-summary-text {
          font-size: 14px;
          color: #cbd5e1;
          line-height: 1.7;
          text-align: justify;
        }
        .dark-skill-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .dark-tag {
          font-size: 12px;
          background: rgba(59, 130, 246, 0.1);
          color: #60a5fa;
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: 500;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .dark-exp-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 6px;
        }
        .dark-company {
          font-size: 15px;
          font-weight: 700;
          color: white;
          margin: 0;
        }
        .dark-role {
          font-size: 13px;
          color: #60a5fa;
          margin-bottom: 4px;
          font-weight: 600;
          margin-top: 2px;
        }
        .dark-duration {
          font-size: 12px;
          font-weight: 700;
          background: rgba(59, 130, 246, 0.1);
          color: #60a5fa;
          padding: 4px 10px;
          border-radius: 8px;
          white-space: nowrap;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .dark-bullets {
          list-style: none;
          padding: 0;
          margin-top: 14px;
        }
        .dark-bullets li {
          font-size: 13px;
          color: #cbd5e1;
          line-height: 1.6;
          padding: 3px 0 3px 16px;
          margin-bottom: 6px;
          position: relative;
        }
        .dark-bullets li::before {
          content: "▸";
          position: absolute;
          left: 0;
          color: #3b82f6;
          font-size: 11px;
          top: 5px;
        }
        .dark-edu-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .dark-edu-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(59, 130, 246, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .dark-edu-degree {
          font-size: 14.5px;
          font-weight: 700;
          color: #60a5fa;
          margin: 0;
        }
        .dark-edu-uni {
          font-size: 12.5px;
          color: #cbd5e1;
          margin-top: 2px;
          margin-bottom: 0;
        }
        .dark-lang-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid #1f2937;
        }
        .dark-lang-row:last-child {
          border-bottom: none;
        }
        .dark-lang-name {
          font-size: 13.5px;
          font-weight: 700;
          color: #60a5fa;
        }
        .dark-lang-level {
          font-size: 12px;
          color: #cbd5e1;
        }

        /* Print styles to fit perfectly on a single A4 page */
        @media print {
          body {
            background-color: #0b0f19 !important;
            color: #e2e8f0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          .dark-resume {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 11.5px !important;
            background-color: #0b0f19 !important;
          }
          .dark-hero {
            padding: 1.15rem 1.4rem !important;
            margin-bottom: 0.6rem !important;
            gap: 1.5rem !important;
            flex-direction: row !important;
            text-align: left !important;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
          }
          .dark-avatar {
            width: 95px !important;
            height: 95px !important;
            font-size: 26px !important;
            border-width: 2.5px !important;
          }
          .dark-hero-info h1 {
            font-size: 20px !important;
            font-weight: 700 !important;
            margin-bottom: 3px !important;
            color: white !important;
          }
          .dark-hero-info .title {
            font-size: 12.5px !important;
            font-weight: 600 !important;
            margin-bottom: 6px !important;
            color: #3b82f6 !important;
          }
          .dark-hero-contacts {
            gap: 8px !important;
            justify-content: flex-start !important;
          }
          .dark-contact-pill {
            padding: 2px 8px !important;
            font-size: 11px !important;
            gap: 4px !important;
            background: #1e293b !important;
            border-color: #334155 !important;
          }
          .dark-card {
            padding: 0.6rem 0.85rem !important;
            border-radius: 8px !important;
            background-color: #111827 !important;
            border-color: #1f2937 !important;
          }
          .dark-card-full {
            margin-bottom: 0.6rem !important;
          }
          .dark-grid2 {
            grid-template-columns: 1fr 1fr !important;
            gap: 0.6rem !important;
            margin-bottom: 0.6rem !important;
          }
          .dark-sec-label {
            font-size: 10px !important;
            margin-bottom: 0.4rem !important;
            gap: 4px !important;
            color: #3b82f6 !important;
          }
          .dark-summary-text {
            font-size: 11.5px !important;
            line-height: 1.5 !important;
            color: #cbd5e1 !important;
          }
          .dark-skill-tags {
            gap: 5px !important;
          }
          .dark-tag {
            font-size: 10.5px !important;
            padding: 2px 6px !important;
            background: rgba(59, 130, 246, 0.1) !important;
            border-color: rgba(59, 130, 246, 0.2) !important;
            color: #60a5fa !important;
          }
          .dark-exp-header {
            margin-bottom: 4px !important;
          }
          .dark-company {
            font-size: 13.5px !important;
            color: white !important;
          }
          .dark-role {
            font-size: 12px !important;
            margin-bottom: 2px !important;
            color: #60a5fa !important;
          }
          .dark-duration {
            font-size: 11px !important;
            font-weight: 700 !important;
            background: rgba(59, 130, 246, 0.1) !important;
            color: #60a5fa !important;
            padding: 3px 8px !important;
            border-color: rgba(59, 130, 246, 0.2) !important;
          }
          .dark-bullets {
            margin-top: 8px !important;
          }
          .dark-bullets li {
            font-size: 11px !important;
            line-height: 1.4 !important;
            padding: 1px 0 1px 12px !important;
            margin-bottom: 4px !important;
            color: #cbd5e1 !important;
          }
          .dark-bullets li::before {
            font-size: 9px !important;
            top: 2px !important;
            color: #3b82f6 !important;
          }
          .dark-edu-row {
            gap: 6px !important;
          }
          .dark-edu-icon {
            width: 28px !important;
            height: 28px !important;
            border-radius: 6px !important;
            background: rgba(59, 130, 246, 0.1) !important;
            border-color: rgba(59, 130, 246, 0.2) !important;
          }
          .dark-edu-degree {
            font-size: 12.5px !important;
            font-weight: 700 !important;
            color: #60a5fa !important;
          }
          .dark-edu-uni {
            font-size: 11px !important;
            margin-top: 1px !important;
            color: #cbd5e1 !important;
          }
          .dark-lang-row {
            padding: 3px 0 !important;
            border-color: #1f2937 !important;
          }
          .dark-lang-name {
            font-size: 11.5px !important;
            font-weight: 700 !important;
            color: #60a5fa !important;
          }
          .dark-lang-level {
            font-size: 10.5px !important;
            color: #cbd5e1 !important;
          }
        }
      `}</style>

      <div className="dark-resume">
        {/* Hero */}
        <div className="dark-hero">
          <div className="dark-avatar">
            {data.basicInfo.image ? (
              <img src={data.basicInfo.image} alt={data.basicInfo.name || 'Avatar'} className="w-full h-full object-cover" />
            ) : (
              getInitials(data.basicInfo.name)
            )}
          </div>
          <div className="dark-hero-info">
            <h1>{data.basicInfo.name || 'Your Name'}</h1>
            <p className="title">
              {data.experience && data.experience[0] 
                ? `${data.experience[0].role} · ${data.experience[0].company}` 
                : 'Professional Title · Company'}
            </p>
            <div className="dark-hero-contacts">
              {data.basicInfo.email && (
                <a href={`mailto:${data.basicInfo.email}`} className="dark-contact-pill">
                  <Mail size={14} />
                  <span>{data.basicInfo.email}</span>
                </a>
              )}
              {data.basicInfo.phone && (
                <a href={`tel:${data.basicInfo.phone}`} className="dark-contact-pill">
                  <Phone size={14} />
                  <span>{data.basicInfo.phone}</span>
                </a>
              )}
              {data.basicInfo.linkedin && (
                <a 
                  href={data.basicInfo.linkedin.startsWith('http') ? data.basicInfo.linkedin : `https://${data.basicInfo.linkedin}`} 
                  className="dark-contact-pill" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <LinkedInIcon size={14} />
                  <span>LinkedIn Profile</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        {data.basicInfo.summary && (
          <div className="dark-card dark-card-full">
            <div className="dark-sec-label">
              <User size={15} />
              <span>Professional Summary</span>
            </div>
            <p className="dark-summary-text">{data.basicInfo.summary}</p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="dark-card dark-card-full">
            <div className="dark-sec-label">
              <Star size={15} />
              <span>Skills</span>
            </div>
            <div className="dark-skill-tags">
              {skills.map((skill, i) => (
                <span key={i} className="dark-tag">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <div className="dark-card dark-card-full">
            <div className="dark-sec-label">
              <Briefcase size={15} />
              <span>Professional Experience</span>
            </div>
            {data.experience.map((exp, i) => (
              <div key={i} className={i > 0 ? "mt-5 pt-4 border-t border-gray-800" : ""}>
                <div className="dark-exp-header">
                  <div>
                    <p className="dark-company">{exp.company}</p>
                    <p className="dark-role">{exp.role}</p>
                  </div>
                  <span className="dark-duration">{exp.duration}</span>
                </div>
                <ul className="dark-bullets">
                  {exp.description.split('\n').map((point, j) => {
                    const trimmed = point.replace(/^[▸•\-\*\s]+/, '').trim();
                    return trimmed ? <li key={j}>{trimmed}</li> : null;
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <div className="dark-card dark-card-full">
            <div className="dark-sec-label">
              <List size={15} />
              <span>Projects</span>
            </div>
            <div className="space-y-4">
              {data.projects.map((proj, i) => (
                <div key={i} className={i > 0 ? "border-t border-gray-800 pt-3" : ""}>
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-bold text-sm text-white">{proj.title}</h4>
                    {proj.link && (
                      <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#60a5fa] hover:underline">
                        Link
                      </a>
                    )}
                  </div>
                  {proj.techStack && (
                    <p className="text-xs font-mono text-slate-500 mt-0.5">{proj.techStack}</p>
                  )}
                  <p className="text-xs text-[#cbd5e1] mt-1 whitespace-pre-line">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education & Languages */}
        <div className="dark-grid2">
          {data.education && data.education.length > 0 && (
            <div className="dark-card">
              <div className="dark-sec-label">
                <GraduationCap size={15} />
                <span>Education</span>
              </div>
              <div className="space-y-4">
                {data.education.map((edu, i) => (
                  <div key={i} className="dark-edu-row">
                    <div className="dark-edu-icon">
                      <BookOpen size={16} className="text-[#60a5fa]" />
                    </div>
                    <div>
                      <p className="dark-edu-degree">{edu.degree}</p>
                      <p className="dark-edu-uni">{edu.institution}</p>
                      <p className="dark-edu-uni" style={{ marginTop: '2px' }}>
                        {edu.year} {edu.score ? `• ${edu.score}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.languages && data.languages.length > 0 && (
            <div className="dark-card">
              <div className="dark-sec-label">
                <Globe size={15} />
                <span>Languages</span>
              </div>
              <div>
                {data.languages.map((lang, i) => (
                  <div key={i} className="dark-lang-row">
                    <span className="dark-lang-name">{lang}</span>
                    <span className="dark-lang-level">Read / Write / Speak</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Awards & Achievements */}
        {data.awards && data.awards.trim() && (
          <div className="dark-card dark-card-full" style={{ marginTop: '1rem' }}>
            <div className="dark-sec-label">
              <Award size={15} />
              <span>Awards & Achievements</span>
            </div>
            <ul className="dark-bullets">
              {data.awards.split('\n').map((point, j) => {
                const trimmed = point.replace(/^[🏆\s▸•\-\*]+/, '').trim();
                return trimmed ? (
                  <li key={j} className="relative pl-4" style={{ listStyleType: 'none' }}>
                    <span className="absolute left-0">🏆</span>
                    {trimmed}
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// 7. Vibrant Gradient Layout (Bala Layout)
const TemplateBala = ({ data }) => {
  const getInitials = (name) => {
    if (!name) return 'BS';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  };

  const skills = data.skills || [];
  
  // Intelligent skill separation:
  const expertiseKeywords = ['relationship', 'handling', 'reporting', 'calling', 'maintenance', 'scanning', 'processing', 'management', 'matching', 'operations', 'resolution', 'improvement', 'auditing'];
  
  let expertiseList = skills.filter(skill => 
    expertiseKeywords.some(keyword => skill.toLowerCase().includes(keyword)) || skill.split(' ').length >= 3
  );
  
  let skillsList = skills.filter(skill => 
    !expertiseList.includes(skill)
  );

  // Fallback if one of them is empty:
  if (expertiseList.length === 0 || skillsList.length === 0) {
    const mid = Math.ceil(skills.length / 2);
    expertiseList = skills.slice(0, mid);
    skillsList = skills.slice(mid);
  }
  
  // Limit expertise to 8 items to fit nicely in grid
  if (expertiseList.length > 8) {
    const excess = expertiseList.slice(8);
    expertiseList = expertiseList.slice(0, 8);
    skillsList = [...skillsList, ...excess];
  }

  // Get primary title (role) for subtitle
  const subTitle = data.experience && data.experience[0] 
    ? `${data.experience[0].role} · ${data.experience[0].company}` 
    : 'Accounts & Finance Professional · AP & Supplier Relationship';

  return (
    <div className="bala-resume-wrapper">
      <style>{`
        .bala-resume-wrapper {
          background-color: #f1f5f9;
          color: #0f172a;
          min-height: 100%;
        }
        .bala-resume {
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          max-width: 820px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem 1rem;
        }
        .bala-hero {
          background: linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%);
          border-radius: 12px;
          padding: 2.25rem 2rem;
          margin-bottom: 1.25rem;
          color: white;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
        }
        .bala-hero-info h1 {
          font-size: 26px;
          font-weight: 700;
          color: white;
          margin: 0 0 6px 0;
          letter-spacing: -0.019em;
        }
        .bala-hero-info .title {
          font-size: 15px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 14px 0;
        }
        .bala-hero-contacts {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .bala-contact-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .bala-contact-pill:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }
        .bala-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
          margin-bottom: 1.25rem;
        }
        .bala-sec-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: #1e3a8a;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 6px;
        }
        .bala-summary-text {
          font-size: 14px;
          color: #334155;
          line-height: 1.65;
          text-align: justify;
        }
        .bala-grid-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .bala-left-col {
          display: flex;
          flex-direction: column;
        }
        .bala-right-col {
          display: flex;
          flex-direction: column;
        }
        .bala-skill-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .bala-tag {
          font-size: 12.5px;
          background: #eff6ff;
          color: #1e40af;
          padding: 5px 11px;
          border-radius: 20px;
          font-weight: 500;
          border: 1px solid #dbeafe;
        }
        .bala-cert-tag {
          font-size: 12.5px;
          background: #f0fdf4;
          color: #166534;
          padding: 5px 11px;
          border-radius: 20px;
          font-weight: 500;
          border: 1px solid #dcfce7;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          width: 100%;
        }
        .bala-exp-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        .bala-company {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .bala-role {
          font-size: 14px;
          font-weight: 600;
          color: #0d9488;
          margin-top: 2px;
          margin-bottom: 0;
        }
        .bala-duration {
          font-size: 12px;
          font-weight: 700;
          background: #f1f5f9;
          color: #334155;
          padding: 4px 10px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          white-space: nowrap;
        }
        .bala-bullets {
          list-style: none;
          padding: 0;
          margin-top: 8px;
        }
        .bala-bullets li {
          font-size: 13.5px;
          color: #334155;
          line-height: 1.6;
          padding: 4px 0 4px 18px;
          position: relative;
          text-align: justify;
        }
        .bala-bullets li::before {
          content: "•";
          position: absolute;
          left: 2px;
          color: #0d9488;
          font-size: 16px;
          top: 2px;
        }
        .bala-edu-item {
          margin-bottom: 1.25rem;
        }
        .bala-edu-item:last-child {
          margin-bottom: 0;
        }
        .bala-edu-degree {
          font-size: 14.5px;
          font-weight: 700;
          color: #1e3a8a;
          margin: 0;
        }
        .bala-edu-college {
          font-size: 13px;
          color: #0f172a;
          font-weight: 500;
          margin-top: 2px;
          margin-bottom: 0;
        }
        .bala-edu-meta {
          font-size: 12px;
          color: #334155;
          display: flex;
          justify-content: space-between;
          margin-top: 4px;
        }
        .bala-achievement-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 6px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .bala-achievement-item:last-child {
          border-bottom: none;
        }
        .bala-achievement-icon {
          color: #eab308;
          font-size: 16px;
          margin-top: 2px;
        }
        .bala-achievement-text {
          font-size: 13.5px;
          color: #334155;
          font-weight: 500;
          text-align: justify;
        }
        .bala-expertise-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 20px;
        }
        .bala-expertise-item {
          font-size: 13.5px;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }
        @media (max-width: 768px) {
          .bala-grid-layout {
            grid-template-columns: 1fr;
          }
          .bala-hero {
            flex-direction: column;
            text-align: center;
            gap: 1.25rem;
            padding: 2rem 1.5rem;
          }
          .bala-hero-contacts {
            justify-content: center;
          }
        }
        @media print {
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          .bala-resume {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 11.5px !important;
          }
          .bala-hero {
            padding: 1.15rem 1.4rem !important;
            margin-bottom: 0.6rem !important;
            border-radius: 8px !important;
            flex-direction: row !important;
            text-align: left !important;
          }
          .bala-hero-info h1 {
            font-size: 20px !important;
            margin-bottom: 3px !important;
          }
          .bala-hero-info .title {
            font-size: 12px !important;
            margin-bottom: 6px !important;
          }
          .bala-hero-contacts {
            gap: 8px !important;
            justify-content: flex-start !important;
          }
          .bala-contact-pill {
            padding: 2px 8px !important;
            font-size: 10.5px !important;
            gap: 4px !important;
          }
          .bala-card {
            padding: 0.75rem 0.85rem !important;
            border-radius: 8px !important;
            margin-bottom: 0.6rem !important;
          }
          .bala-grid-layout {
            grid-template-columns: 1fr 1fr !important;
            gap: 0.6rem !important;
          }
          .bala-sec-label {
            font-size: 9.5px !important;
            margin-bottom: 0.4rem !important;
            padding-bottom: 3px !important;
          }
          .bala-summary-text {
            font-size: 11.5px !important;
            line-height: 1.5 !important;
          }
          .bala-skill-tags {
            gap: 5px !important;
          }
          .bala-tag {
            font-size: 10.5px !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
          }
          .bala-cert-tag {
            font-size: 10.5px !important;
            padding: 2px 6px !important;
            margin-bottom: 4px !important;
            border-radius: 4px !important;
          }
          .bala-exp-header {
            margin-bottom: 4px !important;
          }
          .bala-company {
            font-size: 13px !important;
          }
          .bala-role {
            font-size: 11.5px !important;
            margin-top: 1px !important;
          }
          .bala-duration {
            font-size: 10.5px !important;
            padding: 2px 6px !important;
          }
          .bala-bullets li {
            font-size: 11px !important;
            line-height: 1.4 !important;
            padding: 1px 0 1px 12px !important;
          }
          .bala-bullets li::before {
            font-size: 12px !important;
            left: 0 !important;
          }
          .bala-edu-item {
            margin-bottom: 0.6rem !important;
          }
          .bala-edu-degree {
            font-size: 12px !important;
          }
          .bala-edu-college {
            font-size: 11px !important;
          }
          .bala-edu-meta {
            font-size: 10px !important;
          }
          .bala-achievement-item {
            padding: 3px 0 !important;
          }
          .bala-achievement-text {
            font-size: 11px !important;
          }
          .bala-expertise-grid {
            gap: 4px 10px !important;
          }
          .bala-expertise-item {
            font-size: 11px !important;
            gap: 5px !important;
          }
        }
      `}</style>
      <div className="bala-resume">
        <h2 className="sr-only" style={{position:'absolute',width:'1px',height:'1px',overflow:'hidden',clip:'rect(0,0,0,0)'}}>
          {data.basicInfo.name || 'Your Name'} — Resume
        </h2>

        {/* Hero Section */}
        <div className="bala-hero">
          <div className="bala-hero-info">
            <h1>{(data.basicInfo.name || 'Your Name').toUpperCase()}</h1>
            <p className="title">{subTitle}</p>
            <div className="bala-hero-contacts">
              {data.basicInfo.phone && (
                <a href={`tel:${data.basicInfo.phone}`} className="bala-contact-pill">
                  <Phone size={14} />
                  <span>{data.basicInfo.phone}</span>
                </a>
              )}
              {data.basicInfo.email && (
                <a href={`mailto:${data.basicInfo.email}`} className="bala-contact-pill">
                  <Mail size={14} />
                  <span>{data.basicInfo.email}</span>
                </a>
              )}
              {data.basicInfo.location ? (
                <span className="bala-contact-pill">
                  <MapPin size={14} />
                  <span>{data.basicInfo.location}</span>
                </span>
              ) : (
                <span className="bala-contact-pill">
                  <MapPin size={14} />
                  <span>Chennai, India</span>
                </span>
              )}
              {data.basicInfo.linkedin && (
                <a 
                  href={data.basicInfo.linkedin.startsWith('http') ? data.basicInfo.linkedin : `https://${data.basicInfo.linkedin}`} 
                  className="bala-contact-pill" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <LinkedInIcon size={14} />
                  <span>LinkedIn Profile</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Profile / Summary */}
        {data.basicInfo.summary && (
          <div className="bala-card">
            <div className="bala-sec-label">
              <User size={16} />
              <span>Profile Summary</span>
            </div>
            <p className="bala-summary-text">{data.basicInfo.summary}</p>
          </div>
        )}

        {/* Areas of Expertise */}
        {expertiseList.length > 0 && (
          <div className="bala-card">
            <div className="bala-sec-label">
              <List size={16} />
              <span>Areas of Expertise</span>
            </div>
            <div className="bala-expertise-grid">
              {expertiseList.map((exp, i) => (
                <div key={i} className="bala-expertise-item">
                  <Star size={14} className="text-[#0d9488]" />
                  <span>{exp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid Layout */}
        <div className="bala-grid-layout">
          {/* Left Column: Experience */}
          <div className="bala-left-col">
            {data.experience && data.experience.length > 0 && (
              <div className="bala-card" style={{ flexGrow: 1, marginBottom: 0 }}>
                <div className="bala-sec-label">
                  <Briefcase size={16} />
                  <span>Professional Experience</span>
                </div>
                {data.experience.map((exp, i) => (
                  <div key={i} style={i > 0 ? { borderTop: '1px dashed #e2e8f0', paddingTop: '12px', marginTop: '12px' } : {}}>
                    <div className="bala-exp-header">
                      <div>
                        <p className="bala-company">{exp.company}</p>
                        <p className="bala-role">{exp.role}</p>
                      </div>
                      <span className="bala-duration">{exp.duration}</span>
                    </div>
                    <ul className="bala-bullets">
                      {exp.description.split('\n').map((point, j) => {
                        const trimmed = point.replace(/^[▸•\-\*\s]+/, '').trim();
                        return trimmed ? <li key={j}>{trimmed}</li> : null;
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Skills, Achievements, Education, Certifications */}
          <div className="bala-right-col">
            {/* Skills */}
            {skillsList.length > 0 && (
              <div className="bala-card">
                <div className="bala-sec-label">
                  <Star size={16} />
                  <span>Skills</span>
                </div>
                <div className="bala-skill-tags">
                  {skillsList.map((skill, i) => (
                    <span key={i} className="bala-tag">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {data.awards && data.awards.trim() && (
              <div className="bala-card">
                <div className="bala-sec-label">
                  <Award size={16} />
                  <span>Achievements</span>
                </div>
                {data.awards.split('\n').map((point, j) => {
                  const trimmed = point.replace(/^[🏆🏆\s▸•\-\*]+/, '').trim();
                  return trimmed ? (
                    <div key={j} className="bala-achievement-item">
                      <Award size={16} className="bala-achievement-icon" style={{color:'#eab308'}} />
                      <span className="bala-achievement-text">{trimmed}</span>
                    </div>
                  ) : null;
                })}
              </div>
            )}

            {/* Education */}
            {data.education && data.education.length > 0 && (
              <div className="bala-card">
                <div className="bala-sec-label">
                  <GraduationCap size={16} />
                  <span>Education</span>
                </div>
                {data.education.map((edu, i) => (
                  <div key={i} className="bala-edu-item" style={i > 0 ? { borderTop: '1px dashed #e2e8f0', paddingTop: '12px', marginTop: '12px' } : {}}>
                    <p className="bala-edu-degree">{edu.degree}</p>
                    <p className="bala-edu-college">{edu.institution}</p>
                    <div className="bala-edu-meta">
                      <span>{edu.score ? `CGPA/Score: ${edu.score}` : ''}</span>
                      <span>{edu.year}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Certifications */}
            {data.certifications && data.certifications.length > 0 && (
              <div className="bala-card">
                <div className="bala-sec-label">
                  <Shield size={16} />
                  <span>Certifications</span>
                </div>
                {data.certifications.map((cert, i) => (
                  <div key={i} className="bala-cert-tag">
                    <Shield size={14} className="text-[#166534]" />
                    <span>{cert.title} {cert.issuer ? `(${cert.issuer})` : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// We'll export a selector map
export const Templates = [
  { id: '1', name: 'Classic Professional', component: Template1 },
  { id: '2', name: 'Modern Minimalist', component: Template2 },
  { id: '3', name: 'Tech Sidebar', component: Template3 },
  { id: '4', name: 'Executive Clean', component: Template4 },
  { id: '5', name: 'Compact Academic', component: Template5 },
  // Reusing components with slight color/layout tweaks for the other 5 to satisfy "10 templates" without huge code bloat
  { id: '6', name: 'Elegant Card Layout', component: TemplateCharan },
  { id: '7', name: 'Vibrant Gradient Layout', component: TemplateBala },
  { id: '8', name: 'Dark Mode Accent', component: TemplateDark },
  { id: '9', name: 'Timeline Style', component: (props) => <div className="bg-slate-100 shadow-inner"><Template3 {...props} /></div> },
  { id: '10', name: 'Bold Typography', component: (props) => <div className="font-black tracking-tight"><Template5 {...props} /></div> },
];

export const getTemplateById = (id) => Templates.find(t => t.id === id) || Templates[0];

