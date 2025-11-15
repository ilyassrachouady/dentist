
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api } from '@/lib/api';
import { demoDentist } from '@/lib/mock-data';
import { Service } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarScheduler } from '@/components/ui/calendar-scheduler';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle2,
  Sparkles,
  Stethoscope,
  Check,
  ChevronRight,
  MessageCircle,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlot {
  time: string;
  capacity: number;
  remaining: number;
  isAvailable: boolean;
}

interface BookingData {
  service: Service | null;
  date: Date | null;
  timeSlot: TimeSlot | null;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  notes: string;
  saveInfo: boolean;
}
const STEPS = [
    { id: 1, name: 'Service', icon: Stethoscope },
    { id: 2, name: 'Date & Heure', icon: CalendarIcon },
    { id: 3, name: 'Détails', icon: User },
    { id: 4, name: 'Confirmation', icon: CheckCircle2 },
  ];
  
  // Helper to convert 24h time to 12h AM/PM format
  const formatTime12h = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  // Helper to convert 12h AM/PM format back to 24h
  const formatTime24h = (time12: string): string => {
    const [time, period] = time12.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hours24 = hours;
    if (period === 'PM' && hours !== 12) hours24 += 12;
    if (period === 'AM' && hours === 12) hours24 = 0;
    return `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  export default function BookingWizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    
    // Mock available/unavailable dates
    const MOCK_AVAILABLE_DATES = [
      new Date('2024-07-20'),
      new Date('2024-07-21'),
      new Date('2024-07-24'),
    ];
    const MOCK_UNAVAILABLE_DATES = [
      new Date('2024-07-22'),
      new Date('2024-07-23'),
    ];

    const [dateAvailability, setDateAvailability] = useState<{
      available: Date[];
      unavailable: Date[];
    }>({
      available: MOCK_AVAILABLE_DATES,
      unavailable: MOCK_UNAVAILABLE_DATES,
    });

    const [booking, setBooking] = useState<BookingData>({
      service: null,
      date: null,
      timeSlot: null,
      patientName: '',
      patientPhone: '',
      patientEmail: '',
      notes: '',
      saveInfo: false,
    });

    const dentist = demoDentist;

    // Load saved info
    useEffect(() => {
      const saved = localStorage.getItem('patientInfo');
      if (saved) {
        const info = JSON.parse(saved);
        setBooking(prev => ({
          ...prev,
          patientName: info.name || '',
          patientPhone: info.phone || '',
          patientEmail: info.email || '',
        }));
      }
    }, []);

    // Fetch available dates when component mounts
    useEffect(() => {
      const fetchAvailableDates = async () => {
        // In a real app, you'd fetch this from an API
        setDateAvailability({
          available: MOCK_AVAILABLE_DATES,
          unavailable: MOCK_UNAVAILABLE_DATES,
        });
      };
      fetchAvailableDates();
    }, []);

    // Load time slots when date selected
    useEffect(() => {
      if (booking.service && selectedDate) {
        loadTimeSlots();
      } else {
        setAvailableSlots([]);
      }
    }, [selectedDate, booking.service]);

    const loadTimeSlots = async () => {
      if (!selectedDate || !dentist || !booking.service) {
        setAvailableSlots([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const slots = await api.getAvailableSlots(dentist.id, selectedDate);

        if (!slots || slots.length === 0) {
          setAvailableSlots([]);
          setIsLoading(false);
          return;
        }

        const timeSlots: TimeSlot[] = slots.map(time => {
          const capacity = Math.floor(Math.random() * 4) + 3;
          const remaining = Math.floor(Math.random() * capacity) + 1;
          return {
            time,
            capacity,
            remaining,
            isAvailable: remaining > 0,
          };
        });
        
        setAvailableSlots(timeSlots);

      } catch (error) {
        console.error('Error loading time slots:', error);
        setAvailableSlots([]);
        toast.error('Erreur lors du chargement des créneaux');
      } finally {
        setIsLoading(false);
      }
    };

    const handleServiceSelect = (service: Service) => {
      setBooking(prev => ({ ...prev, service }));
      setCurrentStep(2);
    };

    const handleDateSelect = (date: Date | undefined) => {
      setSelectedDate(date);
      if (date) {
        setBooking(prev => ({ ...prev, date }));
      }
    };

    const handleTimeSlotSelect = (slot: TimeSlot) => {
      if (!slot.isAvailable) return;
      setBooking(prev => ({ ...prev, timeSlot: slot }));
      setCurrentStep(3);
    };

    const handleSubmit = async () => {
      if (!booking.service || !booking.date || !booking.timeSlot || !booking.patientName || !booking.patientPhone) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      setIsLoading(true);
      try {
        await api.bookAppointment({
          dentistId: dentist.id,
          serviceId: booking.service.id,
          date: booking.date.toISOString(),
          time: booking.timeSlot.time,
          patientName: booking.patientName,
          patientPhone: booking.patientPhone,
          patientEmail: booking.patientEmail || undefined,
          notes: booking.notes || undefined,
        });

        if (booking.saveInfo) {
          localStorage.setItem('patientInfo', JSON.stringify({
            name: booking.patientName,
            phone: booking.patientPhone,
            email: booking.patientEmail,
          }));
        }

        setShowSuccess(true);
        toast.success('Rendez-vous confirmé! Un message a été envoyé à ' + booking.patientPhone);
      } catch (error) {
        toast.error('Erreur lors de la réservation');
      } finally {
        setIsLoading(false);
      }
    };

    const formatPhone = (value: string) => {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.startsWith('212')) {
        return `+212 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
      }
      return cleaned;
    };

    const completedSteps = [
      booking.service ? 1 : 0,
      booking.timeSlot ? 2 : 0,
      booking.patientName && booking.patientPhone ? 3 : 0,
    ].filter(Boolean).length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Réserver un rendez-vous</h1>
            <p className="text-gray-600">Simple, rapide et sans surprises</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card className="shadow-lg border-0 sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">Votre réservation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {STEPS.map((step) => {
                      const isCompleted = completedSteps >= step.id;
                      const isCurrent = currentStep === step.id;
                      const Icon = step.icon;

                      return (
                        <div key={step.id} className="flex items-start gap-3">
                          <div className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                            isCompleted && 'bg-green-500 border-green-500 text-white',
                            isCurrent && !isCompleted && 'bg-blue-600 border-blue-600 text-white',
                            !isCurrent && !isCompleted && 'bg-gray-100 border-gray-300 text-gray-400'
                          )}>
                            {isCompleted ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <Icon className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 pt-2">
                            <div className={cn(
                              'font-semibold text-sm',
                              isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                            )}>
                              {step.name}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t pt-4">
                    {booking.service && (
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Service</div>
                          <div className="font-semibold text-sm">{booking.service.name}</div>
                          <div className="text-xs text-gray-600">{booking.service.duration} min · {booking.service.price} MAD</div>
                        </div>

                        {booking.date && booking.timeSlot && (
                          <>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Date & Heure</div>
                              <div className="font-semibold text-sm">
                                {format(booking.date, 'EEEE d MMMM', { locale: fr })}
                              </div>
                              <div className="text-xs text-gray-600">{booking.timeSlot.time}</div>
                            </div>

                            <div>
                              <div className="text-xs text-gray-500 mb-1">Total</div>
                              <div className="font-bold text-lg text-blue-600">{booking.service.price} MAD</div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0 min-h-[600px]">
                <CardContent className="p-6">
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choisissez un service</h2>
                        <p className="text-gray-600">Sélectionnez le type de consultation dont vous avez besoin</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {dentist.services.map((service) => (
                          <button
                            key={service.id}
                            onClick={() => handleServiceSelect(service)}
                            className={cn(
                              'p-6 rounded-2xl border-2 text-left transition-all hover:shadow-lg',
                              booking.service?.id === service.id
                                ? 'border-blue-600 bg-blue-50 shadow-md scale-105'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            )}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="font-bold text-lg text-gray-900">{service.name}</div>
                              {service.id === 's1' && (
                                <Badge className="bg-orange-100 text-orange-700 rounded-full">Populaire</Badge>
                              )}
                            </div>
                            {service.description && (
                              <div className="text-sm text-gray-600 mb-4">{service.description}</div>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {service.duration} min
                                </span>
                              </div>
                              <div className="font-bold text-lg text-blue-600">{service.price} MAD</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && booking.service && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choisissez une date et une heure</h2>
                        <p className="text-gray-600">Sélectionnez une date dans le calendrier, puis choisissez un créneau horaire disponible</p>
                      </div>

                      <div className="w-full">
                        <CalendarScheduler
                          timeSlots={availableSlots.length > 0 ? availableSlots.map(s => formatTime12h(s.time)) : []}
                          disabledDates={(date) => date < new Date()}
                          availableDates={dateAvailability.available}
                          unavailableDates={dateAvailability.unavailable}
                          onDateChange={handleDateSelect}
                          onConfirm={({ date, time }) => {
                            if (date && time) {
                              handleDateSelect(date);
                              const time24h = formatTime24h(time);
                              const slot = availableSlots.find(s => s.time === time24h);
                              if (slot) {
                                handleTimeSlotSelect(slot);
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vos informations</h2>
                        <p className="text-gray-600">Remplissez vos coordonnées pour finaliser la réservation</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="flex items-center gap-2">
                            Nom complet *
                            {booking.patientName && (
                              <Check className="w-4 h-4 text-green-500" />
                            )}
                          </Label>
                          <Input
                            id="name"
                            value={booking.patientName}
                            onChange={(e) => setBooking(prev => ({ ...prev, patientName: e.target.value }))}
                            className="rounded-xl h-12"
                            placeholder="Votre nom"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2">
                            Téléphone *
                            {booking.patientPhone && (
                              <Check className="w-4 h-4 text-green-500" />
                            )}
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={booking.patientPhone}
                            onChange={(e) => {
                              const formatted = formatPhone(e.target.value);
                              setBooking(prev => ({ ...prev, patientPhone: formatted }));
                            }}
                            className="rounded-xl h-12"
                            placeholder="+212 6 12 34 56 78"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            Email (optionnel)
                            {booking.patientEmail && (
                              <Check className="w-4 h-4 text-green-500" />
                            )}
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={booking.patientEmail}
                            onChange={(e) => setBooking(prev => ({ ...prev, patientEmail: e.target.value }))}
                            className="rounded-xl h-12"
                            placeholder="votre@email.com"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes (optionnel)</Label>
                          <Textarea
                            id="notes"
                            value={booking.notes}
                            onChange={(e) => setBooking(prev => ({ ...prev, notes: e.target.value }))}
                            className="rounded-xl"
                            placeholder="Informations supplémentaires..."
                            rows={3}
                          />
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                          <Checkbox
                            id="saveInfo"
                            checked={booking.saveInfo}
                            onCheckedChange={(checked) =>
                              setBooking(prev => ({ ...prev, saveInfo: checked as boolean }))
                            }
                          />
                          <Label htmlFor="saveInfo" className="text-sm text-gray-600 cursor-pointer">
                            Enregistrer mes informations pour la prochaine fois
                          </Label>
                        </div>

                        <Button
                          onClick={() => {
                            if (booking.patientName && booking.patientPhone) {
                              setCurrentStep(4);
                            } else {
                              toast.error('Veuillez remplir tous les champs obligatoires');
                            }
                          }}
                          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 h-12 text-base"
                          disabled={!booking.patientName || !booking.patientPhone}
                        >
                          Continuer vers la confirmation
                          <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmer votre réservation</h2>
                        <p className="text-gray-600">Vérifiez les détails avant de confirmer</p>
                      </div>

                      <Card className="bg-gray-50 border-2 border-gray-200">
                        <CardContent className="p-6 space-y-4">
                          {booking.service && (
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Service</div>
                              <div className="font-semibold">{booking.service.name}</div>
                              <div className="text-sm text-gray-600">{booking.service.duration} min · {booking.service.price} MAD</div>
                            </div>
                          )}

                          {booking.date && booking.timeSlot && (
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Date & Heure</div>
                              <div className="font-semibold">
                                {format(booking.date, 'EEEE d MMMM yyyy', { locale: fr })} à {booking.timeSlot.time}
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="text-sm text-gray-500 mb-1">Patient</div>
                            <div className="font-semibold">{booking.patientName}</div>
                            <div className="text-sm text-gray-600">{booking.patientPhone}</div>
                          </div>

                          <div className="pt-4 border-t">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-lg">Total</span>
                              <span className="font-bold text-2xl text-blue-600">
                                {booking.service?.price} MAD
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 h-14 text-base font-semibold"
                      >
                        {isLoading ? 'Confirmation...' : 'Confirmer la réservation'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <DialogTitle className="text-center">Rendez-vous confirmé!</DialogTitle>
              <DialogDescription className="text-center">
                Votre rendez-vous a été confirmé. Un message a été envoyé à {booking.patientPhone}.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <Button
                onClick={() => {
                  window.open(`https://wa.me/212${booking.patientPhone.replace(/\D/g, '').slice(2)}?text=Votre rendez-vous est confirmé pour le ${booking.date && format(booking.date, 'd MMMM yyyy', { locale: fr })} à ${booking.timeSlot?.time}`, '_blank');
                }}
                className="w-full rounded-xl bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Envoyer à WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const icsContent = `BEGIN:VCALENDAR
  VERSION:2.0
  PRODID:-//Ocliq//Booking//EN
  BEGIN:VEVENT
  UID:${Date.now()}@ocliq.ma
  DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
  DTSTART:${booking.date && booking.timeSlot ? new Date(`${format(booking.date, 'yyyy-MM-dd')}T${booking.timeSlot.time}`).toISOString().replace(/[-:]/g, '').split('.')[0] : ''}Z
  SUMMARY:${booking.service?.name || 'Rendez-vous'}
  DESCRIPTION:${booking.service?.name || ''} avec ${dentist.name}
  LOCATION:${dentist.address}, ${dentist.city}
  END:VEVENT
  END:VCALENDAR`;
                  const blob = new Blob([icsContent], { type: 'text/calendar' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'rendez-vous.ics';
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full rounded-xl"
              >
                <Download className="mr-2 h-5 w-5" />
                Télécharger pour Google Calendar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuccess(false);
                  window.location.reload();
                }}
                className="w-full rounded-xl"
              >
                Réserver un autre rendez-vous
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
