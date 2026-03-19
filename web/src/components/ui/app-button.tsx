import type { ButtonHTMLAttributes } from 'react'

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
export type AppButtonSize = 'sm' | 'md' | 'lg'

type AppButtonClassOptions = {
  variant?: AppButtonVariant
  size?: AppButtonSize
  block?: boolean
  className?: string
}

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Omit<AppButtonClassOptions, 'className'> & {
    className?: string
  }

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function appButtonClassName(options: AppButtonClassOptions = {}) {
  const { variant = 'secondary', size = 'md', block = false, className } = options

  return joinClasses(
    'app-button inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50',
    size === 'sm' && 'px-3 py-1.5 text-xs',
    size === 'md' && 'px-4 py-2 text-sm',
    size === 'lg' && 'px-5 py-2.5 text-sm',
    block && 'w-full',
    variant === 'primary' && 'app-button-primary',
    variant === 'secondary' && 'app-button-secondary',
    variant === 'ghost' && 'app-button-ghost',
    variant === 'destructive' && 'app-button-destructive',
    className
  )
}

export default function AppButton({
  variant = 'secondary',
  size = 'md',
  block = false,
  className,
  type = 'button',
  ...props
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={appButtonClassName({ variant, size, block, className })}
      {...props}
    />
  )
}
