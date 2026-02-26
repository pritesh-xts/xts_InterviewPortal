import { useState, useEffect } from 'react';
import { Modal, Input, Select, Btn } from '../ui';
import { Icons } from '../ui/Icons';
import { getStatuses, getPanels } from '../../api/InterviewPortalApis';
import s from './AddCandidateModal.module.css';

export default function AddCandidateModal({ onClose, onAdd, user }) {
  const [form, setForm] = useState({ name: '', position: '', experience: '', email: '', phone: '', skills: '', department: 'Engineering', date: '', time: '', location: '', panel: '', status: '7' });
  const [panels, setPanels] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
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
    fetchPanels();
    const load = async () => {
      try {
        const data = await getStatuses();
        setStatuses(data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const fetchPanels = async () => {
    try {
      const data = await getPanels();
      setPanels(data);
    } catch (error) {
      console.error('Error fetching panels:', error);
    }
  };


  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setPhone = (value) => {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
    set('phone', digits);
  };
  const getDigits = (value) => String(value || '').replace(/\D/g, '');
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
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

  const validateResume = (file) => {
    if (!file) return '';
    const allowed = ['pdf', 'doc', 'docx'];
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!allowed.includes(ext)) return 'Resume must be PDF, DOC, or DOCX';
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) return 'Resume size must be 5MB or less';
    return '';
  };

  const submit = async () => {
    if (!form.name || !form.position || !form.email || !form.phone || !form.department || !form.status || !form.date || !form.time || !String(form.location || '').trim() || !form.panel) {
      alert('Name, Position, Email, Phone, Education, Status, Date, Time, Location and Panel are required.');
      return;
    }
    if (!String(form.skills || '').trim()) {
      alert('Skills are required');
      return;
    }
    if (!form.experience || Number(form.experience) < 0) {
      alert('Please enter valid experience');
      return;
    }
    if (!resumeFile) {
      alert('Resume is required');
      return;
    }
    if (!isValidEmail(form.email)) {
      alert('Please enter a valid email address');
      return;
    }
    const phoneDigits = getDigits(form.phone);
    if (phoneDigits.length !== 10) {
      alert('Phone number must be exactly 10 digits');
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

    const resumeError = validateResume(resumeFile);
    if (resumeError) {
      alert(resumeError);
      return;
    }

    setSubmitting(true);
    const result = await onAdd({ ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) }, resumeFile);
    setSubmitting(false);

    if (result?.success) {
      if (result.uploadError) {
        alert(`Candidate added, but resume upload failed: ${result.uploadError}`);
      }
      onClose();
    } else {
      alert(result?.message || 'Failed to add candidate');
    }
  };
  const depts = ['MTech', 'Masters', 'BTech', 'Bachelors', 'CDAC', 'Diploma', 'Other'].map(d => ({ value: d, label: d }));
  const panelOptions = [{ value: '', label: 'Select Panel Member' }, ...panels.map(p => ({ value: p.User_id, label: p.User_name }))];
  const isAdmin = Number(user?.roleId || user?.Role_id) === 4;
  const hrAllowedStatusIds = new Set([7, 8, 9]);
  const hrStatuses = statuses.filter(st => hrAllowedStatusIds.has(Number(st.Status_id)));
  const visibleStatuses = isAdmin ? statuses : (hrStatuses.length > 0 ? hrStatuses : statuses);
  const statusOptions = visibleStatuses.map(st => ({ value: st.Status_id, label: st.Status_description }));
  const today = getTodayInIST();

  return (
    <Modal onClose={onClose}>
      <div className={s.content}>
        <div className={s.head}>
          <div>
            <h2 className={s.title}>Add New Candidate</h2>
            <p className={s.subtitle}>Enter candidate details</p>
          </div>
          <Btn onClick={onClose} variant="ghost" small><Icons.X /></Btn>
        </div>
        <div className={s.grid}>
          <div className={s.span2}><Input label="Full Name *" placeholder="e.g. Sarah Chen" value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
          <Input label="Position *" placeholder="e.g. Senior Developer" value={form.position} onChange={(e) => set('position', e.target.value)} />
          <Select label="Education *" options={depts} value={form.department} onChange={(e) => set('department', e.target.value)} />
          <Input label="Experience *" type="number" step="0.1" min="0" placeholder="e.g. 2.5" value={form.experience} onChange={(e) => set('experience', e.target.value)} />
          <Input label="Email *" type="email" placeholder="candidate@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
          <Input label="Phone *" placeholder="10-digit phone number" value={form.phone} maxLength={10} inputMode="numeric" onChange={(e) => setPhone(e.target.value)} />
          <div className={s.fileField}>
            <label className={s.fileLabel}>Resume (PDF/DOC/DOCX, max 5MB) *</label>
            <input
              className={s.fileInput}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
            />
            <p className={s.fileName}>{resumeFile ? resumeFile.name : 'No file selected'}</p>
          </div>
          <Select label="Status *" options={statusOptions} value={form.status} onChange={(e) => set('status', e.target.value)} />
          <Input label="Date *" type="date" min={today} value={form.date} onChange={(e) => set('date', e.target.value)} />
          <Select label="Time *" options={timeOptions} value={form.time} onChange={(e) => set('time', e.target.value)} />
          <Input label="Location *" placeholder="e.g. Zoom / Room A" value={form.location} onChange={(e) => set('location', e.target.value)} />
          <Select label="Panel *" options={panelOptions} value={form.panel} onChange={(e) => set('panel', e.target.value)} />
          <div className={s.span2}><Input label="Skills (comma-separated) *" placeholder="React, TypeScript" value={form.skills} onChange={(e) => set('skills', e.target.value)} /></div>
        </div>
        <div className={s.actions}>
          <Btn onClick={onClose} variant="ghost" disabled={submitting}>Cancel</Btn>
          <Btn onClick={submit} variant="primary" disabled={submitting}><Icons.Plus /> {submitting ? 'Adding...' : 'Add Candidate'}</Btn>
        </div>
      </div>
    </Modal>
  );
}
