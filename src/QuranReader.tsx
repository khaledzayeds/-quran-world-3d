import React, { useEffect, useRef, useState } from 'react';
const API='https://api.alquran.cloud/v1';
type Chapter={number:number;name:string;englishName:string;numberOfAyahs:number};
type Ayah={number:number;numberInSurah:number;text:string;page:number};
type Surah={number:number;name:string;ayahs:Ayah[];numberOfAyahs:number};
const cache=new Map<number,Surah>();
export default function QuranReader(){
 const [chapters,setChapters]=useState<Chapter[]>([]);
 const [chapter,setChapter]=useState(1);
 const [data,setData]=useState<Surah|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [fontSize,setFontSize]=useState(28);
 const [playing,setPlaying]=useState(false);
 const [activeAyah,setActiveAyah]=useState<number|null>(null);
 const audio=useRef<HTMLAudioElement|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  fetch(API+'/surah',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('فشل تحميل فهرس السور');return r.json()}).then(j=>{if(!Array.isArray(j.data)||j.data.length!==114)throw Error('فهرس السور غير مكتمل');setChapters(j.data)}).catch(e=>{if(e.name!=='AbortError')setError('تعذر تحميل فهرس السور. تحقق من اتصال الإنترنت.')});
  return()=>controller.abort();
 },[]);
 useEffect(()=>{
  const controller=new AbortController();setLoading(true);setError('');setData(null);setPlaying(false);setActiveAyah(null);
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
 function playAyah(index:number){
  if(!data||!audio.current)return;
  const verse=data.ayahs[index];if(!verse)return;
  const player=audio.current;
  player.src='https://cdn.islamic.network/quran/audio/64/ar.alafasy/'+verse.number+'.mp3';
  setActiveAyah(index);player.play().then(()=>setPlaying(true)).catch(()=>{setPlaying(false);setError('تعذر تشغيل التلاوة. تحقق من الاتصال.')});
 }
 function toggleAudio(){
  if(!audio.current||!data)return;
  if(playing){audio.current.pause();setPlaying(false)}
  else if(activeAyah!==null){audio.current.play().then(()=>setPlaying(true)).catch(()=>setError('تعذر تشغيل الصوت'))}
  else playAyah(0);
 }
 return <div className="quran-reader">
  <h1>📖 القرآن الكريم</h1>
  <p className="muted">المصحف بالرسم العثماني · التلاوة بصوت الشيخ مشاري العفاسي</p>
  <div className="reader-tools"><label>السورة <select value={chapter} onChange={e=>setChapter(Number(e.target.value))} aria-label="اختر السورة">{chapters.length?chapters.map(s=><option value={s.number} key={s.number}>{s.number} — {s.name}</option>):<option value={1}>١ — الفاتحة</option>}</select></label><div className="font-tools"><button onClick={()=>setFontSize(n=>Math.max(20,n-2))} aria-label="تصغير الخط">أ−</button><button onClick={()=>setFontSize(n=>Math.min(44,n+2))} aria-label="تكبير الخط">أ+</button></div></div>
  <div className="audio-controls"><button className="primary" onClick={toggleAudio} disabled={!data}>{playing?'⏸ إيقاف مؤقت':'▶ استمع للتلاوة'}</button><span>اضغط على أي آية لسماعها، ثم تتابع التلاوة تلقائيًا.</span></div>
  <audio ref={audio} preload="none" onEnded={()=>{if(data&&activeAyah!==null&&activeAyah+1<data.ayahs.length)playAyah(activeAyah+1);else{setPlaying(false);setActiveAyah(null)}}} onError={()=>{setPlaying(false)}}/>
  {error&&<div className="reader-error" role="alert">{error} <button onClick={()=>setChapter(n=>n===114?113:n+1)}>جرّب سورة أخرى</button></div>}
  {loading?<p className="reader-loading" role="status">جارٍ تحميل السورة…</p>:data&&<article className="mushaf" aria-label={'سورة '+data.name}><div className="surah-title">{data.name}</div>{chapter!==1&&chapter!==9&&<p className="basmala">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>}<div className="verses" style={{fontSize}}>{data.ayahs.map((a,i)=><React.Fragment key={a.number}><span className={activeAyah===i?'ayah active-ayah':'ayah'}>{a.text} <button className="verse-number" onClick={()=>playAyah(i)} title={'استمع إلى الآية '+a.numberInSurah} aria-label={'تشغيل الآية '+a.numberInSurah}>﴿{a.numberInSurah}﴾</button></span>{' '}</React.Fragment>)}</div></article>}
  <p className="reader-note">مصدر النص: <a href="https://alquran.cloud/api" target="_blank" rel="noopener noreferrer">Al Quran Cloud (quran-uthmani)</a> · مصدر الصوت: <a href="https://alquran.cloud/cdn" target="_blank" rel="noopener noreferrer">Islamic Network CDN</a>. هذه نسخة تطويرية تحتاج مراجعة نهائية للنص والحقوق قبل الإطلاق الرسمي.</p>
 </div>;
}
