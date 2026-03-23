import React, { useState } from 'react';
import { useStore } from './useStore';
import { Calendar, BarChart2, Settings, Plus, Baby, Droplets, Pill, FileText, Trash2, ChevronLeft, ChevronRight, Utensils } from 'lucide-react';
import { format, addDays, subDays, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import { BabyEvent, TwinId, TwinProfile } from './types';
import { cn } from './utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function App() {
  const { events, profiles, addEvent, deleteEvent, updateProfile, isLoaded } = useStore();
  const [activeTab, setActiveTab] = useState<'daily' | 'stats' | 'settings'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTwin, setSelectedTwin] = useState<TwinId>('twin1');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans max-w-md mx-auto shadow-xl overflow-hidden relative">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Baby className="w-6 h-6 text-indigo-500" />
          Twin Tracker
        </h1>
        {activeTab === 'daily' && (
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedTwin(p.id)}
                className={cn(
                  "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                  selectedTwin === p.id ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {activeTab === 'daily' && (
          <DailyView 
            date={selectedDate} 
            setDate={setSelectedDate} 
            twinId={selectedTwin} 
            events={events} 
            addEvent={addEvent} 
            deleteEvent={deleteEvent}
            profiles={profiles}
          />
        )}
        {activeTab === 'stats' && <StatsView events={events} profiles={profiles} />}
        {activeTab === 'settings' && <SettingsView profiles={profiles} updateProfile={updateProfile} deferredPrompt={deferredPrompt} setDeferredPrompt={setDeferredPrompt} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 flex justify-around p-2 pb-safe z-10">
        <NavItem 
          icon={<Calendar />} 
          label="일일 기록" 
          active={activeTab === 'daily'} 
          onClick={() => setActiveTab('daily')} 
        />
        <NavItem 
          icon={<BarChart2 />} 
          label="통계" 
          active={activeTab === 'stats'} 
          onClick={() => setActiveTab('stats')} 
        />
        <NavItem 
          icon={<Settings />} 
          label="설정" 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
        />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-full py-2 gap-1 transition-colors",
        active ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

// --- Daily View ---
function DailyView({ date, setDate, twinId, events, addEvent, deleteEvent, profiles }: any) {
  const [showModal, setShowModal] = useState<BabyEvent['type'] | null>(null);

  const handlePrevDay = () => setDate(subDays(date, 1));
  const handleNextDay = () => setDate(addDays(date, 1));

  const dailyEvents = events.filter((e: BabyEvent) => isSameDay(new Date(e.timestamp), date) && e.twinId === twinId);

  const twinProfile = profiles.find((p: TwinProfile) => p.id === twinId);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Date Selector */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <button onClick={handlePrevDay} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="font-semibold text-gray-800">
          {format(date, 'yyyy년 M월 d일 (E)', { locale: ko })}
        </div>
        <button onClick={handleNextDay} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-5 gap-2 p-4 bg-white border-b border-gray-100">
        <ActionButton icon={<Baby className="w-6 h-6" />} label="수유" color="bg-orange-100 text-orange-600" onClick={() => setShowModal('feed')} />
        <ActionButton icon={<Utensils className="w-6 h-6" />} label="이유식" color="bg-yellow-100 text-yellow-600" onClick={() => setShowModal('babyfood')} />
        <ActionButton icon={<Droplets className="w-6 h-6" />} label="기저귀" color="bg-blue-100 text-blue-600" onClick={() => setShowModal('diaper')} />
        <ActionButton icon={<Pill className="w-6 h-6" />} label="약" color="bg-green-100 text-green-600" onClick={() => setShowModal('medicine')} />
        <ActionButton icon={<FileText className="w-6 h-6" />} label="메모" color="bg-purple-100 text-purple-600" onClick={() => setShowModal('note')} />
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {dailyEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
            <Baby className="w-12 h-12 opacity-20" />
            <p>기록이 없습니다.</p>
          </div>
        ) : (
          dailyEvents.map((event: BabyEvent) => (
            <EventCard key={event.id} event={event} onDelete={() => deleteEvent(event.id)} />
          ))
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <AddEventModal 
          type={showModal} 
          twinId={twinId} 
          date={date}
          onClose={() => setShowModal(null)} 
          onAdd={addEvent} 
          twinName={twinProfile?.name}
        />
      )}
    </div>
  );
}

function ActionButton({ icon, label, color, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-transform", color)}>
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-600">{label}</span>
    </button>
  );
}

