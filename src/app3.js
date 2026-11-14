
/* ====================== Dibujo y mapa ====================== */
function logoEl(cls){ const s=document.createElementNS(SVGNS,'svg'); s.setAttribute('class',cls||'logo'); s.setAttribute('viewBox','0 0 255 255'); s.setAttribute('aria-hidden','true'); const u=document.createElementNS(SVGNS,'use'); u.setAttribute('href','#logo'); s.appendChild(u); return s; }
let selPt=null;
function toggleImm(){
  const on=!document.body.classList.contains('imm');
  document.body.classList.toggle('imm',on);
  const el=document.documentElement;
  if(on&&el.requestFullscreen) el.requestFullscreen().catch(()=>{});
  else if(!on&&document.fullscreenElement&&document.exitFullscreen) document.exitFullscreen().catch(()=>{});
  setTimeout(()=>{ window.dispatchEvent(new Event('resize')); },120);
}
document.addEventListener('fullscreenchange',()=>{ if(!document.fullscreenElement&&document.body.classList.contains('imm')){ document.body.classList.remove('imm'); window.dispatchEvent(new Event('resize')); } });
function fab(icon,label,fn,cls){ return h('button',{type:'button','aria-label':label,title:label,onclick:fn,class:cls||null},icon); }
function infoBar(){
  const b=h('div',{class:'infobar'});
  b.draw=()=>{
    const p=(selPt&&proj.points.includes(selPt))?selPt:proj.points[proj.points.length-1];
    b.textContent=''; if(!p){ b.append(h('span',null,'Sin puntos')); return; }
    b.append(h('b',null,p.id+(p.code?'  ·  '+p.code:'')),h('span',{style:{textAlign:'right'}},(p===selPt?'Seleccionado':'Último punto')),h('span',null,'N '+fmtN(p.n)),h('span',{style:{textAlign:'right'}},'E '+fmtN(p.e)),h('span',null,'H '+fmtN(p.z)),h('span',{style:{textAlign:'right'}},(S.hiddenLayers.length?visPts().length+' de '+proj.points.length:proj.points.length)+' puntos'));
  };
  b.draw(); return b;
}
let cnCache={key:'',res:null};
function getContours(){
  if(!S.contours) return null;
  const key=dver+'|'+S.cnStep+'|'+S.cnSmooth+'|'+S.cnTrim+'|'+proj.id;
  if(cnCache.key!==key){ cnCache={key,res:computeContours(proj.points,{step:parseFloat(S.cnStep)||0,smooth:S.cnSmooth,trim:S.cnTrim})}; }
  return cnCache.res;
}
function niceStep(raw){ const p=Math.pow(10,Math.floor(Math.log10(raw))), m=raw/p; return (m>=5?5:m>=2?2:1)*p; }


