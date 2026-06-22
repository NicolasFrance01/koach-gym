import { Zap, Brain, Dumbbell, Clock, Check, Play, LayoutDashboard, User, TrendingUp, ArrowUpRight, X, Lock } from 'lucide-react';
import { useState } from 'react';
import { Tooltip, ResponsiveContainer, CartesianGrid, XAxis, YAxis, LineChart, Line, Legend } from 'recharts';

export default function UserApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [activeTab, setActiveTab] = useState('Home');
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? "http://localhost:8000" 
    : "/api";

  // User Data State
  const [userData, setUserData] = useState({
    name: "", dni: "", plan: "Miembro", maxDaysPerWeek: 7, streak: 0,
    currentRoutine: [
      { id: 1, name: "Press de Banca", sets: "4", reps: "10", weight: 0, completed: false },
      { id: 2, name: "Sentadillas", sets: "3", reps: "12", weight: 0, completed: false },
      { id: 3, name: "Jalón al Pecho", sets: "4", reps: "10", weight: 0, completed: false }
    ],
    evolution: [
      { date: "Ene", "Press de Banca": 40, "Sentadillas": 60, "Jalón al Pecho": 35 },
      { date: "Feb", "Press de Banca": 45, "Sentadillas": 70, "Jalón al Pecho": 45 },
      { date: "Mar", "Press de Banca": 55, "Sentadillas": 85, "Jalón al Pecho": 50 },
      { date: "Abr", "Press de Banca": 60, "Sentadillas": 95, "Jalón al Pecho": 55 }
    ],
    attendanceHistory: []
  });

  const [bookings, setBookings] = useState<any[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [selectedExs, setSelectedExs] = useState<string[]>([]);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, password })
      });
      
      const data = await res.json();
      if (res.ok) {
        setUserData(prev => ({
          ...prev,
          name: data.member.name,
          dni: data.member.dni,
          plan: data.member.membership_type,
          streak: 5 // Mock streak for now
        }));
        setIsAuthenticated(true);
      } else {
        alert(data.detail || "Error al ingresar");
      }
    } catch (err) {
      alert("Error de conexión con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/user/${userData.dni}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword })
      });
      if (res.ok) {
        alert("Contraseña actualizada con éxito");
        setNewPassword('');
      } else {
        alert("Error al actualizar contraseña");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExercise = (id: number) => {
    setUserData(prev => ({
      ...prev,
      currentRoutine: prev.currentRoutine.map(ex => ex.id === id ? { ...ex, completed: !ex.completed } : ex)
    }));
  };

  const updateWeight = (id: number, newWeight: number) => {
    setUserData(prev => ({
      ...prev,
      currentRoutine: prev.currentRoutine.map(ex => ex.id === id ? { ...ex, weight: newWeight } : ex)
    }));
  };

  const handleConfirmBooking = () => {
    const booking = { day: selectedDay, time: selectedTime, exercises: selectedExs };
    if (bookings.length >= userData.maxDaysPerWeek) {
      alert(`Límite alcanzado (${userData.maxDaysPerWeek} días)`);
      return;
    }
    setBookings([...bookings, booking]);
    setIsBookingModalOpen(false);
    setSelectedExs([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#212C40] flex flex-col items-center justify-center p-8 font-sans">
        <div className="w-full max-w-sm bg-black/30 border border-white/10 p-10 rounded-[40px] backdrop-blur-2xl shadow-3xl space-y-10">
          <div className="text-center">
            <div className="w-24 h-24 rounded-[2.5rem] mx-auto flex items-center justify-center mb-8 animate-pulse" style={{backgroundColor:'#F38E26', boxShadow:'0 20px 60px rgba(243,142,38,0.4)'}}><Brain size={48} className="text-white" /></div>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-2">KOACH APP</h1>
            <p className="text-white/20 text-xs font-black uppercase tracking-[0.4em]">Personal Fitness OS</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
             <div className="space-y-2"><label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-6">Documento</label><input type="text" className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 px-8 text-white outline-none focus:border-[#F38E26] transition-all text-center font-black" value={dni} onChange={e=>setDni(e.target.value)} required /></div>
             <div className="space-y-2"><label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-6">Password</label><input type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 px-8 text-white outline-none focus:border-[#F38E26] transition-all text-center font-black" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
             <button type="submit" disabled={isLoading} className="w-full py-5 text-white bg-[#6E8AC9] border border-[#F38E26] rounded-[2rem] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all text-sm disabled:opacity-50 shadow-lg shadow-[#F38E26]/10">
               {isLoading ? "Ingresando..." : "Entrar"}
             </button>
          </form>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Training':
        return (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
             <div className="bg-gradient-to-br from-orange-500 to-red-600 p-10 rounded-[50px] text-white shadow-3xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 p-10 opacity-10 rotate-12"><Dumbbell size={160}/></div>
                <h3 className="text-3xl font-black mb-2 tracking-tighter">Plan del Día</h3>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Sigue tu progreso y sube cargas</p>
             </div>
             <div className="space-y-4">
                {userData.currentRoutine.map(ex => (
                  <div key={ex.id} className={`p-8 rounded-[40px] border transition-all ${ex.completed ? 'bg-green-500/10 border-green-500/20 shadow-lg shadow-green-500/5' : 'bg-neutral-900 border-white/5'}`}>
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-5">
                           <div onClick={()=>toggleExercise(ex.id)} className={`w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${ex.completed ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-white/5 text-white/20 hover:text-white hover:bg-white/10'}`}>
                              {ex.completed ? <Check size={24} strokeWidth={4}/> : <Play size={24}/>}
                           </div>
                           <div><p className="font-black text-lg text-white uppercase leading-none mb-1">{ex.name}</p><p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{ex.sets} Sets × {ex.reps} Reps</p></div>
                        </div>
                        <button onClick={()=>toggleExercise(ex.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${ex.completed ? 'bg-green-500 text-white' : 'bg-white/5 text-white/40'}`}>{ex.completed ? 'Hecho' : 'Completar'}</button>
                     </div>
                     <div className="flex items-center gap-4 bg-black/40 rounded-3xl p-4 border border-white/5">
                        <TrendingUp size={16} className="text-orange-500" />
                        <span className="text-[10px] font-black text-white/20 uppercase mr-auto">Carga Actual:</span>
                        <input type="number" className="bg-transparent text-white font-black text-xl w-16 outline-none text-right" value={ex.weight} onChange={e=>updateWeight(ex.id, parseInt(e.target.value) || 0)} />
                        <span className="text-sm font-black text-white/40">KG</span>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        );
      case 'Evolution':
        return (
          <div className="space-y-8 animate-in slide-in-from-bottom-8">
             <div className="bg-neutral-900 border border-white/5 p-10 rounded-[50px] shadow-3xl">
                <h3 className="text-2xl font-black mb-8 flex items-center gap-4 uppercase tracking-tighter"><TrendingUp className="text-orange-500" size={28}/> Mi Progreso</h3>
                <div className="h-80 mb-10">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={userData.evolution}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                         <XAxis dataKey="date" stroke="#444" fontSize={10} fontStyle="italic" />
                         <YAxis stroke="#444" fontSize={10} />
                         <Tooltip contentStyle={{backgroundColor:'#111', border:'none', borderRadius:'20px', padding:'15px'}} />
                         <Legend wrapperStyle={{fontSize:'10px', textTransform:'uppercase', fontWeight:'900', marginTop:'20px'}} />
                         <Line type="monotone" dataKey="Press de Banca" stroke="#3b82f6" strokeWidth={4} dot={{r:6, fill:'#3b82f6'}} activeDot={{r:10}} />
                         <Line type="monotone" dataKey="Sentadillas" stroke="#10b981" strokeWidth={4} dot={{r:6, fill:'#10b981'}} />
                         <Line type="monotone" dataKey="Jalón al Pecho" stroke="#f59e0b" strokeWidth={4} dot={{r:6, fill:'#f59e0b'}} />
                      </LineChart>
                   </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white/5 p-6 rounded-[32px] border border-white/5"><p className="text-[9px] text-white/20 font-black uppercase mb-1">Mejoría Total</p><p className="text-3xl font-black text-white">+25kg</p><p className="text-[10px] text-green-500 font-black mt-1 uppercase">Imparable</p></div>
                   <div className="bg-white/5 p-6 rounded-[32px] border border-white/5"><p className="text-[9px] text-white/20 font-black uppercase mb-1">Días Entrenados</p><p className="text-3xl font-black text-white">48</p><p className="text-[10px] text-orange-500 font-black mt-1 uppercase">Consistencia</p></div>
                </div>
             </div>
          </div>
        );
      case 'Calendar':
        return (
          <div className="space-y-8 animate-in slide-in-from-bottom-8">
             <div className="bg-neutral-900 border border-white/5 p-10 rounded-[50px] shadow-3xl">
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4"><Clock className="text-blue-500" size={28}/> Agenda</h3>
                   <div onClick={()=>setActiveTab('Calendar')} className="px-5 py-2 text-[10px] font-black rounded-2xl uppercase shadow-lg" style={{backgroundColor:'rgba(110,138,201,0.2)', color:'#6E8AC9'}}>{bookings.length}/{userData.maxDaysPerWeek} Días</div>
                </div>
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                       {new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="grid grid-cols-7 gap-2 mb-10 text-center font-black text-[10px] uppercase">
                    {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((d,i)=>(<div key={i} className="text-white/10">{d}</div>))}
                    {(() => {
                      const now = new Date();
                      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
                      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                      const padding = firstDay === 0 ? 6 : firstDay - 1;
                      
                      const days = [];
                      for (let i = 0; i < padding; i++) {
                        days.push(<div key={`pad-${i}`} />);
                      }
                      for (let i = 1; i <= daysInMonth; i++) {
                        const isBooked = bookings.some(b => b.day === i);
                        days.push(
                          <div key={i} 
                            onClick={() => { setSelectedDay(i); setIsBookingModalOpen(true); }} 
                            className={`h-12 flex items-center justify-center rounded-2xl text-sm font-black cursor-pointer transition-all border ${isBooked ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/30' : 'bg-white/5 border-white/5 text-white/20 hover:border-white/20 hover:text-white'}`}>
                            {i}
                          </div>
                        );
                      }
                      return days;
                    })()}
                </div>
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Próximas Sesiones</p>
                   {bookings.map((b,i)=>(
                     <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between group">
                        <div><p className="font-black text-white uppercase">Día {b.day} • {b.time} HS</p><p className="text-[10px] text-white/20 font-black uppercase mt-1">{b.exercises.length} Ejercicios Planificados</p></div>
                        <button onClick={()=>setBookings(bookings.filter((_,idx)=>idx!==i))} className="text-red-500/20 group-hover:text-red-500 transition-colors"><X size={20}/></button>
                     </div>
                   ))}
                   {bookings.length === 0 && <p className="text-center text-white/10 italic text-[10px] font-black uppercase py-10">No tienes reservas aún</p>}
                </div>
             </div>
          </div>
        );
      case 'Profile':
        return (
          <div className="space-y-6 animate-in slide-in-from-bottom-8">
             <div className="bg-neutral-900 border border-white/5 p-10 rounded-[50px] flex flex-col items-center">
                <div className="w-32 h-32 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full flex items-center justify-center text-5xl font-black shadow-2xl mb-6 ring-4 ring-white/5">{userData.name[0]}</div>
                <h2 className="text-3xl font-black text-white mb-2">{userData.name}</h2>
                <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-full uppercase tracking-[0.2em] mb-10">{userData.plan}</span>
                
                <div className="w-full space-y-4 pt-10 border-t border-white/5">
                   <h4 className="text-xs font-black uppercase text-white/40 tracking-widest flex items-center gap-2"><Lock size={14}/> Cambiar Contraseña</h4>
                   <div className="space-y-3">
                      <input type="password" placeholder="Nueva Contraseña" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-xs outline-none focus:border-blue-500" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
                      <button onClick={handleChangePassword} disabled={isLoading || !newPassword} className="w-full py-4 bg-[#6E8AC9] text-white border border-[#F38E26] rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl disabled:opacity-50 hover:scale-[1.01] transition-all">Actualizar Contraseña</button>
                   </div>
                </div>

                <button onClick={()=>setIsAuthenticated(false)} className="w-full mt-10 py-4 bg-[#212C40] text-white border border-[#F38E26] rounded-3xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.01] transition-all">Cerrar Sesión</button>
             </div>
          </div>
        );
      default:
        return (
          <div className="space-y-10 animate-in fade-in duration-1000">
             <header className="flex items-center justify-between">
                <div><h2 className="text-4xl font-black text-white tracking-tighter">¡Hola, {userData.name.split(' ')[0]}! 👋</h2><p className="text-white/30 text-xs font-black uppercase tracking-[0.3em] mt-1">Estatus: Bestia en Entrenamiento</p></div>
                <div onClick={()=>setActiveTab('Profile')} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 active:scale-90 transition-all shadow-xl"><User size={24} className="text-blue-500" /></div>
             </header>
             <section className="bg-gradient-to-br from-neutral-900 to-black p-12 rounded-[60px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] text-center relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(110,138,201,0.25),transparent_70%)]" />
                 <p className="text-xs uppercase tracking-[0.5em] font-black mb-10 relative z-10 animate-pulse" style={{color:'#F38E26'}}>Racha de Fuego</p>
                <div className="relative z-10 flex items-center justify-center gap-6 mb-10"><div className="p-5 bg-orange-500/10 rounded-full text-orange-500 shadow-2xl animate-bounce"><Zap size={40} strokeWidth={3} /></div><span className="text-9xl font-black tracking-tighter text-white drop-shadow-[0_20px_50px_rgba(255,255,255,0.2)]">{userData.streak}</span></div>
                 <div onClick={()=>setActiveTab('Evolution')} className="py-5 px-10 rounded-3xl border text-[10px] uppercase font-black tracking-widest hover:text-white transition-all cursor-pointer relative z-10 mx-auto flex items-center justify-center gap-3" style={{backgroundColor:'rgba(243,142,38,0.1)', borderColor:'rgba(243,142,38,0.2)', color:'#F38E26'}} onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.backgroundColor='#F38E26';(e.currentTarget as HTMLDivElement).style.color='#fff'}} onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.backgroundColor='rgba(243,142,38,0.1)';(e.currentTarget as HTMLDivElement).style.color='#F38E26'}}>Explorar Evolución <ArrowUpRight size={16}/></div>
             </section>
             <div className="grid grid-cols-2 gap-6 pb-10">
                 <button onClick={()=>setActiveTab('Training')} className="p-8 bg-neutral-900 border border-white/5 rounded-[50px] flex flex-col gap-6 group text-left shadow-2xl transition-all" onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(243,142,38,0.3)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'}}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg" style={{backgroundColor:'rgba(243,142,38,0.1)', color:'#F38E26'}} onMouseEnter={e=>{e.currentTarget.style.backgroundColor='#F38E26';e.currentTarget.style.color='#fff'}} onMouseLeave={e=>{e.currentTarget.style.backgroundColor='rgba(243,142,38,0.1)';e.currentTarget.style.color='#F38E26'}}><Dumbbell size={28}/></div>
                   <div><p className="font-black text-2xl leading-none mb-1 uppercase">Entrenar</p><p className="text-[10px] text-white/20 font-black uppercase tracking-widest">3 Ejercicios hoy</p></div>
                </button>
                 <button onClick={()=>setActiveTab('Calendar')} className="p-8 bg-neutral-900 border border-white/5 rounded-[50px] flex flex-col gap-6 group text-left shadow-2xl transition-all" onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(110,138,201,0.3)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'}}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg" style={{backgroundColor:'rgba(110,138,201,0.1)', color:'#6E8AC9'}} onMouseEnter={e=>{e.currentTarget.style.backgroundColor='#6E8AC9';e.currentTarget.style.color='#fff'}} onMouseLeave={e=>{e.currentTarget.style.backgroundColor='rgba(110,138,201,0.1)';e.currentTarget.style.color='#6E8AC9'}}><Clock size={28}/></div>
                   <div><p className="font-black text-2xl leading-none mb-1 uppercase">Agendar</p><p className="text-[10px] text-white/20 font-black uppercase tracking-widest">{bookings.length} Sesiones</p></div>
                </button>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#212C40] text-white font-sans p-6 pb-32 overflow-x-hidden">
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-8 animate-in fade-in duration-300">
           <div className="bg-neutral-900 border border-white/10 p-10 rounded-[50px] w-full max-w-sm shadow-3xl">
              <div className="flex justify-between items-center mb-10"><h3 className="text-2xl font-black uppercase tracking-tighter">Día {selectedDay}</h3><button onClick={()=>setIsBookingModalOpen(false)}><X size={24} className="text-white/20 hover:text-white"/></button></div>
              <div className="space-y-8">
                 <div className="space-y-3"><label className="text-[10px] font-black text-white/20 uppercase tracking-widest">¿A qué hora vas?</label><input type="time" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-xl font-black outline-none focus:border-orange-500" value={selectedTime} onChange={e=>setSelectedTime(e.target.value)} /></div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">¿Qué vas a entrenar?</label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                       {userData.currentRoutine.map(ex => (
                         <button key={ex.id} onClick={()=>{
                           if(selectedExs.includes(ex.name)) setSelectedExs(selectedExs.filter(e=>e!==ex.name));
                           else setSelectedExs([...selectedExs, ex.name]);
                         }} className={`p-4 rounded-2xl text-[10px] font-black uppercase text-left border transition-all ${selectedExs.includes(ex.name) ? 'bg-orange-500 border-orange-400 text-white' : 'bg-white/5 border-white/10 text-white/30'}`}>
                            {ex.name}
                         </button>
                       ))}
                    </div>
                 </div>
                 <button onClick={handleConfirmBooking} className="w-full py-5 bg-orange-500 text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-orange-500/30">Confirmar Reserva</button>
              </div>
           </div>
        </div>
      )}
      <main className="max-w-lg mx-auto">{renderTabContent()}</main>
      <nav className="fixed bottom-8 left-8 right-8 h-24 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-[50px] z-50 flex items-center justify-around px-8 shadow-3xl animate-in slide-in-from-bottom-10 duration-1000">
         <NavBtn active={activeTab === 'Home'} onClick={()=>setActiveTab('Home')} icon={<LayoutDashboard size={28}/>} />
         <NavBtn active={activeTab === 'Training'} onClick={()=>setActiveTab('Training')} icon={<Dumbbell size={28}/>} />
         <NavBtn active={activeTab === 'Calendar'} onClick={()=>setActiveTab('Calendar')} icon={<Clock size={28}/>} />
         <NavBtn active={activeTab === 'Evolution'} onClick={()=>setActiveTab('Evolution')} icon={<TrendingUp size={28}/>} />
      </nav>
    </div>
  );
}

function NavBtn({ active, onClick, icon }: any) {
  return (
    <button onClick={onClick} className={`p-5 rounded-3xl transition-all relative`} style={{color: active ? '#F38E26' : 'rgba(255,255,255,0.1)'}} onMouseEnter={e=>{if(!active)(e.currentTarget as HTMLButtonElement).style.color='rgba(255,255,255,0.3)'}} onMouseLeave={e=>{if(!active)(e.currentTarget as HTMLButtonElement).style.color='rgba(255,255,255,0.1)'}}>
       {icon}
       {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{backgroundColor:'#F38E26', boxShadow:'0 0 15px rgba(243,142,38,0.8)'}} />}
    </button>
  );
}
