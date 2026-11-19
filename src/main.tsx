import React, { Suspense, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Html, Sparkles, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import './style.css';
import QuranReader from './QuranReader';

type Section = 'home' | 'read' | 'khatma' | 'memorize' | 'review' | 'achievements';
const sections: {id:Exclude<Section,'home'>;label:string;subtitle:string;symbol:string;color:string;position:[number,number,number]}[] = [
  {id:'read',label:'قراءة القرآن',subtitle:'افتح المصحف',symbol:'✦',color:'#74e6cb',position:[-3.8,1.5,0]},
  {id:'khatma',label:'الختمة',subtitle:'خطتك اليومية',symbol:'◈',color:'#efcb7b',position:[3.7,1.7,-.4]},
  {id:'memorize',label:'الحفظ',subtitle:'رحلة الحفظ',symbol:'✧',color:'#b3a3ff',position:[-4,-1.7,-1]},
  {id:'review',label:'المراجعة',subtitle:'ثبّت ما حفظت',symbol:'↻',color:'#8bbfff',position:[3.9,-1.6,-1]},
  {id:'achievements',label:'الإنجازات',subtitle:'تابع تقدمك',symbol:'★',color:'#f2adab',position:[0,-3,-2]}
];

function Orb({item,onChoose,active}:{item:typeof sections[number];onChoose:(s:Section)=>void;active:boolean}) {
  const ref=useRef<THREE.Group>(null);
  useFrame(({clock})=>{if(ref.current)ref.current.rotation.y=clock.elapsedTime*.18});
  return <group position={item.position}>
    <Float speed={1.2} rotationIntensity={.08} floatIntensity={.22}>
      <group ref={ref}>
        <mesh><icosahedronGeometry args={[.91,2]}/><meshPhysicalMaterial color={item.color} metalness={.18} roughness={.18} transmission={.2} transparent opacity={.82} emissive={item.color} emissiveIntensity={active?.5:.24}/></mesh>
        <mesh scale={1.12}><sphereGeometry args={[.91,24,16]}/><meshBasicMaterial color={item.color} wireframe transparent opacity={.12}/></mesh>
      </group>
      <Text position={[0,.12,.94]} fontSize={.62} color="#ffffff" anchorX="center" outlineWidth={.008} outlineColor="#12463f">{item.symbol}</Text>
      <Html position={[0,-1.16,0]} center distanceFactor={9} zIndexRange={[20,0]}>
        <button className="orb-label" onClick={()=>onChoose(item.id)} aria-label={'افتح '+item.label}><strong>{item.label}</strong><small>{item.subtitle}</small></button>
      </Html>
      <mesh onClick={()=>onChoose(item.id)}><sphereGeometry args={[1.04,20,16]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
    </Float>
  </group>;
}
function Centerpiece({reduced}:{reduced:boolean}){
  const ring=useRef<THREE.Mesh>(null);
  useFrame((_,dt)=>{if(ring.current&&!reduced)ring.current.rotation.z+=dt*.12});
  return <group>
    <Float speed={.85} floatIntensity={.18} rotationIntensity={.03}>
      <mesh><sphereGeometry args={[1.65,40,32]}/><meshPhysicalMaterial color="#0f736d" metalness={.32} roughness={.19} emissive="#166d63" emissiveIntensity={.55} clearcoat={1}/></mesh>
      <mesh ref={ring} rotation={[.4,0,.2]}><torusGeometry args={[2.12,.035,8,100]}/><meshBasicMaterial color="#e6c884"/></mesh>
      <mesh rotation={[1.12,.25,0]}><torusGeometry args={[1.98,.025,8,100]}/><meshBasicMaterial color="#68cdb4"/></mesh>
      <Text position={[0,.23,1.62]} fontSize={.4} color="#fff7dd" anchorX="center" maxWidth={2.8}>عالم القرآن</Text>
      <Text position={[0,-.27,1.63]} fontSize={.18} color="#d6eecf" anchorX="center">QURAN WORLD</Text>
    </Float>
    <pointLight color="#5ed4b9" intensity={12} distance={12}/>
  </group>;
}
function CameraRig({section,reduced}:{section:Section;reduced:boolean}){
  useFrame(({camera},dt)=>{
    const target=section==='home'?new THREE.Vector3(0,0,13):new THREE.Vector3(0,0,9.3);
    camera.position.lerp(target,reduced?1:1-Math.exp(-2.4*dt));
    camera.lookAt(0,0,0);
  });
  return null;
}
function Scene({section,onChoose,reduced,mobile}:{section:Section;onChoose:(s:Section)=>void;reduced:boolean;mobile:boolean}){
  return <>
    <color attach="background" args={['#061c26']}/>
    <fog attach="fog" args={['#061c26',15,32]}/>
    <ambientLight intensity={1.3}/>
    <directionalLight position={[5,8,7]} intensity={2.2} color="#fff2d4"/>
    <Stars radius={65} depth={45} count={reduced?400:1100} factor={3} saturation={.4} fade speed={reduced?0:.3}/>
    {!reduced&&<Sparkles count={55} scale={[17,11,8]} size={1.7} speed={.2} color="#b8e6d4"/>}
    <Centerpiece reduced={reduced}/>
    {!mobile&&sections.map(item=><Orb key={item.id} item={item} onChoose={onChoose} active={section===item.id}/>)}
    <CameraRig section={section} reduced={reduced}/>
  </>;
}
function getStoredNumber(key:string,fallback:number){
  try{const n=Number(localStorage.getItem(key));return Number.isFinite(n)&&n>0?n:fallback}catch{return fallback}
}
function App(){
  const [section,setSection]=useState<Section>('home');
  const [goal,setGoal]=useState(()=>getStoredNumber('qw-goal',2));
  const [completed,setCompleted]=useState(0);
  const [day,setDay]=useState(()=>new Date().toLocaleDateString('en-CA'));
  const [mobile,setMobile]=useState(()=>typeof window!=='undefined'&&window.innerWidth<850);
  useEffect(()=>{const update=()=>setMobile(window.innerWidth<850);window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update)},[]);
  const [reduced,setReduced]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{try{const v=JSON.parse(localStorage.getItem('quran-world-progress')||'{}');if(v.day===day)setCompleted(Math.max(0,Number(v.completed)||0))}catch{}},[day]);
  useEffect(()=>{try{localStorage.setItem('quran-world-progress',JSON.stringify({day,goal,completed}));localStorage.setItem('qw-goal',String(goal))}catch{}},[day,goal,completed]);
  const completePage=()=>{const today=new Date().toLocaleDateString('en-CA');if(today!==day){setDay(today);setCompleted(1)}else setCompleted(n=>Math.min(goal,n+1))};
  return <main dir="rtl">
    <div className="world-canvas" aria-hidden="true"><Canvas dpr={[1,1.5]} gl={{antialias:true,powerPreference:'high-performance'}} camera={{position:[0,0,13],fov:50}}><Suspense fallback={null}><Scene section={section} onChoose={setSection} reduced={reduced} mobile={mobile}/></Suspense></Canvas></div>
    <header className="topbar"><div className="brand"><span className="brand-mark">۞</span><div><strong>عالم القرآن</strong><small>رحلتك مع القرآن تبدأ هنا</small></div></div><span className="version">تجربة تفاعلية · v0.6</span></header>
    {section==='home'?<section className="welcome"><span className="eyebrow">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span><h1>رحلتك في عالم القرآن</h1><p>اختر عالمك من الدوائر المضيئة، وابدأ القراءة أو خطط لختمتك.</p></section>:<section className="content-panel" aria-label="محتوى القسم">
      <div className="panel-head"><button className="back" onClick={()=>setSection('home')}>→ العودة للعالم</button><span className="panel-kicker">عالم القرآن</span></div>
      {section==='read'?<QuranReader/>:section==='khatma'?<><h1>◈ خطة الختمة</h1><p className="muted">حدد هدفك اليومي وسجّل ما قرأته. التقدم محفوظ على هذا الجهاز مؤقتًا.</p><label className="goal-label">الهدف اليومي <select value={goal} onChange={e=>{setGoal(Number(e.target.value));setCompleted(n=>Math.min(n,Number(e.target.value)))}}>{[1,2,3,4,5,6,8,10,15,20].map(n=><option key={n} value={n}>{n} صفحة</option>)}</select></label><div className="progress-track"><div style={{width:(completed/goal*100)+'%'}}/></div><p>أنجزت {completed} من {goal} صفحات اليوم</p><button className="primary" onClick={completePage} disabled={completed>=goal&&day===new Date().toLocaleDateString('en-CA')}>✓ أنجزت صفحة</button></>:<><h1>{sections.find(s=>s.id===section)?.label}</h1><p className="muted">هذا القسم قيد التطوير. سنربطه بحسابك وخطة رحلتك القرآنية في المراحل القادمة.</p><button className="primary" onClick={()=>setSection('read')}>ابدأ بقراءة القرآن</button></>}
    </section>}
    {section==='home'&&<nav className="mobile-orbits" aria-label="اختر قسمًا">{sections.map(item=><button key={item.id} onClick={()=>setSection(item.id)}><span className="mobile-orb-symbol" style={{borderColor:item.color,color:item.color}}>{item.symbol}</span><strong>{item.label}</strong></button>)}</nav>}
    <nav className="quick-nav" aria-label="أقسام الموقع">{sections.map(item=><button key={item.id} className={section===item.id?'selected':''} onClick={()=>setSection(item.id)}>{item.label}</button>)}</nav>
    <button className="motion-toggle" onClick={()=>setReduced(v=>!v)} aria-label={reduced?'تشغيل الحركة':'تقليل الحركة'}>{reduced?'تشغيل الحركة':'تقليل الحركة'}</button>
    <footer>عالم القرآن · نسخة تجريبية — الحسابات والمزامنة غير متاحين بعد</footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
