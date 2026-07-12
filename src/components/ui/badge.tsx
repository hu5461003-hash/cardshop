interface BadgeProps {
  children: React.ReactNode;
  variant?: "dark" | "light" | "success" | "warning" | "error";
  className?: string;
}

export default function Badge({ children, variant = "dark", className = "" }: BadgeProps) {
  const variants = {
    dark: "bg-dark-3 text-gray-4 border border-glass-border",
    light: "bg-white text-black",
    success: "bg-success/10 text-success border border-success/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    error: "bg-error/10 text-error border border-error/20",
  };

  return (
    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium tracking-wide ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