function EventCard({ event, onDelete }: { key?: string | number, event: BabyEvent, onDelete: () => void }) {
  const timeStr = format(new Date(event.timestamp), 'a h:mm', { locale: ko });

  let icon, title, details, colorClass;

  switch (event.type) {
    case 'feed':
      icon = <Baby className="w-5 h-5" />;
      title = '수유';
      details = `${event.amount} ml`;
      colorClass = 'bg-orange-50 text-orange-600 border-orange-100';
      break;
    case 'babyfood':
      icon = <Utensils className="w-5 h-5" />;
      title = '이유식';
      details = `${event.menu} (${event.amount}g/ml)`;
      colorClass = 'bg-yellow-50 text-yellow-600 border-yellow-100';
      break;
    case 'diaper':
      icon = <Droplets className="w-5 h-5" />;
      title = '기저귀';
      details = event.status === 'pee' ? '소변' : event.status === 'poop' ? '대변' : '대소변';
      colorClass = 'bg-blue-50 text-blue-600 border-blue-100';
      break;
    case 'medicine':
      icon = <Pill className="w-5 h-5" />;
      title = '약 복용';
      details = event.medicineName;
      colorClass = 'bg-green-50 text-green-600 border-green-100';
      break;
    case 'note':
      icon = <FileText className="w-5 h-5" />;
      title = '메모';
      details = '';
      colorClass = 'bg-purple-50 text-purple-600 border-purple-100';
      break;
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-4">
      <div className={cn("p-2 rounded-lg border", colorClass)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <span className="text-xs text-gray-500">{timeStr}</span>
        </div>
        {details && <p className="text-sm text-gray-700 font-medium">{details}</p>}
        {event.note && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.note}</p>}
      </div>
      <button onClick={onDelete} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function AddEventModal({ type, twinId, date, onClose, onAdd, twinName }: any) {
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [amount, setAmount] = useState('100');
  const [babyfoodMenu, setBabyfoodMenu] = useState('');
  const [status, setStatus] = useState<'pee' | 'poop' | 'both'>('pee');
  const [medicineName, setMedicineName] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create timestamp from selected date and time
    const [hours, minutes] = time.split(':').map(Number);
    const timestamp = new Date(date).setHours(hours, minutes, 0, 0);

    const baseEvent = {
      id: uuidv4(),
      twinId,
      timestamp,
      note: note.trim() || undefined,
    };

    let newEvent: any;

    if (type === 'feed') {
      newEvent = { ...baseEvent, type: 'feed', amount: parseInt(amount, 10) || 0 };
    } else if (type === 'babyfood') {
      newEvent = { ...baseEvent, type: 'babyfood', menu: babyfoodMenu, amount: parseInt(amount, 10) || 0 };
    } else if (type === 'diaper') {
      newEvent = { ...baseEvent, type: 'diaper', status };
    } else if (type === 'medicine') {
      newEvent = { ...baseEvent, type: 'medicine', medicineName };
    } else if (type === 'note') {
      newEvent = { ...baseEvent, type: 'note' };
    }

    onAdd(newEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {twinName} - {type === 'feed' ? '수유 기록' : type === 'babyfood' ? '이유식 기록' : type === 'diaper' ? '기저귀 기록' : type === 'medicine' ? '약 복용 기록' : '메모 기록'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">시간</label>
              <button 
                type="button" 
                onClick={() => setTime(format(new Date(), 'HH:mm'))} 
                className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors"
              >
                현재 시간으로
              </button>
            </div>
            <input 
              type="time" 
              value={time} 
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>

          {type === 'feed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">수유량 (ml)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  required
                  min="0"
                  step="10"
                />
                <span className="text-gray-500">ml</span>
              </div>
            </div>
          )}

          {type === 'babyfood' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이유식 메뉴</label>
                <input 
                  type="text" 
                  value={babyfoodMenu} 
                  onChange={(e) => setBabyfoodMenu(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  required
                  placeholder="예: 소고기 미음, 단호박 퓨레"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">먹은 양 (g/ml)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    required
                    min="0"
                    step="10"
                  />
                  <span className="text-gray-500">g/ml</span>
                </div>
              </div>
            </>
          )}

          {type === 'diaper' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
              <div className="flex gap-2">
                {(['pee', 'poop', 'both'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      "flex-1 py-2 rounded-lg border text-sm font-medium transition-colors",
                      status === s 
                        ? "bg-blue-50 border-blue-500 text-blue-700" 
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {s === 'pee' ? '소변' : s === 'poop' ? '대변' : '대소변'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === 'medicine' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">약 이름</label>
              <input 
                type="text" 
                value={medicineName} 
                onChange={(e) => setMedicineName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                required
                placeholder="예: 해열제, 유산균"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">특이사항 (선택)</label>
            <textarea 
              value={note} 
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-20"
              placeholder="메모를 입력하세요..."
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors mt-6"
          >
            저장하기
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Stats View ---
function StatsView({ events, profiles }: any) {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [date, setDate] = useState(new Date());

  const handlePrev = () => setDate(period === 'week' ? subDays(date, 7) : startOfMonth(subDays(startOfMonth(date), 1)));
  const handleNext = () => setDate(period === 'week' ? addDays(date, 7) : startOfMonth(addDays(endOfMonth(date), 1)));

  // Generate date range
  const dateRange = period === 'week' 
    ? eachDayOfInterval({ start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) })
    : eachDayOfInterval({ start: startOfMonth(date), end: endOfMonth(date) });

  // Prepare data for charts
  const feedData = dateRange.map(d => {
    const dayStr = format(d, period === 'week' ? 'E' : 'd');
    const dayEvents = events.filter((e: any) => isSameDay(new Date(e.timestamp), d));
    
    return {
      name: dayStr,
      [profiles[0].id]: dayEvents.filter((e: any) => e.type === 'feed' && e.twinId === profiles[0].id).reduce((sum: number, e: any) => sum + e.amount, 0),
      [profiles[1].id]: dayEvents.filter((e: any) => e.type === 'feed' && e.twinId === profiles[1].id).reduce((sum: number, e: any) => sum + e.amount, 0),
    };
  });

  const diaperData = dateRange.map(d => {
    const dayStr = format(d, period === 'week' ? 'E' : 'd');
    const dayEvents = events.filter((e: any) => isSameDay(new Date(e.timestamp), d));
    
    return {
      name: dayStr,
      [profiles[0].id]: dayEvents.filter((e: any) => e.type === 'diaper' && e.twinId === profiles[0].id).length,
      [profiles[1].id]: dayEvents.filter((e: any) => e.type === 'diaper' && e.twinId === profiles[1].id).length,
    };
  });

  const dateLabel = period === 'week' 
    ? `${format(dateRange[0], 'M.d')} - ${format(dateRange[dateRange.length-1], 'M.d')}`
    : format(date, 'yyyy년 M월');

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4 space-y-6 overflow-y-auto">
      {/* Period Toggle */}
      <div className="flex bg-gray-200 p-1 rounded-lg">
        <button
          onClick={() => setPeriod('week')}
          className={cn("flex-1 py-1.5 text-sm font-medium rounded-md transition-colors", period === 'week' ? "bg-white shadow-sm text-indigo-600" : "text-gray-500")}
        >
          주간
        </button>
        <button
          onClick={() => setPeriod('month')}
          className={cn("flex-1 py-1.5 text-sm font-medium rounded-md transition-colors", period === 'month' ? "bg-white shadow-sm text-indigo-600" : "text-gray-500")}
        >
          월간
        </button>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-100">
        <button onClick={handlePrev} className="p-1 text-gray-500 hover:bg-gray-100 rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="font-semibold text-gray-800">{dateLabel}</div>
        <button onClick={handleNext} className="p-1 text-gray-500 hover:bg-gray-100 rounded-full">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Feed Chart */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Baby className="w-5 h-5 text-orange-500" />
          수유량 통계 (ml)
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={feedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip 
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey={profiles[0].id} name={profiles[0].name} fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey={profiles[1].id} name={profiles[1].name} fill="#f472b6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Diaper Chart */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-500" />
          기저귀 교체 횟수
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={diaperData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
              <Tooltip 
                cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey={profiles[0].id} name={profiles[0].name} stroke="#60a5fa" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey={profiles[1].id} name={profiles[1].name} stroke="#f472b6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// --- Settings View ---
function SettingsView({ profiles, updateProfile, deferredPrompt, setDeferredPrompt }: any) {
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4 space-y-6">
      {deferredPrompt && (
        <div className="bg-indigo-50 p-6 rounded-xl shadow-sm border border-indigo-100">
          <h2 className="text-lg font-bold text-indigo-800 mb-2">앱 설치하기</h2>
          <p className="text-sm text-indigo-600 mb-4">바탕화면에 아이콘을 추가하여 더 편리하게 사용하세요.</p>
          <button onClick={handleInstallClick} className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors">
            홈 화면에 추가
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">아이 이름 설정</h2>
        <div className="space-y-4">
          {profiles.map((p: TwinProfile, index: number) => (
            <div key={p.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {index === 0 ? '첫째' : '둘째'} 이름
              </label>
              <input 
                type="text" 
                value={p.name}
                onChange={(e) => updateProfile(p.id, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="이름을 입력하세요"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">앱 설치 (홈 화면에 추가)</h2>
        <div className="text-sm text-gray-600 space-y-3">
          <p>핸드폰 바탕화면 아이콘으로 추가하여 일반 앱처럼 사용할 수 있습니다.</p>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="font-medium text-gray-800 mb-1">🍎 iPhone (Safari)</p>
            <p>하단의 <strong>공유(↑)</strong> 버튼을 누르고 <strong>'홈 화면에 추가'</strong>를 선택하세요.</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="font-medium text-gray-800 mb-1">🤖 Android (Chrome)</p>
            <p>우측 상단의 <strong>메뉴(⋮)</strong>를 누르고 <strong>'홈 화면에 추가'</strong> 또는 <strong>'앱 설치'</strong>를 선택하세요.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">앱 정보</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p>버전: 1.0.1</p>
          <p>데이터는 기기에 안전하게 저장됩니다.</p>
        </div>
      </div>
    </div>
  );
}
