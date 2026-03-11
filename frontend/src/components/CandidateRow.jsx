import { useState } from 'react';
import { Avatar } from './ui';
import { Icons } from './ui/Icons';
import s from './CandidateRow.module.css';

export default function CandidateRow({ candidate: c, onClick, user, onStatusChange, onSchedule }) {
  const [hov, setHov] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const name = c.Candidate_name || c.name;
  const position = c.Candidate_position || c.position;
  const experience = c.Candidate_experience
    ? `${c.Candidate_experience} years`
    : (c.experience || '');

  const skills = c.Candidate_skills
    ? (typeof c.Candidate_skills === 'string'
      ? c.Candidate_skills.split(',').map(sk => sk.trim())
      : c.Candidate_skills)
    : (c.skills || []);

  const roleId = Number(user?.roleId || user?.Role_id);
  const isHR = roleId == 1 || roleId == 4;
  const isPanel = roleId == 2;

  // For panel users, show their assigned status
  // If Panel_assigned_status_id is 8 or 9 (scheduled), show that
  // Otherwise show the feedback status they submitted
  const status = (isPanel && c.Panel_assigned_status)
    ? c.Panel_assigned_status
    : (c.Status_description || c.status || 'Pending');


  const currentStatus = Number(c.Current_status ?? c.status ?? 0);

  // Check if latest interview invite was rejected
  const inviteRejected = String(c.Latest_invite_response || '').toLowerCase() === 'rejected';



  // HR can schedule L1 for Pending candidates (Status 7)
  // HR can schedule L2 for L1 Clear candidates (Status 1)
  // HR can reschedule if panel rejected the invite
  const showScheduleBtn = isHR && (currentStatus == 7 || currentStatus == 1 || inviteRejected);

  let scheduleBtnLabel = 'Schedule L1';
  if (inviteRejected) {
    scheduleBtnLabel = currentStatus == 8 ? 'Reschedule L1' : 'Reschedule L2';
  } else if (currentStatus == 1) {
    scheduleBtnLabel = 'Schedule L2';
  }


  // Panel sees candidates with L1/L2 Interview Confirmed status
  const isPanelInterview = isPanel && (currentStatus == 8 || currentStatus == 9);
  const handleStatusClick = (e) => {
    e.stopPropagation(); // prevent popup open
    if (isHR) {
      setShowMenu(!showMenu);
    }
  };

  const handleStatusChange = (statusId) => {
    setShowMenu(false);
    if (onStatusChange) {
      onStatusChange(c.Candidate_id || c.id, statusId);
    }
  };



  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => {
        setHov(false);
        setShowMenu(false);
      }}
      className={`${s.row} ${hov ? s.rowHover : ''}`}
    >
      <div className={s.left}>
        <Avatar name={name} />
        <div>
          <p className={s.name}>{name}</p>
          <p className={s.meta}>{position} · {experience}</p>
        </div>
      </div>

      <div className={s.skills}>
        {skills.slice(0, 3).map((skill, i) => (
          <span key={i} className={s.skillTag}>{skill}</span>
        ))}
      </div>

      <div className={s.right}>
        {showScheduleBtn && (
          <button
            className={s.scheduleBtn}
            onClick={(e) => {
              e.stopPropagation();
              onSchedule && onSchedule(c);
            }}
          >
            {scheduleBtnLabel}
          </button>
        )}
        <div className={s.statusWrapper}>
          {inviteRejected ? (
            <span className={s.rejectedBadge} title="Panel rejected interview invite">⚠ Panel Rejected - Needs Reschedule</span>
          ) : (
            <span className={s.status}>{status}</span>
          )}
        </div>

        <div className={s.chev}>
          <Icons.ChevronR />
        </div>
      </div>
    </div>
  );
}
