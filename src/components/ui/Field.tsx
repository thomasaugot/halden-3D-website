import { useId } from 'react'

interface FieldProps {
  label: string
  name: string
  type?: string
  required?: boolean
  error?: string
  defaultValue?: string
  autoComplete?: string
  list?: string
  min?: string
  className?: string
}

export function Field({ label, name, type = 'text', required, error, className = '', ...rest }: FieldProps) {
  const id = useId()
  return (
    <div className={`field flex flex-col ${className}`}>
      <label htmlFor={id} className="field-label text-small text-fg-2 transition-colors">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-1 bg-transparent py-3 text-lede text-fg outline-none placeholder:text-fg-2 [color-scheme:dark]"
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-small text-accent">
          {error}
        </p>
      )}
    </div>
  )
}
