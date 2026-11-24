"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const engine=require("../engine.js");
const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("const CabinaEngine ="))[1];
const embeddedModule={exports:{}};
vm.runInNewContext(inline,{module:embeddedModule,crypto:globalThis.crypto});

function fixture(api){
 const first=api.demo(),second=api.newFlow("Después del arranque · ñ","Manual · página 12");
 first.curve=.3;first.steps.PF[1].bend=-.16;
 second.steps.PF=[{id:"pf",panel:"overhead",name:"APU BLEED",action:"Comprobar",x:0,y:1,radius:.009,bend:0}];
 second.steps.PM=[{id:"pm",panel:"pedestal",name:"Radio",action:"Identificar",x:1,y:0,radius:.031,bend:.3}];
 return [first,second];
}
function withoutIDs(flow){
 return {name:flow.name,source:flow.source,curve:flow.curve,steps:Object.fromEntries(["PF","PM"].map(role=>[role,flow.steps[role].map(({id,...step})=>({...step}))]))};
}
// The published HTML and the standalone engine must accept the same backups.
for(const [name,api] of [["standalone",engine],["embedded",embeddedModule.exports]]){
 test(`${name}: a complete backup preserves both roles, geometry, arrows and the active flow`,()=>{
  const flows=fixture(api),before=JSON.stringify(flows);
  const doc=JSON.parse(JSON.stringify(api.createBackup(flows,flows[1].id)));
  assert.equal(doc.format,"cabina-a320-library");assert.equal(doc.version,1);
  assert.ok(Number.isFinite(Date.parse(doc.exportedAt)));
  const restored=api.readFlowFile(doc);
  assert.equal(restored.flows.length,2);assert.equal(restored.current,restored.flows[1].id);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.flows.map(withoutIDs))),JSON.parse(JSON.stringify(flows.map(withoutIDs))));
  assert.equal(JSON.stringify(flows),before);
  const originals=new Set(flows.flatMap(f=>[f.id,...f.steps.PF.map(s=>s.id),...f.steps.PM.map(s=>s.id)]));
  const copies=restored.flows.flatMap(f=>[f.id,...f.steps.PF.map(s=>s.id),...f.steps.PM.map(s=>s.id)]);
  assert.equal(new Set(copies).size,copies.length);
  assert.ok(copies.every(id=>!originals.has(id)));
 });
 test(`${name}: previous single-flow JSON files remain compatible`,()=>{
  const source=fixture(api)[0],restored=api.readFlowFile({format:"cabina-a320",version:1,flow:source});
  assert.equal(restored.flows.length,1);assert.equal(restored.current,restored.flows[0].id);
  assert.deepEqual(JSON.parse(JSON.stringify(withoutIDs(restored.flows[0]))),JSON.parse(JSON.stringify(withoutIDs(source))));
 });
 test(`${name}: missing active selection falls back to the first imported flow`,()=>{
  const restored=api.readFlowFile(api.createBackup(fixture(api),"missing"));
  assert.equal(restored.current,restored.flows[0].id);
 });
 test(`${name}: an empty editable flow survives a backup`,()=>{
  const restored=api.readFlowFile(api.createBackup([api.newFlow("Vacío")],"missing"));
  assert.equal(restored.flows[0].steps.PF.length,0);assert.equal(restored.flows[0].steps.PM.length,0);
 });
 test(`${name}: a bad flow anywhere rejects the whole library`,()=>{
  const flows=fixture(api);flows[1].steps.PM[0].x=2;
  assert.throws(()=>api.readFlowFile(api.createBackup(flows,flows[0].id)),/paso con datos no válidos/);
 });
 test(`${name}: unsupported versions and unrelated or empty files are rejected`,()=>{
  const flows=fixture(api);
  for(const doc of [null,{},[],{format:"cabina-a320-library",version:2,flows},
   {format:"unrelated",version:1,flows},{format:"cabina-a320-library",version:1,flows:[]},
   {format:"cabina-a320-library",version:1,flows:{}},{format:"cabina-a320",version:1}]){
   assert.throws(()=>api.readFlowFile(doc));
  }
 });
 test(`${name}: large libraries are no longer constrained by the old single-flow 1 MB limit`,()=>{
  const flows=Array.from({length:1500},()=>api.demo());
  const serialized=JSON.stringify(api.createBackup(flows,flows[1499].id));
  assert.ok(Buffer.byteLength(serialized)>1000000);assert.ok(Buffer.byteLength(serialized)<api.maxImportBytes);
  assert.equal(api.readFlowFile(JSON.parse(serialized)).flows.length,1500);
 });
}
