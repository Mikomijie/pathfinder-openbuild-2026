import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';

export default function Progress({ profile }) {
  const [progressData, setProgressData] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: memberships } = await supabase
          .from('class_members')
          .select('class_id, classes(id, name, subject)')
          .eq('student_id', user.id);

        const myClasses = (memberships || []).map(m => m.classes).filter(Boolean);
        setClasses(myClasses);

        const { data: progress } = await supabase
          .from('student_progress')
          .select('*, topics(id, title, subject, class_id, part_number, classes(name, subject))')
          .eq('student_id', user.id)
          .order('last_studied_at', { ascending: false });

        setProgressData(progress || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = selectedClass === 'all'
    ? progressData
    : progressData.filter(p => p.topics?.class_id === selectedClass);

  const completed = filtered.filter(p => p.completed);
  const inProgress = filtered.filter(p => !p.completed);
  const stuck = filtered.filter(p => p.is_stuck);
  const scores = completed.filter(p => p.score > 0).map(p => p.score);
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  const Icons = {
    check: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="3 8 6 11 13 5"/>
      </svg>
    ),
    clock: (
      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    alert: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="8" cy="8" r="6"/>
        <line x1="8" y1="5" x2="8" y2="8"/>
        <line x1="8" y1="11" x2="8.01" y2="11"/>
      </svg>
    ),
    star: (
      <svg viewBox="0 0 16 16" fill="#F59E0B" className="w-3.5 h-3.5">
        <polygon points="8 1 10.06 5.26 14.73 5.9 11.37 9.09 12.24 13.74 8 11.56 3.76 13.74 4.63 9.09 1.27 5.9 5.94 5.26 8 1"/>
      </svg>
    ),
    trophy: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
      </svg>
    ),
    chart: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
        <line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div className="w-6 h-6 rounded-full border-2 border-[#E4E7EC]"
          style={{ borderTopColor: '#136299', animation: 'spin 1s linear infinite' }}/>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.f1{animation:fadeUp .4s ease forwards}.f2{animation:fadeUp .4s .08s ease both}.f3{animation:fadeUp .4s .16s ease both}.f4{animation:fadeUp .4s .24s ease both}`}</style>

      <div className="f1">
        <h1 className="text-[22px] font-extrabold text-[#0F172A]">My Progress</h1>
        <p className="text-[14px] text-[#475467] mt-1">Track how you are doing across all your subjects.</p>
      </div>

      {/* Class filter */}
      {classes.length > 1 && (
        <div className="f2 flex items-center gap-2 flex-wrap">
          <button onClick={() => setSelectedClass('all')}
            className={`px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
              selectedClass === 'all'
                ? 'bg-[#136299] text-white border-[#136299]'
                : 'bg-white text-[#475467] border-[#E4E7EC] hover:border-[#136299]'
            }`}>
            All Classes
          </button>
          {classes.map(c => (
            <button key={c.id} onClick={() => setSelectedClass(c.id)}
              className={`px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
                selectedClass === c.id
                  ? 'bg-[#136299] text-white border-[#136299]'
                  : 'bg-white text-[#475467] border-[#E4E7EC] hover:border-[#136299]'
              }`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Stats grid */}
      <div className="f2 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Completed', value: completed.length, icon: Icons.check, color: '#136299', bg: '#EFF6FF' },
          { label: 'In Progress', value: inProgress.length, icon: Icons.clock, color: '#F59E0B', bg: '#FFFBEB' },
          { label: 'Need Review', value: stuck.length, icon: Icons.alert, color: '#BA1A1A', bg: '#FFF1F1' },
          { label: 'Avg Score', value: avgScore !== null ? `${avgScore}%` : '—', icon: Icons.star, color: '#7C3AED', bg: '#F5F3FF' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-[#E4E7EC] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
            </div>
            <p className="text-[24px] font-extrabold text-[#0F172A]">{s.value}</p>
            <p className="text-[12px] font-semibold text-[#475467] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      {filtered.length > 0 && (
        <div className="f3 bg-white border border-[#E4E7EC] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[#136299]">{Icons.trophy}</span>
              <p className="text-[14px] font-bold text-[#0F172A]">Overall Completion</p>
            </div>
            <p className="text-[13px] font-bold text-[#136299]">
              {completed.length}/{filtered.length} topics
            </p>
          </div>
          <div className="w-full h-3 bg-[#E4E7EC] rounded-full overflow-hidden">
            <div className="h-full bg-[#136299] rounded-full transition-all"
              style={{ width: `${filtered.length > 0 ? (completed.length / filtered.length) * 100 : 0}%` }}/>
          </div>
          <p className="text-[12px] text-[#94A3B8] mt-2">
            {filtered.length > 0 ? Math.round((completed.length / filtered.length) * 100) : 0}% of your topics completed
          </p>
        </div>
      )}

      {/* Score breakdown */}
      {completed.filter(p => p.score > 0).length > 0 && (
        <div className="f3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#136299]">{Icons.chart}</span>
            <h2 className="text-[15px] font-bold text-[#0F172A]">Quiz Scores</h2>
          </div>
          <div className="flex flex-col gap-2">
            {completed.filter(p => p.score > 0).slice(0, 8).map((p, i) => (
              <div key={i} className="bg-white border border-[#E4E7EC] rounded-xl p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#0F172A] truncate">
                    {p.topics?.title || 'Topic'}
                  </p>
                  <p className="text-[11px] text-[#94A3B8]">
                    {p.topics?.classes?.name || p.topics?.subject}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-20 h-1.5 bg-[#E4E7EC] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${p.score}%`,
                        background: p.score >= 70 ? '#136299' : p.score >= 50 ? '#F59E0B' : '#BA1A1A'
                      }}/>
                  </div>
                  <span className={`text-[13px] font-bold w-10 text-right ${
                    p.score >= 70 ? 'text-[#136299]'
                      : p.score >= 50 ? 'text-[#F59E0B]'
                      : 'text-[#BA1A1A]'
                  }`}>
                    {p.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Needs review */}
      {stuck.length > 0 && (
        <div className="f4">
          <h2 className="text-[15px] font-bold text-[#0F172A] mb-3 flex items-center gap-2">
            <span className="text-[#BA1A1A]">{Icons.alert}</span> Needs Review
          </h2>
          <div className="flex flex-col gap-2">
            {stuck.map((p, i) => (
              <div key={i} className="bg-[#FFF1F1] border border-[#FFCDD2] rounded-xl p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#0F172A] truncate">
                    {p.topics?.title || 'Topic'}
                  </p>
                  <p className="text-[11px] text-[#94A3B8]">{p.topics?.classes?.name}</p>
                </div>
                <span className="text-[11px] font-bold text-[#BA1A1A] flex-shrink-0">
                  Flagged
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {progressData.length === 0 && (
        <div className="f2 bg-white border-2 border-dashed border-[#E4E7EC] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4 text-[#136299]">
            {Icons.chart}
          </div>
          <p className="text-[15px] font-bold text-[#0F172A] mb-2">No progress yet</p>
          <p className="text-[13px] text-[#475467]">
            Complete your first lesson to see your progress here.
          </p>
        </div>
      )}
    </div>
  );
}