import { Icons } from './ui/Icons';
import { C } from '../constants/theme';
import s from './Sidebar.module.css';
import logo from '../assets/logo.png';

export default function Sidebar({ page, setPage, activeRole, setActiveRole, candidates, user, onLogout, onChangePassword }) {
  const isGlobalAdmin = user?.roleId === 4;
  
  const navItems = [
    { id: 'candidates', label: 'Candidates', icon: <Icons.Users /> },
    { id: 'reports', label: 'Reports', icon: <Icons.BarChart /> },
    ...(isGlobalAdmin ? [{ id: 'users', label: 'User Management', icon: <Icons.Users /> }] : [])
  ];

  const pendingCount = candidates.filter(c => String(c.Status_description || '').toLowerCase().includes('pending')).length;
  const activeCount = candidates.filter(c => {
    const status = String(c.Status_description || '').toLowerCase();
    return !status.includes('pending') && 
           !status.includes('offer on hold') && 
           !status.includes('offer rolled out') && 
           !status.includes('l1 rejected') && 
           !status.includes('l2 rejected');
  }).length;
  const doneCount = candidates.filter(c => {
    const status = String(c.Status_description || '').toLowerCase();
    return status.includes('offer rolled out') || status.includes('offer on hold');
  }).length;

  return (
    <nav className={s.nav}>
      <div className={s.brand}>
        <img src={logo} alt="Interview Hub" className={s.logo} />
        <h1 className={s.brandTop}>Interview</h1>
        <h1 className={s.brandBottom}>Hub</h1>
        <p className={s.userName}>{user?.name}</p>
      </div>

      {setActiveRole && (
        <div className={s.roleSwitch}>
          {['hr', 'panel'].map(r => (
            <button
              key={r}
              onClick={() => setActiveRole(r)}
              className={`${s.roleBtn} ${activeRole == r ? s.roleBtnActive : ''}`}
            >
              {r === 'hr' ? 'HR View' : 'Panel View'}
            </button>
          ))}
        </div>
      )}

      <div className={s.navItems}>
        {navItems.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setPage(id)} className={`${s.navBtn} ${page === id ? s.navBtnActive : ''}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      <div className={s.footer}>
        <div className={s.pipeline}>
          <p className={s.pipelineTitle}>Pipeline</p>
          {[['Pending', pendingCount, C.amber], ['Active', activeCount, C.blue], ['Completed', doneCount, C.green]].map(([label, value, color]) => (
            <div key={label} className={s.statRow}>
              <span className={s.statLabel}>{label}</span>
              <span className={s.statValue} style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
        <button onClick={onChangePassword} className={s.changePassword}>Change Password</button>
        <button onClick={onLogout} className={s.logout}>Logout</button>
      </div>
    </nav>
  );
}
