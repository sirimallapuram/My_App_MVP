// Calendar page for meeting scheduling and management
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import { useAuth } from '../contexts/AuthContext';
import { MeetingEvent, MeetingParticipant, CalendarView } from '../types/meeting';
import { socketService } from '../services/socket';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const CalendarPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<MeetingEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<MeetingEvent | null>(null);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  // Fetch events from server
  const fetchEvents = useCallback(async () => {
    if (!socketService.isConnected()) return;

    setIsLoading(true);
    const startDate = moment(date).startOf('month').toDate();
    const endDate = moment(date).endOf('month').toDate();

    socketService.emit('meeting:event:fetch' as any, { startDate, endDate });
  }, [date]);

  // Set up socket listeners
  useEffect(() => {
    if (!socketService.isConnected()) return;

    const handleEventsFetched = (fetchedEvents: MeetingEvent[]) => {
      setEvents(fetchedEvents);
      setIsLoading(false);
    };

    const handleEventCreated = (event: MeetingEvent) => {
      setEvents(prev => [...prev, event]);
    };

    const handleEventUpdated = (event: MeetingEvent) => {
      setEvents(prev => prev.map(e => e.id === event.id ? event : e));
    };

    const handleEventDeleted = (eventId: string) => {
      setEvents(prev => prev.filter(e => e.id !== eventId));
    };

    const handleEventReminder = (event: MeetingEvent) => {
      // Show notification for upcoming meeting
      if (Notification.permission === 'granted') {
        new Notification(`Meeting Reminder: ${event.title}`, {
          body: `Your meeting "${event.title}" is starting soon!`,
          icon: '/favicon.ico'
        });
      }
    };

    // Set up listeners
    socketService.on('meeting:event:created', handleEventCreated);
    socketService.on('meeting:event:updated', handleEventUpdated);
    socketService.on('meeting:event:deleted', handleEventDeleted);
    socketService.on('meeting:event:reminder', handleEventReminder);

    // Request permission for notifications
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socketService.off('meeting:event:created', handleEventCreated);
      socketService.off('meeting:event:updated', handleEventUpdated);
      socketService.off('meeting:event:deleted', handleEventDeleted);
      socketService.off('meeting:event:reminder', handleEventReminder);
    };
  }, []);

  // Fetch events when component mounts or date changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSelectEvent = (event: MeetingEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedEvent(null);
    setShowCreateModal(true);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleCreateEvent = (eventData: Partial<MeetingEvent>) => {
    if (!socketService.isConnected() || !user) return;

    const newEvent: Omit<MeetingEvent, 'id' | 'createdAt' | 'updatedAt'> = {
      title: eventData.title || '',
      description: eventData.description || '',
      startDate: eventData.startDate || new Date(),
      endDate: eventData.endDate || new Date(),
      creatorId: user.id,
      creatorName: user.name,
      participants: eventData.participants || [],
      isRecurring: eventData.isRecurring || false,
      recurrencePattern: eventData.recurrencePattern
    };

    socketService.emit('meeting:event:create' as any, newEvent);
    setShowCreateModal(false);
  };

  const handleUpdateEvent = (eventData: MeetingEvent) => {
    if (!socketService.isConnected()) return;

    socketService.emit('meeting:event:update' as any, eventData);
    setShowEventModal(false);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!socketService.isConnected()) return;

    socketService.emit('meeting:event:delete' as any, eventId);
    setShowEventModal(false);
  };

  const handleRespondToEvent = (eventId: string, status: 'accepted' | 'declined' | 'tentative') => {
    if (!socketService.isConnected()) return;

    socketService.emit('meeting:event:respond' as any, { eventId, status });
  };

  // Convert events to calendar format
  const calendarEvents = events.map(event => ({
    ...event,
    start: new Date(event.startDate),
    end: new Date(event.endDate),
    title: event.title,
    resource: event
  }));

  const eventStyleGetter = (event: any) => {
    const now = new Date();
    const eventStart = new Date(event.start);
    const isPast = eventStart < now;
    const isToday = moment(eventStart).isSame(moment(), 'day');
    
    let backgroundColor = '#3174ad';
    if (isPast) backgroundColor = '#6c757d';
    if (isToday) backgroundColor = '#28a745';

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                + New Meeting
              </button>
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Calendar */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setView(Views.MONTH)}
                  className={`px-3 py-1 rounded text-sm ${
                    view === Views.MONTH ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setView(Views.WEEK)}
                  className={`px-3 py-1 rounded text-sm ${
                    view === Views.WEEK ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setView(Views.DAY)}
                  className={`px-3 py-1 rounded text-sm ${
                    view === Views.DAY ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Day
                </button>
              </div>
              <div className="text-sm text-gray-600">
                {moment(date).format('MMMM YYYY')}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                view={view}
                onView={handleViewChange}
                date={date}
                onNavigate={handleNavigate}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable
                eventPropGetter={eventStyleGetter}
                popup
                showMultiDayTimes
                step={15}
                timeslots={4}
              />
            )}
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateEvent}
        />
      )}

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setShowEventModal(false)}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
          onRespond={handleRespondToEvent}
        />
      )}
    </div>
  );
};

// Create Event Modal Component
interface CreateEventModalProps {
  onClose: () => void;
  onCreate: (event: Partial<MeetingEvent>) => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    participants: [] as MeetingParticipant[],
    isRecurring: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  const addParticipant = () => {
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, { id: '', name: '', email: '', status: 'pending' }]
    }));
  };

  const updateParticipant = (index: number, field: keyof MeetingParticipant, value: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const removeParticipant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Create Meeting</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={moment(formData.startDate).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={moment(formData.endDate).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Participants
            </label>
            {formData.participants.map((participant, index) => (
              <div key={index} className="flex space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={participant.name}
                  onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={participant.email}
                  onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeParticipant(index)}
                  className="px-2 py-2 text-red-600 hover:text-red-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addParticipant}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add Participant
            </button>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Event Details Modal Component
interface EventDetailsModalProps {
  event: MeetingEvent;
  onClose: () => void;
  onUpdate: (event: MeetingEvent) => void;
  onDelete: (eventId: string) => void;
  onRespond: (eventId: string, status: 'accepted' | 'declined' | 'tentative') => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  onClose,
  onUpdate,
  onDelete,
  onRespond
}) => {
  const { user } = useAuth();
  const isCreator = event.creatorId === user?.id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <p className="text-gray-900">{event.description || 'No description'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <p className="text-gray-900">{moment(event.startDate).format('MMMM Do YYYY, h:mm a')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Time</label>
            <p className="text-gray-900">{moment(event.endDate).format('MMMM Do YYYY, h:mm a')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Participants</label>
            <div className="space-y-2">
              {event.participants.map((participant, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-900">{participant.name} ({participant.email})</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    participant.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    participant.status === 'declined' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {participant.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            {isCreator ? (
              <>
                <button
                  onClick={() => onDelete(event.id)}
                  className="px-4 py-2 text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
                <button
                  onClick={() => onUpdate(event)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onRespond(event.id, 'declined')}
                  className="px-4 py-2 text-red-600 hover:text-red-800"
                >
                  Decline
                </button>
                <button
                  onClick={() => onRespond(event.id, 'tentative')}
                  className="px-4 py-2 text-yellow-600 hover:text-yellow-800"
                >
                  Maybe
                </button>
                <button
                  onClick={() => onRespond(event.id, 'accepted')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Accept
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
