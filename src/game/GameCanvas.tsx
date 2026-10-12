import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { useEffect, useRef } from 'react';
import type { GameConfig } from '../api/types';

type Props = { config: GameConfig; onHud: (hud: { health: number; score: number; remaining: number }) => void; onEnd: (result: { score: number; duration: number; reason: 'time' | 'hull' }) => void; paused: boolean; resetKey: number; onReady?: () => void; onAutoPause?: () => void; onShoot?: () => void };
type Actor = { x: number; y: number; angle: number; health: number; maxHealth: number; speed: number; kind: 'player' | 'chaser' | 'shooter'; cooldown: number; alive: boolean; sprite: Graphics; healthBar: Graphics };
type Shot = { x: number; y: number; vx: number; vy: number; life: number; owner: 'player' | 'enemy'; graphics: Graphics; damage: number };
const W = 960, H = 600;
const islands = [{ x: 230, y: 180, r: 66 }, { x: 700, y: 360, r: 78 }, { x: 520, y: 95, r: 36 }];
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const distance = (a: {x:number;y:number}, b: {x:number;y:number}) => Math.hypot(a.x - b.x, a.y - b.y);
function shipGraphic(color: number, scale = 1) { const g = new Graphics(); g.poly([0,-20, 12,-6, 10,13, 0,20, -10,13, -12,-6]).fill({ color, alpha: 0.98 }).stroke({ color: 0x142c32, width: 2 }); g.moveTo(0,-15).lineTo(0,12).stroke({ color: 0xffe9b0, width: 2 }); g.circle(0,0,3).fill(0xfff2c0); g.scale.set(scale); return g; }
export default function GameCanvas({ config, onHud, onEnd, paused, resetKey, onReady, onAutoPause, onShoot }: Props) {
  const host = useRef<HTMLDivElement>(null); const controls = useRef({ forward: false, left: false, right: false, front: false, port: false, starboard: false });
  const pausedRef = useRef(paused); pausedRef.current = paused; const onHudRef = useRef(onHud); onHudRef.current = onHud; const onEndRef = useRef(onEnd); onEndRef.current = onEnd; const onReadyRef = useRef(onReady); onReadyRef.current = onReady; const onAutoPauseRef = useRef(onAutoPause); onAutoPauseRef.current = onAutoPause; const onShootRef = useRef(onShoot); onShootRef.current = onShoot;
  useEffect(() => {
    let disposed = false; let app: Application | null = null; let appInitialized = false; let elapsed = 0; let spawnElapsed = 0; let score = 0; let health = 100; let lastHud = 0; let last = performance.now();
    const actors: Actor[] = []; const shots: Shot[] = []; const effects: { g: Graphics; t: number }[] = []; const keys = controls.current;
    const setup = async () => {
      app = new Application(); await app.init({ width: W, height: H, background: 0x0b5261, antialias: true, resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true });
      appInitialized = true;
      if (disposed || !host.current || !app) { app.destroy({removeView:true}, {children:true, texture:false, textureSource:false}); app = null; return; }
      app.canvas.setAttribute('aria-label', 'Pirate Battle game arena'); app.canvas.setAttribute('role', 'img'); app.canvas.style.width = '100%'; app.canvas.style.height = '100%'; app.canvas.style.maxWidth = '100%'; app.canvas.style.maxHeight = '100%'; app.canvas.style.position = 'absolute'; app.canvas.style.inset = '0'; app.canvas.style.display = 'block'; host.current.appendChild(app.canvas);
      const world = new Container(); app.stage.addChild(world);
      const ocean = new Graphics().rect(0,0,W,H).fill(0x0c5666); world.addChild(ocean);
      for (let y=0; y<H; y+=36) for (let x=0; x<W; x+=48) { const wave = new Graphics().moveTo(x+4,y+10).quadraticCurveTo(x+14,y+5,x+24,y+10).stroke({ color: 0x4a94a0, alpha: 0.22, width: 1.5 }); world.addChild(wave); }
      islands.forEach((island, i) => { const g = new Graphics(); g.circle(island.x, island.y, island.r+7).fill(0x133e3c); g.circle(island.x, island.y, island.r).fill(0xd4bc83).stroke({ color: 0x806b46, width: 5 }); g.circle(island.x-8, island.y-10, island.r*.72).fill(i===1?0x718a4a:0x829955); g.circle(island.x+18, island.y+12, island.r*.35).fill(0x587442); for(let j=0;j<5;j++) g.circle(island.x+Math.sin(j*2)*island.r*.35,island.y+Math.cos(j*3)*island.r*.28,4).fill(0x41663f); world.addChild(g); });
      const makeActor = (x:number,y:number,kind:Actor['kind']):Actor => { const g=shipGraphic(kind==='player'?0xf3d58b:kind==='chaser'?0xd75d49:0x9b8be8, kind==='player'?1.25:1); g.position.set(x,y); world.addChild(g); const bar=new Graphics(); world.addChild(bar); const a:Actor={x,y,angle:0,health:kind==='player'?100:kind==='chaser'?35:28,maxHealth:kind==='player'?100:kind==='chaser'?35:28,speed:kind==='player'?175:kind==='chaser'?78:65,kind,cooldown:0,alive:true,sprite:g,healthBar:bar}; actors.push(a); return a; };
      const player=makeActor(W/2,H/2,'player');
      const labels = new Text({ text:'', style:new TextStyle({fontFamily:'Arial',fontSize:12,fill:0xffffff,stroke:{color:0x102e33,width:3}}) }); labels.position.set(12,12); world.addChild(labels);
      const healthBar=(a:Actor)=> { const g=new Graphics(); g.roundRect(a.x-18,a.y-31,36,5,2).fill(0x183d40); g.roundRect(a.x-18,a.y-31,36*Math.max(0,a.health/a.maxHealth),5,2).fill(a.health/a.maxHealth>.35?0x7dd57d:0xef655c); world.addChild(g); return g; };
      const collidesIsland=(x:number,y:number,r=13)=> islands.some(i=>Math.hypot(x-i.x,y-i.y)<i.r+r);
      const addShot=(x:number,y:number,angle:number,owner:'player'|'enemy',damage=12)=> { const g=new Graphics().circle(0,0,owner==='player'?4:3.5).fill(owner==='player'?0xffe8a3:0xff795d).stroke({color:0x4b3025,width:1}); g.position.set(x,y); world.addChild(g); const speed=owner==='player'?360:230; shots.push({x,y,vx:Math.sin(angle)*speed,vy:-Math.cos(angle)*speed,life:1.7,owner,graphics:g,damage}); };
      const explode=(x:number,y:number)=> { const g=new Graphics().circle(x,y,8).fill({color:0xffb34f,alpha:.7}).stroke({color:0xffe0a3,width:3}); world.addChild(g); effects.push({g,t:.35}); };
      const spawn=()=> { let x=40+Math.random()*(W-80),y=40+Math.random()*(H-80),attempts=0; while((distance({x,y},player)<175||collidesIsland(x,y,30))&&attempts++<30){x=40+Math.random()*(W-80);y=40+Math.random()*(H-80);} makeActor(x,y,Math.random()<.56?'chaser':'shooter'); };
      const onKeyDown=(e:KeyboardEvent)=>{ const k=e.key.toLowerCase(); if(['arrowup','arrowleft','arrowright',' ','q','e','w','a','d'].includes(k)) e.preventDefault(); if(k==='w'||k==='arrowup') keys.forward=true; if(k==='a'||k==='arrowleft') keys.left=true; if(k==='d'||k==='arrowright') keys.right=true; if(k===' ') keys.front=true; if(k==='q') keys.port=true; if(k==='e') keys.starboard=true; };
      const onKeyUp=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(k==='w'||k==='arrowup')keys.forward=false;if(k==='a'||k==='arrowleft')keys.left=false;if(k==='d'||k==='arrowright')keys.right=false;if(k===' ')keys.front=false;if(k==='q')keys.port=false;if(k==='e')keys.starboard=false;};
      const resetKeys=()=>Object.keys(keys).forEach(k=>((keys as unknown as Record<string,boolean>)[k]=false));
      window.addEventListener('keydown',onKeyDown); window.addEventListener('keyup',onKeyUp);
      const onVisibility=()=>{if(document.hidden){pausedRef.current=true;resetKeys();onAutoPauseRef.current?.();}}; document.addEventListener('visibilitychange',onVisibility);
      const update=(ticker:any)=>{ const now=performance.now(); const dt=Math.min((now-last)/1000,.04); last=now; if(disposed||pausedRef.current)return; elapsed+=dt; spawnElapsed+=dt; player.cooldown=Math.max(0,player.cooldown-dt);
        if(keys.left)player.angle-=2.65*dt;if(keys.right)player.angle+=2.65*dt;
        if(keys.forward){const nx=player.x+Math.sin(player.angle)*player.speed*dt,ny=player.y-Math.cos(player.angle)*player.speed*dt;if(nx>18&&nx<W-18&&ny>18&&ny<H-18&&!collidesIsland(nx,ny,17)){player.x=nx;player.y=ny;}}
        if((keys.front||keys.port||keys.starboard)&&player.cooldown<=0){onShootRef.current?.();if(keys.front)addShot(player.x+Math.sin(player.angle)*22,player.y-Math.cos(player.angle)*22,player.angle,'player',18);if(keys.port||keys.starboard){const side=keys.port?-1:1;const a=player.angle+side*Math.PI/2;for(let n=-1;n<=1;n++)addShot(player.x+Math.sin(a)*19+Math.sin(player.angle)*n*8,player.y-Math.cos(a)*19-Math.cos(player.angle)*n*8,a,'player',11);}player.cooldown=.34;}
        if(spawnElapsed>=Math.max(1,config.spawnTime)){spawnElapsed=0; if(actors.filter(a=>a.alive&&a.kind!=='player').length<14)spawn();}
        for(const a of actors){if(!a.alive||a.kind==='player')continue; a.cooldown=Math.max(0,a.cooldown-dt);const ang=Math.atan2(player.x-a.x,-(player.y-a.y));a.angle=ang;const d=distance(a,player);if(a.kind==='chaser'||d>180){const nx=a.x+Math.sin(ang)*a.speed*dt,ny=a.y-Math.cos(ang)*a.speed*dt;if(!collidesIsland(nx,ny,14)){a.x=nx;a.y=ny;}}else if(d<310&&a.cooldown<=0){addShot(a.x+Math.sin(ang)*18,a.y-Math.cos(ang)*18,ang,'enemy',9);a.cooldown=1.4;} if(d<25){health=Math.max(0,health-(a.kind==='chaser'?28:12));if(a.kind==='chaser'){a.alive=false;a.sprite.visible=false;explode(a.x,a.y);}else a.x-=Math.sin(ang)*30;}}
        for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;s.graphics.position.set(s.x,s.y);let remove=s.life<=0||s.x<0||s.x>W||s.y<0||s.y>H||collidesIsland(s.x,s.y,4);if(!remove&&s.owner==='player'){for(const a of actors){if(a.alive&&a.kind!=='player'&&distance(s,a)<17){a.health-=s.damage;remove=true;if(a.health<=0){a.alive=false;a.sprite.visible=false;score++;explode(a.x,a.y);}break;}}}else if(!remove&&s.owner==='enemy'&&distance(s,player)<18){health=Math.max(0,health-s.damage);remove=true;}if(remove){s.graphics.destroy();shots.splice(i,1);}}
        for(const a of actors){if(!a.alive){a.healthBar.visible=false;continue;}if(a.kind==='player')a.health=health;a.sprite.position.set(a.x,a.y);a.sprite.rotation=a.angle;a.healthBar.clear();a.healthBar.roundRect(a.x-18,a.y-31,36,5,2).fill(0x183d40);a.healthBar.roundRect(a.x-18,a.y-31,36*Math.max(0,a.health/a.maxHealth),5,2).fill(a.health/a.maxHealth>.35?0x7dd57d:0xef655c);}
        for(const e of effects){e.t-=dt;e.g.alpha=Math.max(0,e.t/.35);e.g.scale.set(1+(1-e.t/.35)*2);}for(let i=effects.length-1;i>=0;i--)if(effects[i].t<=0){effects[i].g.destroy();effects.splice(i,1);}
        for(const child of [...world.children])if(child instanceof Graphics && child!==ocean && !actors.some(a=>a.sprite===child)&&!shots.some(s=>s.graphics===child)&&!effects.some(e=>e.g===child)){/* decorative world geometry */}
        const left=Math.max(0,config.sessionTime-elapsed);labels.text=`SCORE ${score}     HULL ${health}%     TIME ${Math.ceil(left)}s`;if(now-lastHud>100){lastHud=now;onHudRef.current({health,score,remaining:left});}
        if(left<=0||health<=0){app?.ticker.remove(update);window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);document.removeEventListener('visibilitychange',onVisibility);resetKeys();onEndRef.current({score,duration:Math.min(config.sessionTime,Math.round(elapsed)),reason:health<=0?'hull':'time'});}
      };
      app.ticker.add(update); onReadyRef.current?.();
      const resize=()=>{ if(!app||!host.current)return; const width=Math.max(1,host.current.clientWidth); const height=Math.max(1,host.current.clientHeight); app.renderer.resize(width,height); world.scale.set(width/W,height/H); world.position.set(0,0); };
      const observer=new ResizeObserver(resize);observer.observe(host.current);resize();
      return ()=>{observer.disconnect();window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);document.removeEventListener('visibilitychange',onVisibility);};
    };
    let cleanup:(()=>void)|undefined;
    let fallbackCleanup:(()=>void)|undefined;

    // Keep the game playable even on browsers/devices where WebGL initialization fails.
    const startCanvasFallback = () => {
      const container = host.current;
      if (!container || disposed) return;
      container.replaceChildren();
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      canvas.setAttribute('aria-label', 'Pirate Battle game arena');
      canvas.setAttribute('role', 'img');
      canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.maxWidth = '100%'; canvas.style.maxHeight = '100%'; canvas.style.position = 'absolute'; canvas.style.inset = '0'; canvas.style.display = 'block';
      container.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      if (!ctx) { container.textContent = 'Unable to start the game canvas. Please try another browser.'; return; }
      let active = true; let frame = 0; let prev = performance.now(); let gameTime = 0; let spawnTime = 0; let fallbackScore = 0; let fallbackHealth = 100; let ended = false; let lastHudUpdate = 0;
      const fallbackPlayer = { x: W/2, y: H/2, angle: 0, cooldown: 0 };
      const enemies: {x:number;y:number;health:number;kind:'chaser'|'shooter';cooldown:number}[] = [];
      const fallbackShots: {x:number;y:number;vx:number;vy:number;life:number;owner:'player'|'enemy'}[] = [];
      const drawShip = (x:number,y:number,angle:number,color:string,scale=1) => { ctx.save(); ctx.translate(x,y); ctx.rotate(angle); ctx.scale(scale,scale); ctx.fillStyle=color; ctx.strokeStyle='#17343a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,-20);ctx.lineTo(12,-6);ctx.lineTo(10,13);ctx.lineTo(0,20);ctx.lineTo(-10,13);ctx.lineTo(-12,-6);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#fff0bf';ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(0,11);ctx.stroke();ctx.restore(); };
      const draw = (dt:number) => {
        ctx.fillStyle='#0c5666';ctx.fillRect(0,0,W,H);
        ctx.strokeStyle='rgba(112,190,194,.22)';ctx.lineWidth=1;
        for(let y=18;y<H;y+=36){ctx.beginPath();for(let x=8;x<W;x+=48){ctx.moveTo(x,y);ctx.quadraticCurveTo(x+10,y-5,x+22,y);}ctx.stroke();}
        for(const island of islands){ctx.fillStyle='#133e3c';ctx.beginPath();ctx.arc(island.x,island.y,island.r+7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d4bc83';ctx.strokeStyle='#806b46';ctx.lineWidth=5;ctx.beginPath();ctx.arc(island.x,island.y,island.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#829955';ctx.beginPath();ctx.arc(island.x-8,island.y-10,island.r*.72,0,Math.PI*2);ctx.fill();}
        const dtSafe=Math.min(dt,.04); gameTime+=dtSafe; spawnTime+=dtSafe; fallbackPlayer.cooldown=Math.max(0,fallbackPlayer.cooldown-dtSafe);
        if(keys.left)fallbackPlayer.angle-=2.65*dtSafe;if(keys.right)fallbackPlayer.angle+=2.65*dtSafe;
        if(keys.forward){const nx=fallbackPlayer.x+Math.sin(fallbackPlayer.angle)*175*dtSafe,ny=fallbackPlayer.y-Math.cos(fallbackPlayer.angle)*175*dtSafe;if(nx>18&&nx<W-18&&ny>18&&ny<H-18&&!islands.some(i=>Math.hypot(nx-i.x,ny-i.y)<i.r+17)){fallbackPlayer.x=nx;fallbackPlayer.y=ny;}}
        if((keys.front||keys.port||keys.starboard)&&fallbackPlayer.cooldown<=0){onShootRef.current?.();const fire=(a:number)=>fallbackShots.push({x:fallbackPlayer.x+Math.sin(a)*22,y:fallbackPlayer.y-Math.cos(a)*22,vx:Math.sin(a)*360,vy:-Math.cos(a)*360,life:1.7,owner:'player'});if(keys.front)fire(fallbackPlayer.angle);if(keys.port)fire(fallbackPlayer.angle-Math.PI/2);if(keys.starboard)fire(fallbackPlayer.angle+Math.PI/2);fallbackPlayer.cooldown=.34;}
        if(spawnTime>=Math.max(1,config.spawnTime)&&enemies.length<14){spawnTime=0;let x=45+Math.random()*(W-90),y=45+Math.random()*(H-90);if(Math.hypot(x-fallbackPlayer.x,y-fallbackPlayer.y)<160){x=70;y=70;}enemies.push({x,y,health:35,kind:Math.random()<.6?'chaser':'shooter',cooldown:1});}
        for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];const dx=fallbackPlayer.x-e.x,dy=fallbackPlayer.y-e.y,d=Math.hypot(dx,dy)||1,a=Math.atan2(dx,-dy);e.cooldown-=dtSafe;if(e.kind==='chaser'||d>180){if(!islands.some(is=>Math.hypot(e.x+Math.sin(a)*78*dtSafe-is.x,e.y-Math.cos(a)*78*dtSafe-is.y)<is.r+14)){e.x+=Math.sin(a)*(e.kind==='chaser'?78:65)*dtSafe;e.y-=Math.cos(a)*(e.kind==='chaser'?78:65)*dtSafe;}}else if(d<310&&e.cooldown<=0){fallbackShots.push({x:e.x+Math.sin(a)*18,y:e.y-Math.cos(a)*18,vx:Math.sin(a)*230,vy:-Math.cos(a)*230,life:1.7,owner:'enemy'});e.cooldown=1.4;}if(d<25){fallbackHealth=Math.max(0,fallbackHealth-(e.kind==='chaser'?28:12));if(e.kind==='chaser')enemies.splice(i,1);}}
        for(let i=fallbackShots.length-1;i>=0;i--){const b=fallbackShots[i];b.x+=b.vx*dtSafe;b.y+=b.vy*dtSafe;b.life-=dtSafe;let remove=b.life<=0||b.x<0||b.x>W||b.y<0||b.y>H||islands.some(is=>Math.hypot(b.x-is.x,b.y-is.y)<is.r);if(!remove&&b.owner==='player'){const index=enemies.findIndex(e=>Math.hypot(b.x-e.x,b.y-e.y)<17);if(index>=0){enemies[index].health-=18;remove=true;if(enemies[index].health<=0){enemies.splice(index,1);fallbackScore++;}}}else if(!remove&&b.owner==='enemy'&&Math.hypot(b.x-fallbackPlayer.x,b.y-fallbackPlayer.y)<18){fallbackHealth=Math.max(0,fallbackHealth-9);remove=true;}if(remove)fallbackShots.splice(i,1);}
        drawShip(fallbackPlayer.x,fallbackPlayer.y,fallbackPlayer.angle,'#f3d58b',1.25);
        for(const e of enemies){drawShip(e.x,e.y,Math.atan2(fallbackPlayer.x-e.x,-(fallbackPlayer.y-e.y)),e.kind==='chaser'?'#d75d49':'#9b8be8');ctx.fillStyle='#183d40';ctx.fillRect(e.x-18,e.y-31,36,5);ctx.fillStyle='#7dd57d';ctx.fillRect(e.x-18,e.y-31,36*Math.max(0,e.health/35),5);}
        for(const b of fallbackShots){ctx.fillStyle=b.owner==='player'?'#ffe8a3':'#ff795d';ctx.beginPath();ctx.arc(b.x,b.y,4,0,Math.PI*2);ctx.fill();}
        ctx.fillStyle='#fff';ctx.font='bold 14px Arial';ctx.fillText(`SCORE ${fallbackScore}     HULL ${fallbackHealth}%     TIME ${Math.ceil(Math.max(0,config.sessionTime-gameTime))}s`,14,24);
        const remaining=Math.max(0,config.sessionTime-gameTime);if(performance.now()-lastHudUpdate>100){lastHudUpdate=performance.now();onHudRef.current({health:fallbackHealth,score:fallbackScore,remaining});}
        if(!ended&&(remaining<=0||fallbackHealth<=0)){ended=true;active=false;onEndRef.current({score:fallbackScore,duration:Math.min(config.sessionTime,Math.round(gameTime)),reason:fallbackHealth<=0?'hull':'time'});}
      };
      const loop=(now:number)=>{if(!active||disposed)return;const dt=(now-prev)/1000;prev=now;if(!pausedRef.current)draw(dt);frame=requestAnimationFrame(loop);};
      const onKeyDown=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(['arrowup','arrowleft','arrowright',' ','q','e','w','a','d'].includes(k))e.preventDefault();if(k==='w'||k==='arrowup')keys.forward=true;if(k==='a'||k==='arrowleft')keys.left=true;if(k==='d'||k==='arrowright')keys.right=true;if(k===' ')keys.front=true;if(k==='q')keys.port=true;if(k==='e')keys.starboard=true;};
      const onKeyUp=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(k==='w'||k==='arrowup')keys.forward=false;if(k==='a'||k==='arrowleft')keys.left=false;if(k==='d'||k==='arrowright')keys.right=false;if(k===' ')keys.front=false;if(k==='q')keys.port=false;if(k==='e')keys.starboard=false;};
      const onVisibility=()=>{if(document.hidden){pausedRef.current=true;Object.keys(keys).forEach(k=>((keys as unknown as Record<string,boolean>)[k]=false));onAutoPauseRef.current?.();}};
      window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);document.addEventListener('visibilitychange',onVisibility);
      onReadyRef.current?.();frame=requestAnimationFrame(loop);
      return ()=>{active=false;cancelAnimationFrame(frame);window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);document.removeEventListener('visibilitychange',onVisibility);canvas.remove();};
    };
    void setup().then(fn=>{cleanup=fn;}).catch(error=>{console.error('PixiJS could not initialize; using Canvas fallback.',error);if(app&&appInitialized){try{app.destroy({removeView:true}, {children:true, texture:false, textureSource:false});}catch{/* ignore partial initialization cleanup */}app=null;}if(!disposed)fallbackCleanup=startCanvasFallback();});
    return ()=>{disposed=true;cleanup?.();fallbackCleanup?.();if(app&&appInitialized){try{app.destroy({removeView:true}, {children:true, texture:false, textureSource:false});}catch{/* ignore cleanup after failed initialization */}app=null;}actors.splice(0).forEach(a=>a.sprite.destroy());shots.splice(0).forEach(s=>s.graphics.destroy());effects.splice(0).forEach(e=>e.g.destroy());};
  }, [config.sessionTime, config.spawnTime, resetKey]);
  const set=(key:keyof typeof controls.current,value:boolean)=>{controls.current[key]=value;};
  return <div className="game-canvas-shell"><div className="game-canvas" ref={host}/><div className="touch-controls" aria-label="Touch game controls"><div className="touch-group"><button onPointerDown={()=>set('left',true)} onPointerUp={()=>set('left',false)} onPointerLeave={()=>set('left',false)} aria-label="Turn left">↶</button><button onPointerDown={()=>set('forward',true)} onPointerUp={()=>set('forward',false)} onPointerLeave={()=>set('forward',false)} aria-label="Move forward">↑</button><button onPointerDown={()=>set('right',true)} onPointerUp={()=>set('right',false)} onPointerLeave={()=>set('right',false)} aria-label="Turn right">↷</button></div><div className="touch-group"><button onPointerDown={()=>set('port',true)} onPointerUp={()=>set('port',false)} onPointerLeave={()=>set('port',false)} aria-label="Fire left">◀ Fire</button><button onPointerDown={()=>set('front',true)} onPointerUp={()=>set('front',false)} onPointerLeave={()=>set('front',false)} aria-label="Fire forward">Fire ↑</button><button onPointerDown={()=>set('starboard',true)} onPointerUp={()=>set('starboard',false)} onPointerLeave={()=>set('starboard',false)} aria-label="Fire right">Fire ▶</button></div></div></div>;
}
