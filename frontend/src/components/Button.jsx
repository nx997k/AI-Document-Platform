import { useRef } from "react";

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
  const btnRef = useRef(null);

  const handleClick = (e) => {
    if (disabled || loading) return;

    const btn = btnRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      const size = Math.max(rect.width, rect.height);

      ripple.className = "btn-ripple";
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

      btn.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    }

    onClick?.(e);
  };

  const classes = [
    "btn",
    `btn--${variant}`,
    `btn--${size}`,
    loading ? "btn--loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={btnRef}
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      <span className="btn-shine" aria-hidden="true" />
      <span className="btn-content">
        {loading && <span className="btn-spinner" aria-hidden="true" />}
        {icon && !loading && <span className="btn-icon">{icon}</span>}
        {children}
      </span>
    </button>
  );
}

export default Button;
