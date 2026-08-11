function GreenVistaMark({ className = '', title }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
    >
      {title && <title>{title}</title>}
      <path d="M8 33.5C14.2 27.7 20.7 25.7 27.5 27.4C32.6 28.7 36.6 28.3 41 25.8" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M12 38C19 32.7 25.3 31.5 31.5 33.3C35 34.3 38 34.1 41 32.6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M25 27V18.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M24.8 19C19.1 19.2 15.2 15.6 15 10.2C20.5 10 24.4 13.3 24.8 19Z" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />
      <path d="M25.4 20.2C26 14.9 30.2 11.5 35.8 11.8C35.4 17.2 31.3 20.5 25.4 20.2Z" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />
    </svg>
  )
}

export default GreenVistaMark
