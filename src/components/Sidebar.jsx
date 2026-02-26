import { Icons } from './ui/Icons';
import { C } from '../constants/theme';
import s from './Sidebar.module.css';
import logo from '../assets/logo.png';

export default function Sidebar({ page, setPage, activeRole, setActiveRole, candidates, user, onLogout }) {
  const navItems = [
    { id: 'candidates', label: 'Candidates', icon: <Icons.Users /> },
    { id: 'reports', label: 'Reports', icon: <Icons.BarChart /> }
  ];

  const statuses = candidates.map(c => String(c.Status_description || c.status || '').toLowerCase());
  const pendingCount = statuses.filter(v => v.includes('pending')).length;
  const doneCount = statuses.filter(v => v.includes('clear') || v.includes('reject')).length;
  const activeCount = Math.max(candidates.length - doneCount, 0);

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
          {[['Pending', pendingCount, C.amber], ['Active', activeCount, C.blue], ['Done', doneCount, C.green]].map(([label, value, color]) => (
            <div key={label} className={s.statRow}>
              <span className={s.statLabel}>{label}</span>
              <span className={s.statValue} style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
        <button onClick={onLogout} className={s.logout}>Logout</button>
      </div>
    </nav>
  );
}
