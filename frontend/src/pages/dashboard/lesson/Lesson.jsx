import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';
import { generateLesson, generateQuizQuestions } from '../../../services/openrouter';

const LEVELS = ['simple', 'analogy', 'visual', 'question'];
const LEVEL_LABELS = {
  simple: 'Simple Explanation',
  analogy: 'Real-Life Analogy',
  visual: 'Visual Breakdown',
  question: 'Check Understanding',
};
const LEVEL_COLORS = {
  simple: '#136299',
  analogy: '#7C3AED',
  visual: '#0891B2',
  question: '#D97706',
};

export default function Lesson() {
  const navigate = useNavigate();
  const { topicId } = useParams();

  const [topic, setTopic] = useState(null);
  const [profile, setProfile] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [levelContent, setLevelContent] = useState({});
  const [loadingLevel, setLoadingLevel] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [speaking, setSpeaking] = useState(false);
  const [quizReady, setQuizReady] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);

  const speechRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }

        const { data: profileData } = await supabase
          .from('profiles').select('*').eq('id', user.id).single();
        setProfile(profileData);

        const savedSpeed = localStorage.getItem('pathfinder_voice_speed');
        if (savedSpeed) setVoiceSpeed(parseFloat(savedSpeed));
        else if (profileData?.voice_speed) setVoiceSpeed(profileData.voice_speed);

        const { data: topicData } = await supabase
          .from('topics').select('*, classes(name, subject, level)').eq('id', topicId).single();
        setTopic(topicData);

        const { data: progressData } = await supabase
          .from('student_progress')
          .select('*')
          .eq('student_id', user.id)
          .eq('topic_id', topicId)
          .single();
        setProgress(progressData);

        if (progressData?.current_level) {
          const lvlIdx = LEVELS.indexOf(progressData.current_level);
          if (lvlIdx > 0) setCurrentLevel(lvlIdx);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
    return () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, [topicId, navigate]);

  const loadLevel = useCallback(async (levelIdx) => {
    const level = LEVELS[levelIdx];
    if (levelContent[level]) return;

    setLoadingLevel(true);
    setError('');
    try {
      const content = await generateLesson({
        topicTitle: topic.title,
        subject: topic.classes?.subject || topic.subject,
        gradeLevel: topic.classes?.level || profile?.grade_level || 'Secondary',
        level,
        topicContent: topic.content,
      });
      setLevelContent(prev => ({ ...prev, [level]: content }));
    } catch (err) {
      console.error(err);
      setError('Could not load this section. Please check your connection and try again.');
    } finally {
      setLoadingLevel(false);
    }
  }, [topic, profile, levelContent]);

  useEffect(() => {
    if (topic && profile) loadLevel(currentLevel);
  }, [topic, profile, currentLevel, loadLevel]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentLevel]);

  const saveProgress = async (levelIdx, stuck = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setSavingProgress(true);
      const isComplete = levelIdx >= LEVELS.length - 1;
      await supabase.from('student_progress').upsert({
        student_id: user.id,
        topic_id: topicId,
        current_level: LEVELS[levelIdx],
        completed: isComplete,
        is_stuck: stuck,
        last_studied_at: new Date().toISOString(),
      }, { onConflict: 'student_id,topic_id' });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProgress(false);
    }
  };

  const handleSpeak = () => {
    const level = LEVELS[currentLevel];
    const text = levelContent[level];
    if (!text || !window.speechSynthesis) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const clean = text.replace(/[#*`_~]/g, '').replace(/\n+/g, ' ');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = voiceSpeed;
    utterance.lang = 'en-NG';
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleNext = async () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    const nextIdx = currentLevel + 1;
    if (nextIdx >= LEVELS.length) {
      await saveProgress(currentLevel);
      setQuizReady(true);
      return;
    }
    await saveProgress(nextIdx);
    setCurrentLevel(nextIdx);
  };

  const handlePrev = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    if (currentLevel > 0) setCurrentLevel(currentLevel - 1);
  };

  const handleStuck = async () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    await saveProgress(currentLevel, true);
    if (currentLevel > 0) {
      setCurrentLevel(currentLevel - 1);
    } else {
      setError('You flagged this as difficult. Your teacher has been notified. Try re-reading slowly.');
    }
  };

  const Icons = {
    back: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
    ),
    speak: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {active ? (
          <>
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </>
        ) : (
          <>
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </>
        )}
      </svg>
    ),
    focus: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
      </svg>
    ),
    alert: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
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
  };

  if (quizReady) {
    navigate(`/quiz/${topicId}`);
    return null;
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div className="w-6 h-6 rounded-full border-2 border-[#E4E7EC]"
          style={{ borderTopColor: '#136299', animation: 'spin 1s linear infinite' }}/>
      </div>
    );
  }

  const level = LEVELS[currentLevel];
  const levelColor = LEVEL_COLORS[level];
  const content = levelContent[level];

  const renderContent = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-[18px] font-bold text-[#0F172A] mt-4 mb-2">{line.slice(3)}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} className="text-[20px] font-extrabold text-[#0F172A] mt-4 mb-2">{line.slice(2)}</h1>;
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-[15px] font-bold text-[#0F172A] mt-3">{line.slice(2, -2)}</p>;
      if (line.startsWith('- ') || line.startsWith('• ')) return (
        <div key={i} className="flex items-start gap-2 my-1.5">
          <span className="mt-[6px] w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: levelColor }}/>
          <p className="text-[15px] text-[#1E293B] leading-[1.7]">{line.slice(2)}</p>
        </div>
      );
      if (line.trim() === '') return <div key={i} className="h-2"/>;
      return <p key={i} className="text-[15px] text-[#1E293B] leading-[1.7] my-1">{line}</p>;
    });
  };

  return (
    <div className={`min-h-screen flex flex-col ${focusMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeIn .35s ease forwards}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        .pulse{animation:pulse 1.5s ease-in-out infinite}
      `}</style>

      {/* Header */}
      {!focusMode && (
        <header className="bg-white border-b border-[#E4E7EC] px-4 md:px-8 h-[60px] flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => { window.speechSynthesis?.cancel(); navigate(-1); }}
            className="text-[#475467] hover:text-[#0F172A] p-1 flex-shrink-0">
            {Icons.back}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-[#0F172A] truncate">{topic.title}</p>
            <p className="text-[11px] text-[#94A3B8]">{topic.classes?.subject}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleStuck}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#BA1A1A] bg-[#FFF1F1] rounded-lg hover:bg-[#FFE4E4]">
              {Icons.alert} I'm stuck
            </button>
            <button onClick={() => setFocusMode(true)}
              className="p-2 text-[#475467] hover:text-[#136299] hover:bg-[#EFF6FF] rounded-lg">
              {Icons.focus}
            </button>
          </div>
        </header>
      )}

      {/* Focus mode header */}
      {focusMode && (
        <header className="px-4 md:px-8 h-[60px] flex items-center justify-between flex-shrink-0">
          <p className="text-[14px] font-bold text-white/70 truncate flex-1 min-w-0">{topic.title}</p>
          <button onClick={() => setFocusMode(false)}
            className="text-white/50 hover:text-white text-[13px] font-semibold px-3 py-1.5 bg-white/10 rounded-lg ml-3">
            Exit Focus
          </button>
        </header>
      )}

      {/* Level progress dots */}
      <div className={`flex items-center justify-center gap-2 py-3 px-4 ${focusMode ? '' : 'bg-white border-b border-[#F1F5F9]'}`}>
        {LEVELS.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => { if (i <= currentLevel) setCurrentLevel(i); }}
              disabled={i > currentLevel}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                i === currentLevel
                  ? 'text-white shadow-sm'
                  : i < currentLevel
                  ? focusMode ? 'bg-white/20 text-white/60' : 'bg-[#E4E7EC] text-[#475467]'
                  : focusMode ? 'bg-white/5 text-white/20' : 'bg-[#F1F5F9] text-[#C4CAD4]'
              }`}
              style={i === currentLevel ? { background: levelColor } : {}}>
              {i < currentLevel && <span className="text-[9px]">✓</span>}
              {i === currentLevel ? LEVEL_LABELS[l] : l === 'simple' ? 'Simple' : l === 'analogy' ? 'Analogy' : l === 'visual' ? 'Visual' : 'Check'}
            </button>
            {i < LEVELS.length - 1 && (
              <div className={`w-4 h-px ${i < currentLevel ? focusMode ? 'bg-white/30' : 'bg-[#136299]' : focusMode ? 'bg-white/10' : 'bg-[#E4E7EC]'}`}/>
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-[720px] mx-auto">

          {/* Level badge */}
          <div className="flex items-center gap-2 mb-5">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold text-white" style={{ background: levelColor }}>
              {LEVEL_LABELS[level]}
            </span>
            {savingProgress && (
              <span className="text-[11px] text-[#94A3B8]">Saving...</span>
            )}
          </div>

          {/* Content area */}
          {loadingLevel ? (
            <div className="flex flex-col gap-3">
              {[120, 80, 100, 60, 90].map((w, i) => (
                <div key={i} className="pulse h-4 rounded-lg bg-[#E4E7EC]" style={{ width: `${w}%` }}/>
              ))}
              <div className="mt-4 text-center">
                <p className={`text-[13px] ${focusMode ? 'text-white/50' : 'text-[#94A3B8]'}`}>
                  Pathfinder AI is personalising this lesson for you...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-5 bg-[#FFF1F1] border border-[#FFCDD2] rounded-2xl">
              <p className="text-[14px] font-semibold text-[#BA1A1A] mb-3">{error}</p>
              <button onClick={() => { setError(''); loadLevel(currentLevel); }}
                className="px-4 py-2 bg-[#BA1A1A] text-white text-[13px] font-bold rounded-xl">
                Try Again
              </button>
            </div>
          ) : content ? (
            <div className={`fade-in prose max-w-none ${focusMode ? 'text-white' : ''}`}>
              {renderContent(content)}
            </div>
          ) : null}

          {/* Voice controls */}
          {content && !loadingLevel && (
            <div className={`mt-6 flex items-center gap-3 p-4 rounded-2xl border ${
              focusMode ? 'bg-white/5 border-white/10' : 'bg-[#F8FAFC] border-[#E4E7EC]'
            }`}>
              <button onClick={handleSpeak}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-colors ${
                  speaking
                    ? 'bg-[#BA1A1A] text-white'
                    : focusMode
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-[#136299] text-white hover:bg-[#0e4f80]'
                }`}>
                {Icons.speak(speaking)}
                {speaking ? 'Stop' : 'Read Aloud'}
              </button>
              <div className="flex items-center gap-2">
                {[0.5, 0.75, 1.0].map(speed => (
                  <button key={speed}
                    onClick={() => {
                      setVoiceSpeed(speed);
                      localStorage.setItem('pathfinder_voice_speed', speed.toString());
                      if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); }
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                      voiceSpeed === speed
                        ? focusMode ? 'bg-white/20 text-white' : 'bg-[#136299] text-white'
                        : focusMode ? 'bg-white/5 text-white/50 hover:bg-white/10' : 'bg-white border border-[#E4E7EC] text-[#475467] hover:border-[#136299]'
                    }`}>
                    {speed}×
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stuck button mobile */}
          {content && !loadingLevel && (
            <button onClick={handleStuck}
              className={`sm:hidden mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold ${
                focusMode ? 'bg-white/10 text-white/70' : 'bg-[#FFF1F1] text-[#BA1A1A]'
              }`}>
              {Icons.alert} I'm stuck on this
            </button>
          )}

          {/* Navigation */}
          {content && !loadingLevel && (
            <div className="mt-6 flex items-center gap-3">
              {currentLevel > 0 && (
                <button onClick={handlePrev}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[14px] font-semibold border transition-colors ${
                    focusMode
                      ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      : 'bg-white text-[#475467] border-[#E4E7EC] hover:border-[#136299]'
                  }`}>
                  ← Previous
                </button>
              )}
              <button onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[14px] font-bold text-white transition-colors"
                style={{ background: levelColor }}>
                {currentLevel >= LEVELS.length - 1 ? (
                  <>{Icons.check} Take Quiz</>
                ) : (
                  <>Next: {LEVEL_LABELS[LEVELS[currentLevel + 1]]} {Icons.arrow}</>
                )}
              </button>
            </div>
          )}

          <div className="h-8"/>
        </div>
      </div>
    </div>
  );
}