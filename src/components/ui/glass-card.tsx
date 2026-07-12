interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className = "",
  hover = true,
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`glass-card p-6 ${hover ? "hover:bg-white/[0.05] hover:border-white/12 hover:shadow-[0_0_40px_rgba(255,255,255,0.02)]" : ""} ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