/* ====================== Símbolos ====================== */
const SYMS=[{v:'circle',l:'Punto (círculo)'},{v:'triangle',l:'Triángulo'},{v:'square',l:'Cuadrado'},{v:'diamond',l:'Rombo'},{v:'cross',l:'Cruz (+)'},{v:'x',l:'Equis (×)'},{v:'star',l:'Estrella'},{v:'none',l:'Ocultar símbolo'}];
const COLS=[{v:'default',l:'Automático (dorado / gris)'},{v:'red',l:'Rojo'},{v:'blue',l:'Azul'},{v:'green',l:'Verde'},{v:'orange',l:'Naranja'},{v:'purple',l:'Morado'},{v:'yellow',l:'Amarillo'},{v:'black',l:'Negro'}];
const COLHEX={red:'#e0261b',blue:'#2f6df6',green:'#1f9d55',orange:'#f08a24',purple:'#8a3ffc',yellow:'#e6b800',black:'#111111'};
const symName=v=>(SYMS.find(x=>x.v===v)||{l:v}).l, colName=v=>(COLS.find(x=>x.v===v)||{l:v}).l;
// símbolo de un punto: primera regla cuya descripción (código) empieza con el texto; si no, el símbolo por defecto
function symFor(p){
  const code=String(p.code||'').trim().toUpperCase();
  for(const r of S.symRules){ if(r.on===false) continue; const m=String(r.match||'').trim().toUpperCase(); if(m&&code.startsWith(m)) return {sym:r.sym,color:r.color}; }
  return {sym:S.symDef,color:'default'};
}
function symShape(sym,x,y,r){
  const f=n=>n.toFixed(1);
  switch(sym){
    case 'triangle': return {d:'M'+f(x)+' '+f(y-r*1.25)+'L'+f(x+r*1.15)+' '+f(y+r*.85)+'L'+f(x-r*1.15)+' '+f(y+r*.85)+'Z'};
    case 'square': return {d:'M'+f(x-r)+' '+f(y-r)+'h'+f(2*r)+'v'+f(2*r)+'h'+f(-2*r)+'Z'};
    case 'diamond': return {d:'M'+f(x)+' '+f(y-r*1.3)+'L'+f(x+r*1.3)+' '+f(y)+'L'+f(x)+' '+f(y+r*1.3)+'L'+f(x-r*1.3)+' '+f(y)+'Z'};
    case 'cross': return {d:'M'+f(x-r*1.3)+' '+f(y)+'h'+f(2.6*r)+'M'+f(x)+' '+f(y-r*1.3)+'v'+f(2.6*r),line:true};
    case 'x': return {d:'M'+f(x-r)+' '+f(y-r)+'l'+f(2*r)+' '+f(2*r)+'M'+f(x+r)+' '+f(y-r)+'l'+f(-2*r)+' '+f(2*r),line:true};
    case 'star': { let d=''; for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, q=i%2?r*.55:r*1.35; d+=(i?'L':'M')+f(x+q*Math.cos(a))+' '+f(y+q*Math.sin(a)); } return {d:d+'Z'}; }
    default: return {d:'M'+f(x-r)+' '+f(y)+'a'+f(r)+' '+f(r)+' 0 1 0 '+f(2*r)+' 0a'+f(r)+' '+f(r)+' 0 1 0 '+f(-2*r)+' 0Z'};
  }
}
// estilo (cadena CSS) según color elegido
function symStyle(sh,color,input,stroke){
  const c=(color&&color!=='default')?COLHEX[color]:(input?'#5b6470':null);
  const col=c||'var(--pt)';
  return sh.line?'fill:none;stroke:'+col+';stroke-width:2.6;stroke-linecap:round':'fill:'+col+';stroke:'+(stroke||'var(--bg)')+';stroke-width:1.5;stroke-linejoin:round';
}
function symIcon(sym,color){
  const s=document.createElementNS(SVGNS,'svg'); s.setAttribute('class','ico2'); s.setAttribute('viewBox','0 0 24 24');
  if(sym!=='none'){ const sh=symShape(sym,12,12,7); const p=document.createElementNS(SVGNS,'path'); p.setAttribute('d',sh.d); p.setAttribute('style',symStyle(sh,color,false,'var(--row)')); s.appendChild(p); }
  else { const t=document.createElementNS(SVGNS,'path'); t.setAttribute('d','M5 5l14 14M19 5L5 19'); t.setAttribute('style','stroke:var(--val);stroke-width:1.5;fill:none'); s.appendChild(t); }
  return s;
}
screens.symbols=()=>{
  const list=h('div'); const sv=()=>saveS();
  const def=pickRow('Símbolo por defecto','Símbolo por defecto',SYMS,()=>S.symDef,v=>{ S.symDef=v; sv(); });
  const body=h('div',null,band('Todos los demás puntos'),def,band('Reglas según la descripción (código)'),list,
    h('div',{class:'note'},'Un punto usa la primera regla activa cuya descripción empiece con el texto indicado (sin distinguir mayúsculas ni minúsculas), por ejemplo «EST» también cubre EST1 o ESTACION. Si ninguna regla coincide, se usa el símbolo por defecto.'));
  const draw=()=>{ list.textContent='';
    if(!S.symRules.length) list.append(h('div',{class:'note'},'No hay reglas. Pulsa «Agregar regla».'));
    S.symRules.forEach((r,i)=>list.append(h('button',{class:'row symrow',onclick:()=>go('symRule',{i})},symIcon(r.sym,r.color),h('span',{class:'l',style:{flex:1,maxWidth:'none',opacity:r.on===false?.5:1}},'Empieza con «'+r.match+'»'),h('span',{class:'v',style:{flex:'none'}},symName(r.sym)+(r.sym!=='none'&&r.color&&r.color!=='default'?' · '+colName(r.color).toLowerCase():'')+(r.on===false?' (apagada)':'')))));
  };
  return {title:'Símbolos del dibujo',body,mounted:draw,help:'Elige qué símbolo se dibuja según la descripción (código) de cada punto. Por defecto, los puntos que empiezan con EST se muestran como triángulo rojo (puntos de referencia).',
    actions:[{l:'Restablecer',cls:'sec',fn:async()=>{ if(await confirmDlg('¿Volver a los símbolos originales?','Restablecer')){ S.symDef='circle'; S.symRules=[{match:'EST',sym:'triangle',color:'red',on:true}]; sv(); show(); } }},{l:'Agregar regla',fn:()=>go('symRule',{i:-1})},{l:'OK',cls:'sec',fn:()=>back()}]};
};
screens.symRule=p=>{
  const ex=p.i>=0?S.symRules[p.i]:null; const f=ex?Object.assign({},ex):{match:'',sym:'triangle',color:'red',on:true};
  const prev=h('div',{style:{display:'flex',justifyContent:'center',padding:'14px',background:'var(--row)',borderBottom:'1px solid var(--line)'}});
  const upd=()=>{ prev.textContent=''; const i=symIcon(f.sym,f.color); i.style.width=i.style.height='44px'; prev.append(i); };
  const body=h('div',null,prev,inputRow('La descripción empieza con',{value:f.match,ph:'EST',onInput:v=>f.match=v}),
    pickRow('Símbolo','Símbolo',SYMS,()=>f.sym,v=>{ f.sym=v; upd(); }),pickRow('Color','Color',COLS,()=>f.color,v=>{ f.color=v; upd(); }),
    swRow('Regla activa',f.on!==false,v=>f.on=v));
  upd();
  const acts=[{l:'Cancelar',cls:'sec',fn:()=>back()}];
  if(ex) acts.push({l:'Eliminar',cls:'dng',fn:()=>{ S.symRules.splice(p.i,1); saveS(); back(); }});
  acts.push({l:'OK',fn:()=>{ const m=String(f.match).trim(); if(!m){ toast('Escribe el texto con el que empieza la descripción'); return; } f.match=m; if(ex) S.symRules[p.i]=f; else S.symRules.push(f); saveS(); back(); }});
  return {title:ex?'Editar regla':'Nueva regla',body,actions:acts};
};

