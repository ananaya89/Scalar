function IconBase({ children, size = 18, stroke = 1.9, className = '', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function BoardLogoIcon({ size = 22, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="3" width="19" height="18" rx="4.5" fill="currentColor" opacity="0.18" />
      <rect x="4.5" y="5" width="15" height="14" rx="3.5" fill="currentColor" />
      <rect x="7" y="7.5" width="3.4" height="9" rx="1.5" fill="white" />
      <rect x="12.2" y="7.5" width="4.8" height="5.7" rx="1.5" fill="white" opacity="0.95" />
    </svg>
  );
}

export function WorkspaceGridIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </IconBase>
  );
}

export function BoardsIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="6" width="17" height="12" rx="2.5" />
      <path d="M8.5 6v12" />
      <path d="M13.5 6v12" opacity="0.6" />
    </IconBase>
  );
}

export function TemplateIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M6 4.5h7.5a2.5 2.5 0 0 1 2.5 2.5v12.5H8.5A2.5 2.5 0 0 0 6 22z" />
      <path d="M18 8.5h1.5A2.5 2.5 0 0 1 22 11v8.5H13" />
      <path d="M8.5 9.5h5" />
      <path d="M8.5 13h4" />
    </IconBase>
  );
}

export function HomeIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.5v9h11v-9" />
    </IconBase>
  );
}

export function SearchIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="10.5" cy="10.5" r="5.5" />
      <path d="m15 15 5 5" />
    </IconBase>
  );
}

export function MegaphoneIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M5 12v-1.5a2 2 0 0 1 1.2-1.83L17 4.5v10l-10.8-4.17A2 2 0 0 0 5 10.5V12Z" />
      <path d="M7.5 14.5 9 19" />
    </IconBase>
  );
}

export function BellIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M6.5 16.5h11l-1.4-2.2v-3.5A4.6 4.6 0 0 0 11.5 6h-1A4.6 4.6 0 0 0 6 10.8v3.5z" />
      <path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" />
    </IconBase>
  );
}

export function InfoIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.25v5" />
      <path d="M12 7.75h.01" />
    </IconBase>
  );
}

export function ChevronDownIcon(props) {
  return (
    <IconBase {...props}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

export function StarIcon({ filled = false, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={props.size || 18}
      height={props.size || 18}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className || ''}
      aria-hidden="true"
    >
      <path d="m12 3.7 2.62 5.3 5.85.85-4.24 4.13 1 5.82L12 17.03 6.77 19.8l1-5.82L3.53 9.85l5.85-.85z" />
    </svg>
  );
}

export function ClockIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4.7l3 1.8" />
    </IconBase>
  );
}

export function SparklesIcon(props) {
  return (
    <IconBase {...props}>
      <path d="m12 3 1.4 3.9L17 8.3l-3.6 1.4L12 13.6l-1.4-3.9L7 8.3l3.6-1.4z" />
      <path d="m18.5 13 1 2.6 2.5.9-2.5 1-1 2.5-1-2.5-2.5-1 2.5-.9z" />
      <path d="m6 14.5.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </IconBase>
  );
}

export function PlusIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  );
}

export function MoreIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </IconBase>
  );
}

export function FilterIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </IconBase>
  );
}

export function MembersIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="9" r="3" />
      <path d="M4.5 18a4.5 4.5 0 0 1 9 0" />
      <circle cx="17" cy="9.5" r="2.3" />
      <path d="M14.6 18a3.7 3.7 0 0 1 4.9-3.5A3.9 3.9 0 0 1 21 18" />
    </IconBase>
  );
}

export function CalendarIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="5.5" width="16" height="14" rx="2.5" />
      <path d="M8 3.5v4" />
      <path d="M16 3.5v4" />
      <path d="M4 10h16" />
    </IconBase>
  );
}

export function CheckSquareIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="m8.5 12 2.3 2.3 4.7-4.8" />
    </IconBase>
  );
}

export function ArrowUpRightIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </IconBase>
  );
}

export function ArrowLeftIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </IconBase>
  );
}

export function BoltIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M13 2 5.5 13h4l-1 9L18.5 10h-4L18 2z" />
    </IconBase>
  );
}

export function CloseIcon(props) {
  return (
    <IconBase {...props}>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </IconBase>
  );
}
