import { useState, useCallback, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import CandidatesModule from './components/CandidatesModule';
import ReportsModule from './components/ReportsModule';
import s from './App.module.css';
import { createCandidate, uploadCandidateResume } from './api/InterviewPortalApis';

function App() {


  const [user, setUser] = useState(null);
  // const [page, setPage] = useState('candidates');
  const [page, setPage] = useState(() => {
    return localStorage.getItem('activePage') || 'candidates';
  });
  useEffect(() => {
    localStorage.setItem('activePage', page);
  }, [page]);
  
  const [activeRole, setActiveRole] = useState('hr');
  const [candidates, setCandidates] = useState([]);
  const API_BASE = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      if (userData.roleId == 1) setActiveRole('hr');
      else if (userData.roleId == 2) setActiveRole('panel');
      else if (userData.roleId == 4) setActiveRole('hr');
    }
  }, []);

  const fetchCandidates = useCallback(async () => {
    if (!user) return;
    try {
      const userId = user.id || user.User_id;
      const roleId = user.roleId || user.Role_id;
      const params = new URLSearchParams({
        userId: String(userId || ''),
        roleId: String(roleId || '')
      });

      const response = await fetch(`${API_BASE}api/candidates/getAll.php?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setCandidates(result.data);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  }, [API_BASE, user, activeRole]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.roleId == 1) setActiveRole('hr');
    else if (userData.roleId == 2) setActiveRole('panel');
    else if (userData.roleId == 4) setActiveRole('hr');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCandidates([]);
  };

  const handleAdd = useCallback(async (data, resumeFile) => {
    try {
      const result = await createCandidate(data);
      if (result.success) {
        let uploadError = '';
        const candidateId = result?.data?.id;
        if (resumeFile && candidateId) {
          try {
            await uploadCandidateResume(candidateId, resumeFile);
          } catch (uploadErr) {
            uploadError = uploadErr?.message || 'Resume upload failed';
          }
        }
        await fetchCandidates();
        return { success: true, uploadError };
      } else {
        return { success: false, message: result.message || 'Failed to add candidate' };
      }
    } catch (error) {
      console.error('Error adding candidate:', error);
      return { success: false, message: 'Error adding candidate' };
    }
  }, [fetchCandidates]);

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const canSwitchRole = user.roleId == 4;

  return (
    <div className={s.app}>
      <Sidebar
        page={page}
        setPage={setPage}
        activeRole={activeRole}
        setActiveRole={canSwitchRole ? setActiveRole : null}
        candidates={candidates}
        user={user}
        onLogout={handleLogout}
      />
      <main className={s.main}>
        {page == 'candidates' && <CandidatesModule candidates={candidates} activeRole={activeRole} onAddCandidate={handleAdd} user={user} />}
        {page == 'reports' && <ReportsModule candidates={candidates} />}
      </main>
    </div>
  );
}

export default App;