/* ====================== Capas (por código) ====================== */
function layerKey(p){ return String(p.code||'').trim().toUpperCase(); }
function layerName(k){ return k||'(sin código)'; }
function isVisible(p){ return !S.hiddenLayers.includes(layerKey(p)); }
function visPts(){ return S.hiddenLayers.length?proj.points.filter(isVisible):proj.points; }
function layerList(){ const m=new Map(); proj.points.forEach(p=>{ const k=layerKey(p); m.set(k,(m.get(k)||0)+1); }); return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true})).map(([k,n])=>({k,n})); }
screens.layers=()=>{
  const rowsEl=[]; const list=h('div'); const info=h('div',{class:'band'});
  const upd=()=>{ const L=layerList(); const hid=L.filter(x=>S.hiddenLayers.includes(x.k)); const vis=L.length-hid.length;
    info.textContent=L.length?('Capas visibles: '+vis+' de '+L.length+' · puntos visibles: '+visPts().length+' de '+proj.points.length):'Capas'; };
  const L=layerList();
  if(!L.length) list.append(h('div',{class:'note'},'Aún no hay puntos. Las capas se crean solas a partir del código (descripción) de cada punto.'));
  L.forEach(x=>{
    const sy=symFor({code:x.k}); const r=swRow(layerName(x.k)+'  ·  '+x.n,!S.hiddenLayers.includes(x.k),v=>{
      S.hiddenLayers=S.hiddenLayers.filter(k=>k!==x.k); if(!v) S.hiddenLayers.push(x.k); saveS(); upd(); });
    r.insertBefore(symIcon(sy.sym,sy.color),r.firstChild); r.querySelector('.l').style.maxWidth='none'; r.querySelector('.l').style.flex='1'; rowsEl.push({k:x.k,r}); list.append(r);
  });
  const setAll=on=>{ S.hiddenLayers=on?[]:L.map(x=>x.k); saveS(); rowsEl.forEach(o=>o.r.querySelector('.sw').setAttribute('aria-checked',String(on))); upd(); };
  upd();
  return {title:'Capas',body:h('div',null,info,list,h('div',{class:'note'},'Cada código (descripción) es una capa. Las capas apagadas se ocultan en el Dibujo y en el Mapa; los puntos siguen en la base de datos y se exportan igual. Las curvas de nivel se calculan con todos los puntos. Los códigos nuevos que lleguen de la estación aparecen encendidos.')),
    help:'Enciende o apaga grupos de puntos según su código. «Apagar todas» oculta todo para que luego enciendas solo las capas que necesitas.',
    actions:[{l:'Apagar todas',cls:'sec',fn:()=>setAll(false)},{l:'Encender todas',fn:()=>setAll(true)}]};
};

