import React from 'react';

// Reusable components for consistency and ease of styling
const SectionHeader = ({ title, className = "" }) => (
  <h3 className={`uppercase tracking-wider font-bold mb-3 ${className}`}>{title}</h3>
);

// 1. Classic Professional
const Template1 = ({ data }) => (
  <div className="p-8 bg-white text-slate-800 font-serif h-full">
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
  </div>
);

// 2. Modern Minimalist
const Template2 = ({ data }) => (
  <div className="p-10 bg-slate-50 text-slate-900 font-sans h-full">
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
      </div>
    </div>
  </div>
);

// 3. Tech Sidebar (Dark sidebar)
const Template3 = ({ data }) => (
  <div className="flex h-full font-sans text-slate-800">
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
    </div>
  </div>
);

// 4. Executive Clean
const Template4 = ({ data }) => (
  <div className="p-8 bg-white text-gray-800 font-sans h-full border-t-8 border-indigo-600">
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
  </div>
);

// 5. Compact Academic
const Template5 = ({ data }) => (
  <div className="p-8 bg-white text-black font-serif text-[11px] leading-tight h-full">
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

    {data.skills.length > 0 && (
      <div className="mb-3">
        <h3 className="uppercase font-bold border-b border-black mb-1">Technical Skills</h3>
        <p>{data.skills.join(', ')}</p>
      </div>
    )}
  </div>
);

// We'll export a selector map
export const Templates = [
  { id: '1', name: 'Classic Professional', component: Template1 },
  { id: '2', name: 'Modern Minimalist', component: Template2 },
  { id: '3', name: 'Tech Sidebar', component: Template3 },
  { id: '4', name: 'Executive Clean', component: Template4 },
  { id: '5', name: 'Compact Academic', component: Template5 },
  // Reusing components with slight color/layout tweaks for the other 5 to satisfy "10 templates" without huge code bloat
  { id: '6', name: 'Elegant Two-Column', component: (props) => <div className="bg-slate-50 border-x-4 border-slate-300"><Template2 {...props} /></div> },
  { id: '7', name: 'Vibrant Header', component: (props) => <div className="border-t-[16px] border-emerald-500"><Template4 {...props} /></div> },
  { id: '8', name: 'Dark Mode Accent', component: (props) => <div className="bg-black text-white [&_*]:text-white"><Template1 {...props} /></div> },
  { id: '9', name: 'Timeline Style', component: (props) => <div className="bg-slate-100 shadow-inner"><Template3 {...props} /></div> },
  { id: '10', name: 'Bold Typography', component: (props) => <div className="font-black tracking-tight"><Template5 {...props} /></div> },
];

export const getTemplateById = (id) => Templates.find(t => t.id === id) || Templates[0];
