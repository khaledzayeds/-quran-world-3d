import React,{Suspense,useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas,useFrame} from '@react-three/fiber';
import {Html,OrbitControls,Stars} from '@react-three/drei';
import * as THREE from 'three';
import QuranReader from './QuranReader';
import './style.css';
type Chapter={number:number;name:string;numberOfAyahs:number};
type View='world'|'surah'|'reader'|'top';
type Mode='read'|'memorize';
const API='https://api.alquran.cloud/v1';
function loadProgress():Record<string,number>{try{return JSON.parse(localStorage.getItem('qw-surah-progress-v1')||'{}')}catch{return {}}}
function CameraMotion({view,reduced,controls,completed,total}:{view:View;reduced:boolean;controls:React.RefObject<any>;completed:number;total:number}){
 useEffect(()=>{const c=controls.current;if(!c)return;c.enabled=false;const id=window.setTimeout(()=>{if(c)c.enabled=view==='world'},reduced?0:1200);return()=>window.clearTimeout(id)},[view,reduced,controls]);
 useFrame(({camera},dt)=>{if(view==='world'&&controls.current?.enabled)return;const a=Math.PI*-.85+Math.min(completed/Math.max(total,1),1)*Math.PI*1.7;const focus=new THREE.Vector3(Math.sin(a)*6.5,0,Math.cos(a)*6.5);const p=view==='top'?new THREE.Vector3(0,25,.01):view==='surah'?new THREE.Vector3(focus.x*.8,6.7,focus.z+9):view==='reader'?new THREE.Vector3(0,11,18):new THREE.Vector3(0,15,24);camera.position.lerp(p,reduced?1:1-Math.exp(-1.8*dt));camera.lookAt(view==='surah'?focus:new THREE.Vector3(0,0,0))});
 return null;
}
function World({chapters,selected,onSelect,view,reduced,progress,mode}:{chapters:Chapter[];selected:number;onSelect:(n:number)=>void;view:View;reduced:boolean;progress:Record<string,number>;mode:Mode}){
 const rotation=useRef<THREE.Group>(null);
 const controls=useRef<any>(null);
 const chapter=chapters.find(c=>c.number===selected);
 const steps=Math.min(chapter?.numberOfAyahs||7,60);
 const completed=progress[mode+'-'+selected]||0;
 const currentAngle=-Math.PI*.85+Math.min(completed/Math.max(chapter?.numberOfAyahs||1,1),1)*Math.PI*1.7;
 useFrame((_,dt)=>{if(rotation.current&&view==='world'&&!reduced)rotation.current.rotation.y+=dt*.018});
 return <><color attach="background" args={['#061b26']}/><ambientLight intensity={1.4}/><directionalLight position={[8,15,8]} intensity={2.5} color="#ffe8b1"/><pointLight position={[0,5,0]} intensity={25} color="#57d4bb"/><Stars radius={70} depth={40} count={reduced?300:900} factor={3} fade speed={reduced?0:.3}/>
 <mesh position={[0,-.65,0]}><cylinderGeometry args={[10.8,11.2,1.1,114]}/><meshStandardMaterial color="#123c43" metalness={.55} roughness={.3}/></mesh>
 <mesh position={[0,-.05,0]}><cylinderGeometry args={[10.7,10.7,.14,114]}/><meshStandardMaterial color="#1d5b59" metalness={.55} roughness={.3}/></mesh>
 <mesh position={[0,.06,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[10.35,.08,8,114]}/><meshStandardMaterial color="#d8b873" emissive="#ad8740" emissiveIntensity={.3}/></mesh>
 <mesh position={[0,.08,0]}><cylinderGeometry args={[2.7,2.7,.23,64]}/><meshStandardMaterial color="#0b393c" metalness={.65} roughness={.22}/></mesh>
 {Array.from({length:24},(_,i)=>{const a=i/24*Math.PI*2;return <group key={'arch'+i} position={[Math.sin(a)*10.1,0,Math.cos(a)*10.1]} rotation={[0,a,0]}><mesh position={[0,1.4,0]}><cylinderGeometry args={[.12,.16,2.8,8]}/><meshStandardMaterial color="#9c8d69" metalness={.48} roughness={.42}/></mesh><mesh position={[0,2.88,0]}><boxGeometry args={[.7,.16,.32]}/><meshStandardMaterial color="#d1b67b" metalness={.55} roughness={.35}/></mesh></group>})}
 <mesh position={[0,2.98,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[10.1,.11,8,120]}/><meshStandardMaterial color="#c3a66c" metalness={.7} roughness={.27}/></mesh>
 <mesh position={[0,.2,0]}><cylinderGeometry args={[1.6,1.9,.28,48]}/><meshStandardMaterial color="#c5a665" metalness={.7} roughness={.24}/></mesh>
 <mesh position={[0,.36,0]}><sphereGeometry args={[.85,24,16]}/><meshStandardMaterial color="#e4c782" emissive="#d2a44f" emissiveIntensity={.7} metalness={.4} roughness={.2}/></mesh>
 <group ref={rotation} visible={view==='world'||view==='top'}>
 {chapters.map(c=>{const a=(c.number-1)/114*Math.PI*2;const x=Math.sin(a)*8.8,z=Math.cos(a)*8.8;const done=Math.min(c.numberOfAyahs,progress['read-'+c.number]||0);return <group key={c.number} position={[x,.28,z]}>
 <mesh onClick={()=>onSelect(c.number)} onPointerOver={()=>{document.body.style.cursor='pointer'}} onPointerOut={()=>{document.body.style.cursor='auto'}} position={[0,.28,0]}><boxGeometry args={[.48,1.15,.28]}/><meshStandardMaterial color={done===c.numberOfAyahs?'#e7c57d':selected===c.number?'#83e8d1':'#3e8b88'} emissive={selected===c.number?'#2da18c':'#102b30'} emissiveIntensity={.6}/></mesh>
 <mesh position={[0,.92,0]}><sphereGeometry args={[.16,10,8]}/><meshStandardMaterial color="#edcf8e" emissive="#b28d46" emissiveIntensity={.5}/></mesh>
 {(c.number===selected||c.number%10===0)&&<Html position={[0,1.45,0]} center distanceFactor={16} style={{pointerEvents:'auto'}}><button className="surah-gate-label" onClick={()=>onSelect(c.number)}>{c.number} · {c.name}</button></Html>}
 
 </group>})}
 </group>
 {(view==='surah'||view==='reader'||view==='top')&&<group position={[Math.sin(currentAngle)*6.5,.72,Math.cos(currentAngle)*6.5]}><mesh><coneGeometry args={[.38,.75,8]}/><meshStandardMaterial color="#ffe2a0" emissive="#e6aa4d" emissiveIntensity={.9}/></mesh><pointLight color="#ffd991" intensity={5} distance={3}/></group>}
 {(view==='surah'||view==='reader'||view==='top')&&Array.from({length:steps},(_,i)=>{const a=(i/steps)*Math.PI*1.7-Math.PI*.85;const x=Math.sin(a)*6.5,z=Math.cos(a)*6.5;const done=completed>=Math.ceil((i+1)*(chapter?.numberOfAyahs||7)/steps);return <mesh key={i} position={[x,.34,z]}><cylinderGeometry args={[.3,.38,.55,12]}/><meshStandardMaterial color={done?'#e7c57d':'#4d8d88'} emissive={done?'#ad7f30':'#16484b'} emissiveIntensity={.35}/></mesh>})}
 <CameraMotion view={view} reduced={reduced} controls={controls} completed={completed} total={chapter?.numberOfAyahs||1}/>
 <OrbitControls ref={controls} enabled={view==='world'} enablePan={false} enableZoom minDistance={13} maxDistance={37} minPolarAngle={.25} maxPolarAngle={1.42} enableDamping dampingFactor={.07}/>

 </>;
}
function App(){
 const [chapters,setChapters]=useState<Chapter[]>([]);
 const [selected,setSelected]=useState(1);
 const [view,setView]=useState<View>('world');
 const [mode,setMode]=useState<Mode>('read');
 const [progress,setProgress]=useState(loadProgress);
 const [error,setError]=useState('');
 const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const controller=new AbortController();fetch(API+'/surah',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('fetch');return r.json()}).then(j=>{if(!Array.isArray(j.data)||j.data.length!==114)throw Error('invalid');setChapters(j.data)}).catch(e=>{if(e.name!=='AbortError')setError('تعذر تحميل فهرس السور. يرجى تحديث الصفحة.')});return()=>controller.abort()},[]);
 useEffect(()=>{try{localStorage.setItem('qw-surah-progress-v1',JSON.stringify(progress))}catch{}},[progress]);
 const chapter=chapters.find(c=>c.number===selected);
 const completed=progress[mode+'-'+selected]||0;
 const percent=chapter?Math.round(completed/chapter.numberOfAyahs*100):0;
 const choose=(n:number)=>{setSelected(n);setView('surah')};
 const advance=()=>{if(!chapter)return;setProgress(p=>({...p,[mode+'-'+selected]:Math.min(chapter.numberOfAyahs,(p[mode+'-'+selected]||0)+1)}))};
 return <main dir="rtl" className="qworld">
 <div className="world-canvas"><Canvas dpr={[1,1.5]} camera={{position:[0,15,24],fov:48}} gl={{powerPreference:'high-performance'}}><Suspense fallback={null}><World chapters={chapters} selected={selected} onSelect={choose} view={view} reduced={reduced} progress={progress} mode={mode}/></Suspense></Canvas></div>
 <header className="topbar"><div className="brand"><span className="brand-mark">۞</span><div><strong>عالم القرآن</strong><small>رحلة داخل السور والآيات</small></div></div><span className="version">3D · v1.0</span></header>
 {view==='world'?<section className="journey-home"><h1>اختر سورة وابدأ رحلتك</h1><p>114 محطة على منصة واحدة — اسحب لتدور حول العالم · اضغط على محطة لاختيار السورة</p><label>انتقل إلى سورة <select value={selected} onChange={e=>setSelected(Number(e.target.value))}>{chapters.map(c=><option key={c.number} value={c.number}>{c.number} — {c.name}</option>)}</select></label><button className="primary" onClick={()=>choose(selected)} disabled={!chapters.length}>ادخل السورة</button>{error&&<p role="alert">{error}</p>}</section>:<section className="journey-panel"><div className="panel-head"><button className="back" onClick={()=>setView('world')}>→ كل السور</button><button className="back" onClick={()=>setView(view==='top'?'surah':'top')}>{view==='top'?'منظور مائل':'◎ Top View'}</button></div><h2>{chapter?.name||'السورة'}</h2><div className="journey-modes"><button className={mode==='read'?'active':''} onClick={()=>setMode('read')}>قراءة</button><button className={mode==='memorize'?'active':''} onClick={()=>setMode('memorize')}>حفظ</button></div><div className="journey-stat"><strong>{percent}٪</strong><span>أنجزت {completed} من {chapter?.numberOfAyahs||0} آية في {mode==='read'?'القراءة':'الحفظ'}</span></div><div className="progress-track"><div style={{width:percent+'%'}}/></div><div className="journey-actions"><button className="primary" onClick={()=>setView(view==='reader'?'surah':'reader')}>{view==='reader'?'أغلق المصحف':'افتح المصحف والتلاوة'}</button><button className="primary secondary" onClick={advance} disabled={!chapter||completed>=chapter.numberOfAyahs}>سجّل إنجاز آية</button></div>{view==='reader'&&<div className="embedded-reader"><QuranReader initialChapter={selected} onVerseComplete={n=>setProgress(p=>({...p,[mode+'-'+selected]:Math.max(p[mode+'-'+selected]||0,n)}))}/></div>}</section>}
 <button className="motion-toggle" onClick={()=>setReduced(v=>!v)}>{reduced?'تشغيل الحركة':'تقليل الحركة'}</button><footer>التقدم محفوظ على هذا الجهاز · تسجيل الإنجاز يدوي حاليًا</footer>
 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
