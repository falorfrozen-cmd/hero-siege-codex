import { ArrowLeft, ArrowRight } from 'lucide-react';
import './book-page-turns.css';

type Props = {
  label: string;
  previousLabel: string;
  nextLabel: string;
  previousDisabled: boolean;
  nextDisabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

/** Place inside the binding so the controls follow its corners, not the toolbar. */
export default function BookPageTurns({
  label,
  previousLabel,
  nextLabel,
  previousDisabled,
  nextDisabled,
  onPrevious,
  onNext,
}: Props) {
  return (
    <nav className="book-edge-navigation" aria-label={label}>
      <div className="book-edge-track">
        <button
          type="button"
          aria-label={previousLabel}
          title={previousLabel}
          disabled={previousDisabled}
          onClick={onPrevious}
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span>Previous</span>
        </button>
      </div>
      <div className="book-edge-track">
        <button
          type="button"
          aria-label={nextLabel}
          title={nextLabel}
          disabled={nextDisabled}
          onClick={onNext}
        >
          <ArrowRight size={20} aria-hidden="true" />
          <span>Next</span>
        </button>
      </div>
    </nav>
  );
}
