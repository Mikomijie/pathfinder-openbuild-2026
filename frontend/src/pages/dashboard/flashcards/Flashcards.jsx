import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';
import { generateFlashcards } from '../../../services/openrouter';

export default function Flashcards() {
  const navigate = useNavigate();
  const { topicId } = useParams();

  const [topic, setTopic] = useState(null);
  const [cards, setCards] = useState([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [known, setKnown] = useState(0);
  const [results, setResults] = useState([]);

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

        const flashcards = await generateFlashcards({
          topicTitle: topicData.title,
          subject: topicData.classes?.subject || topicData.subject,
          gradeLevel: topicData.classes?.level || 'Secondary',
          topicContent: topicData.content,
          count: 6,
        });
        setCards(flashcards);
      } catch (err) {
        console.error(err);
        setError('Could not generate flashcards. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchAndGenerate();
  }, [topicId, navigate]);

  const handleFlip = () => setFlipped(f => !f);

  const handleKnew = (knew) => {
    const newResults = [...results, { card: cards[current], knew }];
    setResults(newResults);
    if (knew) setKnown(k => k + 1);

    if (current + 1 >= cards.length) {
      setDone(true);
    } else {
      setCurrent(c => c + 1);
      setFlipped(false);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setFlipped(false);
    setDone(false);
    setKnown(0);
    setResults([]);
  };

  const Icons = {
    back: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
    ),
    check: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="4 12 9 17 20 6"/>
      </svg>
    ),
    wrong: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="5" y1="5" x2="19" y2="19"/>
        <line x1="19" y1="5" x2="5" y2="19"/>
      </svg>
    ),
    flip: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="17 1 21 5 17 9"/>
        <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/>
        <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');*{font-family:'Plus Jakarta Sans',sans-serif}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div className="w-8 h-8 rounded-full border-2 border-[#E4E7EC]"
          style={{ borderTopColor: '#136299', animation: 'spin 1s linear infinite' }}/>
        <p className="text-[14px] text-[#475467] font-medium">Creating your flashcards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');*{font-family:'Plus Jakarta Sans',sans-serif}`}</style>
        <div className="text-center max-w-[340px]">
          <p className="text-[16px] font-bold text-[#0F172A] mb-2">Flashcards unavailable</p>
          <p className="text-[14px] text-[#475467] mb-5">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate(-1)}
              className="px-5 py-2.5 bg-[#F1F5F9] text-[#475467] text-[13px] font-bold rounded-xl">
              Go Back
            </button>
            <button onClick={() => { setError(''); setLoading(true); window.location.reload(); }}
              className="px-5 py-2.5 bg-[#136299] text-white text-[13px] font-bold rounded-xl">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((known / cards.length) * 100);
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');*{font-family:'Plus Jakarta Sans',sans-serif}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.f1{animation:fadeUp .4s ease forwards}.f2{animation:fadeUp .4s .1s ease both}.f3{animation:fadeUp .4s .2s ease both}`}</style>
        <header className="bg-white border-b border-[#E4E7EC] px-4 md:px-8 h-[60px] flex items-center">
          <button onClick={() => navigate(-1)} className="text-[#475467]">{Icons.back}</button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
          <div className="w-full max-w-[400px] flex flex-col items-center gap-5">

            <div className="f1 flex flex-col items-center gap-2">
              <div className="text-[56px]">{pct >= 70 ? '🧠' : '📚'}</div>
              <h1 className="text-[26px] font-extrabold text-[#0F172A] text-center">
                {pct >= 70 ? 'Well done!' : 'Keep reviewing!'}
              </h1>
              <p className="text-[14px] text-[#475467] text-center">{topic?.title}</p>
            </div>

            <div className="f2 w-full bg-white border border-[#E4E7EC] rounded-2xl p-6 flex flex-col items-center gap-3">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-[32px] font-extrabold text-[#336b07]">{known}</p>
                  <p className="text-[12px] text-[#94A3B8]">Knew it</p>
                </div>
                <div className="w-px h-12 bg-[#E4E7EC]"/>
                <div className="text-center">
                  <p className="text-[32px] font-extrabold text-[#BA1A1A]">{cards.length - known}</p>
                  <p className="text-[12px] text-[#94A3B8]">Still learning</p>
                </div>
                <div className="w-px h-12 bg-[#E4E7EC]"/>
                <div className="text-center">
                  <p className="text-[32px] font-extrabold text-[#136299]">{pct}%</p>
                  <p className="text-[12px] text-[#94A3B8]">Score</p>
                </div>
              </div>

              <div className="w-full h-2 bg-[#E4E7EC] rounded-full overflow-hidden">
                <div className="h-full bg-[#136299] rounded-full transition-all"
                  style={{ width: `${pct}%` }}/>
              </div>

              <p className="text-[13px] text-[#475467] text-center">
                {pct >= 90 ? 'You have mastered these cards! Try the quiz if you haven\'t already.'
                  : pct >= 70 ? 'Great recall! Review the ones you missed a couple more times.'
                  : 'Flashcards work best with repetition — do another round to reinforce your memory.'}
              </p>
            </div>

            <div className="f3 w-full flex flex-col gap-3">
              <button onClick={handleRestart}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#136299] text-white text-[15px] font-bold rounded-xl">
                {Icons.repeat} Go Again
              </button>
              <button onClick={() => navigate(-1)}
                className="w-full py-3.5 bg-white border border-[#E4E7EC] text-[#475467] text-[14px] font-semibold rounded-xl hover:border-[#136299]">
                Back to Flashcards
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[current];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes spin{to{transform:rotate(360deg)}}
        .card-container { perspective: 1000px; }
        .card-inner { transition: transform 0.5s ease; transform-style: preserve-3d; position: relative; }
        .card-inner.flipped { transform: rotateY(180deg); }
        .card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .card-back { transform: rotateY(180deg); }
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .slide{animation:slideIn .3s ease forwards}
      `}</style>

      <header className="bg-white border-b border-[#E4E7EC] px-4 md:px-8 h-[60px] flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-[#475467]">{Icons.back}</button>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-[#0F172A] truncate">{topic?.title}</p>
        </div>
        <span className="text-[13px] font-bold text-[#136299] bg-[#EFF6FF] px-3 py-1 rounded-full flex-shrink-0">
          {current + 1} / {cards.length}
        </span>
      </header>

      {/* Progress */}
      <div className="w-full h-1 bg-[#E4E7EC]">
        <div className="h-full bg-[#136299] transition-all"
          style={{ width: `${((current + 1) / cards.length) * 100}%` }}/>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
        <div className="w-full max-w-[500px]">

          {/* Card */}
          <div className="card-container w-full" style={{ height: '280px' }}>
            <div className={`card-inner w-full h-full ${flipped ? 'flipped' : ''}`}>

              {/* Front */}
              <div className="card-face absolute inset-0 bg-white border-2 border-[#E4E7EC] rounded-2xl p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest">Question</span>
                  <span className="text-[11px] font-semibold text-[#136299] bg-[#EFF6FF] px-2 py-1 rounded-lg">
                    Tap to reveal
                  </span>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[17px] font-bold text-[#0F172A] text-center leading-[1.5]">
                    {card?.front}
                  </p>
                </div>
              </div>

              {/* Back */}
              <div className="card-face card-back absolute inset-0 bg-[#136299] border-2 border-[#136299] rounded-2xl p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest">Answer</span>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[16px] font-semibold text-white text-center leading-[1.6]">
                    {card?.back}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Flip button */}
          <button onClick={handleFlip}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-white border border-[#E4E7EC] rounded-xl text-[14px] font-semibold text-[#475467] hover:border-[#136299] hover:text-[#136299] transition-colors">
            {Icons.flip} {flipped ? 'Hide Answer' : 'Reveal Answer'}
          </button>

          {/* Knew it / Still learning */}
          {flipped && (
            <div className="slide mt-4 flex gap-3">
              <button onClick={() => handleKnew(false)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#FFF1F1] border border-[#FFCDD2] text-[#BA1A1A] text-[14px] font-bold rounded-xl hover:bg-[#FFE4E4] transition-colors active:scale-[0.98]">
                {Icons.wrong} Still learning
              </button>
              <button onClick={() => handleKnew(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#F0FDF4] border border-[#BBF7D0] text-[#336b07] text-[14px] font-bold rounded-xl hover:bg-[#DCFCE7] transition-colors active:scale-[0.98]">
                {Icons.check} Knew it!
              </button>
            </div>
          )}

          {/* Progress dots */}
          <div className="mt-6 flex items-center justify-center gap-1.5">
            {cards.map((_, i) => (
              <div key={i} className={`rounded-full transition-all ${
                i === current ? 'w-5 h-2 bg-[#136299]'
                  : i < current
                  ? results[i]?.knew ? 'w-2 h-2 bg-[#336b07]' : 'w-2 h-2 bg-[#BA1A1A]'
                  : 'w-2 h-2 bg-[#E4E7EC]'
              }`}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}