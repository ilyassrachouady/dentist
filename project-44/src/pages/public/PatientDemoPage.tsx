import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { api } from '@/lib/api';
import { demoDentist, getAvailableTimeSlots } from '@/lib/mock-data';
import { Dentist, Service } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PatientDemoPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dateAvailability, setDateAvailability] = useState<Map<string, number>>(new Map());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Form fields
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [notes, setNotes] = useState('');

  const dentist = demoDentist;

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  // Pre-load availability for the current month
  useEffect(() => {
    if (selectedService && dentist) {
      loadMonthAvailability();
    }
  }, [currentMonth, selectedService, dentist]);

  const loadMonthAvailability = async () => {
    if (!dentist || !selectedService) return;
    
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    const availabilityMap = new Map<string, number>();
    
    // Load availability for each day in the month
    await Promise.all(
      days.map(async (day) => {
        if (day < new Date()) return; // Skip past dates
        
        try {
          const slots = await api.getAvailableSlots(dentist.id, day);
          const dayKey = format(day, 'yyyy-MM-dd');
          availabilityMap.set(dayKey, slots.length);
        } catch (error) {
          const dayKey = format(day, 'yyyy-MM-dd');
          availabilityMap.set(dayKey, 0);
        }
      })
    );
    
    setDateAvailability(availabilityMap);
  };

  const loadAvailableSlots = async () => {
    if (!selectedDate || !dentist) return;
    try {
      const slots = await api.getAvailableSlots(dentist.id, selectedDate);
      setAvailableSlots(slots);
      setSelectedTime('');
      
      // Update availability map
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      setDateAvailability(prev => {
        const newMap = new Map(prev);
        newMap.set(dateStr, slots.length);
        return newMap;
      });
    } catch (error) {
      toast.error('Erreur lors du chargement des créneaux');
    }
  };

  const handleBooking = async () => {
    if (!dentist || !selectedDate || !selectedTime || !selectedService || !patientName || !patientPhone) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsLoading(true);
    try {
      await api.bookAppointment({
        dentistId: dentist.id,
        serviceId: selectedService,
        date: selectedDate.toISOString(),
        time: selectedTime,
        patientName,
        patientPhone,
        patientEmail: patientEmail || undefined,
        notes: notes || undefined,
      });

      setShowSuccess(true);
      toast.success('Rendez-vous réservé avec succès!');
      
      // Update availability map
      if (selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const currentCount = dateAvailability.get(dateStr) || 0;
        setDateAvailability(prev => {
          const newMap = new Map(prev);
          newMap.set(dateStr, Math.max(0, currentCount - 1));
          return newMap;
        });
      }
      
      // Reset form
      setPatientName('');
      setPatientPhone('');
      setPatientEmail('');
      setNotes('');
      setSelectedService('');
      setSelectedTime('');
      loadAvailableSlots();
    } catch (error) {
      toast.error('Erreur lors de la réservation');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedServiceData = dentist.services.find(s => s.id === selectedService);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ocliq</h1>
              <p className="text-sm text-gray-600">Réservation en ligne - Mode démo</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Dentist Info Card */}
        <Card className="mb-8 shadow-lg border-0 bg-white">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <Avatar className="h-20 w-20 md:h-24 md:w-24">
                <AvatarImage src={dentist.photo} />
                <AvatarFallback className="text-xl">
                  {dentist.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{dentist.name}</h2>
                  <Badge variant="secondary" className="rounded-full">Mode démo</Badge>
                </div>
                <p className="text-lg text-blue-600 mb-3">{dentist.specialty}</p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{dentist.address}, {dentist.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{dentist.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Service Selection */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                  Étape 1: Choisissez un service
                </CardTitle>
                <CardDescription>
                  Sélectionnez le type de consultation dont vous avez besoin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dentist.services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service.id)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all hover:shadow-md',
                        selectedService === service.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="font-semibold text-gray-900 mb-1">{service.name}</div>
                      {service.description && (
                        <div className="text-sm text-gray-600 mb-2">{service.description}</div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.duration} min
                        </span>
                        <span className="font-semibold text-blue-600">{service.price} MAD</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Date Selection */}
            {selectedService && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    Étape 2: Choisissez une date
                  </CardTitle>
                  <CardDescription>
                    Les dates en vert ont des créneaux disponibles, les dates en rouge sont complètes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        onMonthChange={setCurrentMonth}
                        disabled={(date) => date < new Date()}
                        className="rounded-xl border"
                        modifiers={{
                          hasSlots: Array.from(dateAvailability.entries())
                            .filter(([_, count]) => count > 0)
                            .map(([dateStr]) => {
                              const [year, month, day] = dateStr.split('-').map(Number);
                              return new Date(year, month - 1, day);
                            }),
                          noSlots: Array.from(dateAvailability.entries())
                            .filter(([_, count]) => count === 0)
                            .map(([dateStr]) => {
                              const [year, month, day] = dateStr.split('-').map(Number);
                              return new Date(year, month - 1, day);
                            }),
                        }}
                        modifiersClassNames={{
                          hasSlots: 'has-slots-available',
                          noSlots: 'no-slots-available',
                        }}
                        classNames={{
                          day: 'relative',
                        }}
                      />
                      {/* Custom styling overlay for slot indicators */}
                      <style>{`
                        .rdp-day.has-slots-available {
                          background-color: #dcfce7 !important;
                          color: #15803d !important;
                          font-weight: 600;
                          border: 2px solid #4ade80 !important;
                        }
                        .rdp-day.has-slots-available:hover {
                          background-color: #bbf7d0 !important;
                        }
                        .rdp-day.has-slots-available[aria-selected="true"] {
                          background-color: #bbf7d0 !important;
                          box-shadow: 0 0 0 2px #22c55e, 0 0 0 4px rgba(34, 197, 94, 0.2);
                        }
                        .rdp-day.has-slots-available::after {
                          content: '';
                          position: absolute;
                          bottom: 2px;
                          left: 50%;
                          transform: translateX(-50%);
                          width: 6px;
                          height: 6px;
                          background-color: #22c55e;
                          border-radius: 50%;
                        }
                        .rdp-day.no-slots-available {
                          background-color: #fef2f2 !important;
                          color: #dc2626 !important;
                          opacity: 0.7;
                          cursor: not-allowed;
                          border: 2px solid #fecaca !important;
                        }
                        .rdp-day.no-slots-available::after {
                          content: '';
                          position: absolute;
                          bottom: 2px;
                          left: 50%;
                          transform: translateX(-50%);
                          width: 6px;
                          height: 6px;
                          background-color: #ef4444;
                          border-radius: 50%;
                        }
                        .rdp-day:not(.has-slots-available):not(.no-slots-available):not([aria-disabled="true"])::after {
                          content: '';
                          position: absolute;
                          bottom: 2px;
                          left: 50%;
                          transform: translateX(-50%);
                          width: 4px;
                          height: 4px;
                          background-color: #d1d5db;
                          border-radius: 50%;
                        }
                      `}</style>
                    </div>
                    <div className="flex items-center justify-center gap-6 pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-green-100 border-2 border-green-400"></div>
                        <span className="text-gray-600">Disponible</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-red-50 border-2 border-red-200"></div>
                        <span className="text-gray-600">Complet</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                        <span className="text-gray-600">Chargement...</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Time Selection */}
            {selectedDate && availableSlots.length > 0 && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Étape 3: Choisissez un créneau horaire
                  </CardTitle>
                  <CardDescription>
                    Créneaux disponibles le {selectedDate && format(selectedDate, 'd MMMM yyyy', { locale: fr })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        variant={selectedTime === slot ? 'default' : 'outline'}
                        className={cn(
                          'rounded-xl',
                          selectedTime === slot && 'bg-blue-600 hover:bg-blue-700'
                        )}
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Patient Info */}
            {selectedTime && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Étape 4: Vos informations</CardTitle>
                  <CardDescription>
                    Remplissez vos coordonnées pour finaliser la réservation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input
                      id="name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="rounded-xl"
                      placeholder="Votre nom"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="rounded-xl"
                      placeholder="+212 6 12 34 56 78"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optionnel)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      className="rounded-xl"
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optionnel)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="rounded-xl"
                      placeholder="Informations supplémentaires..."
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleBooking}
                    disabled={isLoading || !patientName || !patientPhone}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 h-12 text-base"
                  >
                    {isLoading ? 'Réservation...' : 'Confirmer la réservation'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 sticky top-4">
              <CardHeader>
                <CardTitle>Résumé</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedServiceData && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="text-sm text-gray-600 mb-1">Service</div>
                    <div className="font-semibold">{selectedServiceData.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {selectedServiceData.duration} min • {selectedServiceData.price} MAD
                    </div>
                  </div>
                )}

                {selectedDate && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="text-sm text-gray-600 mb-1">Date</div>
                    <div className="font-semibold">
                      {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                    </div>
                  </div>
                )}

                {selectedTime && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="text-sm text-gray-600 mb-1">Heure</div>
                    <div className="font-semibold">{selectedTime}</div>
                  </div>
                )}

                {!selectedService && (
                  <div className="text-center py-8 text-gray-400">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sélectionnez un service pour commencer</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
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
              Votre rendez-vous a été réservé avec succès. Vous recevrez une confirmation par WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <div className="space-y-2 text-sm">
              <p><strong>Date:</strong> {selectedDate && format(selectedDate, 'PPP', { locale: fr })}</p>
              <p><strong>Heure:</strong> {selectedTime}</p>
              <p><strong>Service:</strong> {selectedServiceData?.name}</p>
              <p><strong>Patient:</strong> {patientName}</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setShowSuccess(false);
              window.location.reload();
            }}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700"
          >
            Réserver un autre rendez-vous
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

