import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';
import { generateQuizQuestions } from '../../../services/openrouter';

export default function Quiz() {
  const navigate = useNavigate();
  const { topicId } = useParams();

  const [topic, setTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchAndGenerate = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }

        const { data: topicData } = await supabase
          .from('topics')
          .select('*, classes(subject, level)')
          .eq('id', topicId)
          .single();
        setTopic(topicData);

        const qs = await generateQuizQuestions({
          topicTitle: topicData.title,
          subject: topicData.classes?.subject || topicData.subject,
          gradeLevel: topicData.classes?.level || 'Secondary',
          topicContent: topicData.content,
          count: 5,
        });
        setQuestions(qs);
      } catch (err) {
        console.error(err);
        setError('Could not load quiz. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchAndGenerate();
  }, [topicId, navigate]);

  const handleSelect = (optionIdx) => {
    if (submitted) return;
    setSelected(optionIdx);
  };

  const handleNext = () => {
    if (selected === null) return;
    const isCorrect = selected === questions[current].correctIndex;
    const newAnswers = [...answers, { selected, isCorrect }];
    setAnswers(newAnswers);

    if (current + 1 >= questions.length) {
      const correctCount = newAnswers.filter(a => a.isCorrect).length;
      const finalScore = Math.round((correctCount / questions.length) * 100);
      setScore(finalScore);
      setSubmitted(true);
      saveScore(finalScore);
    } else {
      setCurrent(current + 1);
      setSelected(null);
    }
  };

  const saveScore = async (finalScore) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('student_progress').upsert({
        student_id: user.id,
        topic_id: topicId,
        completed: true,
        score: finalScore,
        is_stuck: finalScore < 50,
        current_level: 'question',
        last_studied_at: new Date().toISOString(),
      }, { onConflict: 'student_id,topic_id' });
    } catch (err) {
      console.error(err);
    }
  };

  const Icons = {
    back: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
    ),
    check: (
      <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="4 10 8 14 16 6"/>
      </svg>
    ),
    wrong: (
      <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="5" y1="5" x2="15" y2="15"/>
        <line x1="15" y1="5" x2="5" y2="15"/>
      </svg>
    ),
    star: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#F59E0B]">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    trophy: (
      <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
      </svg>
    ),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');*{font-family:'Plus Jakarta Sans',sans-serif}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
        <div className="w-8 h-8 rounded-full border-2 border-[#E4E7EC]"
          style={{ borderTopColor: '#D97706', animation: 'spin 1s linear infinite' }}/>
        <p className="text-[14px] text-[#475467] font-medium">Generating your quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');*{font-family:'Plus Jakarta Sans',sans-serif}`}</style>
        <div className="text-center max-w-[340px]">
          <p className="text-[16px] font-bold text-[#0F172A] mb-2">Quiz unavailable</p>
          <p className="text-[14px] text-[#475467] mb-5">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate(-1)}
              className="px-5 py-2.5 bg-[#F1F5F9] text-[#475467] text-[13px] font-bold rounded-xl">
              Go Back
            </button>
            <button onClick={() => { setError(''); setLoading(true); window.location.reload(); }}
              className="px-5 py-2.5 bg-[#D97706] text-white text-[13px] font-bold rounded-xl">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    const passed = score >= 60;
    const correctCount = answers.filter(a => a.isCorrect).length;
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');*{font-family:'Plus Jakarta Sans',sans-serif}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.f1{animation:fadeUp .4s ease forwards}.f2{animation:fadeUp .4s .1s ease both}.f3{animation:fadeUp .4s .2s ease both}`}</style>
        <header className="bg-white border-b border-[#E4E7EC] px-4 md:px-8 h-[60px] flex items-center">
          <button onClick={() => navigate(-1)} className="text-[#475467]">{Icons.back}</button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-[420px] flex flex-col items-center gap-5">
            <div className="f1 flex flex-col items-center gap-3">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${passed ? 'bg-[#F0FDF4]' : 'bg-[#FFF1F1]'}`}
                style={{ color: passed ? '#336b07' : '#BA1A1A' }}>
                {passed ? Icons.trophy : Icons.wrong}
              </div>
              <h1 className="text-[28px] font-extrabold text-[#0F172A] text-center">
                {passed ? 'Great work!' : 'Keep practising!'}
              </h1>
              <p className="text-[14px] text-[#475467] text-center">
                You scored <strong>{correctCount} out of {questions.length}</strong> questions correctly.
              </p>
            </div>

            <div className="f2 w-full bg-white border border-[#E4E7EC] rounded-2xl p-6 flex flex-col items-center gap-3">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#E4E7EC" strokeWidth="8"/>
                  <circle cx="50" cy="50" r="42" fill="none"
                    stroke={passed ? '#336b07' : '#BA1A1A'} strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - score / 100)}`}
                    strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[28px] font-extrabold text-[#0F172A]">{score}%</span>
                </div>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <span key={i} style={{ opacity: score >= i * 33 ? 1 : 0.2 }}>{Icons.star}</span>
                ))}
              </div>
              <p className="text-[13px] text-[#475467] text-center">
                {score >= 90 ? 'Outstanding! You have mastered this topic.'
                  : score >= 70 ? 'Well done! You have a solid understanding.'
                  : score >= 50 ? 'Good effort. Review the lesson to strengthen your knowledge.'
                  : 'No worries — try the lesson again and you will improve!'}
              </p>
            </div>

            <div className="f3 w-full flex flex-col gap-3">
              {questions.map((q, i) => {
                const ans = answers[i];
                const correct = ans?.isCorrect;
                return (
                  <div key={i} className={`p-4 rounded-xl border ${correct ? 'bg-[#F0FDF4] border-[#BBF7D0]' : 'bg-[#FFF1F1] border-[#FFCDD2]'}`}>
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 flex-shrink-0 ${correct ? 'text-[#336b07]' : 'text-[#BA1A1A]'}`}>
                        {correct ? Icons.check : Icons.wrong}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#0F172A]">{q.question}</p>
                        {!correct && (
                          <p className="text-[12px] text-[#336b07] mt-1">
                            ✓ {q.options[q.correctIndex]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="f3 w-full flex flex-col gap-3 mt-2">
              <button
                onClick={() => navigate(`/lesson-complete/${topicId}?score=${score}`)}
                className="w-full py-3.5 bg-[#136299] text-white text-[15px] font-bold rounded-xl">
                Continue
              </button>
              {!passed && (
                <button
                  onClick={() => navigate(`/lesson/${topicId}`)}
                  className="w-full py-3.5 bg-white border border-[#E4E7EC] text-[#475467] text-[14px] font-semibold rounded-xl hover:border-[#136299]">
                  Review Lesson Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');*{font-family:'Plus Jakarta Sans',sans-serif}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.fade{animation:fadeUp .3s ease forwards}`}</style>

      <header className="bg-white border-b border-[#E4E7EC] px-4 md:px-8 h-[60px] flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-[#475467]">{Icons.back}</button>
        <div className="flex-1">
          <p className="text-[14px] font-bold text-[#0F172A]">Quiz: {topic?.title}</p>
        </div>
        <span className="text-[13px] font-bold text-[#D97706] bg-[#FFFBEB] px-3 py-1 rounded-full">
          {current + 1} / {questions.length}
        </span>
      </header>

      {/* Progress bar */}
      <div className="w-full h-1 bg-[#E4E7EC]">
        <div className="h-full bg-[#D97706] transition-all"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}/>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[560px] flex flex-col gap-5">

          {/* Question */}
          <div className="fade bg-white border border-[#E4E7EC] rounded-2xl p-6">
            <p className="text-[11px] font-bold text-[#D97706] uppercase tracking-widest mb-3">
              Question {current + 1}
            </p>
            <p className="text-[17px] font-bold text-[#0F172A] leading-[1.5]">{q?.question}</p>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3">
            {q?.options?.map((option, i) => (
              <button key={i}
                onClick={() => handleSelect(i)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all font-medium text-[14px] leading-[1.5] ${
                  selected === i
                    ? 'border-[#D97706] bg-[#FFFBEB] text-[#0F172A]'
                    : 'border-[#E4E7EC] bg-white text-[#1E293B] hover:border-[#D97706]/50 hover:bg-[#FFFBEB]/30'
                }`}>
                <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-[11px] font-bold mr-3 flex-shrink-0 ${
                  selected === i ? 'bg-[#D97706] text-white' : 'bg-[#F1F5F9] text-[#94A3B8]'
                }`}>
                  {['A','B','C','D'][i]}
                </span>
                {option}
              </button>
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={handleNext}
            disabled={selected === null}
            className="w-full py-3.5 bg-[#D97706] disabled:bg-[#94A3B8] text-white text-[15px] font-bold rounded-xl transition-colors">
            {current + 1 >= questions.length ? 'Submit Quiz' : 'Next Question'}
          </button>
        </div>
      </div>
    </div>
  );
}