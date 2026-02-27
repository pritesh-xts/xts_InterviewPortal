import { useState, useEffect } from 'react';
import { Modal, Avatar, Btn, Select, Input } from '../ui';
import { Icons } from '../ui/Icons';
import { getStatuses, getPanels, uploadCandidateResume } from '../../api/InterviewPortalApis';
import s from './CandidateModal.module.css';


export default function CandidateModal({ candidate: c, onClose, activeRole, user }) {
  const [tab, setTab] = useState('details');
  const [feedback, setFeedback] = useState({ statusId: '', notes: '' });
  const [candidateDetails, setCandidateDetails] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [panels, setPanels] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editInterview, setEditInterview] = useState({});
  const [initialEditForm, setInitialEditForm] = useState({});
  const [initialEditInterview, setInitialEditInterview] = useState({});
  const [initialFeedback, setInitialFeedback] = useState({ statusId: '', notes: '' });
  const [editResumeFile, setEditResumeFile] = useState(null);
  const [updating, setUpdating] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL;
  const parseApiDateTimeAsIST = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const normalized = raw.replace(' ', 'T');
    const dt = new Date(`${normalized}+05:30`);
    return Number.isNaN(dt.getTime()) ? null : dt;
  };
  const formatISTDate = (value) => {
    const dt = parseApiDateTimeAsIST(value);
    if (!dt) return '-';
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(dt);
  };
  const formatISTTime = (value) => {
    const dt = parseApiDateTimeAsIST(value);
    if (!dt) return '-';
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(dt);
  };
  const formatISTDateTime = (value) => {
    const dt = parseApiDateTimeAsIST(value);
    if (!dt) return '-';
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(dt);
  };
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
  const getDigits = (value) => String(value || '').replace(/\D/g, '');
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  const isPastDateTime = (date, time) => {
    if (!date || !time) return false;
    const selected = new Date(`${date}T${time}:00`);
    if (Number.isNaN(selected.getTime())) return false;
    return selected.getTime() < Date.now();
  };
  const setEditPhone = (value) => {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
    setEditForm(f => ({ ...f, phone: digits }));
  };

  useEffect(() => {
    fetchCandidateDetails();
    fetchStatuses();
    fetchPanels();
  }, []);

  const fetchCandidateDetails = async () => {
    try {
      const candidateId = c.Candidate_id || c.id;
      const response = await fetch(`${API_BASE}api/candidates/getById.php?id=${candidateId}`);
      const result = await response.json();
      if (result.success) {
        setCandidateDetails(result.data);
        setEditForm({
          id: result.data.Candidate_id,
          name: result.data.Candidate_name,
          email: result.data.Candidate_email,
          phone: result.data.Candidate_phone,
          position: result.data.Candidate_position,
          department: result.data.Candidate_department,
          experience: result.data.Candidate_experience,
          resume: result.data.Candidate_resume_link,
          skills: result.data.Candidate_skills,
          status: result.data.Current_status
        });
        setInitialEditForm({
          id: result.data.Candidate_id,
          name: result.data.Candidate_name,
          email: result.data.Candidate_email,
          phone: result.data.Candidate_phone,
          position: result.data.Candidate_position,
          department: result.data.Candidate_department,
          experience: result.data.Candidate_experience,
          resume: result.data.Candidate_resume_link,
          skills: result.data.Candidate_skills,
          status: result.data.Current_status
        });
        if (result.data.interview) {
          const rawDateTime = String(result.data.interview.DateTime || '');
          const [datePart, timePart] = rawDateTime.split(' ');
          const hasValidDate = /^\d{4}-\d{2}-\d{2}$/.test(String(datePart || ''));
          const interviewState = {
            interviewId: result.data.interview.Interview_id,
            date: hasValidDate ? datePart : '',
            time: hasValidDate && timePart ? timePart.slice(0, 5) : '',
            location: result.data.interview.Location || '',
            panel: result.data.interview.Feedback_by || ''
          };
          setEditInterview(interviewState);
          setInitialEditInterview(interviewState);
        } else {
          setEditInterview({});
          setInitialEditInterview({});
        }
        setEditResumeFile(null);
      }
    } catch (error) {
      console.error('Error fetching candidate details:', error);
    }
  };

  // const fetchStatuses = async () => {
  //   try {
  //     const response = await fetch('http://localhost/xts_interviewPortalapi/status/getAll.php');
  //     const result = await response.json();
  //     if (result.success) {
  //       setStatuses(result.data);
  //       if (result.data.length > 0) {
  //         setFeedback(f => ({ ...f, statusId: result.data[0].Status_id }));
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error fetching statuses:', error);
  //   }
  // };

  const fetchStatuses = async () => {
    try {
      const data = await getStatuses();
      setStatuses(data);
      if (data.length > 0) {
        const nextFeedback = { statusId: data[0].Status_id, notes: '' };
        setFeedback(nextFeedback);
        setInitialFeedback(nextFeedback);
      }
    } catch (error) {
      console.error('Error fetching statuses:', error);
    }
  };

  // const fetchPanels = async () => {
  //   try {
  //     const response = await fetch('http://localhost/xts_interviewPortalapi/users/getPanels.php');
  //     const result = await response.json();
  //     if (result.success) {
  //       setPanels(result.data);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching panels:', error);
  //   }
  // };

  const fetchPanels = async () => {
    try {
      const data = await getPanels();
      setPanels(data);
    } catch (error) {
      console.error('Error fetching panels:', error);
    }
  };

  const handleSubmitFeedback = async () => {
    const currentUserId = String(user?.id || user?.User_id || '');
    const isPanelUser = Number(user?.roleId || user?.Role_id) === 2;
    const panelScheduledRounds = history.filter(
      item => String(item?.Feedback_by || '') === currentUserId && (Number(item?.Status_id) === 8 || Number(item?.Status_id) === 9)
    ).length;
    const panelSubmittedRounds = history.filter(
      item => String(item?.Feedback_by || '') === currentUserId && String(item?.Feedback || '').trim().length > 0
    ).length;
    const panelHasSubmitted = panelScheduledRounds > 0
      ? panelSubmittedRounds >= panelScheduledRounds
      : panelSubmittedRounds > 0;
    if (isPanelUser && panelHasSubmitted) {
      alert('Feedback already submitted. View only mode is enabled.');
      return;
    }

    const normalize = (v) => String(v ?? '').trim();
    const unchanged =
      normalize(feedback.statusId) === normalize(initialFeedback.statusId) &&
      normalize(feedback.notes) === normalize(initialFeedback.notes);
    if (unchanged) {
      alert('No change found. Feedback not updated.');
      onClose();
      return;
    }

    if (!feedback.notes.trim()) {
      alert('Detailed notes are required');
      return;
    }
    if (!feedback.statusId) {
      alert('Please select a status');
      return;
    }

    console.log('Submitting feedback:', {
      candidateId: c.Candidate_id || c.id,
      statusId: feedback.statusId,
      feedbackBy: user.id || user.User_id,
      feedback: feedback.notes
    });
    try {
      const candidateId = c.Candidate_id || c.id;
      const response = await fetch(`${API_BASE}api/candidates/addFeedback.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidateId,
          statusId: parseInt(feedback.statusId),
          feedbackBy: user.id || user.User_id,
          feedback: feedback.notes,
          location: ''
        })
      });
      const result = await response.json();
      if (result.success) {
        const selectedStatus = statuses.find(
          st => String(st.Status_id) === String(feedback.statusId)
        );
        const statusLabel = selectedStatus?.Status_description || String(feedback.statusId);
        const candidateName = c.Candidate_name || c.name || '';
        const candidatePosition = c.Candidate_position || c.position || '';
        const panelMemberName = user?.name || user?.User_name || 'Panel Member';

        try {
          const emailResponse = await fetch(`${API_BASE}send-email.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'feedback_submitted',
              candidateName: candidateName,
              position: candidatePosition,
              panelMember: panelMemberName,
              statusLabel: statusLabel,
              notes: feedback.notes
            })
          });
          const emailResult = await emailResponse.json();
          if (!emailResult.success) {
            console.error('Feedback email failed:', emailResult.message, emailResult.smtpDebug || []);
          }
        } catch (mailError) {
          console.error('Feedback email request failed:', mailError);
        }

        alert('Feedback submitted successfully!');
        onClose();
      } else {
        alert(result.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback');
    }
  };

  const handleUpdateCandidate = async () => {
    const normalize = (v) => String(v ?? '').trim();
    const sameEditForm =
      normalize(editForm.name) === normalize(initialEditForm.name) &&
      normalize(editForm.email) === normalize(initialEditForm.email) &&
      normalize(editForm.phone) === normalize(initialEditForm.phone) &&
      normalize(editForm.position) === normalize(initialEditForm.position) &&
      normalize(editForm.department) === normalize(initialEditForm.department) &&
      normalize(editForm.experience) === normalize(initialEditForm.experience) &&
      normalize(editForm.resume) === normalize(initialEditForm.resume) &&
      normalize(editForm.skills) === normalize(initialEditForm.skills) &&
      normalize(editForm.status) === normalize(initialEditForm.status);
    const sameInterview =
      normalize(editInterview.interviewId) === normalize(initialEditInterview.interviewId) &&
      normalize(editInterview.date) === normalize(initialEditInterview.date) &&
      normalize(editInterview.time) === normalize(initialEditInterview.time) &&
      normalize(editInterview.location) === normalize(initialEditInterview.location) &&
      normalize(editInterview.panel) === normalize(initialEditInterview.panel);
    if (sameEditForm && sameInterview && !editResumeFile) {
      alert('No change found. Record not updated.');
      setIsEditing(false);
      return;
    }

    if (!editForm.name || !editForm.email || !editForm.position || !editForm.phone || !editForm.department || !editForm.status || !editInterview?.date || !editInterview?.time || !String(editInterview?.location || '').trim() || !editInterview?.panel) {
      alert('Name, Email, Phone, Position, Education, Status, Date, Time, Location and Panel are required');
      return;
    }
    if (!String(editForm.skills || '').trim()) {
      alert('Skills are required');
      return;
    }
    if (!editForm.experience || Number(editForm.experience) < 0) {
      alert('Please enter valid experience');
      return;
    }
    if (!editResumeFile && !hasResume) {
      alert('Resume is required');
      return;
    }
    if (!isValidEmail(editForm.email)) {
      alert('Please enter a valid email address');
      return;
    }
    const phoneDigits = getDigits(editForm.phone);
    if (phoneDigits.length !== 10) {
      alert('Phone number must be exactly 10 digits');
      return;
    }

    const selectedStatus = Number(editForm.status);
    if (editInterview?.date && editInterview?.time && isPastDateTime(editInterview.date, editInterview.time)) {
      alert('Back date/time is not allowed for interview scheduling');
      return;
    }
    const selectedPanelId = String(editInterview?.panel || '').trim();
    const l1PanelHistory = [...history].reverse().find(
      item => Number(item?.Status_id) === 8 && String(item?.Feedback_by || '').trim()
    );
    const l1PanelId = String(l1PanelHistory?.Feedback_by || '').trim();
    const samePanelForL2 = selectedStatus === 9 && selectedPanelId && l1PanelId && selectedPanelId === l1PanelId;
    let openL2FeedbackOnSuccess = false;
    if (samePanelForL2) {
      const continueWithSamePanel = window.confirm(
        'You selected the same panel member for L2 Interview. Do you want to continue?'
      );
      if (!continueWithSamePanel) {
        return;
      }
      openL2FeedbackOnSuccess = true;
    }

    if (editResumeFile) {
      const ext = (editResumeFile.name.split('.').pop() || '').toLowerCase();
      const allowed = ['pdf', 'doc', 'docx'];
      if (!allowed.includes(ext)) {
        alert('Resume must be PDF, DOC, or DOCX');
        return;
      }
      if (editResumeFile.size > 5 * 1024 * 1024) {
        alert('Resume size must be 5MB or less');
        return;
      }
    }

    try {
      setUpdating(true);
      const scheduleLabel = Number(editForm.status) === 8
        ? 'Interview Scheduled for L1'
        : Number(editForm.status) === 9
          ? 'Interview Scheduled for L2'
          : '';
      const response = await fetch(`${API_BASE}api/candidates/update.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const result = await response.json();
      if (result.success) {
        if (editInterview.interviewId && editInterview.date && editInterview.time && editInterview.panel) {
          const dateTime = editInterview.date + ' ' + editInterview.time + ':00';
          const interviewResponse = await fetch(`${API_BASE}api/interview/update.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              interviewId: editInterview.interviewId,
              dateTime: dateTime,
              location: editInterview.location,
              panel: editInterview.panel,
              statusId: parseInt(editForm.status)
            })
          });
          const interviewResult = await interviewResponse.json();
          if (!interviewResult.success) {
            alert('Candidate updated but interview update failed');
          }
        }

        let resumeUploadError = '';
        if (editResumeFile && editForm.id) {
          try {
            await uploadCandidateResume(editForm.id, editResumeFile);
          } catch (resumeErr) {
            resumeUploadError = resumeErr?.message || 'Resume upload failed';
          }
        }

        if (resumeUploadError) {
          alert(`Candidate updated, but resume upload failed: ${resumeUploadError}`);
        } else if (scheduleLabel) {
          alert(`Candidate updated successfully! ${scheduleLabel}.`);
        } else {
          alert('Candidate updated successfully!');
        }
        if (openL2FeedbackOnSuccess && showTabs) {
          setTab('feedback');
        }
        setIsEditing(false);
        setEditResumeFile(null);
        fetchCandidateDetails();
      } else {
        alert(result.message || 'Failed to update candidate');
      }
    } catch (error) {
      console.error('Error updating candidate:', error);
      alert('Error updating candidate');
    } finally {
      setUpdating(false);
    }
  };

  const data = candidateDetails || c;
  const name = data.Candidate_name || data.name || '';
  const position = data.Candidate_position || data.position || '';
  const email = data.Candidate_email || data.email || '—';
  const phone = data.Candidate_phone || data.phone || '—';
  const experience = data.Candidate_experience ? (data.Candidate_experience + ' years') : (data.experience || '—');
  const department = data.Candidate_department || data.department || '—';
  const resumeRaw = data.Candidate_resume_link || data.resume || '';
  const hasResume = Boolean(resumeRaw && resumeRaw !== '-' && resumeRaw !== '�');
  const resumeUrl = hasResume
    ? (String(resumeRaw).startsWith('http') ? resumeRaw : `${API_BASE}${String(resumeRaw).replace(/^\/+/, '')}`)
    : '';
  const resumeDisplay = hasResume ? String(resumeRaw).split('/').pop() : 'No resume uploaded';
  const status = data.Status_description || data.status || 'Pending';
  const skills = data.Candidate_skills ? (typeof data.Candidate_skills === 'string' ? data.Candidate_skills.split(',').map(s => s.trim()) : data.Candidate_skills) : (data.skills || []);

  const interview = data.interview;
  const interviewInviteResponse = String(interview?.Invite_response || 'pending').trim() || 'pending';
  const interviewInviteResponseLabel = interviewInviteResponse.charAt(0).toUpperCase() + interviewInviteResponse.slice(1);
  const interviewInviteRespondedAt = interview?.Invite_responded_at ? formatISTDateTime(interview.Invite_responded_at) : '-';
  const interviewDate = interview?.DateTime ? formatISTDate(interview.DateTime) : null;
  const interviewTime = interview?.DateTime ? formatISTTime(interview.DateTime) : null;
  const location = interview?.Location || '—';
  const panelName = interview?.Panel_name || '—';
  const history = Array.isArray(data.history) ? data.history : [];
  const historyLoaded = candidateDetails !== null;
  const currentUserId = String(user?.id || user?.User_id || '');
  const isPanelUser = Number(user?.roleId || user?.Role_id) === 2;
  const panelScheduledRounds = history.filter(
    item => String(item?.Feedback_by || '') === currentUserId && (Number(item?.Status_id) === 8 || Number(item?.Status_id) === 9)
  ).length;
  const panelSubmittedRounds = history.filter(
    item => String(item?.Feedback_by || '') === currentUserId && String(item?.Feedback || '').trim().length > 0
  ).length;
  const panelFeedbackLocked = isPanelUser && (panelScheduledRounds > 0
    ? panelSubmittedRounds >= panelScheduledRounds
    : panelSubmittedRounds > 0);
  const lastPanelFeedback = [...history].reverse().find(
    item => String(item?.Feedback_by || '') === currentUserId && String(item?.Feedback || '').trim().length > 0
  );
  const panelFeedbackStatusLabel = lastPanelFeedback?.Interview_status
    || statuses.find(st => String(st.Status_id) === String(lastPanelFeedback?.Status_id))?.Status_description
    || '-';
  const panelFeedbackDate = lastPanelFeedback?.DateTime
    ? formatISTDateTime(lastPanelFeedback.DateTime)
    : '-';
  const historyEntries = history.map((item) => {
    const feedbackText = (item.Feedback || '').trim();
    const statusId = Number(item.Status_id);
    const isScheduledEvent = (statusId === 8 || statusId === 9) && !feedbackText;
    const inviteResponse = String(item.Invite_response || 'pending').trim() || 'pending';
    const inviteResponseLabel = inviteResponse.charAt(0).toUpperCase() + inviteResponse.slice(1);
    const inviteRespondedAt = item.Invite_responded_at ? formatISTDateTime(item.Invite_responded_at) : '-';
    return {
      ...item,
      eventType: isScheduledEvent ? 'Interview Scheduled' : 'Feedback Submitted',
      inviteResponseLabel,
      inviteRespondedAt,
      displayDate: item.DateTime ? formatISTDate(item.DateTime) : '-',
      displayTime: item.DateTime ? formatISTTime(item.DateTime) : '-'
    };
  }).reverse();

  const showTabs = user && (user.roleId == 2 || user.roleId == 4);
  const canEdit = user && (user.roleId == 1 || user.roleId == 4);
  const isAdmin = Number(user?.roleId || user?.Role_id) === 4;
  const hrAllowedStatusIds = new Set([7, 8, 9]);
  const hrStatuses = statuses.filter(st => hrAllowedStatusIds.has(Number(st.Status_id)));
  
  // Filter panel statuses based on current interview round
  const currentStatus = Number(data.Current_status || c.Current_status);
  let panelStatuses = [];
  
  if (currentStatus === 8) {
    // L1 Interview - Show only L1 statuses (1, 2, 3)
    panelStatuses = statuses.filter(st => [1, 2, 3].includes(Number(st.Status_id)));
  } else if (currentStatus === 9) {
    // L2 Interview - Show only L2 statuses (4, 5, 6)
    panelStatuses = statuses.filter(st => [4, 5, 6].includes(Number(st.Status_id)));
  } else {
    // Fallback - show all non-HR statuses
    panelStatuses = statuses.filter(st => !hrAllowedStatusIds.has(Number(st.Status_id)));
  }
  
  const hrVisibleStatuses = isAdmin ? statuses : (hrStatuses.length > 0 ? hrStatuses : statuses);
  const hrStatusOptions = hrVisibleStatuses.map(st => ({ value: st.Status_id, label: st.Status_description }));
  const panelVisibleStatuses = isAdmin ? statuses : (panelStatuses.length > 0 ? panelStatuses : statuses);
  const panelStatusOptions = panelVisibleStatuses.map(st => ({ value: st.Status_id, label: st.Status_description }));
  const depts = ['Engineering', 'MTech', 'Masters', 'BTech', 'Bachelors', 'CDAC', 'Diploma', 'Other'].map(d => ({ value: d, label: d }));
  const panelOptions = [{ value: '', label: 'Select Panel' }, ...panels.map(p => ({ value: p.User_id, label: p.User_name }))];
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
  const today = getTodayInIST();
  const interviewEditTitle = Number(editForm.status) === 8
    ? 'Interview Scheduled for L1'
    : Number(editForm.status) === 9
      ? 'Interview Scheduled for L2'
      : 'Interview Details';
  const showInterviewEditSection = Boolean(
    interview || editInterview?.interviewId || Number(editForm.status) === 8 || Number(editForm.status) === 9
  );

  return (
    <Modal onClose={onClose} wide>
      <div className={s.hero}>
        <div className={s.heroTop}>
          <div className={s.heroLeft}>
            <Avatar name={name} size={56} />
            <div>
              <h2 className={s.name}>{name}</h2>
              <p className={s.position}>{position}</p>
              <span className={s.statusChip}>{status}</span>
            </div>
          </div>
          <div className={s.heroActions}>
            {canEdit && !isEditing && <Btn onClick={() => setIsEditing(true)} variant="primary" small>Edit</Btn>}
            <Btn onClick={onClose} variant="ghost" small><Icons.X /></Btn>
          </div>
        </div>
        {showTabs && (
          <div className={s.tabs}>
            {['details', 'feedback'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`${s.tabBtn} ${tab == t ? s.tabBtnActive : ''}`}>{t}</button>
            ))}
          </div>
        )}
      </div>
      <div className={s.content}>
        {tab == 'details' && (
          <>
            {isEditing ? (
              <div>
                <h3 className={s.sectionTitle}>Edit Candidate</h3>
                <div className={s.grid2}>
                  <Input label="Name *" value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
                  <Input label="Email *" value={editForm.email} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} />
                  <Input label="Phone *" value={editForm.phone} maxLength={10} inputMode="numeric" onChange={(e) => setEditPhone(e.target.value)} />
                  <Input label="Position *" value={editForm.position} onChange={(e) => setEditForm(f => ({ ...f, position: e.target.value }))} />
                  <Select label="Education *" options={depts} value={editForm.department} onChange={(e) => setEditForm(f => ({ ...f, department: e.target.value }))} />
                  <Input label="Experience (years) *" type="number" step="0.1" min="0" value={editForm.experience} onChange={(e) => setEditForm(f => ({ ...f, experience: e.target.value }))} />
                  <div className={s.fileField}>
                    <label className={s.fileLabel}>Resume (PDF/DOC/DOCX, max 5MB) *</label>
                    <input
                      className={s.fileInput}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setEditResumeFile(e.target.files?.[0] || null)}
                    />
                    <p className={s.fileName}>
                      {editResumeFile ? editResumeFile.name : (hasResume ? `Current: ${resumeDisplay}` : 'No resume uploaded')}
                    </p>
                  </div>
                  <Select label="Status *" options={hrStatusOptions} value={editForm.status} onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))} />
                  <div className={s.span2}>
                    <Input label="Skills (comma-separated) *" value={editForm.skills} onChange={(e) => setEditForm(f => ({ ...f, skills: e.target.value }))} />
                  </div>
                </div>
                {showInterviewEditSection && (
                  <div className={s.mt24}>
                    <h4 className={`${s.sectionTitle} ${s.sectionTitleSmall}`}>{interviewEditTitle}</h4>
                    <div className={s.grid2}>
                      <Input label="Date *" type="date" min={today} value={editInterview.date} onChange={(e) => setEditInterview(f => ({ ...f, date: e.target.value }))} />
                      <Select label="Time *" options={timeOptions} value={editInterview.time} onChange={(e) => setEditInterview(f => ({ ...f, time: e.target.value }))} />
                      <Input label="Location *" value={editInterview.location} onChange={(e) => setEditInterview(f => ({ ...f, location: e.target.value }))} />
                      <Select label="Panel *" options={panelOptions} value={editInterview.panel} onChange={(e) => setEditInterview(f => ({ ...f, panel: e.target.value }))} />
                    </div>
                  </div>
                )}
                <div className={s.actions}>
                  <Btn onClick={() => setIsEditing(false)} variant="ghost" disabled={updating}>Cancel</Btn>
                  <Btn onClick={handleUpdateCandidate} variant="primary" disabled={updating}>{updating ? 'Updating...' : 'Update'}</Btn>
                </div>
              </div>
            ) : (
              <>
                <div className={s.infoGrid}>
                  {[['Email', email], ['Phone', phone], ['Experience', experience], ['Education', department], ['Resume', resumeDisplay]].map(([k, v]) => (
                    <div key={k} className={s.infoCard}>
                      <p className={s.infoLabel}>{k}</p>
                      {k === 'Resume' ? (
                        hasResume ? (
                          <a className={s.resumeLink} href={resumeUrl} target="_blank" rel="noreferrer">View Resume</a>
                        ) : (
                          <p className={s.resumeEmpty}>{v}</p>
                        )
                      ) : (
                        <p className={s.infoValue}>{v}</p>
                      )}
                    </div>
                  ))}
                </div>
                {skills.length > 0 && (
                  <div className={s.skillsWrap}>
                    <p className={s.skillsTitle}>SKILLS</p>
                    <div className={s.skillsList}>
                      {skills.map((sk, i) => <span key={i} className={s.skill}>{sk}</span>)}
                    </div>
                  </div>
                )}
                {interview && (
                  <div className={s.interviewCard}>
                    <div className={s.interviewHead}>
                      <Icons.Calendar />
                      <h3 className={s.interviewHeadTitle}>Interview Details</h3>
                    </div>
                    <div className={s.interviewGrid}>
                      <p className={s.line}><strong className={s.strong}>Date:</strong> {interviewDate}</p>
                      <p className={s.line}><strong className={s.strong}>Time:</strong> {interviewTime}</p>
                      <p className={s.line}><strong className={s.strong}>Location:</strong> {location}</p>
                      <p className={s.line}><strong className={s.strong}>Panel:</strong> {panelName}</p>
                      <p className={s.line}><strong className={s.strong}>Invite Response:</strong> {interviewInviteResponseLabel}</p>
                      <p className={s.line}><strong className={s.strong}>Responded At:</strong> {interviewInviteRespondedAt}</p>
                      {interview.Feedback && (
                        <p className={`${s.line} ${s.span2Line}`}><strong className={s.strong}>Feedback:</strong> {interview.Feedback}</p>
                      )}
                    </div>
                  </div>
                )}
                {historyEntries.length > 0 && (
                  <div className={s.historyWrap}>
                    <h3 className={s.historyTitle}>Interview History</h3>
                    <div className={s.timeline}>
                      {historyEntries.map((entry, idx) => (
                        <div key={entry.Interview_id} className={s.timelineRow}>
                          <div className={s.nodeCol}>
                            {idx !== historyEntries.length - 1 && (
                              <span className={s.nodeLine} />
                            )}
                            <span className={s.nodeDot} />
                          </div>
                          <div className={s.historyCard}>
                            <div className={s.historyHead}>
                              <div className={s.historyLeft}>
                                <span className={s.eventType}>{entry.eventType}</span>
                              </div>
                              <span className={s.date}>{entry.displayDate} {entry.displayTime}</span>
                            </div>
                            <div className={s.historyGrid}>
                              <p className={s.line}><strong className={s.strong}>Status:</strong> {entry.Interview_status || '-'}</p>
                              <p className={s.line}><strong className={s.strong}>Panel:</strong> {entry.Panel_name || '-'}</p>
                              <p className={s.line}><strong className={s.strong}>Invite Response:</strong> {entry.inviteResponseLabel}</p>
                              <p className={s.line}><strong className={s.strong}>Responded At:</strong> {entry.inviteRespondedAt}</p>
                              <p className={`${s.line} ${s.span2Line}`}><strong className={s.strong}>Location:</strong> {entry.Location || '-'}</p>
                              {entry.Feedback && (
                                <p className={`${s.line} ${s.span2Line}`}><strong className={s.strong}>Feedback:</strong> {entry.Feedback}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
        {tab == 'feedback' && showTabs && (
          <div>
            <h3 className={s.sectionTitle}>Submit Feedback</h3>
            
            {/* Show L1 feedback for L2 panels */}
            {currentStatus === 9 && historyLoaded && (
              <div className={s.l1FeedbackBox}>
                <h4 className={s.l1FeedbackTitle}>L1 Interview Feedback</h4>
                {(() => {
                  const l1Feedbacks = history.filter(h => {
                    const statusId = Number(h.Status_id);
                    const hasFeedback = String(h.Feedback || '').trim().length > 0;
                    return [1, 2, 3].includes(statusId) && hasFeedback;
                  });
                  
                  if (l1Feedbacks.length === 0) {
                    return <p className={s.line}>No L1 feedback submitted yet.</p>;
                  }
                  
                  return l1Feedbacks.map((l1Entry, idx) => (
                    <div key={idx} className={s.l1FeedbackCard}>
                      <div className={s.l1FeedbackGrid}>
                        <p className={s.line}><strong className={s.strong}>Status:</strong> {l1Entry.Interview_status || '-'}</p>
                        <p className={s.line}><strong className={s.strong}>Panel:</strong> {l1Entry.Panel_name || '-'}</p>
                        <p className={s.line}><strong className={s.strong}>Date:</strong> {l1Entry.DateTime ? formatISTDate(l1Entry.DateTime) : '-'}</p>
                        <p className={s.line}><strong className={s.strong}>Time:</strong> {l1Entry.DateTime ? formatISTTime(l1Entry.DateTime) : '-'}</p>
                        <p className={`${s.line} ${s.span2Line}`}><strong className={s.strong}>Feedback:</strong> {l1Entry.Feedback}</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
            
            {panelFeedbackLocked ? (
              <div className={s.feedbackBox}>
                <div className={s.notesWrap}>
                  <label className={s.notesLabel}>Status</label>
                  <div className={s.line}><strong className={s.strong}>{panelFeedbackStatusLabel}</strong></div>
                </div>
                <div className={s.notesWrap}>
                  <label className={s.notesLabel}>Submitted On</label>
                  <div className={s.line}>{panelFeedbackDate}</div>
                </div>
                <div className={s.notesWrap}>
                  <label className={s.notesLabel}>Detailed Notes</label>
                  <textarea className={s.notes} value={lastPanelFeedback?.Feedback || ''} readOnly />
                </div>
                <Btn variant="ghost" disabled>Feedback Already Submitted</Btn>
              </div>
            ) : (
              <div className={s.feedbackBox}>
                <Select label="Status" options={panelStatusOptions} value={feedback.statusId} onChange={(e) => setFeedback(f => ({ ...f, statusId: e.target.value }))} />
                <div className={s.notesWrap}>
                  <label className={s.notesLabel}>Detailed Notes</label>
                  <textarea className={s.notes} value={feedback.notes} onChange={(e) => setFeedback(f => ({ ...f, notes: e.target.value }))} placeholder="Share your observations, strengths, concerns..." />
                </div>
                <Btn onClick={handleSubmitFeedback} variant="primary">Submit Feedback</Btn>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}