screens.plan=()=>{
  const NS=SVGNS; const svg=document.createElementNS(NS,'svg'); svg.id='plan'; svg.setAttribute('role','img'); svg.setAttribute('aria-label','Dibujo en planta de los puntos');
  const view=h('div',{class:'view'},svg), info=infoBar();
  const msg=h('div',{class:'mapmsg',hidden:true});
  let V={x:0,y:0,k:1}, W=300, H=300, fitted=false, raf=0;
  const el=(n,a,t)=>{ const e=document.createElementNS(NS,n); if(a) for(const k in a) e.setAttribute(k,a[k]); if(t!=null) e.textContent=t; return e; };
  const X=e=>(e-V.x)*V.k+W/2, Y=n=>H/2-(n-V.y)*V.k;
  function bounds(){
    const pts=visPts().filter(p=>isFinite(p.e)&&isFinite(p.n)); if(!pts.length) return null;
    let a=Infinity,b=Infinity,c=-Infinity,d=-Infinity; pts.forEach(p=>{ a=Math.min(a,p.e); c=Math.max(c,p.e); b=Math.min(b,p.n); d=Math.max(d,p.n); }); return {a,b,c,d};
  }
  function fit(){
    W=view.clientWidth||300; H=view.clientHeight||300; const B=bounds();
    if(!B){ V={x:0,y:0,k:1}; return; }
    const w=Math.max(B.c-B.a,0.5), hh=Math.max(B.d-B.b,0.5);
    V={x:(B.a+B.c)/2,y:(B.b+B.d)/2,k:Math.min((W-70)/w,(H-70)/hh)};
    fitted=true;
  }
  function draw(){
    raf=0; W=view.clientWidth||300; H=view.clientHeight||300;
    svg.setAttribute('viewBox','0 0 '+W+' '+H); svg.textContent='';
    if(!fitted&&proj.points.length) fit();
    const g=el('g'); svg.append(g);
    // cuadrícula
    const step=niceStep(70/V.k), e0=Math.floor((V.x-W/2/V.k)/step)*step, e1=V.x+W/2/V.k, n0=Math.floor((V.y-H/2/V.k)/step)*step, n1=V.y+H/2/V.k;
    if(S.grid&&(e1-e0)/step<80&&(n1-n0)/step<80){
      for(let e=e0;e<=e1;e+=step){ g.append(el('line',{class:'grid',x1:X(e),y1:0,x2:X(e),y2:H})); g.append(el('text',{class:'ax',x:X(e)+3,y:H-4},fmtN(e,step<1?2:0))); }
      for(let n=n0;n<=n1;n+=step){ g.append(el('line',{class:'grid',x1:0,y1:Y(n),x2:W,y2:Y(n)})); g.append(el('text',{class:'ax',x:3,y:Y(n)-3},fmtN(n,step<1?2:0))); }
    }
    // curvas de nivel
    const cn=getContours();
    msg.hidden=true;
    if(cn){
      cn.lines.forEach(l=>{ if(l.pts.length<2) return; let d=''; l.pts.forEach((p,i)=>{ d+=(i?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1); }); if(l.closed) d+='Z'; g.append(el('path',{class:'cl'+(l.index?' idx':''),d})); });
      if(V.k>0) cn.lines.forEach(l=>{ if(l.index&&l.pts.length>6){ const p=l.pts[Math.floor(l.pts.length/2)]; g.append(el('text',{class:'cll',x:X(p[0]),y:Y(p[1])},fmtN(l.z,l.z%1?2:0))); } });
      if(cn.info&&proj.points.length){ msg.textContent=cn.info; msg.hidden=false; }
    }
    // unir por código
    if(S.link){ const by={}; visPts().forEach(p=>{ if(p.code) (by[p.code]=by[p.code]||[]).push(p); });
      Object.values(by).forEach(a=>{ if(a.length>1) g.append(el('polyline',{class:'ln',points:a.map(p=>X(p.e).toFixed(1)+','+Y(p.n).toFixed(1)).join(' ')})); }); }
    // polígono del área
    if(areaPts.length>2 && p_showArea) g.append(el('polygon',{class:'poly',points:areaPts.map(p=>X(p.e).toFixed(1)+','+Y(p.n).toFixed(1)).join(' ')}));
    // puntos
    const vis=visPts().filter(p=>{ const x=X(p.e),y=Y(p.n); return x>-20&&x<W+20&&y>-20&&y<H+20; });
    const labels=vis.length<=350;
    vis.forEach(p=>{
      const x=X(p.e), y=Y(p.n), s=p===selPt;
      const sy=symFor(p), small=vis.length>1500, r=small?3:5.5;
      if(sy.sym!=='none'){ const sh=symShape(sy.sym,x,y,r); g.append(el('path',{d:sh.d,style:symStyle(sh,sy.color,p.type==='input')})); }
      if(s) g.append(el('circle',{class:'selring',cx:x,cy:y,r:r+5}));
      if(labels){ let t=[]; if(S.num) t.push(p.id); if(S.codes&&p.code) t.push(p.code); if(t.length) g.append(el('text',{class:'lbl',x:x+7,y:y-6},t.join(' '))); if(S.zs) g.append(el('text',{class:'lbl2',x:x+7,y:y+10},fmtN(p.z,2))); }
    });
    // barra de escala y norte
    const sc=niceStep(90/V.k), px=sc*V.k, bx=14, by=H-26;
    g.append(el('line',{class:'sc',x1:bx,y1:by,x2:bx+px,y2:by}),el('line',{class:'sc',x1:bx,y1:by-4,x2:bx,y2:by+4}),el('line',{class:'sc',x1:bx+px,y1:by-4,x2:bx+px,y2:by+4}),el('text',{class:'ax',x:bx,y:by-8},(sc>=1?sc:sc.toFixed(2))+' m'));
    g.append(el('path',{class:'north',d:'M'+(W-70)+' 40 l8 -24 l8 24 l-8 -6 z'}),el('text',{class:'ax',x:W-74,y:56},'N'));
    if(!proj.points.length){ const t=el('text',{class:'lbl',x:W/2,y:H/2,'text-anchor':'middle'},'Aún no hay puntos'); g.append(t); }
    info.draw();
  }
  const sched=()=>{ if(!raf) raf=requestAnimationFrame(draw); };
  // gestos
  const ptrs=new Map(); let moved=0, last=null;
  svg.addEventListener('pointerdown',e=>{ svg.setPointerCapture(e.pointerId); ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY}); moved=0; last=null; });
  svg.addEventListener('pointermove',e=>{
    if(!ptrs.has(e.pointerId)) return; const o=ptrs.get(e.pointerId); const nx=e.clientX, ny=e.clientY;
    if(ptrs.size===1){ V.x-=(nx-o.x)/V.k; V.y+=(ny-o.y)/V.k; moved+=Math.abs(nx-o.x)+Math.abs(ny-o.y); ptrs.set(e.pointerId,{x:nx,y:ny}); sched(); }
    else if(ptrs.size===2){
      const [a,b]=[...ptrs.values()]; const d0=Math.hypot(a.x-b.x,a.y-b.y);
      ptrs.set(e.pointerId,{x:nx,y:ny}); const [c,d]=[...ptrs.values()]; const d1=Math.hypot(c.x-d.x,c.y-d.y);
      if(d0>0&&d1>0){ V.k=Math.min(1e6,Math.max(1e-4,V.k*d1/d0)); moved+=10; sched(); }
    }
  });
  const up=e=>{
    const o=ptrs.get(e.pointerId); ptrs.delete(e.pointerId);
    if(o&&moved<8&&!ptrs.size){ const r=svg.getBoundingClientRect(); const px=e.clientX-r.left, py=e.clientY-r.top; let best=null,bd=26;
      visPts().forEach(p=>{ const d=Math.hypot(X(p.e)-px,Y(p.n)-py); if(d<bd){ bd=d; best=p; } });
      selPt=best&&best!==selPt?best:null; sched(); }
  };
  svg.addEventListener('pointerup',up); svg.addEventListener('pointercancel',up);
  svg.addEventListener('wheel',e=>{ e.preventDefault(); const r=svg.getBoundingClientRect(); const px=e.clientX-r.left, py=e.clientY-r.top;
    const en=V.x+(px-W/2)/V.k, nn=V.y-(py-H/2)/V.k; const f=e.deltaY<0?1.25:0.8; V.k=Math.min(1e6,Math.max(1e-4,V.k*f)); V.x=en-(px-W/2)/V.k; V.y=nn+(py-H/2)/V.k; sched(); },{passive:false});
  const onResize=()=>{ sched(); }; window.addEventListener('resize',onResize);
  const zoom=f=>{ V.k=Math.min(1e6,Math.max(1e-4,V.k*f)); sched(); };
  const fabs=h('div',{class:'fab'},fab(ico('plan'),'Ver todo',()=>{ fit(); sched(); }),fab('+','Acercar',()=>zoom(1.5)),fab('−','Alejar',()=>zoom(1/1.5)),fab('▦','Mostrar u ocultar la cuadrícula',()=>{ S.grid=!S.grid; saveS(); toast(S.grid?'Cuadrícula visible':'Cuadrícula oculta'); sched(); }),fab(ico('layers'),'Capas',()=>go('layers')),fab('△','Símbolos',()=>go('symbols')),fab(ico('gear'),'Capas y ajustes',()=>go('viewSettings')),
    fab('◐','Cambiar tema claro / oscuro',()=>{ S.theme=isDark()?'light':'dark'; saveS(); applyTheme(); }),fab('⛶','Pantalla completa',toggleImm));
  view.append(fabs,msg);
  const body=h('div',{class:'stage'},view,info);
  return {title:'Dibujo',body,full:true,help:'Arrastra para mover, pellizca o usa la rueda para acercar. Toca un punto para ver sus datos. Las líneas finas de color son curvas de nivel; las gruesas son maestras. Cambia capas en el botón de engranaje.',
    refresh:()=>{ if(!fitted) fit(); sched(); },mounted:()=>{ setTimeout(()=>{ fit(); draw(); },30); },leave:()=>{ window.removeEventListener('resize',onResize); cancelAnimationFrame(raf); }};
};
let p_showArea=false;

