import { useState } from 'react';
import { Modal, Input, Select, Btn } from '../ui';
import { Icons } from '../ui/Icons';
import s from './AddCandidateModal.module.css';

export default function AddCandidateModal({ onClose, onAdd, user }) {
  const [form, setForm] = useState({ name: '', position: '', primarySkill: '', experience: '', email: '', phone: '', skills: '', department: 'Engineering', status: '7' });
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);


  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setPhone = (value) => {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
    set('phone', digits);
  };
  const getDigits = (value) => String(value || '').replace(/\D/g, '');
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

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
    if (!form.name || !form.position || !form.primarySkill || !form.email || !form.phone || !form.department) {
      alert('Name, Position, Primary Skill, Email, Phone, and Education are required.');
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
          <Input label="Experience (years) *" type="number" step="0.1" min="0" placeholder="e.g. 2.5" value={form.experience} onChange={(e) => set('experience', e.target.value)} />
          <Input label="Email *" type="email" placeholder="candidate@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
          <Input label="Phone *" placeholder="10-digit phone number" value={form.phone} maxLength={10} inputMode="numeric" onChange={(e) => setPhone(e.target.value)} />
          <Input label="Primary Skill (comma-separated)*" placeholder="e.g. Frontend, Backend" value={form.primarySkill} onChange={(e) => set('primarySkill', e.target.value)} />
          <Input label="Skills (comma-separated) *" placeholder="React, TypeScript, Node.js" value={form.skills} onChange={(e) => set('skills', e.target.value)} />

          <Input label="Resume (PDF/DOC/DOCX, max 5MB) *" type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
          {/* <p className={s.fileName}>{resumeFile ? resumeFile.name : 'No file selected'}</p> */}
          {/* <div className={s.span2}>
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
          </div> */}
          {/* <div className={s.grid}>
            <div className={s.span2}>
              <Input label="Primary Skill *" placeholder="e.g. React" value={form.primarySkill} onChange={(e) => set('primarySkill', e.target.value)} />
            </div>
            <div className={s.span2}>
              <Input label="Skills (comma-separated) *" placeholder="React, TypeScript, Node.js" value={form.skills} onChange={(e) => set('skills', e.target.value)} />
            </div>
          </div> */}
        </div>

        <div className={s.actions}>
          <Btn onClick={onClose} variant="ghost" disabled={submitting}>Cancel</Btn>
          <Btn onClick={submit} variant="primary" disabled={submitting}><Icons.Plus /> {submitting ? 'Adding...' : 'Add Candidate'}</Btn>
        </div>
      </div>
    </Modal>
  );
}
