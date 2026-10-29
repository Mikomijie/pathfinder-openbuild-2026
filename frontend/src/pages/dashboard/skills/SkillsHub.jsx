import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SKILLS = [
  {
    id: 'note-taking',
    title: 'Effective Note-Taking',
    emoji: '📝',
    category: 'Study Skills',
    desc: 'Learn the Cornell method, mind mapping, and how to take notes that actually stick.',
    tips: [
      'Divide your page: main notes on the right, key questions on the left, summary at the bottom.',
      'Use abbreviations and symbols to write faster — develop your own shorthand.',
      'Review and rewrite your notes within 24 hours while the material is fresh.',
      'Highlight only the most important 10–20% of your notes, not everything.',
      'Turn your notes into questions you can quiz yourself on later.',
    ],
  },
  {
    id: 'time-management',
    title: 'Time Management',
    emoji: '⏰',
    category: 'Productivity',
    desc: 'Beat procrastination, plan your study sessions, and make the most of every hour.',
    tips: [
      'Use the Pomodoro technique: 25 minutes of focused study, then a 5-minute break.',
      'Plan your week on Sunday — block time for each subject before the week starts.',
      'Tackle your hardest subject first when your brain is freshest.',
      'Break big assignments into small daily tasks so nothing sneaks up on you.',
      'Turn off notifications during study blocks — every distraction costs 20 minutes of focus.',
    ],
  },
  {
    id: 'exam-prep',
    title: 'Exam Preparation',
    emoji: '🎯',
    category: 'Exams',
    desc: 'A proven strategy to prepare for exams without cramming the night before.',
    tips: [
      'Start reviewing 2 weeks before — space your revision across multiple short sessions.',
      'Use past questions as your primary revision tool; they show what examiners actually ask.',
      'Practise active recall: close your notes and try to write down everything you remember.',
      'Sleep at least 8 hours the night before — sleep consolidates memory better than cramming.',
      'On exam day: read all questions first, answer what you know, then tackle harder ones.',
    ],
  },
  {
    id: 'focus',
    title: 'Staying Focused',
    emoji: '🧘',
    category: 'Wellbeing',
    desc: 'Practical techniques to improve concentration, especially if you find it hard to sit still.',
    tips: [
      'Create a consistent study environment — your brain associates the space with focus.',
      'Try the "two-minute rule": if you notice a distraction, give yourself two minutes then return.',
      'Body-doubling works: study with a friend (even on video call) to stay accountable.',
      'Move your body before studying — even a 10-minute walk improves concentration.',
      'If your mind wanders, write the thought down to "park" it, then return to the task.',
    ],
  },
  {
    id: 'memory',
    title: 'Memory Techniques',
    emoji: '🧠',
    category: 'Study Skills',
    desc: 'Mnemonics, the memory palace, spaced repetition — tools to remember more with less effort.',
    tips: [
      'Use acronyms: take the first letter of each item to create a word (e.g. BODMAS).',
      'Build a memory palace: place facts in imaginary rooms you can mentally walk through.',
      'Spaced repetition beats cramming — review information at increasing intervals.',
      'Teaching someone else what you learned is the strongest memory exercise there is.',
      'Connect new information to something you already know — analogies create strong memories.',
    ],
  },
  {
    id: 'growth-mindset',
    title: 'Growth Mindset',
    emoji: '🌱',
    category: 'Wellbeing',
    desc: 'Why "I\'m not good at this yet" is more powerful than "I\'m just not smart."',
    tips: [
      'Replace "I can\'t do this" with "I can\'t do this yet" — the word "yet" changes everything.',
      'Mistakes are data, not failure — ask yourself what the mistake is teaching you.',
      'Effort and strategy matter more than natural talent in the long run.',
      'Compare yourself to who you were last week, not to other students.',
      'Celebrate small wins — your brain releases dopamine when you notice progress.',
    ],
  },
  {
    id: 'reading',
    title: 'Active Reading',
    emoji: '📖',
    category: 'Study Skills',
    desc: 'How to read a textbook so you actually understand and remember what you read.',
    tips: [
      'Preview first: read headings, subheadings and diagrams before reading the full text.',
      'Ask a question before each section — reading to answer a question is more effective.',
      'Pause after each paragraph and summarise it in your own words without looking.',
      'Mark only what surprises you or what you don\'t understand — not everything.',
      'After finishing, write a 3-sentence summary of the whole passage from memory.',
    ],
  },
  {
    id: 'stress',
    title: 'Managing Exam Stress',
    emoji: '💆',
    category: 'Wellbeing',
    desc: 'Healthy ways to handle pressure, anxiety and stress during exam season.',
    tips: [
      'Box breathing: inhale 4 counts, hold 4, exhale 4, hold 4 — repeat 4 times.',
      'Reframe anxiety as excitement — both feel similar; tell yourself "I\'m excited."',
      'Keep a regular sleep schedule even during exam week — tired brains forget things.',
      'Exercise for 20 minutes a day — it reduces cortisol (the stress hormone) significantly.',
      'Talk to someone you trust — sharing stress cuts it in half.',
    ],
  },
];

