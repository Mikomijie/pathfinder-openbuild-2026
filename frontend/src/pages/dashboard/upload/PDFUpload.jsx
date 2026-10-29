import React, { useState, useRef } from 'react';
import { supabase } from '../../../supabaseClient';

export default function PDFUpload({ profile }) {
  const fileInputRef = useRef(null);
  const [step, setStep] = useState('form'); // form | processing | done
  const [uploadMode, setUploadMode] = useState('pdf');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf') { setError('Please select a PDF file.'); return; }
    if (f.size > 15 * 1024 * 1024) { setError('File too large. Maximum 15MB.'); return; }
    setFile(f);
    setError('');
    if (!title) setTitle(f.name.replace('.pdf', ''));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Please enter a title for your notes.'); return; }
    if (uploadMode === 'pdf' && !file) { setError('Please select a PDF file.'); return; }
    if (uploadMode === 'paste' && !pasteText.trim()) { setError('Please paste your notes.'); return; }

    setUploading(true);
    setError('');
    setStep('processing');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const gradeLevel = profile?.student_level || 'University';
      let payload = {
        topicTitle: title.trim(),
        classId: null,
        gradeLevel,
        personalUpload: true,
        studentId: user.id,
      };

      if (uploadMode === 'pdf') {
        setUploadStep('Reading your PDF...');
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = () => reject(new Error('Could not read file'));
          reader.readAsDataURL(file);
        });
        payload.pdfBase64 = base64;
      } else {
        payload.pasteText = pasteText.trim();
      }

      setUploadStep('Pathfinder AI is creating lessons from your notes...');

      let data, error;
      for (let attempt = 1; attempt <= 5; attempt++) {
        const result = await supabase.functions.invoke('process-pdf', { body: payload });
        if (!result.error) { data = result.data; error = result.error; break; }
        if (attempt < 5) {
          const wait = Math.min(3000 * (attempt - 1), 20000);
          setUploadStep(`Retrying... (attempt ${attempt + 1}/5)`);
          await new Promise(r => setTimeout(r, wait));
        } else { data = result.data; error = result.error; }
      }

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Upload failed');

      setResult(data);
      setStep('done');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Upload failed. Please try again.');
      setStep('form');
    } finally {
      setUploading(false);
      setUploadStep('');
    }
  };

  const handleReset = () => {
    setStep('form');
    setTitle('');
    setFile(null);
    setPasteText('');
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const Icons = {
    pdf: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    paste: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      </svg>
    ),
    check: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="4 12 9 17 20 6"/>
      </svg>
    ),
    book: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
    plus: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
    arrow: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M3 8h10M9 4l4 4-4 4"/>
      </svg>
    ),
  };

  if (step === 'processing') {
    return (
      <div className="flex flex-col gap-5">
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.pulse{animation:pulse 1.5s ease-in-out infinite}`}</style>
        <div>
          <h1 className="text-[22px] font-extrabold text-[#0F172A]">Upload Notes</h1>
        </div>
        <div className="bg-white border border-[#E4E7EC] rounded-2xl p-8 flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#DBEAFE]"
              style={{ borderTopColor: '#136299', animation: 'spin 1s linear infinite' }}/>
          </div>
          <div className="text-center">
            <p className="text-[16px] font-bold text-[#0F172A] mb-1">{uploadStep || 'Processing...'}</p>
            <p className="text-[13px] text-[#475467]">This usually takes 15–30 seconds. Please don't close the page.</p>
          </div>
          <div className="w-full flex flex-col gap-2">
            {['Reading your content', 'Identifying key topics', 'Generating adaptive lessons', 'Saving to your library'].map((s, i) => (
              <div key={i} className="pulse flex items-center gap-2 p-3 bg-[#F8FAFC] rounded-xl">
                <div className="w-2 h-2 rounded-full bg-[#136299] flex-shrink-0"/>
                <p className="text-[13px] text-[#475467]">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'done' && result) {
    return (
      <div className="flex flex-col gap-5">
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.f1{animation:fadeUp .4s ease forwards}.f2{animation:fadeUp .4s .1s ease both}.f3{animation:fadeUp .4s .2s ease both}`}</style>
        <div className="f1">
          <h1 className="text-[22px] font-extrabold text-[#0F172A]">Upload Notes</h1>
        </div>
        <div className="f1 p-5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#336b07] flex items-center justify-center text-white flex-shrink-0">
            {Icons.check}
          </div>
          <div>
            <p className="text-[15px] font-bold text-[#1A3A2A]">Notes uploaded successfully!</p>
            <p className="text-[13px] text-[#336b07]">
              {result.totalParts} lesson{result.totalParts !== 1 ? 's' : ''} created from your content.
            </p>
          </div>
        </div>

        {result.lessons && result.lessons.length > 0 && (
          <div className="f2 flex flex-col gap-2">
            <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest">Lessons Created</p>
            {result.lessons.map((lesson, i) => (
              <div key={i} className="bg-white border border-[#E4E7EC] rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#136299] text-[12px] font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#0F172A] truncate">{lesson.title}</p>
                  <p className="text-[12px] text-[#94A3B8]">Ready to study</p>
                </div>
                <span className="text-[#136299] flex-shrink-0">{Icons.book}</span>
              </div>
            ))}
          </div>
        )}

        <div className="f3 flex flex-col gap-3">
          <button onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#136299] text-white text-[14px] font-bold rounded-xl">
            {Icons.plus} Upload More Notes
          </button>
          <p className="text-[12px] text-[#94A3B8] text-center">
            Find your new lessons under My Subjects in the sidebar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.f1{animation:fadeUp .4s ease forwards}.f2{animation:fadeUp .4s .08s ease both}`}</style>

      <div className="f1">
        <h1 className="text-[22px] font-extrabold text-[#0F172A]">Upload Notes</h1>
        <p className="text-[14px] text-[#475467] mt-1">
          Upload your lecture notes or textbook pages — Pathfinder turns them into adaptive lessons just for you.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-[#FFF1F1] border border-[#FFCDD2] rounded-xl text-[13px] text-[#BA1A1A] font-medium">
          {error}
        </div>
      )}

      <div className="f2 bg-white border border-[#E4E7EC] rounded-2xl p-5 md:p-6">
        <form onSubmit={handleUpload} className="flex flex-col gap-5">

          <div>
            <label className="text-[13px] font-semibold text-[#1E293B] block mb-1.5">Title / Topic Name</label>
            <input type="text" required
              placeholder="e.g. Organic Chemistry — Alkanes, Week 3 Lecture Notes"
              value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-[#E4E7EC] rounded-xl text-[14px] placeholder-[#94A3B8] focus:outline-none focus:border-[#136299]"/>
          </div>

          <div>
            <label className="text-[13px] font-semibold text-[#1E293B] block mb-2">Upload Method</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'pdf', label: 'Upload PDF', sub: 'Lecture slides or notes', icon: Icons.pdf },
                { key: 'paste', label: 'Paste Text', sub: 'Type or paste content', icon: Icons.paste },
              ].map(m => (
                <button key={m.key} type="button"
                  onClick={() => { setUploadMode(m.key); setError(''); }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    uploadMode === m.key
                      ? 'border-[#136299] bg-[#EFF6FF]'
                      : 'border-[#E4E7EC] bg-white hover:border-[#136299]/40'
                  }`}>
                  <div className={uploadMode === m.key ? 'text-[#136299]' : 'text-[#94A3B8]'}>{m.icon}</div>
                  <div>
                    <p className="text-[13px] font-bold text-[#0F172A]">{m.label}</p>
                    <p className="text-[11px] text-[#94A3B8]">{m.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {uploadMode === 'pdf' && (
            <div>
              <label className="text-[13px] font-semibold text-[#1E293B] block mb-1.5">
                PDF File <span className="text-[#94A3B8] font-normal">(max 15MB)</span>
              </label>
              <div className="relative border-2 border-dashed border-[#E4E7EC] rounded-xl overflow-hidden hover:border-[#136299] transition-colors">
                <input ref={fileInputRef} type="file" accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}/>
                <div className="p-6 flex flex-col items-center gap-3 pointer-events-none">
                  <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#136299]">{Icons.pdf}</div>
                  {file ? (
                    <div className="text-center">
                      <p className="text-[14px] font-semibold text-[#0F172A]">{file.name}</p>
                      <p className="text-[12px] text-[#94A3B8]">{(file.size / 1024 / 1024).toFixed(1)} MB — tap to change</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-[14px] font-semibold text-[#0F172A]">Tap to select PDF</p>
                      <p className="text-[12px] text-[#94A3B8]">Your lecture notes, textbook chapters, or handouts</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {uploadMode === 'paste' && (
            <div>
              <label className="text-[13px] font-semibold text-[#1E293B] block mb-1.5">Your Notes</label>
              <textarea rows={8}
                placeholder="Paste your notes, lecture content, or any text you want to turn into lessons..."
                value={pasteText} onChange={e => setPasteText(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#E4E7EC] rounded-xl text-[14px] placeholder-[#94A3B8] focus:outline-none focus:border-[#136299] resize-none"/>
            </div>
          )}

          <div className="p-4 bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl">
            <p className="text-[12px] font-bold text-[#136299] uppercase tracking-widest mb-1">What Pathfinder does</p>
            <p className="text-[13px] text-[#1E293B] leading-[1.6]">
              Our AI reads your notes, splits them into natural topics, and creates 4-level adaptive lessons with voice support, analogies, visual breakdowns and quizzes — personalised to your level.
            </p>
          </div>

          <button type="submit"
            disabled={uploading || !title.trim() || (uploadMode === 'pdf' && !file) || (uploadMode === 'paste' && !pasteText.trim())}
            className="w-full py-3.5 bg-[#136299] hover:bg-[#0e4f80] disabled:bg-[#94A3B8] text-white text-[15px] font-bold rounded-xl transition-colors">
            Create My Lessons
          </button>
        </form>
      </div>
    </div>
  );
}