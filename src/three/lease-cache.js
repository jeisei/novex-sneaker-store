// Bounded CPU model ownership. Never share live scene nodes between viewers.
export function createLeaseCache({load,suspend,dispose,weight=()=>0,maxEntries=2,maxBytes=192*1024*1024}) {
  const entries=new Map();let tick=0;
  function remove(key,entry){
    entries.delete(key);entry.controller.abort();
    if(entry.value)dispose(entry.value);
  }
  function prune(){
    let bytes=[...entries.values()].reduce((sum,e)=>sum+(e.bytes??0),0);
    for(const[key,e]of [...entries].sort((a,b)=>a[1].used-b[1].used)){
      if(entries.size<=maxEntries&&bytes<=maxBytes)break;
      if(e.active||e.waiters||!e.value)continue;
      bytes-=e.bytes;remove(key,e);
    }
  }
  return {
    async acquire(key,signal,onTiming=()=>{}){
      signal.throwIfAborted();let entry=entries.get(key);
      if(!entry){
        entry={controller:new AbortController(),active:false,waiters:0,used:++tick};entries.set(key,entry);
        entry.promise=Promise.resolve().then(()=>load(key,entry.controller.signal,onTiming)).then(value=>{
          if(entries.get(key)!==entry){dispose(value);throw new DOMException('Stale model','AbortError');}
          entry.value=value;entry.bytes=weight(value);return value;
        }).catch(error=>{if(entries.get(key)===entry)entries.delete(key);throw error;});
      }else onTiming('cacheHit',performance.now());
      entry.waiters++;let abort;
      try{
        const cancelled=new Promise((_,reject)=>{abort=()=>reject(signal.reason??new DOMException('Aborted','AbortError'));signal.addEventListener('abort',abort,{once:true});});
        const value=await Promise.race([entry.promise,cancelled]);signal.throwIfAborted();
        if(entry.active)throw new Error('Model already leased to another viewer');
        entry.active=true;entry.used=++tick;let released=false;
        return {model:value,release(){
          if(released)return;released=true;suspend(value);entry.active=false;entry.used=++tick;prune();
        }};
      }finally{
        signal.removeEventListener('abort',abort);entry.waiters--;
        if(!entry.waiters&&!entry.active&&!entry.value&&entries.get(key)===entry)remove(key,entry);
        prune();
      }
    },
    stats(){return {entries:entries.size,active:[...entries.values()].filter(e=>e.active).length,bytes:[...entries.values()].reduce((sum,e)=>sum+(e.bytes??0),0)};},
    has(key){return Boolean(entries.get(key)?.value);},
    clear(){for(const[key,e]of entries)if(!e.active&&!e.waiters)remove(key,e);},
  };
}
