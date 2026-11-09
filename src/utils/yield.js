// Real cooperative CPU scheduling, not a visual/loading delay.
export function yieldToBrowser(){
  if(globalThis.scheduler?.yield)return globalThis.scheduler.yield();
  return new Promise(resolve=>{
    const channel=new MessageChannel();
    channel.port1.onmessage=()=>{channel.port1.close();channel.port2.close();resolve();};
    channel.port2.postMessage(0);
  });
}
