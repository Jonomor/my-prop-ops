import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Calendar } from '../components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight,
  ClipboardCheck,
  Calendar as CalendarIcon,
  User,
  Building2,
  Home
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay, parseISO } from 'date-fns';

const statusColors = {
  scheduled: 'bg-blue-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  approved: 'bg-purple-500',
  active: 'bg-green-500',
  pending: 'bg-amber-500',
  inactive: 'bg-gray-500'
};

const CalendarView = () => {
  const { api, currentOrg } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, [currentOrg, currentMonth]);

  const fetchEvents = async () => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      const response = await api.get(
        `/organizations/${currentOrg.org_id}/calendar?start_date=${start}&end_date=${end}`
      );
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const getEventsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(e => e.date === dateStr);
  };

  const filteredEvents = filterType === 'all' 
    ? events 
    : events.filter(e => e.type === filterType);

  const selectedDateEvents = selectedDate 
    ? getEventsForDate(selectedDate).filter(e => filterType === 'all' || e.type === filterType)
    : [];

  // Custom day content renderer for the calendar
  const getDayContent = (day) => {
    const dayEvents = getEventsForDate(day);
    const hasInspection = dayEvents.some(e => e.type === 'inspection');
    const hasLeaseEnd = dayEvents.some(e => e.type === 'lease_end');
    
    return (
      <div className="relative w-full h-full flex flex-col items-center">
        <span>{format(day, 'd')}</span>
        {(hasInspection || hasLeaseEnd) && (
          <div className="flex gap-0.5 mt-0.5">
            {hasInspection && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
            {hasLeaseEnd && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
          </div>
        )}
      </div>
    );
  };

  const handleEventClick = (event) => {
    if (event.type === 'inspection') {
      navigate(`/inspections`);
    } else if (event.type === 'lease_end') {
      navigate(`/tenants`);
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="calendar-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading">Calendar</h1>
            <p className="text-muted-foreground mt-1">
              View inspections and lease dates
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40" data-testid="event-type-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="inspection">Inspections</SelectItem>
                <SelectItem value="lease_end">Lease Ends</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2 glass">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-heading">
                  {format(currentMonth, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Today
                  </Button>
                  <Button variant="ghost" size="icon" onClick={goToPreviousMonth} data-testid="prev-month">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={goToNextMonth} data-testid="next-month">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-7 gap-2">
                  {Array(35).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  className="w-full"
                  classNames={{
                    months: "w-full",
                    month: "w-full",
                    table: "w-full border-collapse",
                    head_row: "flex w-full",
                    head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "h-12 w-full text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-12 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                  }}
                  components={{
                    DayContent: ({ date }) => getDayContent(date)
                  }}
                />
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Inspection
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Lease End
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Events Sidebar */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                {selectedDate 
                  ? format(selectedDate, 'MMM d, yyyy')
                  : 'Upcoming Events'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : selectedDate && selectedDateEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No events on this date</p>
                </div>
              ) : (selectedDate ? selectedDateEvents : filteredEvents.slice(0, 10)).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No events this month</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(selectedDate ? selectedDateEvents : filteredEvents.slice(0, 10)).map(event => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => handleEventClick(event)}
                      data-testid={`calendar-event-${event.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          event.type === 'inspection' ? 'bg-blue-500/10' : 'bg-amber-500/10'
                        }`}>
                          {event.type === 'inspection' ? (
                            <ClipboardCheck className={`w-5 h-5 ${event.type === 'inspection' ? 'text-blue-500' : 'text-amber-500'}`} />
                          ) : (
                            <User className="w-5 h-5 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{event.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{format(parseISO(event.date), 'MMM d')}</span>
                            {event.status && (
                              <Badge variant="secondary" className={`text-xs ${statusColors[event.status]}/10 text-${statusColors[event.status].replace('bg-', '')}`}>
                                {event.status}
                              </Badge>
                            )}
                          </div>
                          {event.property_name && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Building2 className="w-3 h-3" />
                              {event.property_name}
                              {event.unit_number && (
                                <>
                                  <Home className="w-3 h-3 ml-1" />
                                  Unit {event.unit_number}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CalendarView;
