"use strict";
const {panels,uid,newFlow,demo,clean,assess}=CabinaEngine;
const $=id=>document.getElementById(id), roles=["PF","PM"], colors={PF:"#a9ed72",PM:"#ffcd63"};
const icons={route:'<circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h5a4 4 0 0 0 0-8h-1a2 2 0 1 1 0-4h6"/>',play:'<path d="m7 4 13 8-13 8z"/>',layers:'<path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',plane:'<path d="m21 3-6 18-3-8-9-3zM12 13l9-10"/>',scan:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="3"/>',plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',fit:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',pointer:'<path d="m5 3 14 10-7 1-3 7z"/>',pencil:'<path d="m4 15 11-11 5 5L9 20l-6 1zM13 6l5 5"/>',drive:'<path d="m5 4-3 11v5h20v-5L19 4zM2 15h20m-5 3h2"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5"/>',close:'<path d="m5 5 14 14M19 5 5 19"/>',book:'<path d="M3 5c4-1 6-1 9 1 3-2 5-2 9-1v14c-4-1-6-1-9 1-3-2-5-2-9-1zM12 6v14"/>',chevron:'<path d="m9 5 7 7-7 7"/>',trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',undo:'<path d="M3 10h11a6 6 0 0 1 0 12M3 10l6-6m-6 6 6 6"/>',check:'<path d="m4 12 5 5L20 6"/>',target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h1m-1 6h1m-1 6h1"/>',up:'<path d="m6 15 6-6 6 6"/>',down:'<path d="m6 9 6 6 6-6"/>',hint:'<path d="M9 17c0-2-3-3-3-7a6 6 0 1 1 12 0c0 4-3 5-3 7zM9 21h6"/>',edit:'<path d="M4 20h16m-13-5 9-9 3 3-9 9-4 1z"/>'};
const icon=k=>'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">'+(icons[k]||"")+'</svg>';
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
document.querySelectorAll("i[data-i]").forEach(e=>e.innerHTML=icon(e.dataset.i));
const key="cabina.a320.v1";
let flows=[],current="",storeOK=true;
try{const s=JSON.parse(localStorage.getItem(key)||"null");if(s){
 if(!Array.isArray(s.flows))throw Error();
 flows=s.flows.map(f=>{const v=clean(f);v.id=typeof f.id==="string"?f.id:uid();return v;});current=s.current;
}}catch{storeOK=false;}
if(!flows.length)flows=[demo()];
if(!flows.some(f=>f.id===current))current=flows[0].id;
const flow=()=>flows.find(f=>f.id===current),steps=()=>flow().steps[role];
let mode="edit",role="PF",view="central",zoom=1,both=false,taps=[],report=null,showRef=true,showTaps=true,moving=null,aim=null,geo={},timer=0,suppressClick=false;
function save(){try{localStorage.setItem(key,JSON.stringify({version:1,current,flows}));storeOK=true;}catch{storeOK=false;}savedStatus();}
function savedStatus(){$("saveStatus").textContent=storeOK?"Guardado en este navegador":"Guardado local no disponible · exporta tu flujo";}
function toast(s){$("toast").textContent=s;$("toast").hidden=false;clearTimeout(timer);timer=setTimeout(()=>$("toast").hidden=true,3200);}
function button(id,label,cls="btn",sym=""){return '<button type="button" class="'+cls+'" id="'+id+'">'+(sym?icon(sym):"")+esc(label)+'</button>';}
function modal(title,body,actions,submit){
 const d=$("modal");if(d.open)d.close();$("modalTitle").textContent=title;$("modalBody").innerHTML=body;$("modalActions").innerHTML=actions;
 $("dialogForm").onsubmit=e=>{e.preventDefault();if(submit)submit();};d.showModal();
}
const close=()=>$("modal").close();$("closeDialog").onclick=close;
const submitBtn=s=>'<button class="btn primary" type="submit">'+esc(s)+'</button>';
function field(id,label,value,max,required=false,placeholder=""){return '<label class="field">'+esc(label)+'<input id="'+id+'" value="'+esc(value)+'" maxlength="'+max+'" '+(required?"required ":"")+'placeholder="'+esc(placeholder)+'"></label>';}
function question(title,desc,ok,run){
 modal(title,'<p class="note">'+esc(desc)+'</p>',button("cancel","Volver")+button("confirm",ok,"btn primary"));
 $("cancel").onclick=close;$("confirm").onclick=()=>{close();run();};
}
function flowDialog(isNew){
 const f=flow();modal(isNew?"Nuevo flujo":"Editar flujo",field("nameField","Nombre del flujo",isNew?"":f.name,100,true,"Ej. After Start")+field("sourceField","Manual, revisión y página",isNew?"":f.source,250,false,"Ej. SOP de mi centro · revisión · página"),submitBtn(isNew?"Crear flujo":"Guardar cambios"),()=>{
 const n=$("nameField").value.trim();if(!n)return;const ref=$("sourceField").value.trim();
 if(isNew){const nf=newFlow(n,ref);flows.push(nf);current=nf.id;role="PF";}else{f.name=n;f.source=ref;}close();mode="edit";moving=null;save();render();});
 $("nameField").focus();
}
function editStep(point,index=null){
 const s=index===null?{...point,name:"",action:"",radius:.009}:steps()[index];
 const main=field("switchName","Mando o instrumento",s.name,100,true,"Ej. APU BLEED")+field("switchAction","Acción o posición de referencia",s.action,160,false,"Ej. Identificar / comprobar")+
 '<label class="field">Área de acierto<select id="radiusField">'+[[.004,"Precisa · interruptor pequeño"],[.009,"Normal · botón o selector"],[.018,"Amplia · instrumento"],[.031,"Pantalla"]].map(([v,t])=>'<option value="'+v+'" '+(Math.abs(v-s.radius)<.0001?"selected":"")+'>'+t+'</option>').join("")+'</select></label>'+
 (index===null?"":'<div class="smallActions">'+button("earlier","Subir","","up")+button("later","Bajar","","down")+button("move","Reubicar","","target")+button("removeStep","Eliminar","danger","trash")+'</div>');
 modal(role+" · Paso "+(index===null?steps().length+1:index+1),main,submitBtn(index===null?"Añadir paso":"Guardar paso"),()=>{
 const name=$("switchName").value.trim();if(!name)return;const item={...s,name,action:$("switchAction").value.trim(),radius:Number($("radiusField").value),id:s.id||uid()};if(index===null)steps().push(item);else steps()[index]=item;
 close();save();render();});
 if(index!==null){
 const swap=k=>{[steps()[index],steps()[k]]=[steps()[k],steps()[index]];close();save();render();};
 $("earlier").disabled=index===0;$("later").disabled=index===steps().length-1;
 $("earlier").onclick=()=>swap(index-1);$("later").onclick=()=>swap(index+1);
 $("move").onclick=()=>{close();moving=s.id;render();toast("Haz clic en la nueva posición del mando.");};
 $("removeStep").onclick=()=>question("Eliminar paso",s.name,"Eliminar",()=>{steps().splice(index,1);save();render();});
 }else $("switchName").focus();
}
function library(){
 const body='<div>'+flows.map((f,i)=>'<div class="flowItem"><button type="button" data-load="'+i+'"><b>'+esc(f.name)+'</b><small>'+f.steps.PF.length+' PF · '+f.steps.PM.length+' PM</small></button><button type="button" class="iconbtn" aria-label="Eliminar flujo" data-del="'+i+'">'+icon("trash")+'</button></div>').join("")+'</div><p class="note" style="margin-top:14px">Exporta un flujo para hacer una copia o practicarlo en otro dispositivo.</p>';
 modal("Mis flujos",body,button("import","Importar JSON")+button("export","Exportar flujo actual","btn","download"));
 $("modalBody").querySelectorAll("[data-load]").forEach(b=>b.onclick=()=>{current=flows[+b.dataset.load].id;mode="edit";moving=null;close();save();render();});
 $("modalBody").querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{const i=+b.dataset.del;question("Eliminar flujo",flows[i].name,"Eliminar",()=>{flows.splice(i,1);if(!flows.length)flows.push(newFlow("Mi flujo A320"));if(!flows.some(f=>f.id===current))current=flows[0].id;mode="edit";save();render();library();});});
 $("import").onclick=()=>$("importFile").click();$("export").onclick=()=>{const blob=new Blob([JSON.stringify({format:"cabina-a320",version:1,flow:flow()},null,2)],{type:"application/json"});const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=(flow().name.replace(/[^a-z0-9áéíóúñ_-]+/gi,"-")||"flujo")+".json";a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);};
}
$("importFile").onchange=async e=>{const file=e.target.files[0];e.target.value="";if(!file)return;try{if(file.size>1000000)throw Error("El archivo supera 1 MB.");const doc=JSON.parse(await file.text());if(doc.format!=="cabina-a320"||doc.version!==1)throw Error("Selecciona un JSON exportado desde Cabina.");const f=clean(doc.flow);flows.push(f);current=f.id;mode="edit";moving=null;close();save();render();toast("Flujo importado.");}catch(err){toast(err.message||"No se pudo importar el flujo.");}};
function guard(fn){if(mode==="practice"&&taps.length)question("Salir de la práctica","Se descartará este intento.","Salir",fn);else fn();}
function begin(){
 const options=roles.filter(r=>flow().steps[r].length);if(!options.length){toast("Añade al menos un paso para practicar.");return;}
 modal("Practicar flujo",'<p class="note">'+esc(flow().name)+'</p><label class="field">Rol que practicarás<select id="practiceRole">'+options.map(r=>'<option '+(r===role?"selected":"")+' value="'+r+'">'+r+' · '+flow().steps[r].length+' pasos</option>').join("")+'</select></label><p class="note">Marca los mandos de memoria. Puedes cambiar de panel, deshacer un clic o finalizar aunque te falten pasos.</p>',submitBtn("Iniciar práctica"),()=>{
 role=$("practiceRole").value;mode="practice";taps=[];report=null;moving=null;aim=null;close();render();});
}
function finish(){report=assess(steps(),taps);mode="result";showRef=true;showTaps=true;render();}
function bind(id,fn){const e=$(id);if(e)e.onclick=fn;}
function pickView(v){view=v;zoom=1;aim=null;$("viewport").scrollTo(0,0);draw();}
function render(){
 const f=flow(),edit=mode==="edit",practice=mode==="practice",result=mode==="result";
 document.querySelectorAll("[data-nav]").forEach(b=>b.classList.toggle("active",b.dataset.nav===(edit?"edit":"practice")));
 $("headline").textContent=edit?"Flujos de cabina":practice?"Práctica de memoria":"Resultado de la práctica";
 $("intro").textContent=edit?"Marca los mandos en orden y practica la secuencia de cada piloto.":practice?"Selecciona los mandos en la secuencia que recuerdas.":"Compara tus clics con la secuencia de referencia guardada.";
 $("start").innerHTML=icon(edit?"play":practice?"check":"play")+(edit?"Practicar flujo":practice?"Comparar intento":"Repetir práctica");
 $("newFlow").hidden=!edit;$("start").disabled=edit&&!roles.some(r=>f.steps[r].length);
 $("settings").hidden=!edit;$("sidecap").textContent=edit?"FLUJO ACTIVO":practice?"PRÁCTICA EN CURSO":"COMPARACIÓN";
 $("flowName").textContent=f.name;$("refLine").innerHTML=icon("book")+" "+esc(f.source||"Sin referencia registrada");
 $("roleArea").innerHTML=edit?'<div class="roleChoice">'+roles.map(r=>'<button class="'+(r===role?"sel ":"")+(r==="PM"?"pm":"")+'" data-role="'+r+'" aria-pressed="'+(r===role)+'"><span class="dot '+(r==="PM"?"pm":"")+'"></span>'+r+' <span class="sub">'+(r==="PF"?"Pilot Flying":"Pilot Monitoring")+'</span></button>').join("")+'</div>':'<div class="chip"><span class="dot '+(role==="PM"?"pm":"")+'"></span> '+role+' · '+(role==="PF"?"Pilot Flying":"Pilot Monitoring")+'</div>';
 document.querySelectorAll("[data-role]").forEach(b=>b.onclick=()=>{role=b.dataset.role;moving=null;render();});
 const cap=(s,t)=>'<div class="seqcap">'+s+'<span class="count">'+t+'</span></div>';
 const badge=(i)=>'<span class="num '+(role==="PM"?"pm":"")+'">'+(i+1)+'</span>';
 if(edit){
 $("sequence").innerHTML=cap("SECUENCIA",steps().length+" pasos")+(steps().length?'<div class="steps">'+steps().map((s,i)=>'<button class="row" data-step="'+i+'">'+badge(i)+'<span><strong>'+esc(s.name)+'</strong><small>'+esc(s.action?s.action+" · ":"")+panels[s.panel].label+'</small></span><span class="end">'+icon("chevron")+'</span></button>').join("")+'</div>':'<div class="empty">Selecciona un mando en la cabina para crear el primer paso de '+role+'.</div>');
 document.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>{const i=+b.dataset.step;if(view!=="all"&&view!==steps()[i].panel)pickView(steps()[i].panel);editStep(null,i);});
 $("sideActions").innerHTML='<div class="sideBottom">'+button("refEdit","Editar referencia","btn wide","book")+'</div>';bind("refEdit",()=>flowDialog(false));
 }else if(practice){
 $("sequence").innerHTML=cap("INTENTO","En curso")+'<div class="statuscard"><div class="tally">'+taps.length+' <small class="count">clics</small></div><p class="note">El flujo de referencia contiene '+steps().length+' pasos.</p></div>';
 $("sideActions").innerHTML='<div class="sideBottom">'+button("undo","Deshacer clic","btn","undo")+button("hint","Pista","btn","hint")+'</div>';bind("undo",()=>{taps.pop();render();});$("undo").disabled=!taps.length;bind("hint",()=>{const i=Math.min(taps.length,steps().length-1);toast("Referencia "+(i+1)+" · "+steps()[i].name);});
 }else{
 const status={ok:"En orden",order:"Fuera de orden",missing:"Omitido"};
 $("sequence").innerHTML='<div class="statuscard"><div class="score">'+report.correct+' / '+report.total+'</div><p class="note">Mandos acertados en secuencia · '+report.extra.length+' clics extra</p></div>'+cap("PASO A PASO",role)+'<div class="steps">'+report.rows.map(r=>'<button class="row" data-focus="'+r.step+'">'+badge(r.step)+'<span><strong>'+esc(steps()[r.step].name)+'</strong><small class="'+(r.status==="ok"?"status-good":"status-warn")+'">'+status[r.status]+(r.tap!==null?" · tu clic "+(r.tap+1):"")+'</small></span></button>').join("")+report.extra.map(j=>'<button class="row" data-extra="'+j+'"><span class="num pm">×</span><span><strong>Clic '+(j+1)+' adicional</strong><small>'+panels[taps[j].panel].label+'</small></span></button>').join("")+'</div>';
 document.querySelectorAll("[data-focus]").forEach(b=>b.onclick=()=>focusPoint(steps()[+b.dataset.focus]));document.querySelectorAll("[data-extra]").forEach(b=>b.onclick=()=>focusPoint(taps[+b.dataset.extra]));
 $("sideActions").innerHTML='<div class="sideBottom smallActions"><button id="toggleRef" aria-pressed="'+showRef+'">'+(showRef?"✓ ":"")+"Referencia"+'</button><button id="toggleTaps" aria-pressed="'+showTaps+'">'+(showTaps?"✓ ":"")+"Mis clics"+'</button></div>';
 bind("toggleRef",()=>{showRef=!showRef;render();});bind("toggleTaps",()=>{showTaps=!showTaps;render();});
 }
 $("layers").hidden=!edit;$("layers").setAttribute("aria-pressed",String(both));$("layers").querySelector("span").textContent=both?"Ambos roles visibles":"Ver ambos roles";
 $("footTip").innerHTML=icon(edit?"pointer":practice?"target":"route")+" "+(edit?(moving?"Marca la nueva posición · Esc cancela.":"Haz clic en un mando para añadir un paso."):practice?"Marca de memoria y pulsa «Comparar intento».":"Círculos: referencia · rombos azules: tus clics.");
 savedStatus();draw();
}
function worldLayout(){
 if(view!=="all")return {w:1000,h:1000*panels[view].ratio,boxes:{[view]:{x:0,y:0,w:1000,h:1000*panels[view].ratio}}};
 let y=0;const boxes={};for(const p of ["overhead","central","pedestal"]){const w=p==="central"?1000:460,h=w*panels[p].ratio;boxes[p]={x:(1000-w)/2,y,w,h};y+=h+34;}return {w:1000,h:y-34,boxes};
}
const mapPoint=p=>{const b=geo[p.panel];return b?{x:b.x+p.x*b.w,y:b.y+p.y*b.h}:null;};
function draw(){
 const vp=$("viewport"),scene=$("scene"),w=vp.clientWidth,h=vp.clientHeight;if(!w||!h)return;
 const world=worldLayout(),padX=w<500?10:22,padY=h<420?50:56,scale=Math.min((w-2*padX)/world.w,(h-2*padY)/world.h)*zoom;
 const sw=Math.max(w,Math.ceil(world.w*scale+padX*2)),sh=Math.max(h,Math.ceil(world.h*scale+padY*2));
 scene.style.width=sw+"px";scene.style.height=sh+"px";geo={};
 for(const p of Object.keys(panels)){let img=$("panel-"+p);if(!img){img=document.createElement("img");img.id="panel-"+p;img.alt=panels[p].label+" del Airbus A320";img.draggable=false;img.src="./"+p+".webp";scene.insertBefore(img,$("overlay"));}
 const b=world.boxes[p];img.hidden=!b;if(!b)continue;const rect={x:(sw-world.w*scale)/2+b.x*scale,y:(sh-world.h*scale)/2+b.y*scale,w:b.w*scale,h:b.h*scale};geo[p]=rect;
 Object.assign(img.style,{left:rect.x+"px",top:rect.y+"px",width:rect.w+"px",height:rect.h+"px"});}
 $("viewTitle").textContent=view==="all"?"CABINA COMPLETA":panels[view].label.toUpperCase();$("zoomText").textContent=Math.round(zoom*100)+"%";$("minus").disabled=zoom<=1;$("plus").disabled=zoom>=16;
 document.querySelectorAll("[data-view]").forEach(b=>{b.classList.toggle("on",view===b.dataset.view);b.setAttribute("aria-pressed",String(view===b.dataset.view));});
 let paths="",markers="";
 function series(points,color,kind,tag){
 const mark=kind==="tap",opacity=mode==="edit"&&tag!==role?.6:1,rad=mark?9:12;
 let prev=null;points.forEach((p,i)=>{const cur=mapPoint(p);if(!cur){prev=null;return;}const {x,y}=cur;
 if(prev){const dx=x-prev.x,dy=y-prev.y,len=Math.hypot(dx,dy);
 if(len>rad*2+6){const ux=dx/len,uy=dy/len,tx=x-ux*(rad+2),ty=y-uy*(rad+2),sx=prev.x+ux*(rad+1),sy=prev.y+uy*(rad+1);
 const path='M '+sx+' '+sy+' L '+tx+' '+ty;const arrow='M '+(tx-ux*8-uy*4)+' '+(ty-uy*8+ux*4)+' L '+tx+' '+ty+' '+(tx-ux*8+uy*4)+' '+(ty-uy*8-ux*4);
 paths+='<g fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="'+opacity+'"><path d="'+path+'" stroke="#111b20" stroke-width="4.3"/><path d="'+path+'" stroke="'+color+'" stroke-width="2.2" '+(mark||tag==="PM"?'stroke-dasharray="5 4"':'')+'/>'+'<path d="'+arrow+'" stroke="'+color+'" stroke-width="2.4"/></g>';}}
 prev=cur;
 const shape=mark?'<path d="M 0 -11 11 0 0 11 -11 0Z" fill="#14354b" stroke="'+color+'" stroke-width="2"/>':'<circle r="12.5" fill="'+color+'" stroke="#18231e" stroke-width="2.5"/>';
 markers+='<g transform="translate('+x+' '+y+')" opacity="'+opacity+'">'+shape+'<text text-anchor="middle" y="4" font-family="Consolas,monospace" font-size="11.5" font-weight="bold" fill="'+(mark?"#f4fbff":"#142013")+'">'+(i+1)+'</text></g>';
 });}
 if(mode==="edit"){if(both){const other=role==="PF"?"PM":"PF";series(flow().steps[other],colors[other],"ref",other);}series(steps(),colors[role],"ref",role);}
 if(mode==="result"&&showRef)series(steps(),colors[role],"ref",role);
 if(mode==="practice"||(mode==="result"&&showTaps))series(taps,"#91d3ff","tap",role);
 if(aim){markers+='<g transform="translate('+aim.x+' '+aim.y+')" stroke="white" fill="none"><circle r="6"/><path d="M-11 0H-3m6 0h8M0-11v8m0 6v8"/></g>';}
 $("overlay").innerHTML=paths+markers;
}
function focusPoint(p){pickView(p.panel);changeZoom(2);const c=mapPoint(p),vp=$("viewport");aim=c;vp.scrollTo(c.x-vp.clientWidth/2,c.y-vp.clientHeight/2);draw();}
function changeZoom(z,anchor){
 const vp=$("viewport"),sc=$("scene"),ax=anchor?.x??vp.clientWidth/2,ay=anchor?.y??vp.clientHeight/2;
 const x=(vp.scrollLeft+ax)/sc.offsetWidth,y=(vp.scrollTop+ay)/sc.offsetHeight;zoom=Math.max(1,Math.min(16,z));aim=null;draw();vp.scrollTo(x*sc.offsetWidth-ax,y*sc.offsetHeight-ay);
}
function pointAt(x,y){
 for(const [panel,b] of Object.entries(geo)){if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)return {panel,x:(x-b.x)/b.w,y:(y-b.y)/b.h};}return null;
}
function place(x,y){
 if(mode==="result")return;
 const p=pointAt(x,y);if(!p){toast("Selecciona un punto dentro de la imagen del panel.");return;}
 if(mode==="practice"){if(taps.length>=500){toast("Compara este intento para continuar.");return;}taps.push(p);render();return;}
 if(moving){const s=steps().find(s=>s.id===moving);if(s)Object.assign(s,p);moving=null;save();render();return;}
 if(steps().length>=250){toast("Cada rol admite hasta 250 pasos.");return;}
 editStep(p);
}
const vp=$("viewport"),scene=$("scene");
scene.onclick=e=>{if(suppressClick){suppressClick=false;return;}const b=scene.getBoundingClientRect();place(e.clientX-b.left,e.clientY-b.top);};
let drag=null;
vp.onpointerdown=e=>{suppressClick=false;if(e.pointerType==="mouse"&&e.button===0){drag={x:e.clientX,y:e.clientY,l:vp.scrollLeft,t:vp.scrollTop,id:e.pointerId,active:false};}};
vp.onpointermove=e=>{if(!drag||drag.id!==e.pointerId||!(e.buttons&1))return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(Math.hypot(dx,dy)>5&&(vp.scrollWidth>vp.clientWidth||vp.scrollHeight>vp.clientHeight))drag.active=true;
 if(drag.active){vp.setPointerCapture(e.pointerId);vp.scrollTo(drag.l-dx,drag.t-dy);suppressClick=true;}};
