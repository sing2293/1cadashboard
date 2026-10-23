import { CircleAlert } from 'lucide-react';
import {
  cloneElement,
  isValidElement,
  useId,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../lib/utils';

/** What Field hands its control: spread these onto it (render-prop form) or let Field clone them in. */
export interface FieldControlProps {
  id: string;
  'aria-labelledby': string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  'aria-required'?: true;
}

interface ControlOwnProps {
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
  'aria-required'?: boolean | 'true' | 'false';
}

export interface FieldProps extends Omit<ComponentProps<'div'>, 'children' | 'id'> {
  /** The visible label. */
  label: ReactNode;
  /** Help under the control. */
  hint?: ReactNode;
  /** An error message, in place of nothing. Marks the control aria-invalid and describes it. */
  error?: ReactNode;
  /**
   * Shows a required asterisk and sets aria-required. It does not add the native `required`
   * attribute, so form behaviour is unchanged; keep `required` on the control if it had one.
   */
  required?: boolean;
  /** Shows a muted "Optional" after the label. */
  optional?: boolean;
  /** The control's id. Generated when left out (an id already on the child wins). */
  id?: string;
  /** "stacked" (default): label above. "inline": label and hint on the left, control on the right (switches). */
  layout?: 'stacked' | 'inline';
  /**
   * One control element (GlassInput, GlassSelectTrigger, GlassTextarea, GlassSwitch, a native
   * input...), which Field gives an id, aria-labelledby, aria-describedby and aria-invalid; or a
   * function that receives those props, for controls nested deeper (a GlassSelect's trigger).
   */
  children: ReactElement | ((control: FieldControlProps) => ReactNode);
}

/**
 * A label, a control, and its hint or error, wired together for assistive technology.
 * Server-safe.
 *
 *   <Field label="Email" hint="We send the report here" error={errors.email} required>
 *     <GlassInput type="email" name="email" className="ca-control-sm" />
 *   </Field>
 *
 *   <Field label="Branch">
 *     {(control) => (
 *       <GlassSelect value={branch} onValueChange={setBranch}>
 *         <GlassSelectTrigger {...control} className="ca-control-sm"><GlassSelectValue /></GlassSelectTrigger>
 *         <GlassSelectContent>…</GlassSelectContent>
 *       </GlassSelect>
 *     )}
 *   </Field>
 */
export function Field({
  label,
  hint,
  error,
  required = false,
  optional = false,
  id,
  layout = 'stacked',
  className,
  children,
  ...props
}: FieldProps) {
  const generatedId = useId();
  const fallbackId = id ?? `ca-field-${generatedId}`;
  const childId =
    typeof children !== 'function' && isValidElement<ControlOwnProps>(children)
      ? children.props.id
      : undefined;
  const controlId = childId ?? fallbackId;
  const labelId = `${controlId}-label`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const control: FieldControlProps = {
    id: controlId,
    'aria-labelledby': labelId,
    ...(describedBy ? { 'aria-describedby': describedBy } : null),
    ...(error ? { 'aria-invalid': true as const } : null),
    ...(required ? { 'aria-required': true as const } : null),
  };

  let rendered: ReactNode;
  if (typeof children === 'function') {
    rendered = children(control);
  } else if (isValidElement<ControlOwnProps>(children)) {
    const own = children.props;
    rendered = cloneElement(children, {
      id: controlId,
      // A control that names itself keeps its own name.
      'aria-labelledby': own['aria-label']
        ? own['aria-labelledby']
        : (own['aria-labelledby'] ?? labelId),
      'aria-describedby':
        [own['aria-describedby'], describedBy].filter(Boolean).join(' ') || undefined,
      'aria-invalid': error ? true : own['aria-invalid'],
      'aria-required': required ? true : own['aria-required'],
    });
  } else {
    rendered = children;
  }

  const labelRow = (
    <label
      id={labelId}
      htmlFor={controlId}
      className="flex items-baseline gap-1 text-sm font-medium text-ca-text select-none"
    >
      {label}
      {required ? (
        <span aria-hidden className="text-ca-danger">
          *
        </span>
      ) : null}
      {optional && !required ? (
        <span className="text-xs font-normal text-ca-muted">(optional)</span>
      ) : null}
    </label>
  );

  const hintNode = hint ? (
    <p id={hintId} className="text-xs text-pretty text-ca-muted">
      {hint}
    </p>
  ) : null;

  const errorNode = error ? (
    <p id={errorId} className="flex items-start gap-1.5 text-xs font-medium text-ca-danger">
      <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
      <span>{error}</span>
    </p>
  ) : null;

  if (layout === 'inline') {
    return (
      <div {...props} className={cn('flex min-w-0 flex-col gap-1.5', className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            {labelRow}
            {hintNode}
          </div>
          <div className="shrink-0">{rendered}</div>
        </div>
        {errorNode}
      </div>
    );
  }

  return (
    <div {...props} className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {labelRow}
      {rendered}
      {hintNode}
      {errorNode}
    </div>
  );
}
