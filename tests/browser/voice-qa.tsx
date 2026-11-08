import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from '../../context/authContext';
import { browserSpeak } from '../../services/browserVoice';
import { Assistant, openAssistant } from '../../components/assistant/Assistant';
import LoginScreen from '../../screens/auth/LoginScreen';
import '../../style.css';
if (import.meta.env.MODE !== 'demo' || import.meta.env.VITE_USE_FIREBASE_EMULATORS !== 'true' || !['localhost','127.0.0.1'].includes(location.hostname)) throw new Error('Voice QA requires the isolated local demo.');
const fixtures = [new URL('./fixtures/question-one.wav', import.meta.url).href, new URL('./fixtures/question-two.wav', import.meta.url).href];
function VoiceQA() {
  const {user,isLoading,logout}=useAuth();const [track,setTrack]=useState<MediaStreamTrack>();const [events,setEvents]=useState<string[]>([]);const [error,setError]=useState('');const [complete,setComplete]=useState(false);const playbackStarted=useRef(0);const playbackDurations=useRef<number[]>([]);
  const audio=useRef<HTMLAudioElement | undefined>(undefined);const context=useRef<AudioContext | undefined>(undefined);const turn=useRef(0);const lastState=useRef('');
  const voices=window.speechSynthesis.getVoices();
  useEffect(()=>{if(track)openAssistant();},[track]);
  const log=(message:string)=>setEvents(rows=>[...rows,`${new Date().toISOString()} ${message}`]);
  useEffect(()=>{const playback=(event:Event)=>{ const detail=(event as CustomEvent).detail;log('Native TTS '+JSON.stringify(detail));if(detail.stage==='start')playbackStarted.current=detail.at;if(detail.stage==='end')playbackDurations.current.push(detail.at-playbackStarted.current); };window.addEventListener('nanolabs_voice_playback',playback);const observer=new MutationObserver(()=>{
    const status=document.querySelector('.assistant-panel footer [role="status"]')?.textContent??'';
    if(status&&status!==lastState.current){lastState.current=status;log(status);
      if(status.includes('Listening')&&turn.current===fixtures.length&&playbackDurations.current.length===2&&playbackDurations.current.every(duration=>duration>50))setComplete(true);
      if(status.includes('Listening')&&turn.current<fixtures.length&&audio.current){
        const number=turn.current++;audio.current.src=fixtures[number];
        log(`Playing actual synthetic audio question ${number+1}`);
        void audio.current.play().catch(err=>setError(err.message));
      }
    }
  });observer.observe(document.body,{subtree:true,childList:true,characterData:true});return()=>{observer.disconnect();window.removeEventListener('nanolabs_voice_playback',playback);audio.current?.pause();void context.current?.close();};},[]);
  async function prepare(){
    try{
      setError('');turn.current=0;setComplete(false);playbackDurations.current=[];
      const ctx=new AudioContext();context.current=ctx;await ctx.resume();
      const element=new Audio();audio.current=element; element.onplaying=()=>log('Synthetic audio playback started');element.onended=()=>log('Synthetic audio playback ended');
      const source=ctx.createMediaElementSource(element);const destination=ctx.createMediaStreamDestination();source.connect(destination);
      setTrack(destination.stream.getAudioTracks()[0]);log('Prepared real audio stream; no microphone or fake recognition events.');
    }catch(err){setError(err instanceof Error?err.message:'Audio setup failed.');}
  }
  if(isLoading)return <p>Checking demo session…</p>;
  if(!user)return <LoginScreen initialPortal="patient" onLoginSuccess={()=>{}} onNavigateWebsite={()=>location.assign('/')} />;
  return <main className="p-8 max-w-3xl space-y-5"><p className="page-eyebrow">Isolated demo only</p><h1 className="page-title">Real-audio voice QA</h1><p>Two synthetic spoken questions go through the browser’s native speech recognizer, the real authenticated Gemini assistant, and the browser’s real spoken playback. No microphone is used and no transcript or AI answer is mocked.</p><p>Click Prepare, then Start voice in the assistant. Audio plays directly into a live MediaStreamTrack. Listening after each spoken reply automatically triggers the next question.</p><button disabled={!!track} onClick={prepare} className="primary-button">Prepare synthetic audio test</button><button onClick={logout} className="ml-4 underline">Sign out</button>{error&&<p role="alert">{error}</p>}<p className="text-xs">Native voices: {voices.length}; default: {voices.find(voice=>voice.default)?.name||'Not loaded'}</p><button className="primary-button" onClick={()=>{void browserSpeak('Nano Labs voice playback test is speaking now.').catch(err=>setError(err.message));}}>Test spoken playback</button><p role="status" className="rounded-xl bg-teal-50 text-teal-900 p-4 font-semibold">{complete?'PASS: two actual speech inputs, two Gemini replies, two completed spoken playbacks, and automatic return to listening.':'Voice test has not completed yet.'}</p><ol className="text-xs space-y-3 font-mono">{events.map((event,i)=><li key={i}>{event}</li>)}</ol>{track&&<Assistant voiceInputTrack={track}/>}</main>;
}
createRoot(document.getElementById('root')!).render(<AuthProvider><VoiceQA/></AuthProvider>);
