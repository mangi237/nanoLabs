import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VoiceSession } from '../services/voiceSession.ts';
const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
function harness(ask=async()=> 'The answer') {
 const recognizers=[];const states=[];const events=[];let finishSpeech;
 const voice=new VoiceSession({recognition:()=>{const recognition={start(){events.push('mic:start');this.onstart?.();},abort(){events.push('mic:abort');},onresult:null,onend:null,onerror:null};recognizers.push(recognition);return recognition;},ask:async text=>{events.push('ask:'+text);return ask(text);},speak:async text=>{events.push('speak:'+text);await new Promise(resolve=>{finishSpeech=resolve;});},cancelSpeech:()=>events.push('speech:cancel'),state:(state,error)=>states.push({state,error}),delay:1});
 const speak=()=>finishSpeech();const result=(index=0)=>recognizers[index].onresult({resultIndex:0,results:[{0:{transcript:'Track my booking'},isFinal:true}]});
 return {voice,recognizers,states,events,speak,result};
}
test('hands-free alternates listening, network and speech without microphone echo; stop releases resources',async()=>{
 const h=harness();h.voice.start();h.voice.start();assert.equal(h.recognizers.length,1);
 const done=h.result();await tick();assert.deepEqual(h.events.slice(0,4),['mic:start','mic:abort','ask:Track my booking','speak:The answer']);assert.equal(h.recognizers.length,1);
 h.speak();await done;assert.equal(h.recognizers.length,2);assert.equal(h.states.at(-1).state,'listening');
 h.voice.stop();assert.equal(h.voice.active,false);assert.equal(h.states.at(-1).state,'off');assert.equal(h.recognizers[1].onend,null);
});
test('closing while waiting for an answer prevents speech and microphone restart',async()=>{
 let resolve;const h=harness(()=>new Promise(done=>resolve=done));h.voice.start();const done=h.result();h.voice.stop();resolve('Late answer');await done;
 assert.equal(h.recognizers.length,1);assert(!h.events.includes('speak:Late answer'));
});
test('permission denial and provider failure stop the loop and show an error',async()=>{
 const h=harness();h.voice.start();h.recognizers[0].onerror({error:'not-allowed'});await tick();assert.equal(h.voice.active,false);assert.equal(h.recognizers.length,1);assert.match(h.states.at(-1).error,/not-allowed/);
 const failed=harness(async()=>{throw new Error('Provider unavailable');});failed.voice.start();await failed.result();assert.equal(failed.voice.active,false);assert.equal(failed.states.at(-1).error,'Provider unavailable');assert(!failed.events.some(event=>event.startsWith('speak:')));
});
test('browser end-of-session restarts only while active; cancelled restarts cannot leak microphone',async()=>{
 const h=harness();h.voice.start();h.recognizers[0].onend();await tick();assert.equal(h.recognizers.length,2);h.recognizers[1].onend();h.voice.stop();await tick();assert.equal(h.recognizers.length,2);
});
test('playback failure stops recognition and surfaces the error instead of silently resuming',async()=>{
 const states=[];let recognition;const voice=new VoiceSession({recognition:()=>{recognition={start(){this.onstart?.();},abort(){},onresult:null,onend:null,onerror:null};return recognition;},ask:async()=> 'Answer',speak:async()=>{throw new Error('Playback failed');},cancelSpeech(){},state:(state,error)=>states.push({state,error})});
 voice.start();await recognition.onresult({resultIndex:0,results:[{0:{transcript:'Question'},isFinal:true}]});assert.equal(voice.active,false);assert.equal(states.at(-1).error,'Playback failed');
});
test('Listening appears only after native recognition confirms startup',()=>{
 const states=[];let recognition;const voice=new VoiceSession({recognition:()=>{recognition={start(){},abort(){},onresult:null,onend:null,onerror:null};return recognition;},ask:async()=>'',speak:async()=>{},cancelSpeech(){},state:state=>states.push(state)});
 voice.start();assert.equal(states.at(-1),'starting');recognition.onstart();assert.equal(states.at(-1),'listening');voice.stop();
});
test('a recognizer that never starts fails visibly and releases the session',t=>{
 t.mock.timers.enable({apis:['setTimeout']});const states=[];let aborted=false;
 const voice=new VoiceSession({recognition:()=>({start(){},abort(){aborted=true;},onresult:null,onend:null,onerror:null}),ask:async()=>'',speak:async()=>{},cancelSpeech(){},state:(state,error)=>states.push({state,error})});
 voice.start();t.mock.timers.tick(10001);assert.equal(voice.active,false);assert.equal(aborted,true);assert.equal(states.at(-1).state,'error');assert.match(states.at(-1).error,/did not start/);
});
