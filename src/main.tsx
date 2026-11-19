import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, Text, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import './style.css';

const held = new Set<string>();
function useKeys() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault(); held.add(e.key.toLowerCase()); };
    const up = (e: KeyboardEvent) => held.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); held.clear(); };
  }, []);
}
function Tree({x,z,s=1}:{x:number,z:number,s?:number}) {
  return <group position={[x,0,z]} scale={s}>
    <mesh position={[0,1,0]} castShadow><cylinderGeometry args={[.15,.24,2,8]}/><meshStandardMaterial color="#765039"/></mesh>
    <mesh position={[0,2.4,0]} castShadow><coneGeometry args={[1.1,2.7,9]}/><meshStandardMaterial color="#2f7450"/></mesh>
    <mesh position={[0,3.5,0]} castShadow><coneGeometry args={[.85,2,9]}/><meshStandardMaterial color="#3d9366"/></mesh>
  </group>;
}
function Portal({onEnter}:{onEnter:()=>void}) {
  const light=useRef<THREE.Mesh>(null);
  useFrame(({clock})=>{if(light.current) light.current.rotation.z=clock.elapsedTime*.12});
  return <group position={[0,0,-14]}>
    <mesh position={[0,3,0]} castShadow><torusGeometry args={[2.4,.4,12,48]}/><meshStandardMaterial color="#e6d6a5" metalness={.65} roughness={.3}/></mesh>
    <mesh ref={light} position={[0,3,0.05]}><torusGeometry args={[2.1,.08,8,48]}/><meshBasicMaterial color="#8ef7e1"/></mesh>
    <mesh position={[0,3,0]}><circleGeometry args={[2.1,48]}/><meshBasicMaterial color="#50bba6" transparent opacity={.32} side={THREE.DoubleSide}/></mesh>
    <pointLight position={[0,3,1]} intensity={14} distance={12} color="#70f7d5"/>
    <Sparkles count={55} scale={[5,7,3]} size={4} speed={.5} color="#e6ffcf" position={[0,3,0]}/>
    <Text position={[0,6.4,0]} fontSize={.65} color="#fff3c9" anchorX="center">QURAN CITY</Text>
    <mesh position={[0,.35,0]} onClick={onEnter}><boxGeometry args={[4.5,.7,1.2]}/><meshStandardMaterial color="#bda47a"/></mesh>
  </group>;
}
function Player({onNear}:{onNear:(v:boolean)=>void}) {
  const ref=useRef<THREE.Group>(null);
  const near=useRef(false);
  const facing=useRef(0);
  const walk=useRef(0);
  const leftLeg=useRef<THREE.Group>(null);
  const rightLeg=useRef<THREE.Group>(null);
  useFrame(({camera},dt)=>{
    const p=ref.current;if(!p)return;
    const dx=Number(held.has('d')||held.has('arrowright'))-Number(held.has('a')||held.has('arrowleft'));
    const dz=Number(held.has('s')||held.has('arrowdown'))-Number(held.has('w')||held.has('arrowup'));
    const len=Math.hypot(dx,dz)||1;const speed=held.has('shift')?7:4;
    p.position.x=THREE.MathUtils.clamp(p.position.x+dx/len*speed*dt,-24,24);
    p.position.z=THREE.MathUtils.clamp(p.position.z+dz/len*speed*dt,-22,22);
    if(dx||dz){facing.current=Math.atan2(-dx,-dz);p.rotation.y=THREE.MathUtils.damp(p.rotation.y,facing.current,10,dt);walk.current+=dt*speed*2.2;}
    const stride=(dx||dz)?Math.sin(walk.current)*.45:0;
    if(leftLeg.current)leftLeg.current.rotation.x=THREE.MathUtils.damp(leftLeg.current.rotation.x,stride,9,dt);
    if(rightLeg.current)rightLeg.current.rotation.x=THREE.MathUtils.damp(rightLeg.current.rotation.x,-stride,9,dt);
    const target=new THREE.Vector3(p.position.x+7,p.position.y+7,p.position.z+12);
    camera.position.lerp(target,1-Math.exp(-3.8*dt));
    const look=new THREE.Vector3(p.position.x,p.position.y+1.45,p.position.z-2);
    camera.lookAt(look);
    const n=Math.hypot(p.position.x,p.position.z+14)<4;
    if(n!==near.current){near.current=n;onNear(n);}
  });
  return <group ref={ref} position={[0,0,9]}>
    <mesh position={[0,1.35,0]} castShadow><capsuleGeometry args={[.42,1.2,6,12]}/><meshStandardMaterial color="#e7e1cc"/></mesh>
    <mesh position={[0,2.5,0]} castShadow><sphereGeometry args={[.42,16,12]}/><meshStandardMaterial color="#cba07c"/></mesh>
    <group ref={leftLeg} position={[-.22,.85,0]}><mesh position={[0,-.4,0]} castShadow><boxGeometry args={[.25,.85,.35]}/><meshStandardMaterial color="#243e4a"/></mesh></group>
    <group ref={rightLeg} position={[.22,.85,0]}><mesh position={[0,-.4,0]} castShadow><boxGeometry args={[.25,.85,.35]}/><meshStandardMaterial color="#243e4a"/></mesh></group>
  </group>;
}
function Rock({x,z,s=1}:{x:number,z:number,s?:number}) {
  return <mesh position={[x,.22*s,z]} scale={[s*1.3,s*.6,s]} castShadow receiveShadow><dodecahedronGeometry args={[1,0]}/><meshStandardMaterial color="#8c9586" roughness={1}/></mesh>;
}
function Shrine({x,z}:{x:number,z:number}) {
  return <group position={[x,0,z]}>
    <mesh position={[0,.6,0]} castShadow><cylinderGeometry args={[.85,1,1.2,8]}/><meshStandardMaterial color="#c9b996"/></mesh>
    <mesh position={[0,1.55,0]} castShadow><sphereGeometry args={[.8,12,8,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color="#e8d6a7" metalness={.15}/></mesh>
    <mesh position={[0,2.4,0]}><sphereGeometry args={[.12,10,10]}/><meshStandardMaterial color="#f7d477" emissive="#f7b943" emissiveIntensity={1.2}/></mesh>
  </group>;
}
function JourneyMarkers({onChoose}:{onChoose:(kind:'read'|'memorize')=>void}) {
  return <>
    {([{x:-4,z:1,title:'READ',kind:'read' as const,color:'#f3ce85'}, {x:4,z:-6,title:'MEMORIZE',kind:'memorize' as const,color:'#9de8d6'}]).map(item=><group key={item.kind} position={[item.x,0,item.z]}>
      <mesh position={[0,.7,0]} castShadow onClick={()=>onChoose(item.kind)}><cylinderGeometry args={[1,1.2,1.4,8]}/><meshStandardMaterial color="#d5c6a0"/></mesh>
      <mesh position={[0,1.55,0]} onClick={()=>onChoose(item.kind)}><octahedronGeometry args={[.65]}/><meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={.45}/></mesh>
      <Text position={[0,2.7,0]} fontSize={.45} color="#fff9d8" anchorX="center">{item.title}</Text>
    </group>)}
  </>;
}
function World({onNear,onEnter,onChoose}:{onNear:(v:boolean)=>void,onEnter:()=>void,onChoose:(kind:'read'|'memorize')=>void}) {:{onNear:(v:boolean)=>void,onEnter:()=>void}) {
  return <>
    <color attach="background" args={['#b7d9dd']}/><fog attach="fog" args={['#b7d9dd',22,85]}/>
    <ambientLight intensity={1.2}/><directionalLight position={[12,25,9]} intensity={2.4} castShadow shadow-mapSize={[1024,1024]}/>
    <Sky sunPosition={[5,7,-12]} turbidity={7}/>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[180,180]}/><meshStandardMaterial color="#73a47d"/></mesh>
    <mesh position={[0,.025,-3]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[4.5,35]}/><meshStandardMaterial color="#c9b795"/></mesh>
    <mesh position={[0,-.18,-32]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[20,64]}/><meshStandardMaterial color="#81b9a2"/></mesh>
    <Sparkles count={110} scale={[48,9,52]} position={[0,4,-4]} size={1.8} speed={.2} color="#f9eac3"/>
    <Shrine x={-8} z={-10}/><Shrine x={9} z={-17}/>
    {Array.from({length:24},(_,i)=>{const side=i%2?1:-1;return <Rock key={i} x={side*(5+i*11%17)} z={-23+i*17%47} s={.35+(i%5)*.14}/>})}
    {Array.from({length:22},(_,i)=>{const x=(i%2?1:-1)*(6+(i*7%17));const z=-21+(i*13%43);return <Tree key={i} x={x} z={z} s={.7+(i%4)*.16}/>})}
    <JourneyMarkers onChoose={onChoose}/><Portal onEnter={onEnter}/><Player onNear={onNear}/>
  </>;
}
function App(){
  useKeys();
  const [near,setNear]=useState(false);
  const [open,setOpen]=useState(false);
  const [journey,setJourney]=useState<'read'|'memorize'|null>(null);
  const [goal,setGoal]=useState(2);
  const [completed,setCompleted]=useState(0);
  const [day,setDay]=useState(()=>new Date().toLocaleDateString('en-CA'));
  useEffect(()=>{
    try { const saved=JSON.parse(localStorage.getItem('quran-world-progress')||'{}');
      if(saved.day===new Date().toLocaleDateString('en-CA')) setCompleted(Math.max(0,Number(saved.completed)||0));
      if(Number.isFinite(saved.goal)) setGoal(Math.min(20,Math.max(1,saved.goal)));
    } catch { /* Storage is optional. */ }
  },[]);
  useEffect(()=>{try{localStorage.setItem('quran-world-progress',JSON.stringify({day,goal,completed}));}catch{/* private browsing */}},[day,goal,completed]);
  const completePage=()=>{
    const today=new Date().toLocaleDateString('en-CA');
    if(today!==day){setDay(today);setCompleted(1);}else setCompleted(v=>Math.min(goal,v+1));
  };
  const mobile=(key:string,active:boolean)=>{if(active)held.add(key);else held.delete(key)};
  return <main><Canvas shadows camera={{position:[7,8,21],fov:55}}><World onNear={setNear} onEnter={()=>setOpen(true)} onChoose={setJourney}/></Canvas>
    <header><h1>عالم القرآن 3D</h1><p>وادي النور • الإصدار التجريبي 0.3</p></header>
    <aside>تحرّك بالأسهم أو WASD • اقترب من البوابة • اضغط على البلورات لاختيار رحلتك</aside>
    <button className="journey-open" onClick={()=>setJourney('read')}>📖 رحلتي القرآنية</button>
    {journey&&<section className="dialog journey-panel" dir="rtl" role="dialog" aria-modal="true" aria-label="رحلتي القرآنية">
      <button className="close" onClick={()=>setJourney(null)} aria-label="إغلاق">✕</button>
      <h2>{journey==='read'?'رحلة الختمة':'رحلة الحفظ'}</h2>
      <p>{journey==='read'?'حدد هدفك اليومي من صفحات المصحف، وسجّل إنجازك بعد القراءة.':'مسار الحفظ قيد التطوير. يمكنك الآن تجربة متابعة الصفحات التي تراجعها يوميًا.'}</p>
      <label htmlFor="daily-goal">الهدف اليومي (صفحات)</label>
      <select id="daily-goal" value={goal} onChange={e=>{setGoal(Number(e.target.value));setCompleted(v=>Math.min(v,Number(e.target.value)));}}>{[1,2,3,4,5,6,8,10,15,20].map(n=><option key={n} value={n}>{n} {n===1?'صفحة':'صفحات'}</option>)}</select>
      <div className="progress-track" role="progressbar" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={goal}><div style={{width:`${completed/goal*100}%`}}/></div>
      <p>أنجزت {completed} من {goal} صفحات اليوم {completed>=goal?'✨ أحسنت، حققت هدفك!':''}</p>
      <button onClick={completePage} disabled={completed>=goal&&day===new Date().toLocaleDateString('en-CA')}>✓ أنجزت صفحة</button>
      <small>يُحفظ التقدم على هذا الجهاز فقط، ولا يوجد حساب أو مزامنة بعد.</small>
    </section>}
    {near&&<button className="enter" onClick={()=>setOpen(true)}>دخول بوابة مدينة القرآن</button>}
    {open&&<section className="dialog"><h2>مدينة القرآن</h2><p>أحسنت الوصول إلى بوابة مدينة القرآن! هذه بداية الرحلة؛ في التحديثات القادمة ستُفتح مسارات الختمة والحفظ داخل المدينة.</p><button onClick={()=>setOpen(false)}>العودة إلى الوادي</button></section>}
    <nav className="pad" aria-label="أزرار الحركة">{[['↑','w'],['←','a'],['↓','s'],['→','d']].map(([label,key])=><button key={key} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);mobile(key,true)}} onPointerUp={()=>mobile(key,false)} onPointerCancel={()=>mobile(key,false)}>{label}</button>)}</nav>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
