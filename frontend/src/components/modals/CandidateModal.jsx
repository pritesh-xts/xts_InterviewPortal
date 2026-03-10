import { useState, useEffect } from 'react';
import { Modal, Avatar, Btn, Select, Input } from '../ui';
import { Icons } from '../ui/Icons';
import { getStatuses, getPanels, uploadCandidateResume } from '../../api/InterviewPortalApis';
import { useAlert } from '../../hooks/useAlert';
import { AlertModal } from '../ui/AlertModal';
import s from './CandidateModal.module.css';


export default function CandidateModal({ candidate: c, onClose, activeRole, user, onRefresh }) {
  const { alert, showAlert, closeAlert } = useAlert();
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
  const [resumeInputKey, setResumeInputKey] = useState(0);
  const [quickStatus, setQuickStatus] = useState('');
  const [quickStatusReason, setQuickStatusReason] = useState('');
  const [forceOfferDecisionEdit, setForceOfferDecisionEdit] = useState(false);
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

  // Set initial feedback status based on interview assignment
  useEffect(() => {
    if (statuses.length > 0 && candidateDetails) {
      const interviewData = candidateDetails.interview;
      const userId = String(user?.id || user?.User_id || '');
      const isPanel = Number(user?.roleId || user?.Role_id) === 2;

      if (isPanel && interviewData && String(interviewData.Feedback_by) === userId) {
        const interviewStatus = Number(interviewData.Status_id);
        let defaultStatusId = '';

        if (interviewStatus === 8) {
          // L1 Interview - default to first L1 status
          const l1Status = statuses.find(st => [1, 2, 3].includes(Number(st.Status_id)));
          defaultStatusId = l1Status ? l1Status.Status_id : '';
        } else if (interviewStatus === 9) {
          // L2 Interview - default to first L2 status
          const l2Status = statuses.find(st => [4, 5, 6].includes(Number(st.Status_id)));
          defaultStatusId = l2Status ? l2Status.Status_id : '';
        }

        if (defaultStatusId) {
          const nextFeedback = { statusId: defaultStatusId, notes: '' };
          setFeedback(nextFeedback);
          setInitialFeedback(nextFeedback);
        }
      }
    }
  }, [statuses, candidateDetails]);

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
          status: result.data.Current_status,
          reason: result.data.Reason || ''
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
          status: result.data.Current_status,
          reason: result.data.Reason || ''
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
        setResumeInputKey((k) => k + 1);
        const statusId = Number(result.data.Current_status ?? 0);
        setQuickStatus([10, 11].includes(statusId) ? String(statusId) : '');
        setQuickStatusReason(String(result.data.Reason || ''));
        setForceOfferDecisionEdit(false);
      }
    } catch (error) {
      console.error('Error fetching candidate details:', error);
    }
  };

  // const fetchStatuses = async () => {
  //   try {
  //     const response = await fetch('http://localhost/InterviewPortal/files/api/status/getAll.php');
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
      // Don't set initial feedback here - it will be set based on panel assignment
    } catch (error) {
      console.error('Error fetching statuses:', error);
    }
  };

  // const fetchPanels = async () => {
  //   try {
  //     const response = await fetch('http://localhost/InterviewPortal/files/api/users/getPanels.php');
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
    // Check if feedback already submitted for current active interview
    if (panelFeedbackLocked) {
      showAlert('Feedback already submitted. View only mode is enabled.', 'warning');
      return;
    }

    // Validate that panel is assigned to current interview
    if (!interview || String(interview.Feedback_by) !== currentUserId) {
      showAlert('You are not assigned to this interview.', 'error');
      return;
    }

    // Get the interview status to determine which feedback statuses are allowed
    const interviewStatusId = Number(interview.Status_id);
    const selectedFeedbackStatusId = Number(feedback.statusId);

    console.log('Feedback Validation:', {
      interviewStatusId,
      selectedFeedbackStatusId,
      feedbackStatusIdRaw: feedback.statusId,
      isL1Interview: interviewStatusId === 8,
      isL2Interview: interviewStatusId === 9
    });

    // Validate feedback status matches interview round
    if (interviewStatusId === 8 && ![1, 2, 3].includes(selectedFeedbackStatusId)) {
      showAlert('For L1 Interview, please select L1 feedback status (L1 Clear, L1 Reject, or L1 Hold).', 'warning');
      return;
    }
    if (interviewStatusId === 9 && ![4, 5, 6].includes(selectedFeedbackStatusId)) {
      showAlert('For L2 Interview, please select L2 feedback status (L2 Clear, L2 Reject, or L2 Hold).', 'warning');
      return;
    }

    const normalize = (v) => String(v ?? '').trim();
    const unchanged =
      normalize(feedback.statusId) === normalize(initialFeedback.statusId) &&
      normalize(feedback.notes) === normalize(initialFeedback.notes);
    if (unchanged) {
      showAlert('No change found. Feedback not updated.', 'info');
      onClose();
      return;
    }

    if (!feedback.notes.trim()) {
      showAlert('Detailed notes are required', 'warning');
      return;
    }
    if (!feedback.statusId) {
      showAlert('Please select a status', 'warning');
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

        showAlert('Feedback submitted successfully!', 'success');
        await fetchCandidateDetails();
        setTab('history');
      } else {
        showAlert(result.message || 'Failed to submit feedback', 'error');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showAlert('Error submitting feedback', 'error');
    }
  };

  const handleUpdateCandidate = async () => {
    if (!canEdit) {
      showAlert('Edit is disabled after L1 feedback submission. View-only access is enabled.', 'warning');
      setIsEditing(false);
      return;
    }

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
      normalize(editForm.status) === normalize(initialEditForm.status) &&
      normalize(editForm.reason) === normalize(initialEditForm.reason);
    const sameInterview =
      normalize(editInterview.interviewId) === normalize(initialEditInterview.interviewId) &&
      normalize(editInterview.date) === normalize(initialEditInterview.date) &&
      normalize(editInterview.time) === normalize(initialEditInterview.time) &&
      normalize(editInterview.location) === normalize(initialEditInterview.location) &&
      normalize(editInterview.panel) === normalize(initialEditInterview.panel);
    if (sameEditForm && sameInterview && !editResumeFile) {
      showAlert('No change found. Record not updated.', 'info');
      setIsEditing(false);
      return;
    }

    const selectedStatus = Number(editForm.status);
    const requiresInterviewFields = Boolean(
      editInterview?.interviewId || [8, 9].includes(selectedStatus)
    );

    if (!editForm.name || !editForm.email || !editForm.position || !editForm.phone || !editForm.department || !editForm.status) {
      showAlert('Name, Email, Phone, Position, Education and Status are required', 'warning');
      return;
    }
    if (
      requiresInterviewFields &&
      (!editInterview?.date || !editInterview?.time || !String(editInterview?.location || '').trim() || !editInterview?.panel)
    ) {
      showAlert('Date, Time, Location and Panel are required for interview details', 'warning');
      return;
    }
    if (!String(editForm.skills || '').trim()) {
      showAlert('Skills are required', 'warning');
      return;
    }
    if (!editForm.experience || Number(editForm.experience) < 0) {
      showAlert('Please enter valid experience', 'warning');
      return;
    }
    if (!editResumeFile && !hasResume) {
      showAlert('Resume is required', 'warning');
      return;
    }
    if (!isValidEmail(editForm.email)) {
      showAlert('Please enter a valid email address', 'warning');
      return;
    }
    const phoneDigits = getDigits(editForm.phone);
    if (phoneDigits.length !== 10) {
      showAlert('Phone number must be exactly 10 digits', 'warning');
      return;
    }

    if (editInterview?.date && editInterview?.time && isPastDateTime(editInterview.date, editInterview.time)) {
      showAlert('Back date/time is not allowed for interview scheduling', 'error');
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
        showAlert('Resume must be PDF, DOC, or DOCX', 'warning');
        return;
      }
      if (editResumeFile.size > 5 * 1024 * 1024) {
        showAlert('Resume size must be 5MB or less', 'warning');
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
            showAlert('Candidate updated but interview update failed', 'warning');
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
          showAlert(`Candidate updated, but resume upload failed: ${resumeUploadError}`, 'warning');
        } else if (scheduleLabel) {
          showAlert(`Candidate updated successfully! ${scheduleLabel}.`, 'success');
        } else {
          showAlert('Candidate updated successfully!', 'success');
        }
        if (openL2FeedbackOnSuccess && showTabs) {
          setTab('feedback');
        }
        setIsEditing(false);
        setEditResumeFile(null);
        fetchCandidateDetails();
        onRefresh && onRefresh();
      } else {
        showAlert(result.message || 'Failed to update candidate', 'error');
      }
    } catch (error) {
      console.error('Error updating candidate:', error);
      showAlert('Error updating candidate', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleStartEditing = () => {
    setEditForm({ ...initialEditForm });
    setEditInterview({ ...initialEditInterview });
    setEditResumeFile(null);
    setResumeInputKey((k) => k + 1);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setEditForm({ ...initialEditForm });
    setEditInterview({ ...initialEditInterview });
    setEditResumeFile(null);
    setResumeInputKey((k) => k + 1);
    setIsEditing(false);
  };

  const handleQuickStatusUpdate = async () => {
    if (!isHR) {
      showAlert('Only HR can update status from this section.', 'warning');
      return;
    }

    const selectedStatus = Number(quickStatus || 0);
    if (!selectedStatus) {
      showAlert('Please select a valid status', 'warning');
      return;
    }
    if (l2OfferStatusIds.has(selectedStatus) && !hasL2FeedbackOutcome) {
      showAlert('Offer statuses are available only after L2 feedback is submitted as L2 Clear or On Hold after L2.', 'warning');
      return;
    }
    if (selectedStatus === 11 && !String(quickStatusReason || '').trim()) {
      showAlert('Reason is required for Offer On Hold.', 'warning');
      return;
    }

    try {
      setUpdating(true);
      const candidateId = data.Candidate_id || c.Candidate_id || c.id;
      const response = await fetch(`${API_BASE}api/candidates/updateStatus.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: candidateId,
          status: selectedStatus,
          reason: selectedStatus === 11 ? String(quickStatusReason || '').trim() : null
        })
      });
      const result = await response.json();
      if (result.success) {
        showAlert('Status updated successfully', 'success');
        setForceOfferDecisionEdit(false);
        await fetchCandidateDetails();
        onRefresh && onRefresh();
      } else {
        showAlert(result.message || 'Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showAlert('Error updating status', 'error');
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

  // Check if panel has submitted feedback for the CURRENT active interview only
  const currentInterviewHasFeedback = interview &&
    String(interview.Feedback_by) === currentUserId &&
    String(interview.Feedback || '').trim().length > 0;

  const panelFeedbackLocked = isPanelUser && currentInterviewHasFeedback;

  const lastPanelFeedback = currentInterviewHasFeedback ? interview : null;
  const panelFeedbackStatusLabel = lastPanelFeedback?.Interview_status
    || statuses.find(st => String(st.Status_id) === String(lastPanelFeedback?.Status_id))?.Status_description
    || '-';
  const panelFeedbackDate = lastPanelFeedback?.DateTime
    ? formatISTDateTime(lastPanelFeedback.DateTime)
    : '-';
  const canWriteFeedback = Boolean(
    isPanelUser && interview && String(interview.Feedback_by) === currentUserId
  );
  const submittedFeedbackEntries = [...history]
    .filter(item => {
      const statusId = Number(item.Status_id);
      const hasFeedback = String(item.Feedback || '').trim().length > 0;
      return [1, 2, 3, 4, 5, 6].includes(statusId) && hasFeedback;
    })
    .reverse();
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

  const roleId = Number(user?.roleId || user?.Role_id);
  const showTabs = user && [1, 2, 4].includes(roleId);
  const isAdmin = roleId == 4;
  const isHR = roleId == 1;
  const isHrOrAdmin = isHR || isAdmin;
  const hrAllowedStatusIds = new Set([7, 8, 9]);
  const l2OfferStatusIds = new Set([10, 11]);
  const toStatusId = (value) => Number.parseInt(String(value ?? ''), 10) || 0;
  const currentStatus = toStatusId(data.Current_status ?? c.Current_status);
  const latestInterviewStatus = toStatusId(interview?.Status_id);
  const hasL1ScheduledHistory = history.some(item => toStatusId(item?.Status_id) === 8);
  const isL1Scheduled = currentStatus === 8 || latestInterviewStatus === 8 || hasL1ScheduledHistory;
  const hasL1FeedbackSubmitted = history.some(item => [1, 2, 3].includes(Number(item?.Status_id))) || [1, 2, 3].includes(currentStatus);
  const latestL2Feedback = [...history].reverse().find(h => {
    const statusId = Number(h.Status_id);
    const hasFeedback = String(h.Feedback || '').trim().length > 0;
    return [4, 5, 6].includes(statusId) && hasFeedback;
  });
  const latestL2FeedbackStatus = Number(latestL2Feedback?.Status_id || 0);
  const hasL2FeedbackOutcome = [4, 6].includes(latestL2FeedbackStatus) || [4, 6].includes(currentStatus);
  const hasOfferDecision = [10, 11].includes(currentStatus);
  const isOfferDecisionEditing = !hasOfferDecision || forceOfferDecisionEdit;
  const selectedQuickStatus = Number(quickStatus || 0);
  const existingReason = String(data.Reason || '').trim();
  const nextReason = String(quickStatusReason || '').trim();
  const quickStatusChanged = hasOfferDecision
    ? (selectedQuickStatus !== currentStatus || (selectedQuickStatus === 11 && nextReason !== existingReason))
    : selectedQuickStatus > 0;
  const canSubmitOfferDecision = quickStatusChanged && (selectedQuickStatus !== 11 || nextReason.length > 0);
  const currentStatusLabel = statuses.find(st => Number(st.Status_id) === currentStatus)?.Status_description || status;
  const canChangeOfferDecision = currentStatus !== 10;
  const canEdit = isAdmin
    ? !hasL1FeedbackSubmitted && !isL1Scheduled
    : isHR
      ? (!hasL1FeedbackSubmitted && !isL1Scheduled)
      : false;

  // Determine panel statuses based on active interview assignment
  let panelStatuses = [];
  if (isPanelUser && interview && String(interview.Feedback_by) === currentUserId) {
    // Panel is assigned to this candidate's active interview
    const interviewStatus = Number(interview.Status_id);

    // Check if panel already submitted feedback for this interview
    const alreadySubmittedForThisInterview = String(interview.Feedback || '').trim().length > 0;

    console.log('Panel Statuses Debug:', {
      interviewStatus,
      alreadySubmittedForThisInterview,
      isPanelUser,
      currentUserId,
      interviewFeedbackBy: interview.Feedback_by
    });

    if (!alreadySubmittedForThisInterview) {
      if (interviewStatus === 8) {
        // L1 Interview - Show only L1 statuses
        panelStatuses = statuses.filter(st => [1, 2, 3].includes(Number(st.Status_id)));
      } else if (interviewStatus === 9) {
        // L2 Interview - Show only L2 statuses
        panelStatuses = statuses.filter(st => [4, 5, 6].includes(Number(st.Status_id)));
      }
    }
  } else if (!isPanelUser) {
    // HR/Admin - show all non-HR statuses
    panelStatuses = statuses.filter(st => !hrAllowedStatusIds.has(Number(st.Status_id)));
  }

  // HR statuses logic - Offer statuses appear only after L2 feedback outcome
  // is submitted as L2 Clear (4) or On Hold after L2 (6).
  let hrStatuses = [];
  if (isHR) {
    if (hasL2FeedbackOutcome) {
      // If L2 is cleared, show only Offer statuses
      hrStatuses = statuses.filter(st => l2OfferStatusIds.has(Number(st.Status_id)));
    } else {
      // Otherwise show normal HR statuses
      hrStatuses = statuses.filter(st => hrAllowedStatusIds.has(Number(st.Status_id)));
    }
  } else if (isAdmin) {
    // Admin can edit candidate details but cannot select Offer statuses (10/11)
    hrStatuses = statuses.filter(st => !l2OfferStatusIds.has(Number(st.Status_id)));
  } else {
    hrStatuses = statuses.filter(st => hrAllowedStatusIds.has(Number(st.Status_id)));
  }

  const hrVisibleStatuses = hrStatuses;
  const hrStatusOptions = hrVisibleStatuses.map(st => ({ value: st.Status_id, label: st.Status_description }));
  const offerDecisionOptions = [
    { value: '', label: 'Select offer status' },
    ...hrStatusOptions
  ];
  const panelVisibleStatuses = isAdmin ? statuses : (panelStatuses.length > 0 ? panelStatuses : statuses);
  const panelStatusOptions = panelVisibleStatuses.map(st => ({ value: st.Status_id, label: st.Status_description }));

  console.log('Panel Status Options:', {
    panelStatusesLength: panelStatuses.length,
    panelVisibleStatusesLength: panelVisibleStatuses.length,
    panelStatusOptions: panelStatusOptions,
    currentFeedbackStatusId: feedback.statusId
  });
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
    <>
      {alert && <AlertModal message={alert.message} type={alert.type} onClose={closeAlert} />}
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
              {canEdit && !isEditing && tab === 'details' && <Btn onClick={handleStartEditing} variant="primary" small>Edit</Btn>}
              <Btn onClick={onClose} variant="ghost" small><Icons.X /></Btn>
            </div>
          </div>
          {showTabs && (
            <div className={s.tabs}>
              {['details', 'feedback', 'history'].map(t => (
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
                        key={resumeInputKey}
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
                    {(hasL2FeedbackOutcome || [10, 11].includes(Number(editForm.status))) && (
                      <div className={s.span2}>
                        <Input label="Reason *" value={editForm.reason || ''} onChange={(e) => setEditForm(f => ({ ...f, reason: e.target.value }))} placeholder="Enter reason for this status" />
                      </div>
                    )}
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
                    <Btn onClick={handleCancelEditing} variant="ghost" disabled={updating}>Cancel</Btn>
                    <Btn onClick={handleUpdateCandidate} variant="primary" disabled={updating}>{updating ? 'Updating...' : 'Update'}</Btn>
                  </div>
                </div>
              ) : (
                <>
                  {isHR && hasL2FeedbackOutcome && (
                    <div className={`${s.interviewCard} ${s.quickStatusCard}`}>
                      <div className={s.quickStatusHead}>
                        <Icons.Check />
                        <h3 className={s.interviewHeadTitle}>Offer Status Update</h3>
                      </div>
                      {!isOfferDecisionEditing ? (
                        <>
                          <div className={s.historyGrid}>
                            <p className={s.line}><strong className={s.strong}>Current Decision:</strong> {currentStatusLabel}</p>
                            {currentStatus === 11 && (
                              <p className={`${s.line} ${s.span2Line}`}><strong className={s.strong}>Reason:</strong> {existingReason || '-'}</p>
                            )}
                          </div>
                          <div className={s.quickStatusActions}>
                            <Btn
                              onClick={() => {
                                setForceOfferDecisionEdit(true);
                                setQuickStatus(String(currentStatus));
                                setQuickStatusReason(existingReason);
                              }}
                              variant="ghost"
                              disabled={!canChangeOfferDecision}
                            >
                              Change Decision
                            </Btn>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={s.grid2}>
                            <Select
                              label="Status *"
                              options={offerDecisionOptions}
                              value={quickStatus}
                              onChange={(e) => {
                                const next = e.target.value;
                                setQuickStatus(next);
                                if (Number(next) !== 11) {
                                  setQuickStatusReason('');
                                }
                              }}
                            />
                            {selectedQuickStatus === 11 && (
                              <Input
                                label="Reason *"
                                value={quickStatusReason}
                                onChange={(e) => setQuickStatusReason(e.target.value)}
                                placeholder="Enter reason for Offer On Hold"
                              />
                            )}
                          </div>
                          <div className={s.quickStatusActions}>
                            {hasOfferDecision && (
                              <Btn
                                onClick={() => {
                                  setForceOfferDecisionEdit(false);
                                  setQuickStatus(String(currentStatus));
                                  setQuickStatusReason(existingReason);
                                }}
                                variant="ghost"
                                disabled={updating}
                              >
                                Cancel
                              </Btn>
                            )}
                            <Btn onClick={handleQuickStatusUpdate} variant="primary" disabled={updating || !canSubmitOfferDecision}>
                              {updating ? 'Updating...' : (hasOfferDecision ? 'Save Decision' : 'Submit Decision')}
                            </Btn>
                          </div>
                        </>
                      )}
                    </div>
                  )}
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
                  {/* {historyEntries.length > 0 && (
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
                )} */}
                </>
              )}
            </>
          )}
          {tab == 'history' && showTabs && (
            <div>
              <h3 className={s.sectionTitle}>Feedback History</h3>
              {historyLoaded && (() => {
                const allFeedbacks = history.filter(h => {
                  const statusId = Number(h.Status_id);
                  const hasFeedback = String(h.Feedback || '').trim().length > 0;
                  return [1, 2, 3, 4, 5, 6].includes(statusId) && hasFeedback;
                });

                if (allFeedbacks.length === 0) {
                  return <p className={s.noHistory}>No feedback history available.</p>;
                }

                return (
                  <div className={s.historyFeedbackWrap}>
                    {allFeedbacks.map((entry, idx) => {
                      const statusId = Number(entry.Status_id);
                      const isL1 = [1, 2, 3].includes(statusId);
                      const roundLabel = isL1 ? 'L1 Interview' : 'L2 Interview';

                      return (
                        <div key={idx} className={s.historyFeedbackCard}>
                          <div className={s.historyFeedbackHeader}>
                            <h4 className={s.roundLabel}>{roundLabel}</h4>
                            <span className={s.feedbackDate}>
                              {entry.DateTime ? formatISTDate(entry.DateTime) : '-'} {entry.DateTime ? formatISTTime(entry.DateTime) : ''}
                            </span>
                          </div>
                          <div className={s.historyGrid}>
                            <p className={s.line}><strong className={s.strong}>Status:</strong> {entry.Interview_status || '-'}</p>
                            <p className={s.line}><strong className={s.strong}>Panel:</strong> {entry.Panel_name || '-'}</p>
                            <p className={s.line}><strong className={s.strong}>Location:</strong> {entry.Location || '-'}</p>
                            <p className={`${s.line} ${s.span2Line}`}><strong className={s.strong}>Feedback:</strong> {entry.Feedback}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
          {tab == 'feedback' && showTabs && (
            <div>
              <h3 className={s.sectionTitle}>Submit Feedback</h3>

              {/* Show L1 feedback for L2 panels, HR, and Admin */}
              {historyLoaded && (() => {
                const l1Feedbacks = history.filter(h => {
                  const statusId = Number(h.Status_id);
                  const hasFeedback = String(h.Feedback || '').trim().length > 0;
                  const notCurrentUser = String(h.Feedback_by || '') !== currentUserId;
                  return [1, 2, 3].includes(statusId) && hasFeedback && notCurrentUser;
                });

                // Show L1 feedback block only for L2 panel context.
                // HR/Admin already see complete feedback history below.
                const panelIsL2 = isPanelUser && interview && String(interview.Feedback_by) === currentUserId && Number(interview.Status_id) === 9;
                const shouldShowL1Feedback = l1Feedbacks.length > 0 && panelIsL2;

                if (!shouldShowL1Feedback) return null;

                return (
                  <div className={s.l1FeedbackBox}>
                    <h4 className={s.l1FeedbackTitle}>L1 Interview Feedback</h4>
                    {l1Feedbacks.map((l1Entry, idx) => (
                      <div key={idx} className={s.l1FeedbackCard}>
                        <div className={s.l1FeedbackGrid}>
                          <p className={s.line}><strong className={s.strong}>Status:</strong> {l1Entry.Interview_status || '-'}</p>
                          <p className={s.line}><strong className={s.strong}>Panel:</strong> {l1Entry.Panel_name || '-'}</p>
                          <p className={s.line}><strong className={s.strong}>Date:</strong> {l1Entry.DateTime ? formatISTDate(l1Entry.DateTime) : '-'}</p>
                          <p className={s.line}><strong className={s.strong}>Time:</strong> {l1Entry.DateTime ? formatISTTime(l1Entry.DateTime) : '-'}</p>
                          <p className={`${s.line} ${s.span2Line}`}><strong className={s.strong}>Feedback:</strong> {l1Entry.Feedback}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {canWriteFeedback ? (
                panelFeedbackLocked ? (
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
                )
              ) : (
                submittedFeedbackEntries.length > 0 ? (
                  <div className={s.historyFeedbackWrap}>
                    {submittedFeedbackEntries.map((entry, idx) => {
                      const statusId = Number(entry.Status_id);
                      const isL1 = [1, 2, 3].includes(statusId);
                      const roundLabel = isL1 ? 'L1 Interview' : 'L2 Interview';

                      return (
                        <div key={idx} className={s.historyFeedbackCard}>
                          <div className={s.historyFeedbackHeader}>
                            <h4 className={s.roundLabel}>{roundLabel}</h4>
                            <span className={s.feedbackDate}>
                              {entry.DateTime ? formatISTDate(entry.DateTime) : '-'} {entry.DateTime ? formatISTTime(entry.DateTime) : ''}
                            </span>
                          </div>
                          <div className={s.historyGrid}>
                            <p className={s.line}><strong className={s.strong}>Status:</strong> {entry.Interview_status || '-'}</p>
                            <p className={s.line}><strong className={s.strong}>Panel:</strong> {entry.Panel_name || '-'}</p>
                            <p className={s.line}><strong className={s.strong}>Location:</strong> {entry.Location || '-'}</p>
                            <p className={`${s.line} ${s.span2Line}`}><strong className={s.strong}>Feedback:</strong> {entry.Feedback}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className={s.noHistory}>No feedback available yet.</p>
                )
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}





