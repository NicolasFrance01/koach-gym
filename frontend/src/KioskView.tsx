import CheckInPanel from './components/CheckInPanel';
import CameraPanel from './components/CameraPanel';
import AlarmOverlay from './components/AlarmOverlay';
import { useGymStore } from './store/useGymStore';
import { useEffect, useState } from 'react';

export default function KioskView() {
  const { setAlarmActive, currentMember, setCurrentMember } = useGymStore();
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const isHttps = window.location.protocol === 'https:';
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isHttps && !isLocal) {
        setWsConnected(false);
        return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = isLocal ? 'ws://localhost:8000/ws' : `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'alarm_state') {
          setAlarmActive(data.active);
        }
      } catch (e) {
        console.error(e);
      }
    };
    return () => ws.close();
  }, [setAlarmActive]);

  useEffect(() => {
    if (currentMember) {
      const timer = setTimeout(() => {
        setCurrentMember(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [currentMember, setCurrentMember]);

  return (
    <div className="flex h-screen bg-[#212C40] text-white overflow-hidden font-sans selection:bg-orange-500/30">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-red-900/10 pointer-events-none" />
      
      <div className="w-[30%] min-w-[350px] flex-shrink-0 z-10 border-r border-white/5 bg-black/40 backdrop-blur-3xl shadow-2xl shadow-black/50">
        <CheckInPanel className="h-full bg-transparent" />
      </div>

      <div className="flex-1 flex flex-col z-0 relative bg-[#212C40]">
        <CameraPanel className="h-full w-full object-cover" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
             <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
             <span className="text-sm font-mono text-white/50">{wsConnected ? 'WS CONNECTED' : 'WS OFFLINE'}</span>
          </div>
          <span className="text-sm font-mono text-white/50">SYSTEM: GYM-AI-YOLOv8</span>
        </div>
      </div>
      
      <AlarmOverlay />

      {window.location.protocol === 'https:' && !window.location.hostname.includes('127.0.0.1') && !window.location.hostname.includes('localhost') && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-[#212C40] border border-red-500/30 rounded-[40px] p-10 text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-red-500">
              <AlertTriangle size={48} />
            </div>
            <h2 className="text-3xl font-black mb-4 tracking-tight">Acceso Seguro Detectado</h2>
            <p className="text-neutral-400 mb-8 leading-relaxed">
              Vercel (HTTPS) bloquea la conexión con la cámara local por seguridad. Para usar el control de acceso, por favor abre:
            </p>
            <div className="bg-black/50 p-6 rounded-3xl border border-white/10 mb-8 font-mono text-orange-400 break-all">
              http://localhost:5173
            </div>
            <button 
              onClick={() => window.location.href = 'http://localhost:5173'}
              className="w-full py-4 bg-[#6E8AC9] text-white border border-[#F38E26] font-bold rounded-2xl hover:scale-[1.02] transition-all"
            >
              Ir al Kiosko Local
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AlertTriangle(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
    </svg>
  );
}
