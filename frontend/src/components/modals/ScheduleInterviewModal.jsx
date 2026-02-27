import { useState, useEffect } from 'react';
import { Modal, Input, Select, Btn } from '../ui';
import { Icons } from '../ui/Icons';
import { getPanels } from '../../api/InterviewPortalApis';
import s from './ScheduleInterviewModal.module.css';

export default function ScheduleInterviewModal({ onClose, onSchedule, candidate }) {
  const [form, setForm] = useState({ date: '', time: '', location: '', panel: '' });
  const [panels, setPanels] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const getTodayInIST = () => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const panelsData = await getPanels();
        setPanels(panelsData);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const isPastDateTime = (date, time) => {
    if (!date || !time) return false;
    const selected = new Date(`${date}T${time}:00`);
    if (Number.isNaN(selected.getTime())) return false;
    return selected.getTime() < Date.now();
  };

  const isAllowedInterviewTime = (time) => {
    if (!time) return true;
    return time >= '09:00' && time <= '21:00';
  };

  const timeOptions = (() => {
    const options = [{ value: '', label: 'Select Time' }];
    for (let minutes = 9 * 60; minutes <= 21 * 60; minutes += 15) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const hour12 = hour % 12 === 0 ? 12 : hour % 12;
      const meridiem = hour < 12 ? 'AM' : 'PM';
      options.push({ value, label: `${hour12}:${String(minute).padStart(2, '0')} ${meridiem}` });
    }
    return options;
  })();

  const submit = async () => {
    if (!form.date || !form.time || !String(form.location || '').trim() || !form.panel) {
      alert('Date, Time, Location and Panel are required.');
      return;
    }

    if (form.time && !isAllowedInterviewTime(form.time)) {
      alert('Interview time must be between 09:00 AM and 09:00 PM');
      return;
    }

    if (form.date && form.time && isPastDateTime(form.date, form.time)) {
      alert('Back date/time is not allowed for interview scheduling');
      return;
    }

    setSubmitting(true);
    const result = await onSchedule(candidate.Candidate_id || candidate.id, form);
    setSubmitting(false);

    if (result?.success) {
      onClose();
    } else {
      alert(result?.message || 'Failed to schedule interview');
    }
  };

  const panelOptions = [{ value: '', label: 'Select Panel Member' }, ...panels.map(p => ({ value: p.User_id, label: p.User_name }))];
  const today = getTodayInIST();

  return (
    <Modal onClose={onClose}>
      <div className={s.content}>
        <div className={s.head}>
          <div>
            <h2 className={s.title}>Schedule Interview</h2>
            <p className={s.subtitle}>{candidate.Candidate_name || candidate.name} - {candidate.Candidate_position || candidate.position}</p>
          </div>
          <Btn onClick={onClose} variant="ghost" small><Icons.X /></Btn>
        </div>
        <div className={s.grid}>
          <Input label="Date *" type="date" min={today} value={form.date} onChange={(e) => set('date', e.target.value)} />
          <Select label="Time *" options={timeOptions} value={form.time} onChange={(e) => set('time', e.target.value)} />
          <Input label="Location *" placeholder="e.g. Zoom / Room A" value={form.location} onChange={(e) => set('location', e.target.value)} />
          <Select label="Panel *" options={panelOptions} value={form.panel} onChange={(e) => set('panel', e.target.value)} />
        </div>
        <div className={s.actions}>
          <Btn onClick={onClose} variant="ghost" disabled={submitting}>Cancel</Btn>
          <Btn onClick={submit} variant="primary" disabled={submitting}><Icons.Calendar /> {submitting ? 'Scheduling...' : 'Schedule Interview'}</Btn>
        </div>
      </div>
    </Modal>
  );
}
