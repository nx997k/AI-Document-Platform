function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  disabled = false,
  icon,
  type = "button",
  onClick,
  ...props
}) {
  const classes = ["btn", `btn--${variant}`, `btn--${size}`, loading ? "btn--loading" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} disabled={disabled || loading} onClick={onClick} aria-busy={loading || undefined} {...props}>
      <span className="btn-content">
        {loading && <span className="btn-spinner" aria-hidden="true" />}
        {icon && !loading && <span className="btn-icon">{icon}</span>}
        {children}
      </span>
    </button>
  );
}

export default Button;