const CATEGORIES = ['All', 'Study Skills', 'Productivity', 'Exams', 'Wellbeing'];

export default function SkillsHub({ profile }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openSkill, setOpenSkill] = useState(null);

  const filtered = selectedCategory === 'All'
    ? SKILLS
    : SKILLS.filter(s => s.category === selectedCategory);

  const Icons = {
    arrow: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M3 8h10M9 4l4 4-4 4"/>
      </svg>
    ),
    chevron: (open) => (
      <svg viewBox="0 0 16 16" fill="none" className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M4 6l4 4 4-4"/>
      </svg>
    ),
    check: (
      <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="3 8 6 11 13 5"/>
      </svg>
    ),
    lightbulb: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="9" y1="18" x2="15" y2="18"/>
        <line x1="10" y1="22" x2="14" y2="22"/>
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
      </svg>
    ),
  };

  return (
    <div className="flex flex-col gap-5">
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.f1{animation:fadeUp .4s ease forwards}.f2{animation:fadeUp .4s .08s ease both}.f3{animation:fadeUp .4s .16s ease both}`}</style>

      <div className="f1">
        <h1 className="text-[22px] font-extrabold text-[#0F172A]">Skills Hub</h1>
        <p className="text-[14px] text-[#475467] mt-1">
          Study smarter with practical skills built for university students.
        </p>
      </div>

      {/* Category filter */}
      <div className="f2 flex items-center gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
              selectedCategory === cat
                ? 'bg-[#136299] text-white border-[#136299]'
                : 'bg-white text-[#475467] border-[#E4E7EC] hover:border-[#136299]'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Skills list */}
      <div className="f3 flex flex-col gap-3">
        {filtered.map((skill) => {
          const isOpen = openSkill === skill.id;
          return (
            <div key={skill.id} className="bg-white border border-[#E4E7EC] rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenSkill(isOpen ? null : skill.id)}
                className="w-full flex items-center gap-4 p-4 md:p-5 hover:bg-[#F8FAFC] transition-colors text-left">
                <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[24px] flex-shrink-0">
                  {skill.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[15px] font-bold text-[#0F172A]">{skill.title}</p>
                    <span className="text-[10px] font-bold text-[#136299] bg-[#EFF6FF] px-2 py-0.5 rounded-full">
                      {skill.category}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#475467] mt-0.5 line-clamp-1">{skill.desc}</p>
                </div>
                <span className="text-[#94A3B8] flex-shrink-0">{Icons.chevron(isOpen)}</span>
              </button>

              {isOpen && (
                <div className="border-t border-[#F1F5F9] px-4 md:px-5 py-4">
                  <p className="text-[13px] text-[#475467] leading-[1.6] mb-4">{skill.desc}</p>
                  <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">
                    5 Key Tips
                  </p>
                  <div className="flex flex-col gap-3">
                    {skill.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#136299] flex items-center justify-center flex-shrink-0 mt-0.5 text-white">
                          {Icons.check}
                        </div>
                        <p className="text-[13px] text-[#1E293B] leading-[1.6]">{tip}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl flex items-start gap-2">
                    <span className="text-[#136299] flex-shrink-0 mt-0.5">{Icons.lightbulb}</span>
                    <p className="text-[12px] text-[#1E293B] leading-[1.5]">
                      <strong>Pathfinder tip:</strong> Try applying just one of these this week. Small consistent changes beat big changes you don't stick to.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}