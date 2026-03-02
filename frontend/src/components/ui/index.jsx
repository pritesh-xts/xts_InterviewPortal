import s from './ui.module.css';

export const Badge = ({ label, color, bg }) => (
  <span className={s.badge} style={{ color, background: bg }}>{label}</span>
);

export const Btn = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  small = false,
  style = {},
  type = 'button',
  className = '',
  ...rest
}) => {
  const variantClass = variant === 'ghost' ? s.btnGhost : s.btnPrimary;
  const btnClassName = [s.btn, variantClass, small ? s.btnSmall : '', disabled ? s.btnDisabled : '', className].filter(Boolean).join(' ');
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      className={btnClassName}
      style={style}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export const Input = ({ label, style, ...props }) => (
  <div className={s.field}>
    {label && <label className={s.label}>{label}</label>}
    <input {...props} className={s.input} style={style} />
  </div>
);

export const Select = ({ label, options, style, ...props }) => (
  <div className={s.field}>
    {label && <label className={s.label}>{label}</label>}
    <select {...props} className={s.select} style={style}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

export const Avatar = ({ name, size = 44 }) => {
  const safe = name || '?';
  const initials = safe.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const hue = safe.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className={s.avatar}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: `linear-gradient(135deg, hsl(${hue},70%,55%), hsl(${(hue + 40) % 360},70%,45%))`
      }}
    >
      {initials}
    </div>
  );
};

export const Modal = ({ children, onClose, wide = false }) => (
  <div onClick={onClose} className={s.overlay}>
    <div onClick={(e) => e.stopPropagation()} className={`${s.modal} ${wide ? s.modalWide : ''}`}>
      {children}
    </div>
  </div>
);
