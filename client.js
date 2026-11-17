const townBg=new Image();townBg.src='/longwy-bg.jpg';const mayorFull=new Image();mayorFull.src='/maire-full.png';const mayorFace=new Image();mayorFace.src='/maire-face.jpg';const c=document.getElementById('game'),g=c.getContext('2d'),overlay=document.getElementById('overlay'),start=document.getElementById('start'),status=document.getElementById('status');let runStartedAt=0,runElapsed=0,personalBest=Number(localStorage.getItem('grandLongwyBestMs'))||0;let active=false,won=false,frame=0,score=0,stage=0,player,enemies=[],sparks=[],keys={},shake=0,audio=null,musicTimer=0;const W=960,H=540;
const scenes=[
{name:'COUR DE L’HÔTEL-DIEU',photo:'hotel-wide.jpg',enemy:'AGENT ARS',faction:'ARS GRAND EST',intro:'Votre dossier est en cours de traitement !',color:'#42b5f7'},
{name:'ENTRÉE DE L’HÔTEL-DIEU',photo:'hotel-facade.jpg',enemy:'LE TAMPONNEUR',faction:'ARS GRAND EST',intro:'Il manque encore trois signatures !',color:'#42b5f7'},
{name:'ACCÈS AUX URGENCES',photo:'emergency-drive.jpg',enemy:'LE REPORTATOR',faction:'ARS GRAND EST',intro:'Rendez-vous au prochain trimestre !',color:'#42b5f7'},
{name:'PORTE DES URGENCES',photo:'emergency-entry.jpg',enemy:'LE CONTRÔLEUR',faction:'GROUPE SOS SANTÉ',intro:'J’ai recalculé le budget !',color:'#ff7474'},
{name:'COULOIR DE L’HÔPITAL',photo:'hospital-corridor.jpg',enemy:'LE COMPTABLE',faction:'GROUPE SOS SANTÉ',intro:'Une colonne Excel peut tout régler !',color:'#ff7474'},
{name:'ENTRÉE DE LA MATERNITÉ',photo:'maternity.jpg',enemy:'LE GRAND OPTIMISATEUR',faction:'GROUPE SOS SANTÉ',intro:'Vous n’avez pas rempli le formulaire final !',color:'#ff7474'}];
const villainARS=new Image();villainARS.src='/villain-ars.png';const villainSOS=new Image();villainSOS.src='/villain-sos.png';const villainVariants=['villain-ars.png','villain-ars-2.png','villain-ars-3.png','villain-sos.png','villain-sos-2.png','villain-sos-3.png'].map(src=>{const i=new Image();i.src='/'+src;return i});const photos=scenes.map(s=>{const im=new Image();im.src='/'+s.photo;return im});let intro=0;
function tone(freq,duration,type='triangle',volume=.045){try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),v=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(35,freq*.65),audio.currentTime+duration);v.gain.setValueAtTime(volume,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(v);v.connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}catch(e){}}
function formatRun(ms){const t=Math.floor(ms/1000);return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')}
function reset(){runStartedAt=performance.now();runElapsed=0;frame=0;score=0;stage=0;won=false;intro=275;player={x:130,y:420,hp:100,face:1,attack:0,kind:0,inv:0};spawn();active=true;overlay.style.display='none';tone(440,.2);status.textContent='Bats tous les ennemis pour avancer !';}
function spawn(){const s=scenes[stage];enemies=[{x:735,y:420,hp:stage===5?36:stage>=3?26:20,max:stage===5?36:stage>=3?26:20,cool:0,stun:0,face:-1,attack:0,kind:0,damageDone:false}];sparks=[];intro=275;}
start.addEventListener('click',reset);
for(const b of document.querySelectorAll('[data-key]')){const k=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true;b.classList.add('down');b.setPointerCapture(e.pointerId);if(k==='punch'||k==='kick')hit(k);});for(const t of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(t,()=>{keys[k]=false;b.classList.remove('down')});}
document.addEventListener('keydown',e=>{const k=({ArrowLeft:'left',ArrowRight:'right',' ':'punch',x:'kick'})[e.key];if(k){e.preventDefault();if(!keys[k]&&(k==='punch'||k==='kick'))hit(k);keys[k]=true}});document.addEventListener('keyup',e=>{const k=({ArrowLeft:'left',ArrowRight:'right',' ':'punch',x:'kick'})[e.key];if(k)keys[k]=false});
function hit(kind){if(!active||intro>0||player.attack>0)return;player.attack=kind==='kick'?24:24;player.kind=kind==='kick'?2:1;tone(kind==='kick'?165:240,.09,'sawtooth',.03);let range=kind==='kick'?125:270;for(const e of enemies){if(e.hp>0&&Math.abs(e.x-player.x)<range&&Math.sign(e.x-player.x)===player.face){e.hp=Math.max(0,e.hp-(kind==='kick'?3:2));e.stun=12;e.x+=player.face*9;shake=8;tone(e.hp<=0?95:115,.17,'square',.045);score+=e.hp<=0?100:15;sparks.push({x:e.x,y:e.y-95,t:22});}}}
function rect(x,y,w,h,color){g.fillStyle=color;g.fillRect(x,y,w,h)}
function text(t,x,y,size=24,color='#fff',align='left'){g.fillStyle=color;g.textAlign=align;g.font='900 '+size+'px system-ui';g.fillText(t,x,y)}
function person(x,y,hero,boss=false,face=1,attack=0){
const im=hero?mayorFull:villainVariants[stage];
g.save();g.translate(x,y);g.scale(hero?face:-face,1);
g.fillStyle='#0008';g.beginPath();g.ellipse(0,0,41,9,0,0,Math.PI*2);g.fill();
if(im.complete&&im.naturalWidth){
const iw=im.naturalWidth,ih=im.naturalHeight,dh=226,dw=iw/ih*dh;
const moving=hero&&(keys.left||keys.right),stride=moving?Math.sin(frame*.29):0;
const kicking=attack===2,punching=attack===1;
const top=ih*.70,legH=ih-top,split=iw*.5;
const renderPart=(sx,sw,dx,rot)=>{
g.save();g.translate(dx,-dh*(1-top/ih));g.rotate(rot);
g.drawImage(im,sx,top,sw,legH,-dw/2+(sx/iw)*dw,0,sw/iw*dw,legH/ih*dh);g.restore();};
renderPart(0,split,0,kicking?-.02:stride*.17);
renderPart(split,iw-split,0,kicking?-1.12:-stride*.17);
g.save();g.translate(0,-dh*(1-top/ih));g.drawImage(im,0,0,iw,top,-dw/2,-dh*top/ih,dw,dh*top/ih);g.restore();
if(hero){
// Permanent water pistol in the mayor's forward hand. Its barrel always points
// along local +X; the character's facing transform flips it toward the enemy.
const gunX=dw*.21,gunY=-dh*.67;
g.save();g.translate(gunX,gunY);
g.lineJoin='round';g.lineCap='round';
g.fillStyle='#0e3c5c';g.strokeStyle='#102337';g.lineWidth=3;
g.beginPath();g.moveTo(-12,-10);g.lineTo(31,-10);g.lineTo(31,2);g.lineTo(9,4);g.lineTo(2,27);g.lineTo(-11,24);g.lineTo(-6,3);g.lineTo(-12,3);g.closePath();g.fill();g.stroke();
g.fillStyle='#1ab4e5';g.fillRect(-7,-15,39,11);
g.fillStyle='#ffe35e';g.fillRect(27,-12,19,7);
g.fillStyle='#50e0ff';g.beginPath();g.ellipse(0,-2,8,7,0,0,Math.PI*2);g.fill();
g.fillStyle='#d5a280';g.beginPath();g.ellipse(-9,13,9,7,-.3,0,Math.PI*2);g.fill();
if(punching){
 const t=(24-player.attack)/24;
 if(t>.12&&t<.83){
  const travel=(t-.12)/.71;
  g.strokeStyle='#65dcff';g.lineWidth=5;g.globalAlpha=.9;
  g.beginPath();g.moveTo(46,-8);g.lineTo(46+180*travel,-8);g.stroke();
  g.fillStyle='#a8efff';
  for(let i=0;i<5;i++){g.beginPath();g.arc(49+travel*(24+i*30),-8+Math.sin(frame*.7+i)*5,3+i%2,0,Math.PI*2);g.fill();}
 }
}
g.restore();
}
if(!hero&&punching){
// Enemy attacks use their photographic forearm, never the mayor's water pistol.
const t=Math.max(0,Math.min(1,(24-attack)/24));
const thrust=Math.sin(Math.PI*t);
const sx=Math.floor(iw*.56),sy=Math.floor(ih*.26),sw=Math.floor(iw*.39),sh=Math.floor(ih*.34);
g.save();g.translate(dw*.17,-dh*.70);g.rotate(-1.2*thrust);
g.drawImage(im,sx,sy,sw,sh,-7,-3,sw/iw*dw,sh/ih*dh);g.restore();
}
if(kicking){g.strokeStyle='#ffe2aa';g.lineWidth=5;g.beginPath();g.arc(72,-73,35,-1.6,1.2);g.stroke();}
}else{g.fillStyle='#4c5362';g.beginPath();g.ellipse(0,-110,34,102,0,0,Math.PI*2);g.fill();}
g.restore();
}
function draw(){const s=scenes[stage];g.save();if(shake>0){g.translate(Math.sin(frame*2.7)*shake,Math.cos(frame*2.1)*shake*.4);shake*=.78;if(shake<.3)shake=0;}
rect(0,0,W,H,'#192339');const photo=photos[stage];if(photo.complete&&photo.naturalWidth){const scale=Math.max(W/photo.width,H/photo.height),w=photo.width*scale,h=photo.height*scale;g.drawImage(photo,(W-w)/2,(H-h)/2,w,h);}
rect(0,0,W,H,'#08132448');rect(0,382,W,158,'#0b142455');rect(0,385,W,5,'#e6c36e88');
text(s.name,25,40,22,'#fff4b9');rect(20,55,250,23,'#1b1e32');rect(20,55,Math.max(0,player.hp)*2.5,23,player.hp>30?'#60d98c':'#f85c68');text('VIE',25,73,15);text('SCORE '+score,935,37,22,'#ffdc69','right');text('TEMPS '+formatRun(active?performance.now()-runStartedAt:runElapsed),935,103,19,'#ffdc69','right');text('NIVEAU '+(stage+1)+'/'+scenes.length,935,70,18,'#fff','right');
for(const e of enemies)if(e.hp>0){person(e.x,e.y,false,stage===5,e.face,e.attack>0?e.kind:0);rect(e.x-49,e.y-244,98,10,'#1b1720');rect(e.x-49,e.y-244,98*e.hp/e.max,10,s.color);text(Math.ceil(100*e.hp/e.max)+'%',e.x,e.y-229,12,'#fff','center');text(s.enemy,e.x,e.y-254,14,'#fff','center');}
person(player.x,player.y,true,false,player.face,player.attack>0?player.kind:0);text('LE MAIRE',player.x,player.y-239,15,'#ffe08c','center');
for(const a of sparks){text('💥',a.x,a.y,36);a.y-=2;a.t--}sparks=sparks.filter(a=>a.t>0);
if(intro>0){rect(0,95,W,158,'#07101eea');text('NOUVEL ADVERSAIRE · '+s.faction,W/2,129,22,s.color,'center');text(s.enemy,W/2,172,35,'#fff','center');text('« '+s.intro+' »',W/2,213,19,'#ffe3b2','center');}
g.restore();}
function finish(v){runElapsed=performance.now()-runStartedAt;if(v&&(!personalBest||runElapsed<personalBest)){personalBest=runElapsed;localStorage.setItem('grandLongwyBestMs',String(Math.round(personalBest)))}active=false;won=v;overlay.style.display='flex';overlay.querySelector('h1').innerHTML=v?'VICTOIRE !':'GAME OVER';overlay.querySelector('p').textContent=v?'Victoire en '+formatRun(runElapsed)+' ! Record personnel : '+formatRun(personalBest)+' · ICI NOUS SACHONS !':'Le maire est KO après '+formatRun(runElapsed)+'. Une nouvelle tentative ?';start.textContent='↻ REJOUER';}
function tick(){if(active){frame++;if(intro>0)intro--;if(frame%24===0){const notes=[110,110,164.81,146.83,110,130.81,98,146.83];tone(notes[Math.floor(frame/24)%notes.length],.18,'triangle',.013)}if(intro===0&&keys.left){player.x=Math.max(35,player.x-5);player.face=-1}if(intro===0&&keys.right){player.x=Math.min(925,player.x+5);player.face=1}if(player.attack>0)player.attack--;if(player.inv>0)player.inv--;for(const e of enemies){if(intro>0||e.hp<=0)continue;if(e.attack>0){e.attack--;if(!e.damageDone&&e.attack===12&&Math.abs(player.x-e.x)<105&&player.inv===0){player.hp-=e.kind===2?12:8;player.inv=32;shake=11;tone(70,.23,'sawtooth',.045);sparks.push({x:player.x,y:player.y-120,t:18});e.damageDone=true;}continue}if(e.stun>0){e.stun--;continue}const d=player.x-e.x;e.face=d>0?1:-1;if(Math.abs(d)>70)e.x+=Math.sign(d)*(stage===2?1.3:1.8);else if(frame%65===0){e.attack=24;e.kind=(Math.floor(frame/65)+stage)%3===0?2:1;e.damageDone=false;}}if(player.hp<=0)finish(false);else if(enemies.every(e=>e.hp<=0)){if(stage===scenes.length-1)finish(true);else{stage++;player.hp=Math.min(100,player.hp+25);spawn();status.textContent='Niveau '+(stage+1)+' : '+scenes[stage].name}}}draw();requestAnimationFrame(tick)}
player={x:130,y:420,hp:100,face:1,attack:0,kind:0,inv:0};spawn();tick();
