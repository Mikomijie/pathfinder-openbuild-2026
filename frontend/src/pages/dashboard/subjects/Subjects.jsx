import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';

export default function Subjects({ profile }) {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [topicsByClass, setTopicsByClass] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedClass, setExpandedClass] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: memberships } = await supabase
          .from('class_members')
          .select('class_id, classes(id, name, subject, level, code)')
          .eq('student_id', user.id);

        const myClasses = (memberships || []).map(m => m.classes).filter(Boolean);
        setClasses(myClasses);

        if (myClasses.length > 0) {
          setExpandedClass(myClasses[0].id);
          const classIds = myClasses.map(c => c.id);

          const { data: topics } = await supabase
            .from('topics')
            .select('*, student_progress(completed, score, is_stuck, last_studied_at)')
            .in('class_id', classIds)
            .eq('student_progress.student_id', user.id)
            .order('part_number', { ascending: true });

          const grouped = {};
          (topics || []).forEach(t => {
            if (!grouped[t.class_id]) grouped[t.class_id] = [];
            grouped[t.class_id].push(t);
          });
          setTopicsByClass(grouped);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const Icons = {
    arrow: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M3 8h10M9 4l4 4-4 4"/>
      </svg>
    ),
    chevron: (open) => (
      <svg viewBox="0 0 16 16" fill="none" className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M4 6l4 4 4-4"/>
      </svg>
    ),
    check: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="3 8 6 11 13 5"/>
      </svg>
    ),
    lock: (
      <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="7" width="10" height="8" rx="1.5"/>
        <path d="M5 7V5a3 3 0 0 1 6 0v2"/>
      </svg>
    ),
    play: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
        <polygon points="4 2 14 8 4 14"/>
      </svg>
    ),
    alert: (
      <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="8" cy="8" r="6"/>
        <line x1="8" y1="5" x2="8" y2="8"/>
        <line x1="8" y1="11" x2="8.01" y2="11"/>
      </svg>
    ),
    book: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  };

  const getTopicStatus = (topic) => {
    const progress = topic.student_progress?.[0];
    if (!progress) return 'not_started';
    if (progress.completed) return 'completed';
    if (progress.is_stuck) return 'stuck';
    return 'in_progress';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-[#E4E7EC]"
          style={{ borderTopColor: '#136299', animation: 'spin 1s linear infinite' }}/>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.f1{animation:fadeUp .4s ease forwards} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div className="f1">
          <h1 className="text-[22px] font-extrabold text-[#0F172A]">My Subjects</h1>
          <p className="text-[14px] text-[#475467] mt-1">Topics from your classes will appear here.</p>
        </div>
        <div className="bg-white border-2 border-dashed border-[#E4E7EC] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4 text-[#136299]">{Icons.book}</div>
          <p className="text-[15px] font-bold text-[#0F172A] mb-2">No classes yet</p>
          <p className="text-[13px] text-[#475467]">Ask your teacher for a class code to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.f1{animation:fadeUp .4s ease forwards}.f2{animation:fadeUp .4s .08s ease both}.f3{animation:fadeUp .4s .16s ease both} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div className="f1">
        <h1 className="text-[22px] font-extrabold text-[#0F172A]">My Subjects</h1>
        <p className="text-[14px] text-[#475467] mt-1">Select a topic to start an adaptive lesson.</p>
      </div>

      <div className="f2 flex flex-col gap-3">
        {classes.map((cls, ci) => {
          const topics = topicsByClass[cls.id] || [];
          const completedCount = topics.filter(t => getTopicStatus(t) === 'completed').length;
          const isOpen = expandedClass === cls.id;

          return (
            <div key={ci} className="bg-white border border-[#E4E7EC] rounded-2xl overflow-hidden">
              {/* Class header */}
              <button
                onClick={() => setExpandedClass(isOpen ? null : cls.id)}
                className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-[#F8FAFC] transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#136299] font-extrabold text-[14px] flex-shrink-0">
                    {cls.subject?.[0]?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-[#0F172A]">{cls.name}</p>
                    <p className="text-[12px] text-[#94A3B8]">
                      {cls.subject} · {completedCount}/{topics.length} topics done
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {topics.length > 0 && (
                    <div className="hidden sm:flex items-center gap-1.5">
                      <div className="w-24 h-1.5 bg-[#E4E7EC] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#136299] rounded-full transition-all"
                          style={{ width: `${topics.length > 0 ? (completedCount / topics.length) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-[#94A3B8] font-medium">
                        {topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0}%
                      </span>
                    </div>
                  )}
                  <span className="text-[#94A3B8]">{Icons.chevron(isOpen)}</span>
                </div>
              </button>

              {/* Progress bar mobile */}
              {isOpen && topics.length > 0 && (
                <div className="sm:hidden px-4 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#E4E7EC] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#136299] rounded-full"
                        style={{ width: `${(completedCount / topics.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[#94A3B8] font-medium flex-shrink-0">
                      {Math.round((completedCount / topics.length) * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Topics list */}
              {isOpen && (
                <div className="border-t border-[#E4E7EC]">
                  {topics.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-[14px] font-semibold text-[#0F172A]">No topics yet</p>
                      <p className="text-[13px] text-[#94A3B8] mt-1">Your teacher has not uploaded any materials for this class yet.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#F1F5F9]">
                      {topics.map((topic, ti) => {
                        const status = getTopicStatus(topic);
                        const progress = topic.student_progress?.[0];

                        return (
                          <button
                            key={ti}
                            onClick={() => navigate(`/lesson/${topic.id}`)}
                            className="w-full flex items-center gap-3 px-4 md:px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors text-left active:scale-[0.99] group">

                            {/* Status indicator */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                              status === 'completed'
                                ? 'bg-[#136299] text-white'
                                : status === 'in_progress'
                                ? 'bg-[#EFF6FF] text-[#136299] border-2 border-[#136299]'
                                : status === 'stuck'
                                ? 'bg-[#FFF1F1] text-[#BA1A1A]'
                                : 'bg-[#F1F5F9] text-[#94A3B8] group-hover:bg-[#EFF6FF] group-hover:text-[#136299]'
                            }`}>
                              {status === 'completed'
                                ? Icons.check
                                : status === 'in_progress'
                                ? Icons.play
                                : status === 'stuck'
                                ? Icons.alert
                                : <span className="text-[11px] font-bold">{ti + 1}</span>
                              }
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`text-[14px] font-semibold truncate ${
                                status === 'completed' ? 'text-[#475467]' : 'text-[#0F172A]'
                              }`}>
                                {topic.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {status === 'completed' && progress?.score > 0 && (
                                  <span className="text-[11px] text-[#136299] font-semibold">
                                    Score: {progress.score}%
                                  </span>
                                )}
                                {status === 'in_progress' && (
                                  <span className="text-[11px] text-[#F59E0B] font-semibold">In progress</span>
                                )}
                                {status === 'stuck' && (
                                  <span className="text-[11px] text-[#BA1A1A] font-semibold">Needs review</span>
                                )}
                                {status === 'not_started' && (
                                  <span className="text-[11px] text-[#94A3B8]">Not started</span>
                                )}
                                {topic.part_number && (
                                  <span className="text-[11px] text-[#C4CAD4]">Part {topic.part_number}</span>
                                )}
                              </div>
                            </div>

                            <span className="text-[#CBD5E1] group-hover:text-[#136299] flex-shrink-0 transition-colors">
                              {Icons.arrow}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}