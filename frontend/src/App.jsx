import { useState, useCallback, useEffect } from 'react';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
import Sidebar from './components/Sidebar';
import CandidatesModule from './components/CandidatesModule';
import ReportsModule from './components/ReportsModule';
import UserManagement from './components/UserManagement';
import ChangePasswordModal from './components/modals/ChangePasswordModal';
import s from './App.module.css';
import { createCandidate, uploadCandidateResume } from './api/InterviewPortalApis';

function App() {


  const [user, setUser] = useState(null);
  const [page, setPage] = useState(() => {
    return sessionStorage.getItem('activePage') || 'candidates';
  });
  const [activeRole, setActiveRole] = useState(() => {
    return sessionStorage.getItem('activeRole') || 'hr';
  });
  
  useEffect(() => {
    sessionStorage.setItem('activePage', page);
  }, [page]);
  
  useEffect(() => {
    sessionStorage.setItem('activeRole', activeRole);
  }, [activeRole]);
  const [candidates, setCandidates] = useState([]);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const API_BASE = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // Check for reset token in URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset');
    if (token) {
      setResetToken(token);
      return;
    }

    const savedUser = sessionStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      const savedRole = sessionStorage.getItem('activeRole');
      if (!savedRole) {
        if (userData.roleId == 1) setActiveRole('hr');
        else if (userData.roleId == 2) setActiveRole('panel');
        else if (userData.roleId == 4) setActiveRole('hr');
      }
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
    let defaultRole = 'hr';
    if (userData.roleId == 1) defaultRole = 'hr';
    else if (userData.roleId == 2) defaultRole = 'panel';
    else if (userData.roleId == 4) defaultRole = 'hr';
    setActiveRole(defaultRole);
    sessionStorage.setItem('activeRole', defaultRole);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('activePage');
    sessionStorage.removeItem('activeRole');
    setUser(null);
    setCandidates([]);
  };

  const handleResetSuccess = () => {
    setResetToken(null);
    window.history.replaceState({}, '', window.location.pathname);
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

  if (resetToken) {
    return <ResetPassword token={resetToken} onSuccess={handleResetSuccess} />;
  }

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
        onChangePassword={() => setShowChangePassword(true)}
      />
      <main className={s.main}>
        {page == 'candidates' && <CandidatesModule candidates={candidates} activeRole={activeRole} onAddCandidate={handleAdd} user={user} />}
        {page == 'reports' && <ReportsModule candidates={candidates} />}
        {page == 'users' && user.roleId === 4 && <UserManagement />}
      </main>
      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
          userId={user.id}
        />
      )}
    </div>
  );
}

export default App;
