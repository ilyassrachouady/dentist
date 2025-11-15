import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AddAppointmentFormProps {
  dentistId: string;
  onSuccess: () => void;
}

export function AddAppointmentForm({ dentistId, onSuccess }: AddAppointmentFormProps) {
  const { dentist } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'pending' | 'confirmed'>('confirmed');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (date) {
      loadAvailableSlots();
    }
  }, [date, dentist]);

  const loadAvailableSlots = async () => {
    if (!date || !dentist) return;
    try {
      const slots = await api.getAvailableSlots(dentist.id, date);
      setAvailableSlots(slots);
      setTime('');
    } catch (error) {
      console.error('Error loading slots:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !time || !serviceId || !patientName || !patientPhone) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsLoading(true);
    try {
      // Find or create patient
      const patients = await api.getPatients(dentistId);
      let patient = patients.find(p => p.phone === patientPhone);
      
      if (!patient) {
        // In a real app, create patient first
        patient = {
          id: `p-${Date.now()}`,
          name: patientName,
          phone: patientPhone,
          email: patientEmail || undefined,
          createdAt: new Date(),
          appointments: [],
        };
      }

      await api.createAppointment({
        dentistId,
        patientId: patient.id,
        serviceId,
        date,
        time,
        status,
        notes: notes || undefined,
      });

      toast.success('Rendez-vous créé avec succès');
      onSuccess();
    } catch (error) {
      toast.error('Erreur lors de la création du rendez-vous');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Service *</Label>
          <Select value={serviceId} onValueChange={setServiceId} required>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Sélectionnez un service" />
            </SelectTrigger>
            <SelectContent>
              {dentist?.services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Statut</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="confirmed">Confirmé</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal rounded-xl',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP', { locale: fr }) : 'Sélectionnez une date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {date && availableSlots.length > 0 && (
        <div className="space-y-2">
          <Label>Heure *</Label>
          <Select value={time} onValueChange={setTime} required>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Sélectionnez une heure" />
            </SelectTrigger>
            <SelectContent>
              {availableSlots.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nom du patient *</Label>
          <Input
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="rounded-xl"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Téléphone *</Label>
          <Input
            type="tel"
            value={patientPhone}
            onChange={(e) => setPatientPhone(e.target.value)}
            className="rounded-xl"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Email (optionnel)</Label>
        <Input
          type="email"
          value={patientEmail}
          onChange={(e) => setPatientEmail(e.target.value)}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="submit"
          className="rounded-xl bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? 'Création...' : 'Créer le rendez-vous'}
        </Button>
      </div>
    </form>
  );
}

