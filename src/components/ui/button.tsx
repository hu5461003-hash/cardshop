import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none cursor-pointer";

    const variants = {
      primary: "bg-white text-black hover:bg-light-3 hover:-translate-y-px hover:shadow-md active:translate-y-0",
      secondary: "bg-transparent text-light-3 border border-glass-border hover:bg-glass-bg hover:border-white/15",
      ghost: "bg-transparent text-gray-4 hover:text-light-3 hover:bg-glass-bg",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 rounded-md",
      md: "text-sm px-5 py-2.5 rounded-[10px]",
      lg: "text-base px-7 py-3 rounded-xl",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
