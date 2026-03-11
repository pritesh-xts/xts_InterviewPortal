import { useState, useEffect } from 'react';
import { Btn } from './ui';
import { Icons } from './ui/Icons';
import CandidateRow from './CandidateRow';
import AddCandidateModal from './modals/AddCandidateModal';
import ScheduleInterviewModal from './modals/ScheduleInterviewModal';
import CandidateModal from './modals/CandidateModal';
import { getStatuses } from '../api/InterviewPortalApis';
import { useAlert } from '../hooks/useAlert';
import { AlertModal } from './ui/AlertModal';
import s from './CandidatesModule.module.css';
import { API_BASE } from '../api/InterviewPortalApis';

export default function CandidatesModule({ candidates, activeRole, onAddCandidate, user, onRefresh }) {
  const { alert, showAlert, closeAlert } = useAlert();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleCandidate, setScheduleCandidate] = useState(null);
  const [selected, setSelected] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, candidates]);

  const filtered = candidates.filter(c => {
    const name = c.Candidate_name || c.name || '';
    const position = c.Candidate_position || c.position || '';
    const statusId = c.Current_status || c.status || '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || position.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterStatus === 'all' || statusId == filterStatus;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.max(Math.ceil(filtered.length / pageSize), 1);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pagedCandidates = filtered.slice(startIndex, startIndex + pageSize);

  const canAddCandidate = user && (user.roleId == 1 || user.roleId == 4);
  
  const handleSchedule = (candidate) => {
    setScheduleCandidate(candidate);
    setShowSchedule(true);
  };

  const handleScheduleSubmit = async (candidateId, scheduleData) => {
    try {
      const hrName = user?.User_name || user?.name || user?.username || '';
      const hrId = user?.User_id || user?.id || '';
      const response = await fetch(`${API_BASE}api/candidates/scheduleInterview.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          hrName,
          hrId,
          ...scheduleData
        })
      });

      const result = await response.json();

      if (result.success) {
        setShowSchedule(false);
        setScheduleCandidate(null);
        showAlert('Interview scheduled successfully!', 'success');
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
      showAlert("Status updated successfully", 'success');
      fetchCandidates();
    } else {
      showAlert(result.message, 'error');
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

  const handleAlertClose = () => {
    closeAlert();
    if (alert?.type === 'success') {
      window.location.reload();
    }
  };

  return (
    <>
      {alert && <AlertModal message={alert.message} type={alert.type} onClose={handleAlertClose} />}
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
          {pagedCandidates.map(c => <CandidateRow key={c.Candidate_id || c.id} candidate={c} user={user} onClick={() => setSelected(c)} onStatusChange={handleStatusChange} onSchedule={handleSchedule} />)}
        </div>
      )}

      {filtered.length > pageSize && (
        <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
          <button className="btn btn-outline-secondary btn-sm" disabled={safePage === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
            Prev
          </button>
          <div className="d-flex align-items-center gap-1">
            {(() => {
              const maxVisible = 4;
              const pages = [];
              const startPage = Math.max(1, safePage - Math.floor((maxVisible - 1) / 2));
              const endPage = Math.min(totalPages, startPage + maxVisible - 1);
              const safeStart = Math.max(1, endPage - maxVisible + 1);
              if (safeStart > 1) pages.push(1);
              if (safeStart > 2) pages.push('ellipsis-start');
              for (let p = safeStart; p <= endPage; p++) pages.push(p);
              if (endPage < totalPages - 1) pages.push('ellipsis-end');
              if (endPage < totalPages) pages.push(totalPages);
              return pages.map((p, idx) => {
                if (typeof p === 'string') {
                  return <span key={`${p}-${idx}`} className="px-2 text-muted">…</span>;
                }
                return (
                  <button
                    key={p}
                    className={`btn btn-sm ${p === safePage ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              });
            })()}
          </div>
          <button className="btn btn-outline-secondary btn-sm" disabled={safePage === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
            Next
          </button>
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
      {selected && <CandidateModal candidate={selected} onClose={() => { setSelected(null); onRefresh && onRefresh(); }} activeRole={activeRole} user={user} onRefresh={onRefresh} />}
    </div>
    </>
  );
}
