import { Link } from 'react-router-dom';

export function LogoMark({ className = 'logo-mark', light }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="31" fill={light ? '#FBF7F0' : '#3B2416'} />
      <circle cx="32" cy="32" r="26" fill="none" stroke="#B8862F" strokeWidth="1.4" />
      <path d="M26 15c8 4 8 10 0 14s-8 10 0 14 8 6 2 8" fill="none" stroke="#D9B26A" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M38 15c-8 4-8 10 0 14s8 10 0 14-8 6-2 8" fill="none" stroke={light ? '#3B2416' : '#FBF7F0'} strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ light = false, onClick }) {
  return (
    <Link to="/" className={`logo${light ? ' light' : ''}`} aria-label="Cece African Hair Braiding — home" onClick={onClick}>
      <LogoMark light={light} />
      <span className="logo-text">
        <span className="logo-name">Cece</span>
        <span className="logo-sub">African Hair Braiding</span>
      </span>
    </Link>
  );
}
