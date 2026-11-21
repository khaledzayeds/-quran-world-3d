import React, { useEffect, useRef, useState } from 'react';
const API='https://api.alquran.cloud/v1';
type Chapter={number:number;name:string;englishName:string;numberOfAyahs:number};
type Ayah={number:number;numberInSurah:number;text:string;page:number};
type Surah={number:number;name:string;ayahs:Ayah[];numberOfAyahs:number};
type Mushaf={id:number;name:string;server:string;surah_list:string};
type Reciter={id:number;name:string;moshaf:Mushaf[]};
const requestedReciters=['محمد عبادة','إسلام صبحي','محمد صديق المنشاوي','أحمد بن علي العجمي'];
const normalize=(name:string)=>name.replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/\s+/g,' ').trim();
const cache=new Map<number,Surah>();
export default function QuranReader({initialChapter=1,onVerseComplete}:{initialChapter?:number;onVerseComplete?:(verse:number)=>void}){
 const [chapters,setChapters]=useState<Chapter[]>([]);
 const [chapter,setChapter]=useState(initialChapter);
 const [data,setData]=useState<Surah|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [fontSize,setFontSize]=useState(28);
 const [markedVerse,setMarkedVerse]=useState(0);
 const [playing,setPlaying]=useState(false);
 const [reciters,setReciters]=useState<Reciter[]>([]);
 const [reciterId,setReciterId]=useState<number|null>(null);
 const [reciterError,setReciterError]=useState('');
 const [audioError,setAudioError]=useState('');
 const audio=useRef<HTMLAudioElement|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  fetch(API+'/surah',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('فشل تحميل فهرس السور');return r.json()}).then(j=>{if(!Array.isArray(j.data)||j.data.length!==114)throw Error('فهرس السور غير مكتمل');setChapters(j.data)}).catch(e=>{if(e.name!=='AbortError')setError('تعذر تحميل فهرس السور. تحقق من اتصال الإنترنت.')});
  return()=>controller.abort();
 },[]);
 useEffect(()=>{
  const controller=new AbortController();
  fetch('https://www.mp3quran.net/api/v3/reciters?language=ar',{signal:controller.signal})
   .then(r=>{if(!r.ok)throw Error('reciters');return r.json()})
   .then(j=>{
    const all=(j.reciters||[]) as Reciter[];
    const selected=requestedReciters.flatMap(name=>all.filter(r=>normalize(r.name)===normalize(name)&&Array.isArray(r.moshaf)&&r.moshaf.length));
    setReciters(selected);
    const preferred=selected.find(r=>normalize(r.name)===normalize('محمد صديق المنشاوي'))||selected[0];
    setReciterId(preferred?.id??null);
    if(!preferred)setReciterError('تعذر العثور على تسجيلات القراء المختارين.');
   }).catch(e=>{if(e.name!=='AbortError')setReciterError('تعذر تحميل قائمة القراء. حاول إعادة فتح قسم القراءة.')});
  return()=>controller.abort();
 },[]);
 const selectedReciter=reciters.find(r=>r.id===reciterId);
 const availableMushaf=selectedReciter?.moshaf.find(m=>m.surah_list.split(',').includes(String(chapter))&&/^https:\/\//.test(m.server));
 const audioUrl=availableMushaf?availableMushaf.server.replace(/\/?$/,'/')+String(chapter).padStart(3,'0')+'.mp3':null;
 useEffect(()=>{
  setPlaying(false);setAudioError('');
  if(audio.current){audio.current.pause();audio.current.removeAttribute('src');audio.current.load()}
 },[chapter,reciterId]);
 useEffect(()=>{
  setMarkedVerse(0);
  const controller=new AbortController();setLoading(true);setError('');setData(null);setPlaying(false);
  if(audio.current){audio.current.pause();audio.current.removeAttribute('src');audio.current.load()}
  const cached=cache.get(chapter);
  if(cached){setData(cached);setLoading(false);return()=>controller.abort()}
  fetch(API+'/surah/'+chapter+'/quran-uthmani',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('تعذر تحميل السورة');return r.json()}).then(j=>{
   const s=j.data as Surah;
   if(!s||s.number!==chapter||!Array.isArray(s.ayahs)||s.ayahs.length!==s.numberOfAyahs||!s.ayahs.every((a,i)=>a.numberInSurah===i+1&&typeof a.text==='string'&&a.text.length>0))throw Error('بيانات السورة غير مكتملة');
   cache.set(chapter,s);setData(s);setLoading(false);
  }).catch(e=>{if(e.name!=='AbortError'){setError('تعذر تحميل نص السورة. حاول مجددًا.');setLoading(false)}});
  return()=>controller.abort();
 },[chapter]);
 function toggleAudio(){
  const player=audio.current;
  if(!player||!audioUrl)return;
  if(!player.src||player.src!==audioUrl){player.src=audioUrl;player.load()}
  if(!player.paused){player.pause();setPlaying(false)}
  else player.play().then(()=>{setPlaying(true);setAudioError('')}).catch(()=>{setPlaying(false);setAudioError('تعذر تشغيل هذه التلاوة. جرّب قارئًا آخر.')});
 }

 return <div className="quran-reader">
  <h1>📖 القرآن الكريم</h1>
  <p className="muted">المصحف بالرسم العثماني · اختر القارئ واستمع للسورة كاملة</p>
  <div className="reader-tools"><label>السورة <select value={chapter} onChange={e=>setChapter(Number(e.target.value))} aria-label="اختر السورة">{chapters.length?chapters.map(s=><option value={s.number} key={s.number}>{s.number} — {s.name}</option>):<option value={1}>١ — الفاتحة</option>}</select></label><div className="font-tools"><button onClick={()=>setFontSize(n=>Math.max(20,n-2))} aria-label="تصغير الخط">أ−</button><button onClick={()=>setFontSize(n=>Math.min(44,n+2))} aria-label="تكبير الخط">أ+</button></div></div>
  <div className="reciter-tools"><label>القارئ <select aria-label="اختر القارئ" value={reciterId??''} onChange={e=>setReciterId(Number(e.target.value))} disabled={!reciters.length}>{reciters.length?reciters.map(r=><option value={r.id} key={r.id}>{r.name}</option>):<option value="">جارٍ تحميل القراء</option>}</select></label><p className="reader-note">محمد عبادة: {reciters.some(r=>normalize(r.name)===normalize('محمد عبادة'))?'متاح ضمن القائمة':'لم تتأكد إتاحة تسجيلاته من المصدر الحالي بعد'}</p></div>
  <div className="audio-controls"><button className="primary" onClick={toggleAudio} disabled={!audioUrl}>{playing?'⏸ إيقاف مؤقت':'▶ استمع للسورة'}</button><span>{audioUrl?'تشغيل السورة كاملة من تسجيل القارئ المختار':'هذه السورة غير متاحة للقارئ المختار'}</span></div>
  <audio ref={audio} controls preload="none" className="quran-audio" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)} onError={()=>{if(audio.current?.src)setAudioError('تعذر تحميل الملف الصوتي لهذا القارئ')}}/>
  {(reciterError||audioError)&&<p className="reader-error" role="alert">{reciterError||audioError}</p>}
  {error&&<div className="reader-error" role="alert">{error} <button onClick={()=>setChapter(n=>n===114?113:n+1)}>جرّب سورة أخرى</button></div>}
  {loading?<p className="reader-loading" role="status">جارٍ تحميل السورة…</p>:data&&<article className="mushaf" aria-label={'سورة '+data.name}><div className="surah-title">{data.name}</div>{chapter!==1&&chapter!==9&&<p className="basmala">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>}<div className="verses" style={{fontSize}}>{data.ayahs.map((a,i)=><React.Fragment key={a.number}><span className={markedVerse===a.numberInSurah?'ayah marked-ayah':'ayah'}>{a.text} <button className="verse-number verse-mark" title="تسجيل الوصول إلى هذه الآية" aria-label={'أنجزت حتى الآية '+a.numberInSurah} onClick={()=>{setMarkedVerse(a.numberInSurah);onVerseComplete?.(a.numberInSurah)}}>﴿{a.numberInSurah}﴾</button></span>{' '}</React.Fragment>)}</div></article>}
  <p className="reader-note">اضغط على رقم الآية لتسجيل وصولك إليها وتحديث مسارك الثلاثي الأبعاد.</p>
  <p className="reader-note">مصدر النص: <a href="https://alquran.cloud/api" target="_blank" rel="noopener noreferrer">Al Quran Cloud (quran-uthmani)</a> · مصدر الصوت: <a href="https://www.mp3quran.net/ar/api" target="_blank" rel="noopener noreferrer">MP3Quran</a>. هذه نسخة تطويرية تحتاج مراجعة نهائية للنص والحقوق قبل الإطلاق الرسمي.</p>
 </div>;
}
