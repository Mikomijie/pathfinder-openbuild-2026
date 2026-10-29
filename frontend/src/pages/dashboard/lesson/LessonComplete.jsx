import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';

export default function LessonComplete() {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const score = parseInt(searchParams.get('score') || '0');

  const [topic, setTopic] = useState(null);
  const [nextTopic, setNextTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: topicData } = await supabase
          .from('topics')
          .select('*, classes(id, name, subject)')
          .eq('id', topicId)
          .single();
        setTopic(topicData);

        if (topicData) {
          const { data: nextTopics } = await supabase
            .from('topics')
            .select('id, title')
            .eq('class_id', topicData.class_id)
            .gt('part_number', topicData.part_number || 0)
            .order('part_number', { ascending: true })
            .limit(1);
          if (nextTopics && nextTopics.length > 0) {
            setNextTopic(nextTopics[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [topicId]);

  const passed = score >= 60;
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;

  const Icons = {
    star: (filled) => (
      <svg viewBox="0 0 24 24" fill={filled ? '#F59E0B' : 'none'} className="w-9 h-9"
        stroke="#F59E0B" strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    arrow: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M3 8h10M9 4l4 4-4 4"/>
      </svg>
    ),
    home: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    repeat: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="17 1 21 5 17 9"/>
        <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/>
        <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    ),
    book: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6 py-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(0.5);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
        .f1{animation:fadeUp .4s ease forwards}
        .f2{animation:fadeUp .4s .1s ease both}
        .f3{animation:fadeUp .4s .2s ease both}
        .f4{animation:fadeUp .4s .3s ease both}
        .pop{animation:pop .5s .1s ease both}
      `}</style>

      <div className="w-full max-w-[420px] flex flex-col items-center gap-6">

        {/* Badge */}
        <div className="f1 pop flex flex-col items-center gap-3">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-[40px] ${
            passed ? 'bg-[#F0FDF4]' : 'bg-[#FFFBEB]'
          }`}>
            {passed ? '🎉' : '💪'}
          </div>
          <h1 className="text-[28px] font-extrabold text-[#0F172A] text-center leading-tight">
            {passed ? 'Topic Complete!' : 'Good Effort!'}
          </h1>
          <p className="text-[14px] text-[#475467] text-center">
            {topic?.title}
          </p>
        </div>

        {/* Stars + Score */}
        <div className="f2 w-full bg-white border border-[#E4E7EC] rounded-2xl p-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(i => Icons.star(i <= stars))}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-[36px] font-extrabold text-[#136299]">{score}%</p>
              <p className="text-[12px] text-[#94A3B8] font-medium">Quiz Score</p>
            </div>
          </div>
          <p className={`text-[13px] font-semibold text-center px-4 py-2.5 rounded-xl w-full ${
            passed
              ? 'bg-[#F0FDF4] text-[#336b07]'
              : 'bg-[#FFFBEB] text-[#92400E]'
          }`}>
            {score >= 90
              ? '🌟 Outstanding! You have truly mastered this topic.'
              : score >= 70
              ? '✅ Great work! You have a solid understanding.'
              : score >= 50
              ? '👍 Good effort! A quick review will help solidify things.'
              : '📚 Keep going — each attempt makes you stronger!'}
          </p>
        </div>

        {/* XP / streak nudge */}
        <div className="f3 w-full flex items-center gap-3 p-4 bg-[#EFF6FF] border border-[#DBEAFE] rounded-2xl">
          <span className="text-[24px]">⚡</span>
          <div>
            <p className="text-[13px] font-bold text-[#1E293B]">Learning streak active!</p>
            <p className="text-[12px] text-[#475467]">
              {passed
                ? 'You completed a topic today. Come back tomorrow to keep your streak going.'
                : 'You studied today — that counts! Review this topic to improve your score.'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="f4 w-full flex flex-col gap-3">
          {nextTopic && passed && (
            <button
              onClick={() => navigate(`/lesson/${nextTopic.id}`)}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#136299] hover:bg-[#0e4f80] text-white text-[15px] font-bold rounded-xl transition-colors">
              {Icons.book}
              Next: {nextTopic.title}
              {Icons.arrow}
            </button>
          )}

          <button
            onClick={() => navigate('/dashboard/student/subjects')}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-[#E4E7EC] hover:border-[#136299] text-[#475467] text-[14px] font-semibold rounded-xl transition-colors">
            {Icons.home}
            Back to Subjects
          </button>

          {!passed && (
            <button
              onClick={() => navigate(`/lesson/${topicId}`)}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-[14px] font-semibold rounded-xl">
              {Icons.repeat}
              Try Lesson Again
            </button>
          )}
        </div>

        {/* Class name footer */}
        {topic?.classes?.name && (
          <p className="text-[12px] text-[#C4CAD4] text-center">
            {topic.classes.name} · {topic.classes.subject}
          </p>
        )}
      </div>
    </div>
  );
}