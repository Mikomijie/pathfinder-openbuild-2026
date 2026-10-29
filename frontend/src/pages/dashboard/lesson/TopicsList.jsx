import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';

export default function TopicsList() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [cls, setCls] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: classData } = await supabase
          .from('classes')
          .select('*')
          .eq('id', classId)
          .single();
        setCls(classData);

        const { data: topicsData } = await supabase
          .from('topics')
          .select('*, student_progress(completed, score, is_stuck)')
          .eq('class_id', classId)
          .eq('student_progress.student_id', user.id)
          .order('part_number', { ascending: true });

        setTopics(topicsData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [classId]);

  const Icons = {
    back: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
    ),
    arrow: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M3 8h10M9 4l4 4-4 4"/>
      </svg>
    ),
    check: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="3 8 6 11 13 5"/>
      </svg>
    ),
    play: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
        <polygon points="4 2 14 8 4 14"/>
      </svg>
    ),
  };

  const getStatus = (topic) => {
    const p = topic.student_progress?.[0];
    if (!p) return 'not_started';
    if (p.completed) return 'completed';
    if (p.is_stuck) return 'stuck';
    return 'in_progress';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div className="w-6 h-6 rounded-full border-2 border-[#E4E7EC]"
          style={{ borderTopColor: '#136299', animation: 'spin 1s linear infinite' }}/>
      </div>
    );
  }

  const completed = topics.filter(t => getStatus(t) === 'completed').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .f1{animation:fadeUp .4s ease forwards}.f2{animation:fadeUp .4s .08s ease both}.f3{animation:fadeUp .4s .16s ease both}
      `}</style>

      <header className="bg-white border-b border-[#E4E7EC] px-4 md:px-8 h-[60px] flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-[#475467] hover:text-[#0F172A] p-1">
          {Icons.back}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-[#0F172A] truncate">{cls?.name || 'Topics'}</p>
          <p className="text-[12px] text-[#94A3B8]">{cls?.subject}</p>
        </div>
      </header>

      <div className="max-w-[680px] mx-auto px-4 md:px-8 py-6 flex flex-col gap-5">
        {/* Progress summary */}
        <div className="f1 bg-white border border-[#E4E7EC] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[14px] font-bold text-[#0F172A]">Your Progress</p>
            <p className="text-[13px] font-semibold text-[#136299]">{completed}/{topics.length} done</p>
          </div>
          <div className="w-full h-2 bg-[#E4E7EC] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#136299] rounded-full transition-all"
              style={{ width: `${topics.length > 0 ? (completed / topics.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Topics */}
        <div className="f2 flex flex-col gap-2">
          {topics.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-[#E4E7EC] rounded-2xl p-8 text-center">
              <p className="text-[14px] font-semibold text-[#0F172A]">No topics yet</p>
              <p className="text-[13px] text-[#94A3B8] mt-1">Your teacher hasn't uploaded materials for this class yet.</p>
            </div>
          ) : (
            topics.map((topic, i) => {
              const status = getStatus(topic);
              const progress = topic.student_progress?.[0];
              return (
                <button key={i}
                  onClick={() => navigate(`/lesson/${topic.id}`)}
                  className="bg-white border border-[#E4E7EC] rounded-xl p-4 flex items-center gap-3 hover:border-[#5B9BD5] hover:shadow-sm transition-all text-left w-full active:scale-[0.99] group">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[13px] ${
                    status === 'completed' ? 'bg-[#136299] text-white'
                    : status === 'in_progress' ? 'bg-[#EFF6FF] text-[#136299] border-2 border-[#136299]'
                    : status === 'stuck' ? 'bg-[#FFF1F1] text-[#BA1A1A]'
                    : 'bg-[#F1F5F9] text-[#94A3B8]'
                  }`}>
                    {status === 'completed' ? Icons.check
                      : status === 'in_progress' ? Icons.play
                      : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#0F172A] truncate">{topic.title}</p>
                    <p className="text-[12px] text-[#94A3B8] mt-0.5">
                      {status === 'completed' && progress?.score > 0 ? `Score: ${progress.score}%`
                        : status === 'in_progress' ? 'In progress'
                        : status === 'stuck' ? 'Needs review'
                        : 'Not started'}
                      {topic.part_number ? ` · Part ${topic.part_number}` : ''}
                    </p>
                  </div>
                  <span className="text-[#CBD5E1] group-hover:text-[#136299] flex-shrink-0">{Icons.arrow}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}