import type { FormEvent, ReactNode } from "react";
import type { DialogCloseButtonTone } from "@/components/DialogCloseButton";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

export interface ModalProps {
  /** Whether the modal is open. Drives the reveal animation and dismissal handlers. */
  open: boolean;
  /** Called when the user requests to close (backdrop, Escape, or close button). */
  onClose: () => void;
  /** Header title. When provided it is wired up as the dialog's accessible label. */
  title?: ReactNode;
  /** Optional secondary text rendered under the title. */
  description?: ReactNode;
  /** Extra controls rendered in the header, left of the close button (e.g. an Import button). */
  headerActions?: ReactNode;
  /** Footer content (typically action buttons). Rendered in a bordered footer row. */
  footer?: ReactNode;
  /** Modal body content. */
  children: ReactNode;
  /** Max width preset for the panel. Defaults to `lg`. */
  size?: ModalSize;
  /** ARIA role for the panel. Use `alertdialog` for confirmations. Defaults to `dialog`. */
  role?: "dialog" | "alertdialog";
  /**
   * When `true`, the modal is locked: backdrop click, Escape, and the close button are disabled.
   * Use while an async action is running.
   */
  busy?: boolean;
  /** Hide the default header close button. */
  hideCloseButton?: boolean;
  /** Tone for the header close button. */
  closeButtonTone?: DialogCloseButtonTone;
  /** Disable closing when the backdrop is clicked. */
  disableBackdropClose?: boolean;
  /** Disable closing on Escape. */
  disableEscapeClose?: boolean;
  /**
   * Wrap the body + footer in a `<form>` with this submit handler. Lets a footer submit button
   * drive a form in the body (e.g. edit dialogs).
   */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  /**
   * Absolutely-positioned overlay rendered above the panel content (e.g. a loading spinner).
   * When present and `busy` is `true`, the underlying content is blurred.
   */
  overlay?: ReactNode;
  /** Override the overlay stacking/position class (defaults to `fixed inset-0 z-[100]`). */
  overlayClassName?: string;
  /** Extra classes appended to the panel. */
  panelClassName?: string;
  /** Extra classes appended to the body wrapper. */
  bodyClassName?: string;
  /** Accessible label for the dialog when no `title` is rendered. */
  ariaLabel?: string;
  /** Override the element id used for `aria-describedby`. */
  describedById?: string;
}
