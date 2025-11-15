import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { api } from '@/lib/api';
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
import { Calendar as CalendarIcon, Clock, MapPin, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const [dentist, setDentist] = useState<Dentist | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form fields
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadDentist();
  }, [id]);

  useEffect(() => {
    if (selectedDate && dentist) {
      loadAvailableSlots();
    }
  }, [selectedDate, dentist]);

  const loadDentist = async () => {
    if (!id) return;
    try {
      const data = await api.getDentist(id);
      setDentist(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des informations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDate || !dentist) return;
    try {
      const slots = await api.getAvailableSlots(dentist.id, selectedDate);
      setAvailableSlots(slots);
      setSelectedTime('');
    } catch (error) {
      toast.error('Erreur lors du chargement des créneaux');
    }
  };

  const handleBooking = async () => {
    if (!dentist || !selectedDate || !selectedTime || !selectedService || !patientName || !patientPhone) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsBooking(true);
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
    } catch (error) {
      toast.error('Erreur lors de la réservation');
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!dentist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Dentiste non trouvé</div>
      </div>
    );
  }

  const selectedServiceData = dentist.services.find(s => s.id === selectedService);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Dentist Header */}
        <Card className="mb-8 shadow-lg border-0">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <Avatar className="h-24 w-24 md:h-32 md:w-32">
                <AvatarImage src={dentist.photo} />
                <AvatarFallback className="text-2xl">
                  {dentist.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{dentist.name}</h1>
                <p className="text-lg text-gray-600 mb-4">{dentist.specialty}</p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{dentist.address}, {dentist.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{dentist.phone}</span>
                  </div>
                  {dentist.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{dentist.email}</span>
                    </div>
                  )}
                </div>
                {dentist.bio && (
                  <p className="mt-4 text-gray-700">{dentist.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Form */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-2xl">Réserver un rendez-vous</CardTitle>
              <CardDescription>
                Sélectionnez une date, un créneau et un service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Service Selection */}
              <div className="space-y-2">
                <Label>Service</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Sélectionnez un service" />
                  </SelectTrigger>
                  <SelectContent>
                    {dentist.services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - {service.duration}min - {service.price} MAD
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label>Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-xl border"
                />
              </div>

              {/* Time Selection */}
              {selectedDate && availableSlots.length > 0 && (
                <div className="space-y-2">
                  <Label>Heure</Label>
                  <div className="grid grid-cols-3 gap-2">
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
                        <Clock className="mr-2 h-4 w-4" />
                        {slot}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDate && availableSlots.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Aucun créneau disponible pour cette date
                </div>
              )}

              {/* Patient Info */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Vos informations</h3>
                
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
              </div>

              <Button
                onClick={handleBooking}
                disabled={isBooking || !selectedDate || !selectedTime || !selectedService || !patientName || !patientPhone}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700"
              >
                {isBooking ? 'Réservation...' : 'Réserver le rendez-vous'}
              </Button>
            </CardContent>
          </Card>

          {/* Services List */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Services disponibles</CardTitle>
              <CardDescription>Liste de tous nos services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dentist.services.map((service) => (
                  <div
                    key={service.id}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-colors',
                      selectedService === service.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{service.name}</h4>
                        {service.description && (
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {service.duration} min
                          </span>
                          <span className="font-semibold text-gray-900">{service.price} MAD</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
            <DialogTitle className="text-center">Rendez-vous réservé!</DialogTitle>
            <DialogDescription className="text-center">
              Votre rendez-vous a été confirmé. Vous recevrez une confirmation par WhatsApp.
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
        </DialogContent>
      </Dialog>
    </div>
  );
}