let leafletP=null;
function ensureLeaflet(){
  if(window.L) return Promise.resolve();
  if(leafletP) return leafletP;
  leafletP=new Promise((res,rej)=>{
    const l=h('link',{rel:'stylesheet',href:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'}); document.head.appendChild(l);
    const s=h('script',{src:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'});
    s.onload=()=>res(); s.onerror=()=>{ leafletP=null; rej(new Error('Sin conexión a internet')); }; document.head.appendChild(s);
  });
  return leafletP;
}
screens.map=()=>{
  const div=h('div',{id:'map',style:{position:'absolute',inset:0}}), view=h('div',{class:'view'},div), info=infoBar();
  const msg=h('div',{class:'mapmsg',hidden:true});
  let map=null, layer=null, tiles=null, fittedMap=false, lastV=-1;
  function say(t){ msg.textContent=t||''; msg.hidden=!t; }
  function build(){
    if(!map) return; layer.clearLayers();
    const cs=proj.cs; if(cs.type!=='utm'){ say('Los datos usan coordenadas locales: el mapa necesita UTM (Datos → Sistema de coordenadas).'); return; }
    const pts=visPts().filter(p=>isFinite(p.e)&&isFinite(p.n)); const ll=[];
    const cn=getContours();
    if(cn) cn.lines.forEach(l=>{ if(l.pts.length>1) L.polyline(l.pts.map(p=>utmToLatLon(p[0],p[1],cs.zone,cs.south)),{color:'#d9822b',weight:l.index?2.4:1.2,opacity:.9}).addTo(layer); });
    pts.forEach(p=>{ const c=utmToLatLon(p.e,p.n,cs.zone,cs.south); if(!isFinite(c[0])) return; ll.push(c);
      const sy=symFor(p); if(sy.sym==='none') return; const sh=symShape(sy.sym,11,11,6.5);
      const html='<svg width="22" height="22" viewBox="0 0 22 22"><path d="'+sh.d+'" style="'+symStyle(sh,sy.color,p.type==='input','#fff').replace('var(--pt)','#b87a1a')+'"/></svg>';
      L.marker(c,{icon:L.divIcon({html,className:'symmk',iconSize:[22,22],iconAnchor:[11,11]})}).on('click',()=>{ selPt=p; info.draw(); }).bindTooltip(p.id+(p.code?' · '+p.code:'')).addTo(layer); });
    if(S.link){ const by={}; pts.forEach(p=>{ if(p.code) (by[p.code]=by[p.code]||[]).push(utmToLatLon(p.e,p.n,cs.zone,cs.south)); }); Object.values(by).forEach(a=>{ if(a.length>1) L.polyline(a,{color:'#e5b36a',weight:2.5}).addTo(layer); }); }
    if(ll.length&&!fittedMap){ map.fitBounds(L.latLngBounds(ll),{padding:[40,40],maxZoom:19}); fittedMap=true; }
    say(''); info.draw();
  }
  function setBase(){ if(!map) return; if(tiles) map.removeLayer(tiles);
    tiles=S.base==='sat'?L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Imágenes © Esri'}):L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'});
    tiles.addTo(map); tiles.bringToBack(); }
  const fabs=h('div',{class:'fab'},fab(ico('map'),'Ver todo',()=>{ fittedMap=false; build(); }),fab(ico('layers'),'Capas',()=>go('layers')),fab('△','Símbolos',()=>go('symbols')),fab('◫','Mapa / satélite',()=>{ S.base=S.base==='sat'?'osm':'sat'; saveS(); setBase(); toast(S.base==='sat'?'Satélite':'Mapa de calles'); }),fab(ico('gear'),'Capas y ajustes',()=>go('viewSettings')),
    fab('◐','Cambiar tema claro / oscuro',()=>{ S.theme=isDark()?'light':'dark'; saveS(); applyTheme(); }),fab('⛶','Pantalla completa',toggleImm));
  view.append(fabs,msg);
  return {title:'Mapa',body:h('div',{class:'stage'},view,info),full:true,help:'Muestra los puntos sobre un mapa real. Necesita internet y datos con sistema UTM correcto (zona y hemisferio).',
    refresh:()=>{ if(map&&lastV!==dver){ lastV=dver; build(); } else info.draw(); },
    mounted:async()=>{
      if(proj.cs.type!=='utm'){ say('Los datos usan coordenadas locales: el mapa necesita UTM (Datos → Sistema de coordenadas).'); return; }
      say('Cargando mapa…');
      try{ await ensureLeaflet(); }catch(e){ say('No hay internet: el mapa necesita conexión. El dibujo funciona sin internet.'); return; }
      if(!div.isConnected) return;
      map=L.map(div,{zoomControl:false,attributionControl:true}).setView([0,-78],5); layer=L.layerGroup().addTo(map); setBase(); lastV=dver; build();
      setTimeout(()=>map&&map.invalidateSize(),150);
      window.addEventListener('resize',rs);
    },
    leave:()=>{ window.removeEventListener('resize',rs); if(map){ map.remove(); map=null; } }};
  function rs(){ if(map) map.invalidateSize(); }
};
screens.viewSettings=()=>{
  const sv=()=>{ saveS(); };
  const body=h('div',null,band('Fondo'),swRow('Mostrar cuadrícula',S.grid,v=>{ S.grid=v; sv(); }),row('Capas de puntos','Por código',{fn:()=>go('layers')}),row('Símbolos de los puntos','Según la descripción',{fn:()=>go('symbols')}),band('Etiquetas'),swRow('Mostrar números de punto',S.num,v=>{ S.num=v; sv(); }),swRow('Mostrar cotas',S.zs,v=>{ S.zs=v; sv(); }),swRow('Mostrar códigos',S.codes,v=>{ S.codes=v; sv(); }),swRow('Unir puntos con el mismo código',S.link,v=>{ S.link=v; sv(); }),
    band('Curvas de nivel'),swRow('Mostrar curvas de nivel',S.contours,v=>{ S.contours=v; sv(); }),
    inputRow('Equidistancia',{type:'number',value:S.cnStep,unit:'m',ph:'Automática',inputmode:'decimal',onChange:v=>{ S.cnStep=v; sv(); }}),
    swRow('Suavizar curvas',S.cnSmooth,v=>{ S.cnSmooth=v; sv(); }),swRow('Recortar triángulos largos',S.cnTrim,v=>{ S.cnTrim=v; sv(); }),
    h('div',{class:'note'},'Las curvas se interpolan sobre una red de triángulos (TIN) con los puntos que tienen cota. «Recortar» evita unir zonas alejadas sin datos. Deja la equidistancia vacía para que se calcule sola.'),
    band('Mapa'),pickRow('Fondo del mapa','Fondo del mapa',[{v:'osm',l:'Calles (OpenStreetMap)'},{v:'sat',l:'Satélite (Esri)'}],()=>S.base,v=>{ S.base=v; sv(); }));
  return {title:'Capas y ajustes',body,actions:[{l:'OK',fn:()=>back()}]};
};

/* ====================== Herramientas ====================== */
let areaPts=[];
screens.area=()=>{
  const list=h('div'), res=h('div'), prev=h('div',{style:{background:'var(--row)',padding:'6px',textAlign:'center'}});
  let selI=-1;
  function draw(){
    p_showArea=true;
    list.textContent='';
    if(!areaPts.length) list.append(h('div',{class:'note'},'Agrega al menos 3 puntos en el orden en que rodean el polígono.'));
    areaPts.forEach((p,i)=>list.append(h('button',{class:'row'+(i===selI?' sel':''),onclick:()=>{ selI=i===selI?-1:i; draw(); }},h('span',{class:'l',style:{maxWidth:'none',flex:'none'}},(i+1)+'.  '+p.id),h('span',{class:'v'},'N '+fmtN(p.n)+'  E '+fmtN(p.e)))));
    const m=polygonMetrics(areaPts); res.textContent='';
    res.append(band('Resultado'),row('Puntos',String(areaPts.length)),row('Área',areaPts.length>2?m.area.toLocaleString('es-CO',{maximumFractionDigits:3})+' m²':'—'),row('Hectáreas',areaPts.length>2?(m.area/10000).toFixed(4)+' ha':'—'),row('Perímetro',areaPts.length>1?m.perimeter.toLocaleString('es-CO',{maximumFractionDigits:3})+' m':'—'));
    prev.textContent='';
    if(areaPts.length>2){
      const xs=areaPts.map(p=>p.e), ys=areaPts.map(p=>p.n), a=Math.min(...xs), c=Math.max(...xs), b=Math.min(...ys), d=Math.max(...ys), w=Math.max(c-a,1e-6), hh=Math.max(d-b,1e-6), S0=Math.min(280/w,150/hh);
      const pts=areaPts.map(p=>((p.e-a)*S0+10).toFixed(1)+','+((d-p.n)*S0+10).toFixed(1)).join(' ');
      const sv=document.createElementNS(SVGNS,'svg'); sv.setAttribute('viewBox','0 0 '+(w*S0+20)+' '+(hh*S0+20)); sv.style.cssText='max-width:100%;height:170px';
      sv.innerHTML='<polygon points="'+pts+'" fill="rgba(229,179,106,.35)" stroke="#b87a1a" stroke-width="2"/>'; prev.append(sv);
    }
  }
  const body=h('div',null,band('Lista de puntos'),list,prev,res);
  return {title:'Área y perímetro',body,help:'Calcula el área (fórmula de Gauss) y el perímetro de un polígono cerrado. Los puntos deben ir en orden alrededor del contorno. El polígono también se muestra en el Dibujo.',
    mounted:draw,leave:()=>{ p_showArea=false; },
    actions:[{l:'Agregar',fn:()=>go('pickPoint',{cb:p=>{ areaPts.push(p); }})},{l:'Todos',cls:'sec',fn:()=>{ areaPts=proj.points.slice(); draw(); }},
      {l:'Quitar',cls:'sec',fn:()=>{ if(selI>=0){ areaPts.splice(selI,1); selI=-1; } else areaPts.pop(); draw(); }},{l:'Limpiar',cls:'sec',fn:()=>{ areaPts=[]; selI=-1; draw(); }}]};
};
// campo de punto: elegir de la base o escribir
function ptInput(st,label){
  const nm=row(label,st.id||'Toca para elegir',{fn:()=>go('pickPoint',{cb:p=>{ st.id=p.id; st.n=p.n; st.e=p.e; st.z=p.z; }})});
  const mk=(l,k)=>inputRow(l,{type:'number',value:st[k]==null?'':st[k],unit:'m',inputmode:'decimal',onInput:v=>{ st[k]=v===''?null:+v; st.id=''; }});
  return h('div',null,band(label),nm,mk('Norte','n'),mk('Este','e'),mk('Altura','z'));
}
const num=v=>(v==null||v===''||!isFinite(+v))?null:+v;
function resRow(l,v){ return row(l,v); }
screens.cogo=()=>({title:'COGO',body:h('div',{class:'list'},[['Inversa','cogoInv'],['Radiación (acimut y distancia)','cogoRad'],['Dividir una línea','cogoDiv']].map(m=>h('button',{class:'row link',onclick:()=>go(m[1])},ico('cogo'),h('span',{class:'l',style:{maxWidth:'none',flex:1}},m[0]))))});
const cg={a:{},b:{},az:'',hd:'',dz:'0',n:2};
screens.cogoInv=()=>{
  const out=h('div'); const calc=()=>{ out.textContent=''; const a={n:num(cg.a.n),e:num(cg.a.e),z:num(cg.a.z)||0}, b={n:num(cg.b.n),e:num(cg.b.e),z:num(cg.b.z)||0};
    if([a.n,a.e,b.n,b.e].some(v=>v==null)){ out.append(h('div',{class:'err'},'Completa Norte y Este de los dos puntos.')); return; }
    const r=inverse(a,b); out.append(band('Resultado'),row('Acimut',fmtAngle(r.az,S.angFmt==='dms2'?'dms2':S.angFmt,2)),row('Acimut (decimal)',r.az.toFixed(5)+'°'),row('Distancia horizontal',fmtN(r.hd)+' m'),row('Desnivel',fmtN(r.dz)+' m'),row('Pendiente',isFinite(r.slope)?r.slope.toFixed(2)+' %':'—'),row('Distancia inclinada',fmtN(r.sd)+' m')); };
  return {title:'Inversa',body:h('div',null,ptInput(cg.a,'Punto A'),ptInput(cg.b,'Punto B'),out),actions:[{l:'Calcular',fn:calc}],mounted:()=>{ if(cg.a.n!=null&&cg.b.n!=null) calc(); }};
};
screens.cogoRad=()=>{
  const out=h('div'); let last=null;
  const calc=()=>{ out.textContent=''; const a={n:num(cg.a.n),e:num(cg.a.e),z:num(cg.a.z)||0}, az=num(cg.az), hd=num(cg.hd);
    if([a.n,a.e,az,hd].some(v=>v==null)){ out.append(h('div',{class:'err'},'Completa el punto base, el acimut y la distancia.')); last=null; return; }
    const ang=degFromUnit(az,S.fmt.angUnit); last=radiate(a,ang,hd,num(cg.dz)||0);
    out.append(band('Resultado'),row('Norte',fmtN(last.n)+' m'),row('Este',fmtN(last.e)+' m'),row('Altura',fmtN(last.z)+' m')); };
  const unit={dms:'GGG.MMSS',deg:'grados',gon:'gon'}[S.fmt.angUnit]||'';
  return {title:'Radiación',body:h('div',null,ptInput(cg.a,'Punto base'),band('Datos'),inputRow('Acimut',{type:'number',value:cg.az,unit,inputmode:'decimal',onInput:v=>cg.az=v}),inputRow('Distancia horizontal',{type:'number',value:cg.hd,unit:'m',inputmode:'decimal',onInput:v=>cg.hd=v}),inputRow('Desnivel',{type:'number',value:cg.dz,unit:'m',inputmode:'decimal',onInput:v=>cg.dz=v}),out),
    help:'Calcula un punto nuevo a partir de un punto base, un acimut y una distancia horizontal. La unidad del ángulo se cambia en Dispositivo → Formato de datos.',
    actions:[{l:'Calcular',fn:calc},{l:'Guardar punto',cls:'sec',fn:()=>{ if(!last){ calc(); if(!last) return; } proj.points.push({id:nextName(),n:last.n,e:last.e,z:last.z,code:'',type:'input',t:Date.now()}); proj.next+=Math.max(1,+S.incr||1); touch(); toast('Punto guardado'); }}]};
};
screens.cogoDiv=()=>{
  const out=h('div'); let res=[];
  const calc=()=>{ out.textContent=''; const a={n:num(cg.a.n),e:num(cg.a.e),z:num(cg.a.z)||0}, b={n:num(cg.b.n),e:num(cg.b.e),z:num(cg.b.z)||0}, n=Math.floor(+cg.n);
    if([a.n,a.e,b.n,b.e].some(v=>v==null)||!(n>=2&&n<=200)){ out.append(h('div',{class:'err'},'Completa los dos puntos y un número de partes entre 2 y 200.')); res=[]; return; }
    res=divideLine(a,b,n); out.append(band('Puntos intermedios ('+res.length+')'),...res.map((p,i)=>row((i+1)+'',fmtN(p.n)+'  '+fmtN(p.e)+'  '+fmtN(p.z)))); };
  return {title:'Dividir línea',body:h('div',null,ptInput(cg.a,'Punto A'),ptInput(cg.b,'Punto B'),band('Datos'),inputRow('Número de partes',{type:'number',value:cg.n,inputmode:'numeric',onInput:v=>cg.n=v}),out),
    actions:[{l:'Calcular',fn:calc},{l:'Guardar puntos',cls:'sec',fn:()=>{ if(!res.length){ calc(); if(!res.length) return; } res.forEach(p=>{ proj.points.push({id:nextName(),n:p.n,e:p.e,z:p.z,code:'',type:'input',t:Date.now()}); proj.next+=Math.max(1,+S.incr||1); }); touch(); toast(res.length+' puntos guardados'); }}]};
};
screens.angleConv=()=>{
  const st={unit:'dms',v:''}; const out=h('div');
  const calc=()=>{ out.textContent=''; const v=num(st.v); if(v==null){ return; } const deg=degFromUnit(v,st.unit);
    out.append(band('Equivalencias'),row('GG°MM\'SS"',fmtAngle(deg,'dms',2)),row('GGG.MMSS',fmtAngle(deg,'dms2',2)),row('Grados decimales',deg.toFixed(6)+'°'),row('Gradianes',(deg*400/360).toFixed(5)+' gon'),row('Radianes',(deg*Math.PI/180).toFixed(8)+' rad')); };
  return {title:'Conversor de ángulos',body:h('div',null,pickRow('Unidad de entrada','Unidad de entrada',[{v:'dms',l:'GGG.MMSS (ej. 45.3015)'},{v:'deg',l:'Grados decimales'},{v:'gon',l:'Gradianes'},{v:'rad',l:'Radianes'}],()=>st.unit,v=>{ st.unit=v; calc(); }),inputRow('Valor',{type:'number',inputmode:'decimal',ph:'0',onInput:v=>{ st.v=v; calc(); }}),out),
    help:'GGG.MMSS significa grados, minutos y segundos pegados: 45.3015 = 45°30\'15".'};
};
screens.coordConv=()=>{
  const st={mode:'ll2utm',lat:'',lon:'',e:'',n:'',zone:proj.cs.zone,south:proj.cs.south}; const out=h('div'); const a=h('div'), b=h('div');
  const calc=()=>{ out.textContent='';
    if(st.mode==='ll2utm'){ const la=num(st.lat), lo=num(st.lon); if(la==null||lo==null||Math.abs(la)>90||Math.abs(lo)>180) return; const r=latLonToUTM(la,lo,st.zone?+st.zone:null);
      out.append(band('Resultado UTM WGS84'),row('Zona',r.zone+(r.south?' Sur':' Norte')),row('Este',fmtN(r.e)+' m'),row('Norte',fmtN(r.n)+' m')); }
    else { const e=num(st.e), n=num(st.n); if(e==null||n==null) return; const c=utmToLatLon(e,n,+st.zone||17,st.south);
      out.append(band('Resultado WGS84'),row('Latitud',c[0].toFixed(8)+'°'),row('Longitud',c[1].toFixed(8)+'°'),row('Latitud (GMS)',fmtAngle(c[0],'dms',3)),row('Longitud (GMS)',fmtAngle(c[1],'dms',3))); } };
  const mk=()=>{ a.textContent='';
    if(st.mode==='ll2utm') a.append(inputRow('Latitud',{type:'number',unit:'°',inputmode:'decimal',value:st.lat,onInput:v=>{ st.lat=v; calc(); }}),inputRow('Longitud',{type:'number',unit:'°',inputmode:'decimal',value:st.lon,onInput:v=>{ st.lon=v; calc(); }}),h('div',{class:'note'},'Latitud sur y longitud oeste son negativas (Bogotá: 4.711, -74.072). Deja la zona vacía en el campo de abajo para que se calcule sola.'));
    else a.append(inputRow('Este',{type:'number',unit:'m',inputmode:'decimal',value:st.e,onInput:v=>{ st.e=v; calc(); }}),inputRow('Norte',{type:'number',unit:'m',inputmode:'decimal',value:st.n,onInput:v=>{ st.n=v; calc(); }}));
    calc(); };
  const body=h('div',null,pickRow('Conversión','Conversión',[{v:'ll2utm',l:'Latitud/Longitud → UTM'},{v:'utm2ll',l:'UTM → Latitud/Longitud'}],()=>st.mode,v=>{ st.mode=v; mk(); }),a,
    inputRow('Zona UTM',{type:'number',value:st.zone,inputmode:'numeric',onInput:v=>{ st.zone=v; calc(); }}),pickRow('Hemisferio','Hemisferio',[{v:true,l:'Sur'},{v:false,l:'Norte'}],()=>st.south,v=>{ st.south=v; calc(); }),out);
  mk(); return {title:'Conversor de coordenadas',body};
};

/* ====================== Inicio ====================== */
document.querySelectorAll('#tabs button').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
window.addEventListener('pagehide',saveProjNow);
document.addEventListener('visibilitychange',()=>{ if(document.hidden) saveProjNow(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ if(dlgEl) closeDlg(); else if(document.body.classList.contains('imm')) toggleImm(); else back(); } });
function hardBack(){
  if(dlgEl){ closeDlg(); return; }
  if(document.body.classList.contains('imm')){ toggleImm(); return; }
  if(stack.length){ back(); return; }
  if(tab!=='proj'){ setTab('proj'); return; }
  try{ CAP.Plugins.App.exitApp(); }catch(e){}
}
if(NATIVE&&CAP.Plugins&&CAP.Plugins.App){ try{ CAP.Plugins.App.addListener('backButton',hardBack); }catch(e){} }
applyTheme();
setInterval(()=>{ if(rx.on) updateStatus(); },1000);
show();
})();
