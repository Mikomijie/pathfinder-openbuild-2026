import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';

export default function FlashcardsHome({ profile }) {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [topicsByClass, setTopicsByClass] = useState({});
  const [loading, setLoading] = useState(true);

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

        if (myClasses.length > 0) {
          const classIds = myClasses.map(c => c.id);
          const { data: topics } = await supabase
            .from('topics')
            .select('id, title, class_id, subject')
            .in('class_id', classIds)
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
    card: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
    brain: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.98-3 2.5 2.5 0 0 1-1.32-4.24 3 3 0 0 1 .34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.1-2.46z"/>
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.98-3 2.5 2.5 0 0 0 1.32-4.24 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.1-2.46z"/>
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

  const allTopics = Object.values(topicsByClass).flat();

  return (
    <div className="flex flex-col gap-5">
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.f1{animation:fadeUp .4s ease forwards}.f2{animation:fadeUp .4s .08s ease both}.f3{animation:fadeUp .4s .16s ease both}`}</style>

      <div className="f1">
        <h1 className="text-[22px] font-extrabold text-[#0F172A]">Flashcards</h1>
        <p className="text-[14px] text-[#475467] mt-1">
          Pick a topic to practise with AI-generated flashcards.
        </p>
      </div>

      {allTopics.length === 0 ? (
        <div className="f2 bg-white border-2 border-dashed border-[#E4E7EC] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4 text-[#136299]">
            {Icons.card}
          </div>
          <p className="text-[15px] font-bold text-[#0F172A] mb-2">No topics yet</p>
          <p className="text-[13px] text-[#475467]">
            Join a class and complete a lesson — flashcards will appear here.
          </p>
        </div>
      ) : (
        <div className="f2 flex flex-col gap-4">
          {classes.map((cls, ci) => {
            const topics = topicsByClass[cls.id] || [];
            if (topics.length === 0) return null;
            return (
              <div key={ci}>
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2">
                  {cls.name} · {cls.subject}
                </p>
                <div className="flex flex-col gap-2">
                  {topics.map((topic, ti) => (
                    <button key={ti}
                      onClick={() => navigate(`/flashcards/${topic.id}`)}
                      className="bg-white border border-[#E4E7EC] rounded-xl p-4 flex items-center gap-3 hover:border-[#5B9BD5] hover:shadow-sm transition-all text-left w-full active:scale-[0.99] group">
                      <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#136299] flex-shrink-0">
                        {Icons.card}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-[#0F172A] truncate">{topic.title}</p>
                        <p className="text-[12px] text-[#94A3B8]">5 flashcards · AI generated</p>
                      </div>
                      <span className="text-[#CBD5E1] group-hover:text-[#136299] flex-shrink-0 transition-colors">
                        {Icons.arrow}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* What are flashcards tip */}
      {allTopics.length > 0 && (
        <div className="f3 p-4 bg-[#EFF6FF] border border-[#DBEAFE] rounded-2xl flex items-start gap-3">
          <div className="text-[#136299] flex-shrink-0 mt-0.5">{Icons.brain}</div>
          <div>
            <p className="text-[13px] font-bold text-[#1E293B] mb-1">How flashcards help</p>
            <p className="text-[12px] text-[#475467] leading-[1.6]">
              Flashcards use spaced repetition — one of the most effective study techniques. 
              Pathfinder generates them from your actual lesson content so they match exactly what you learned.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}