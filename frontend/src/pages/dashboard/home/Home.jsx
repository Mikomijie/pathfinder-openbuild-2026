import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';

export default function Home({ profile }) {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [recentProgress, setRecentProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: memberships } = await supabase
          .from('class_members')
          .select('class_id, classes(id, name, subject, code, teacher_id)')
          .eq('student_id', user.id);

        setClasses((memberships || []).map(m => m.classes).filter(Boolean));

        const { data: progress } = await supabase
          .from('student_progress')
          .select('*, topics(title, subject, class_id)')
          .eq('student_id', user.id)
          .order('last_studied_at', { ascending: false })
          .limit(5);

        setRecentProgress(progress || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const completedCount = recentProgress.filter(p => p.completed).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const Icons = {
    arrow: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M3 8h10M9 4l4 4-4 4"/>
      </svg>
    ),
    book: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
    check: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="8" cy="8" r="6"/><polyline points="5 8 7 10 11 6"/>
      </svg>
    ),
    clock: (
      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    star: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    brain: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.98-3 2.5 2.5 0 0 1-1.32-4.24 3 3 0 0 1 .34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.1-2.46z"/>
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.98-3 2.5 2.5 0 0 0 1.32-4.24 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.1-2.46z"/>
      </svg>
    ),
    zap: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-[#E4E7EC]"
          style={{ borderTopColor: '#136299', animation: 'spin 1s linear infinite' }}/>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .f1{animation:fadeUp .4s ease forwards} .f2{animation:fadeUp .4s .08s ease both} .f3{animation:fadeUp .4s .16s ease both} .f4{animation:fadeUp .4s .24s ease both} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Greeting */}
      <div className="f1">
        <h1 className="text-[26px] md:text-[32px] font-extrabold text-[#0F172A] leading-tight">
          {greeting},<br/>{firstName}! 👋
        </h1>
        <p className="text-[14px] text-[#475467] mt-2">
          {classes.length > 0
            ? `You're enrolled in ${classes.length} class${classes.length !== 1 ? 'es' : ''}. Keep going!`
            : 'Join a class to start your learning journey.'}
        </p>
      </div>

      {/* Quick stats */}
      {recentProgress.length > 0 && (
        <div className="f2 grid grid-cols-3 gap-3">
          {[
            { label: 'Topics Done', value: recentProgress.filter(p => p.completed).length, color: '#136299', bg: '#EFF6FF' },
            { label: 'In Progress', value: recentProgress.filter(p => !p.completed).length, color: '#F59E0B', bg: '#FFFBEB' },
            {
              label: 'Avg Score',
              value: (() => {
                const scores = recentProgress.filter(p => p.score > 0).map(p => p.score);
                return scores.length > 0
                  ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) + '%'
                  : '—';
              })(),
              color: '#70AD47',
              bg: '#F0FDF4'
            },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-[#E4E7EC] rounded-2xl p-4 text-center">
              <p className="text-[22px] font-extrabold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] font-semibold text-[#475467] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Continue learning */}
      {recentProgress.filter(p => !p.completed).length > 0 && (
        <div className="f3">
          <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Continue Learning</p>
          <div className="flex flex-col gap-2">
            {recentProgress.filter(p => !p.completed).slice(0, 3).map((p, i) => (
              <button key={i}
                onClick={() => navigate(`/lesson/${p.topic_id}`)}
                className="bg-white border border-[#E4E7EC] rounded-xl p-4 flex items-center gap-3 hover:border-[#5B9BD5] hover:shadow-sm transition-all text-left w-full active:scale-[0.99]">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#136299] flex-shrink-0">
                  {Icons.book}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#0F172A] truncate">{p.topics?.title || 'Topic'}</p>
                  <p className="text-[12px] text-[#94A3B8]">{p.topics?.subject || ''}</p>
                </div>
                <span className="text-[#94A3B8] flex-shrink-0">{Icons.arrow}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* My classes shortcut */}
      {classes.length > 0 && (
        <div className="f3">
          <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">My Classes</p>
          <div className="flex flex-col gap-2">
            {classes.map((c, i) => (
              <button key={i}
                onClick={() => navigate('/dashboard/student/subjects')}
                className="bg-white border border-[#E4E7EC] rounded-xl p-4 flex items-center gap-3 hover:border-[#5B9BD5] hover:shadow-sm transition-all text-left w-full active:scale-[0.99]">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#136299] font-bold text-[13px] flex-shrink-0">
                  {c.subject?.[0]?.toUpperCase() || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#0F172A] truncate">{c.name}</p>
                  <p className="text-[12px] text-[#94A3B8] truncate">{c.subject}</p>
                </div>
                <span className="text-[#94A3B8] flex-shrink-0">{Icons.arrow}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state — no classes yet */}
      {classes.length === 0 && (
        <div className="f4 bg-white border-2 border-dashed border-[#E4E7EC] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4 text-[#136299]">
            {Icons.brain}
          </div>
          <h2 className="text-[16px] font-bold text-[#0F172A] mb-2">Ready to learn smarter?</h2>
          <p className="text-[13px] text-[#475467] leading-[1.6] mb-5">
            Ask your teacher for a class code to join. Pathfinder will adapt every lesson to the way <em>you</em> learn best.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-[13px] font-semibold text-[#136299]">
            {Icons.zap} Adaptive · Accessible · Built for you
          </div>
        </div>
      )}

      {/* Motivational tip */}
      {completedCount > 0 && (
        <div className="f4 p-4 bg-gradient-to-r from-[#EFF6FF] to-[#F0FDF4] border border-[#DBEAFE] rounded-2xl flex items-center gap-3">
          <span className="text-[#F59E0B] flex-shrink-0">{Icons.star}</span>
          <p className="text-[13px] text-[#1E293B] font-medium leading-[1.5]">
            You have completed <strong>{completedCount}</strong> topic{completedCount !== 1 ? 's' : ''} recently. You are doing great — keep the momentum going!
          </p>
        </div>
      )}
    </div>
  );
}