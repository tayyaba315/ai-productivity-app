import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { apiUrl } from '../lib/api';
import { useAuth } from '../app/context/AuthContext';
import GoogleIntegrationIndicator from '../components/GoogleIntegrationIndicator';

interface Event {
  id: string;
  title: string;
  date: string;
  category: 'meeting' | 'assignment' | 'personal';
  time: string;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDuration, setFormDuration] = useState(60);
  const [formLocation, setFormLocation] = useState('');
  const [alsoCreateGoogle, setAlsoCreateGoogle] = useState(true);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const currentMonth = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const fromAt = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const toAt = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const emailQuery = user?.email ? `&email=${encodeURIComponent(user.email)}` : '';
      const url = `${apiUrl('/calendar/events')}?from_at=${encodeURIComponent(fromAt)}&to_at=${encodeURIComponent(toAt)}${emailQuery}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Failed to load calendar events');

      const nextEvents: Event[] = (data.events || []).map((item: any, index: number) => {
        const start = new Date(item.start_at || item.start?.dateTime || item.start?.date || new Date().toISOString());
        return {
          id: String(item.id || `event-${index}`),
          title: String(item.title || item.summary || 'Event'),
          date: start.toISOString(),
          category: 'meeting',
          time: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      });
      setEvents(nextEvents);
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate, user?.email]);

  const getEventsForDate = (date: number) =>
    events.filter((event) => {
      const d = new Date(event.date);
      return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth() && d.getDate() === date;
    });

  const upcomingEvents = useMemo(
    () =>
      [...events]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5),
    [events]
  );

  const submitEvent = async () => {
    if (!formTitle.trim() || !formDate || !formTime) return;
    setError('');
    try {
      const startAt = new Date(`${formDate}T${formTime}`);
      const endAt = new Date(startAt.getTime() + formDuration * 60 * 1000);
      const res = await fetch(apiUrl('/calendar/events'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          location: formLocation.trim(),
          also_create_google: alsoCreateGoogle,
          email: user?.email || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Failed to create event');

      const created = data.schedule;
      const start = new Date(created.start_at);
      setEvents((prev) => [
        ...prev,
        {
          id: String(created.id),
          title: String(created.title || formTitle),
          date: start.toISOString(),
          category: 'meeting',
          time: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsAddingEvent(false);
      setFormTitle('');
      setFormDate('');
      setFormTime('');
      setFormDuration(60);
      setFormLocation('');
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'meeting':
        return 'bg-[#8B5CF6]';
      case 'assignment':
        return 'bg-[#7C3AED]';
      case 'personal':
        return 'bg-[#6D28D9]';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-4xl font-bold mb-2">Calendar</h1>
        <p className="text-lg text-white/90">Manage your schedule and upcoming events</p>
      </div>
      <GoogleIntegrationIndicator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#2A2A2A]">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#EDEDED]">{currentMonth}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                className="p-2 rounded-xl hover:bg-[#171717] transition-all text-[#A3A3A3]"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                className="p-2 rounded-xl hover:bg-[#171717] transition-all text-[#A3A3A3]"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsAddingEvent((prev) => !prev)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all ml-2"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add Event</span>
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
          {isAddingEvent && (
            <div className="mb-5 p-4 rounded-xl bg-[#171717] border border-[#2A2A2A] grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Event title" className="h-10 rounded-lg bg-[#1E1E1E] border border-[#2A2A2A] px-3 text-[#EDEDED]" />
              <input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="Location (optional)" className="h-10 rounded-lg bg-[#1E1E1E] border border-[#2A2A2A] px-3 text-[#EDEDED]" />
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="h-10 rounded-lg bg-[#1E1E1E] border border-[#2A2A2A] px-3 text-[#EDEDED]" />
              <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="h-10 rounded-lg bg-[#1E1E1E] border border-[#2A2A2A] px-3 text-[#EDEDED]" />
              <input type="number" min={15} step={15} value={formDuration} onChange={(e) => setFormDuration(Number(e.target.value || 60))} placeholder="Duration minutes" className="h-10 rounded-lg bg-[#1E1E1E] border border-[#2A2A2A] px-3 text-[#EDEDED]" />
              <label className="flex items-center gap-2 text-sm text-[#EDEDED]">
                <input type="checkbox" checked={alsoCreateGoogle} onChange={(e) => setAlsoCreateGoogle(e.target.checked)} />
                Also create in Google Calendar
              </label>
              <button onClick={submitEvent} className="h-10 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white font-medium">Save Event</button>
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#8B5CF6]"></div>
              <span className="text-[#A3A3A3]">Meetings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#7C3AED]"></div>
              <span className="text-[#A3A3A3]">Assignments</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#6D28D9]"></div>
              <span className="text-[#A3A3A3]">Personal</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-[#A3A3A3] text-sm py-2">
                {day}
              </div>
            ))}

            {/* Empty days */}
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square"></div>
            ))}

            {/* Calendar days */}
            {days.map((day) => {
              const dayEvents = getEventsForDate(day);
              const now = new Date();
              const isToday = day === now.getDate() && currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear();
              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square rounded-xl p-2 cursor-pointer transition-all relative
                    ${isToday ? 'bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] text-white' : 'bg-[#171717] hover:bg-[#1E1E1E]'}
                    ${selectedDate === day && !isToday ? 'ring-2 ring-[#7C3AED]' : ''}
                  `}
                >
                  <span className={`text-sm font-medium ${isToday ? 'text-white' : 'text-[#EDEDED]'}`}>
                    {day}
                  </span>
                  {hasEvents && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : getCategoryColor(event.category)}`}
                        ></div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-4">
          <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#2A2A2A]">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#7C3AED]" />
              <span className="text-[#EDEDED]">Upcoming Events</span>
            </h3>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-xl bg-[#171717] hover:bg-[#1E1E1E] transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full ${getCategoryColor(event.category)} mt-2`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-[#EDEDED] text-sm">{event.title}</p>
                      <p className="text-xs text-[#A3A3A3] mt-1">{new Date(event.date).toLocaleDateString()} • {event.time}</p>
                    </div>
                  </div>
                </div>
              ))}
              {loading && <p className="text-sm text-[#A3A3A3]">Loading events...</p>}
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="bg-gradient-to-br from-[#7C3AED]/20 to-[#8B5CF6]/20 rounded-2xl p-6 shadow-lg border border-[#7C3AED]/30">
              <h3 className="text-lg font-bold mb-4 text-[#EDEDED]">
                {new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate).toLocaleDateString()}
              </h3>
              <div className="space-y-2">
                {getEventsForDate(selectedDate).length > 0 ? (
                  getEventsForDate(selectedDate).map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-xl bg-[#1E1E1E]/60 border border-[#2A2A2A]"
                    >
                      <p className="font-medium text-[#EDEDED] text-sm">{event.title}</p>
                      <p className="text-xs text-[#A3A3A3] mt-1">{event.time}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#A3A3A3]">No events scheduled</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}