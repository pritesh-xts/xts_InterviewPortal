import { useState, useEffect } from 'react';
import { Btn } from './ui';
import { Icons } from './ui/Icons';
import CandidateRow from './CandidateRow';
import AddCandidateModal from './modals/AddCandidateModal';
import ScheduleInterviewModal from './modals/ScheduleInterviewModal';
import CandidateModal from './modals/CandidateModal';
import { getStatuses } from '../api/InterviewPortalApis';
import s from './CandidatesModule.module.css';
import { API_BASE } from '../api/InterviewPortalApis';

export default function CandidatesModule({ candidates, activeRole, onAddCandidate, user }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleCandidate, setScheduleCandidate] = useState(null);
  const [selected, setSelected] = useState(null);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
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

  const filtered = candidates.filter(c => {
    const name = c.Candidate_name || c.name || '';
    const position = c.Candidate_position || c.position || '';
    const statusId = c.Current_status || c.status || '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || position.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterStatus === 'all' || statusId == filterStatus;
    return matchSearch && matchFilter;
  });

  const canAddCandidate = user && (user.roleId == 1 || user.roleId == 4);
  
  const handleSchedule = (candidate) => {
    setScheduleCandidate(candidate);
    setShowSchedule(true);
  };

  const handleScheduleSubmit = async (candidateId, scheduleData) => {
    try {
      const response = await fetch(`${API_BASE}api/candidates/scheduleInterview.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          ...scheduleData
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Interview scheduled successfully!');
        window.location.reload();
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      return { success: false, message: 'Error scheduling interview' };
    }
  };

  // p-status update function
const handleStatusChange = async (candidateId, statusId) => {
  console.log("Updating:", candidateId, statusId);

  try {
    const response = await fetch(`${API_BASE}api/candidates/updateStatus.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: candidateId,
        status: statusId
      })
    });

    const result = await response.json();
    console.log("API result:", result);

    if (result.success) {
      alert("Status updated successfully");
      fetchCandidates();
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

  return (
    <div className={s.root}>
      <div className={s.head}>
        <div>
          <h2 className={s.title}>Candidates</h2>
          <p className={s.subtitle}>{candidates.length} candidates in the pipeline</p>
        </div>
        {canAddCandidate && <Btn onClick={() => setShowAdd(true)} variant="primary"><Icons.Plus /> Add Candidate</Btn>}
      </div>

      <div className={s.filters}>
        <div className={s.searchWrap}>
          <div className={s.searchIcon}><Icons.Search /></div>
          <input
            className={s.searchInput}
            placeholder="Search by name or position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={s.statusSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          {statuses.map(st => <option key={st.Status_id} value={st.Status_id}>{st.Status_description}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={s.empty}>
          <Icons.Users />
          <p className={s.emptyText}>{search || filterStatus !== 'all' ? 'No matching candidates' : 'No candidates yet'}</p>
        </div>
      ) : (
        <div className={s.list}>
          {filtered.map(c => <CandidateRow key={c.Candidate_id || c.id} candidate={c} user={user} onClick={() => setSelected(c)} onStatusChange={handleStatusChange} onSchedule={handleSchedule} />)}
        </div>
      )}

      {showAdd && <AddCandidateModal onClose={() => setShowAdd(false)} onAdd={onAddCandidate} user={user} />}
      {showSchedule && scheduleCandidate && (
        <ScheduleInterviewModal 
          onClose={() => {
            setShowSchedule(false);
            setScheduleCandidate(null);
          }} 
          onSchedule={handleScheduleSubmit}
          candidate={scheduleCandidate}
        />
      )}
      {selected && <CandidateModal candidate={selected} onClose={() => setSelected(null)} activeRole={activeRole} user={user} />}
    </div>
  );
}
