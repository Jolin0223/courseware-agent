import type { StateStorage } from 'zustand/middleware';
import toast from '../utils/toast';

// Project snapshots and uploaded media exceed localStorage's small quota.
// Keep one ordered write queue and migrate the old value only after a durable commit.
let database:Promise<IDBDatabase>|undefined;
let writes:Promise<void>=Promise.resolve();
let warned=false;
const memory=new Map<string,string>();
function openDatabase(){
 if(!database)database=new Promise<IDBDatabase>((resolve,reject)=>{
  const request=indexedDB.open('courseware-projects',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('state');
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();database=undefined;};resolve(db);};
  request.onerror=()=>{database=undefined;reject(request.error);};
  request.onblocked=()=>{database=undefined;reject(new Error('本地数据库被其他页面占用'));};
 });
 return database;
}
async function transaction(key:string,value?:string,remove=false):Promise<string|null>{
 const db=await openDatabase();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('state',value!==undefined||remove?'readwrite':'readonly'),store=tx.objectStore('state');
  const request=remove?store.delete(key):value!==undefined?store.put(value,key):store.get(key);
  tx.oncomplete=()=>resolve(typeof request.result==='string'?request.result:null);
  tx.onerror=()=>reject(tx.error||request.error);
  tx.onabort=()=>reject(tx.error||new Error('本地保存中断'));
 });
}
// Separate clone windows edit separate projects. Merge only this window's changes
// in one transaction so an older tab cannot overwrite a newly created clone.
async function saveProjectChanges(key:string,value:string,previous?:string){
 const incoming=JSON.parse(value),before=previous?JSON.parse(previous).state.projects:{},projects=incoming.state.projects;
 const changed=Object.keys(projects).filter(id=>JSON.stringify(projects[id])!==JSON.stringify(before[id]));
 const removed=Object.keys(before).filter(id=>!projects[id]);
 const db=await openDatabase();
 await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction('state','readwrite'),store=tx.objectStore('state'),read=store.get(key);
  read.onsuccess=()=>{
   try{
    const saved=typeof read.result==='string'?JSON.parse(read.result):incoming;
    const merged={...saved.state.projects};
    for(const id of changed)merged[id]=projects[id];
    for(const id of removed)delete merged[id];
    store.put(JSON.stringify({...incoming,state:{...incoming.state,projects:merged}}),key);
   }catch{tx.abort();}
  };
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('本地保存中断'));
 });
}
function localValue(key:string){try{return localStorage.getItem(key);}catch{return null;}}
function reportFailure(){if(!warned){warned=true;toast('本地保存暂时失败，修改仍保留在当前页面，请暂勿关闭页面。');}}
export const videoProjectStorage:StateStorage={
 getItem:async key=>{
  if(memory.has(key))return memory.get(key)!;
  let saved:string|null=null;
  if(typeof indexedDB!=='undefined')try{saved=await transaction(key);}catch{/* Read the previous local cache if the database is unavailable. */}
  if(saved===null){
   saved=localValue(key);
   if(saved!==null&&typeof indexedDB!=='undefined')try{await transaction(key,saved);localStorage.removeItem(key);}catch{/* Keep the original cache until migration succeeds. */}
  }
  if(saved!==null)memory.set(key,saved);
  return saved;
 },
 setItem:(key,value)=>{
  const previous=memory.get(key);
  memory.set(key,value);
  writes=writes.then(async()=>{
   try{
    if(typeof indexedDB==='undefined')localStorage.setItem(key,value);
    else{
     if(key==='video-courseware-platform-v2')await saveProjectChanges(key,value,previous);
     else await transaction(key,value);
     // Only the migrated project cache is removed; unrelated browser data stays intact.
     try{localStorage.removeItem(key);}catch{/* The database copy is already durable. */}
    }
    warned=false;
   }catch{
    // Storage failures must not escape into React and blank the whole page.
    reportFailure();
   }
  });
  return writes;
 },
 removeItem:key=>{
  memory.delete(key);
  writes=writes.then(async()=>{try{if(typeof indexedDB!=='undefined')await transaction(key,undefined,true);localStorage.removeItem(key);}catch{reportFailure();}});
  return writes;
 },
};
