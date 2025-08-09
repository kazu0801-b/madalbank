interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg' | 'xs';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  outline?: boolean;
  glass?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  outline = false,
  glass = false,
  type = 'button',
}) => {
  const baseClasses = 'btn';
  
  const variantClasses = {
    primary: outline ? 'btn-outline btn-primary' : 'btn-primary',
    secondary: outline ? 'btn-outline btn-secondary' : 'btn-secondary',
    danger: outline ? 'btn-outline btn-error' : 'btn-error',
    success: outline ? 'btn-outline btn-success' : 'btn-success',
    warning: outline ? 'btn-outline btn-warning' : 'btn-warning',
    info: outline ? 'btn-outline btn-info' : 'btn-info',
  };
  
  const sizeClasses = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };
  
  const modifierClasses = [
    loading && 'loading',
    glass && 'glass',
    disabled && 'btn-disabled',
  ].filter(Boolean).join(' ');
  
  const className = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${modifierClasses}`.trim();
  
  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
    >
      {children}
    </button>
  );
};