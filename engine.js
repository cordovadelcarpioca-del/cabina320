"use strict";
const CabinaEngine = (() => {
  const panels = {overhead:{label:"Overhead",ratio:3281/1700},central:{label:"Panel central",ratio:1277/3840},pedestal:{label:"Pedestal",ratio:2820/1700}};
  const uid = () => globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+Math.random().toString(36).slice(2);
  const newFlow = (name,source="") => ({id:uid(),name,source,curve:.16,steps:{PF:[],PM:[]}});
  const demo = () => {
    const f=newFlow("Reconocimiento del panel","Ejercicio de ubicación · sin SOP");
    function add(role,name,x,y,action) { f.steps[role].push({id:uid(),panel:"central",name,x,y,action,radius:.031}); }
    add("PF","PFD izquierdo",.145,.445,"Localizar"); add("PF","ND izquierdo",.273,.445,"Localizar");
    add("PF","ECAM superior",.503,.44,"Localizar"); add("PF","ECAM inferior",.503,.78,"Localizar");
    add("PM","PFD derecho",.846,.445,"Localizar"); add("PM","ND derecho",.72,.445,"Localizar"); add("PM","ECAM inferior",.503,.78,"Localizar");
    return f;
  };
  const text=(s,max)=>typeof s==="string"&&s.length<=max;
  const inRange=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
  function clean(raw) {
    if(!raw || !text(raw.name,100)||!raw.name.trim()||!text(raw.source??"",250)) throw Error("Nombre o referencia no válidos.");
    const flow=newFlow(raw.name.trim(),raw.source||"");
    if(inRange(raw.curve,0,.36))flow.curve=raw.curve;
    for(const role of ["PF","PM"]) {
      const steps=raw.steps?.[role]; if(!Array.isArray(steps)||steps.length>250)throw Error("La secuencia contiene pasos no válidos.");
      for(const s of steps){
        if(!s||!Object.hasOwn(panels,s.panel)||!text(s.name,100)||!s.name.trim()||!text(s.action??"",160)||!inRange(s.x,0,1)||!inRange(s.y,0,1)||!inRange(s.radius,.001,.1))throw Error("Hay un paso con datos no válidos.");
        flow.steps[role].push({id:uid(),panel:s.panel,name:s.name.trim(),action:s.action||"",x:s.x,y:s.y,radius:s.radius,...(inRange(s.bend,-.36,.36)?{bend:s.bend}:{})});
      }
    }
    return flow;
  }
  const maxImportBytes=20*1024*1024;
  function createBackup(flows,current){
    return {format:"cabina-a320-library",version:1,exportedAt:new Date().toISOString(),current,flows};
  }
  function readFlowFile(doc){
    if(!doc||doc.version!==1)throw Error("Selecciona un archivo .cabina320 o un JSON exportado desde Cabina.");
    if(doc.format==="cabina-a320"){
      const flow=clean(doc.flow);
      return {flows:[flow],current:flow.id};
    }
    if(doc.format!=="cabina-a320-library")throw Error("Selecciona un archivo .cabina320 o un JSON exportado desde Cabina.");
    if(!Array.isArray(doc.flows)||!doc.flows.length)throw Error("La copia no contiene flujos.");
    // Validate the complete library before the caller changes or saves any data.
    // Fresh IDs keep imported copies independent from flows already in this browser.
    const flows=doc.flows.map(clean);
    const index=typeof doc.current==="string"?doc.flows.findIndex(f=>f.id===doc.current):-1;
    return {flows,current:flows[Math.max(0,index)].id};
  }
  function distance(a,b){return a.panel!==b.panel?Infinity:Math.hypot(a.x-b.x,(a.y-b.y)*panels[a.panel].ratio);}
  // Match the nearest switch first. When the same control occurs twice,
  // sequence alignment can choose either occurrence without mixing nearby switches.
  function assess(steps,taps){
    const n=steps.length,m=taps.length;
    const matches=taps.map(t=>{
      const d=steps.map(s=>distance(t,s)),best=Math.min(...d.map((v,i)=>v<=steps[i].radius?v:Infinity));
      return d.map((v,i)=>Number.isFinite(best)&&v<=steps[i].radius&&v-best<.0008);
    });
    const dp=Array.from({length:n+1},()=>new Uint16Array(m+1));
    for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=matches[j][i]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);
    const rows=steps.map((s,i)=>({step:i,status:"missing",tap:null})),used=new Set();
    for(let i=0,j=0;i<n&&j<m;){
      if(matches[j][i]&&dp[i][j]===1+dp[i+1][j+1]){rows[i]={step:i,status:"ok",tap:j};used.add(j);i++;j++;}
      else if(dp[i+1][j]>dp[i][j+1])i++;else j++;
    }
    for(const row of rows)if(row.status==="missing"){
      const j=matches.findIndex((v,j)=>!used.has(j)&&v[row.step]);
      if(j>=0){row.status="order";row.tap=j;used.add(j);}
    }
    const extra=taps.map((_,j)=>j).filter(j=>!used.has(j));
    return {rows,extra,correct:dp[0][0],total:n};
  }
  return {panels,uid,newFlow,demo,clean,assess,maxImportBytes,createBackup,readFlowFile};
})();
if(typeof module!=="undefined")module.exports=CabinaEngine;

