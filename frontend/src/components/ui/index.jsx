import { cn } from '../../lib/utils';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:bg-blue-300',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200',
    outline: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    emerald: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    ghost: 'text-slate-700 hover:bg-slate-100',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-medium rounded-lg',
    md: 'px-4 py-2 text-sm font-medium rounded-lg',
    lg: 'px-5 py-2.5 text-base font-semibold rounded-xl',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn('rounded-2xl border border-slate-200 bg-white shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Input({ error, className, ...props }) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2',
        error
          ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
          : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200',
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ error, className, ...props }) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2',
        error
          ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
          : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200',
        className
      )}
      {...props}
    />
  );
}

export function Select({ error, className, children, ...props }) {
  return (
    <select
      className={cn(
        'w-full rounded-xl border bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2',
        error
          ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
          : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