vp.onpointerup=vp.onpointercancel=()=>{drag=null;};
vp.addEventListener("wheel",e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();const b=vp.getBoundingClientRect();changeZoom(zoom*(e.deltaY<0?1.2:1/1.2),{x:e.clientX-b.left,y:e.clientY-b.top});}},{passive:false});
vp.onkeydown=e=>{
 if(e.key==="Escape"&&moving){moving=null;render();return;}
 const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
 if(!delta&&e.key!=="Enter")return;e.preventDefault();if(!aim)aim={x:vp.scrollLeft+vp.clientWidth/2,y:vp.scrollTop+vp.clientHeight/2};
 if(e.key==="Enter"){place(aim.x,aim.y);return;}
 const speed=e.shiftKey?12:2;aim={x:Math.min(scene.offsetWidth,Math.max(0,aim.x+delta[0]*speed)),y:Math.min(scene.offsetHeight,Math.max(0,aim.y+delta[1]*speed))};
 if(aim.x<vp.scrollLeft||aim.x>vp.scrollLeft+vp.clientWidth||aim.y<vp.scrollTop||aim.y>vp.scrollTop+vp.clientHeight)vp.scrollTo(aim.x-vp.clientWidth/2,aim.y-vp.clientHeight/2);draw();
};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&moving){moving=null;render();}});
bind("plus",()=>changeZoom(zoom*1.5));bind("minus",()=>changeZoom(zoom/1.5));bind("fit",()=>changeZoom(1));
document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>pickView(b.dataset.view));
bind("start",()=>mode==="practice"?finish():begin());bind("newFlow",()=>flowDialog(true));bind("settings",()=>flowDialog(false));bind("layers",()=>{both=!both;render();});
bind("vault",()=>guard(()=>{if(mode==="practice"){mode="edit";render();}library();}));
document.querySelector('[data-nav="edit"]').onclick=()=>guard(()=>{mode="edit";moving=null;render();});
document.querySelector('[data-nav="practice"]').onclick=()=>{if(mode!=="practice")begin();};
if("ResizeObserver" in window)new ResizeObserver(draw).observe(vp);else window.addEventListener("resize",draw);
render();if(storeOK)save();


