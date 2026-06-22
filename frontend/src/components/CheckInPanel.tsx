import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGymStore, type Member } from '../store/useGymStore';
import { Search } from 'lucide-react';

export default function CheckInPanel({ className = '' }: { className?: string }) {
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { currentMember, setCurrentMember } = useGymStore();

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/members/${dni}`);
      const data = await res.json();
      
      if (res.ok && !data.error) {
        setCurrentMember(data);
        setDni('');
      } else {
        setError('Socio no encontrado');
        setCurrentMember(null);
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
      // Keep focus on input for kiosk mode
      inputRef.current?.focus();
    }
  };

  const getGlowColor = (status: Member['status']) => {
    switch (status) {
      case 'AL DIA': return 'shadow-[0_0_40px_rgba(34,197,94,0.6)] border-green-500';
      case 'POR VENCER': return 'shadow-[0_0_40px_rgba(234,179,8,0.6)] border-yellow-500';
      case 'DEUDA': return 'shadow-[0_0_40px_rgba(239,68,68,0.8)] border-red-500 animate-pulse';
      default: return 'border-neutral-700';
    }
  };

  const getStatusText = (status: Member['status']) => {
    switch (status) {
      case 'AL DIA': return 'text-green-400';
      case 'POR VENCER': return 'text-yellow-400';
      case 'DEUDA': return 'text-red-400';
      default: return 'text-white';
    }
  };

  return (
    <div className={`p-6 flex flex-col ${className}`}>
      <div className="mb-8">
        <div className="inline-flex items-center justify-center p-2 rounded-xl mb-4 ring-1 ring-white/10" style={{backgroundColor:'rgba(243,142,38,0.2)'}}>
          <Search style={{color:'#F38E26'}} size={20} />
        </div>
        <h1 className="text-3xl font-black mb-1 tracking-tight bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent">Access Control</h1>
        <p className="text-neutral-400 text-sm font-medium">Ingrese su DNI para acceder</p>
      </div>

      <form onSubmit={handleCheckIn} className="mb-8 relative w-full group">
        <input 
          ref={inputRef}
          type="text" 
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          placeholder="Número de DNI" 
          autoFocus
          className="w-full bg-white/5 text-white text-2xl p-4 rounded-2xl border border-white/10 focus:outline-none transition-all placeholder:text-neutral-600 backdrop-blur-md" 
          onFocus={e=>{e.currentTarget.style.borderColor='rgba(243,142,38,0.5)';e.currentTarget.style.boxShadow='0 0 0 4px rgba(243,142,38,0.1)'}}
          onBlur={e=>{e.currentTarget.style.borderColor='';e.currentTarget.style.boxShadow=''}}
        />
        <button 
          type="submit" 
          disabled={loading}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-xl shadow-lg transition-all hover:scale-105" style={{backgroundColor:'#F38E26', boxShadow:'0 8px 20px rgba(243,142,38,0.3)'}}
        >
          {loading ? (
             <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Search size={24} />
          )}
        </button>
      </form>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 text-red-400 p-3 rounded-xl border border-red-500/20 mb-6 backdrop-blur-md text-center text-sm font-medium shadow-lg shadow-red-500/10"
        >
          {error}
        </motion.div>
      )}

      <div className="flex-grow flex flex-col justify-end pb-4">
        <AnimatePresence mode="wait">
          {currentMember && (
            <motion.div
              key={currentMember.dni}
              initial={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
              transition={{ type: "spring", bounce: 0.4 }}
              className={`bg-white/5 rounded-[1.5rem] p-6 flex flex-col items-center text-center transition-all duration-500 backdrop-blur-xl border border-white/10 ${getGlowColor(currentMember.status)}`}
            >
              {currentMember.photo_url ? (
                <img 
                  src={currentMember.photo_url} 
                  alt="Member" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-neutral-700/50 mb-4 drop-shadow-2xl" 
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-neutral-700 mb-4" />
              )}
              
              <h2 className="text-2xl font-bold mb-1">{currentMember.name}</h2>
              <p className="text-sm text-neutral-400 mb-3">DNI: {currentMember.dni}</p>
              
              <div className="mt-2 px-4 py-1.5 rounded-full bg-black/50 border border-neutral-700/50">
                <span className={`text-base font-bold ${getStatusText(currentMember.status)}`}>
                  {currentMember.status}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
