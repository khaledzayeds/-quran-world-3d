import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, OrbitControls, Text, Float } from '@react-three/drei';
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
    <mesh position={[0,3,0]}><circleGeometry args={[2.1,48]}/><meshBasicMaterial color="#50bba6" transparent opacity={.22} side={THREE.DoubleSide}/></mesh>
    <Text position={[0,6.4,0]} fontSize={.65} color="#fff3c9" anchorX="center">QURAN CITY</Text>
    <mesh position={[0,.35,0]} onClick={onEnter}><boxGeometry args={[4.5,.7,1.2]}/><meshStandardMaterial color="#bda47a"/></mesh>
  </group>;
}
function Player({onNear}:{onNear:(v:boolean)=>void}) {
  const ref=useRef<THREE.Group>(null);
  const near=useRef(false);
  useFrame((_,dt)=>{
    const p=ref.current;if(!p)return;
    const dx=Number(held.has('d')||held.has('arrowright'))-Number(held.has('a')||held.has('arrowleft'));
    const dz=Number(held.has('s')||held.has('arrowdown'))-Number(held.has('w')||held.has('arrowup'));
    const len=Math.hypot(dx,dz)||1;const speed=held.has('shift')?7:4;
    p.position.x=THREE.MathUtils.clamp(p.position.x+dx/len*speed*dt,-24,24);
    p.position.z=THREE.MathUtils.clamp(p.position.z+dz/len*speed*dt,-22,22);
    if(dx||dz)p.rotation.y=Math.atan2(-dx,-dz);
    const n=Math.hypot(p.position.x,p.position.z+14)<4;
    if(n!==near.current){near.current=n;onNear(n);}
  });
  return <group ref={ref} position={[0,0,9]}>
    <mesh position={[0,1.35,0]} castShadow><capsuleGeometry args={[.42,1.2,6,12]}/><meshStandardMaterial color="#e7e1cc"/></mesh>
    <mesh position={[0,2.5,0]} castShadow><sphereGeometry args={[.42,16,12]}/><meshStandardMaterial color="#cba07c"/></mesh>
    <mesh position={[0,.45,-.19]} castShadow><boxGeometry args={[.25,.9,.35]}/><meshStandardMaterial color="#243e4a"/></mesh>
    <mesh position={[0,.45,.19]} castShadow><boxGeometry args={[.25,.9,.35]}/><meshStandardMaterial color="#243e4a"/></mesh>
  </group>;
}
function World({onNear,onEnter}:{onNear:(v:boolean)=>void,onEnter:()=>void}) {
  return <>
    <color attach="background" args={['#b7d9dd']}/><fog attach="fog" args={['#b7d9dd',22,85]}/>
    <ambientLight intensity={1.2}/><directionalLight position={[12,25,9]} intensity={2.4} castShadow shadow-mapSize={[1024,1024]}/>
    <Sky sunPosition={[5,7,-12]} turbidity={7}/>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[180,180]}/><meshStandardMaterial color="#73a47d"/></mesh>
    <mesh position={[0,.025,-3]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[4.5,35]}/><meshStandardMaterial color="#c9b795"/></mesh>
    {Array.from({length:22},(_,i)=>{const x=(i%2?1:-1)*(6+(i*7%17));const z=-21+(i*13%43);return <Tree key={i} x={x} z={z} s={.7+(i%4)*.16}/>})}
    <Portal onEnter={onEnter}/><Player onNear={onNear}/>
    <OrbitControls makeDefault target={[0,1,0]} enablePan={false} minDistance={7} maxDistance={24} maxPolarAngle={Math.PI/2.1}/>
  </>;
}
function App(){
  useKeys();
  const [near,setNear]=useState(false);
  const [open,setOpen]=useState(false);
  const mobile=(key:string,active:boolean)=>{if(active)held.add(key);else held.delete(key)};
  return <main><Canvas shadows camera={{position:[9,10,21],fov:55}}><World onNear={setNear} onEnter={()=>setOpen(true)}/></Canvas>
    <header><h1>عالم القرآن 3D</h1><p>وادي البداية • الإصدار التجريبي 0.1</p></header>
    <aside>تحرّك بالأسهم أو WASD • اسحب لتدوير الكاميرا • Shift للجري</aside>
    {near&&<button className="enter" onClick={()=>setOpen(true)}>دخول بوابة مدينة القرآن</button>}
    {open&&<section className="dialog"><h2>مدينة القرآن</h2><p>وصلت إلى البوابة! ستُفتح المدينة في المرحلة القادمة بإذن الله.</p><button onClick={()=>setOpen(false)}>العودة إلى الوادي</button></section>}
    <nav className="pad" aria-label="أزرار الحركة">{[['↑','w'],['←','a'],['↓','s'],['→','d']].map(([label,key])=><button key={key} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);mobile(key,true)}} onPointerUp={()=>mobile(key,false)} onPointerCancel={()=>mobile(key,false)}>{label}</button>)}</nav>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
