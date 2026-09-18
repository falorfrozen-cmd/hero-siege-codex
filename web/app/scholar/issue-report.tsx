'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Copy, MessageSquareWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CODEX_UI_RELEASE,
  issueReport,
  reportEntryLink,
  type IssueContext,
} from '@desktop/issue-report';

export default function ReportIssue({
  archive,
  getEntry,
}: {
  archive: string;
  getEntry: () => string;
}) {
  const [context, setContext] = useState<IssueContext | null>(null);
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState(false);
  const attempt = useRef(0);
  const reportBox = useRef<HTMLTextAreaElement>(null);
  useEffect(
    () => () => {
      attempt.current++;
    },
    [],
  );
  const report = context ? issueReport(context, details) : '';

  function open() {
    attempt.current++;
    setContext({
      archive,
      entry: getEntry(),
      link: reportEntryLink(window.location.href),
    });
    setDetails('');
    setStatus('');
    setPreview(false);
  }
  async function copy() {
    const id = ++attempt.current;
    try {
      await navigator.clipboard.writeText(report);
      if (id === attempt.current)
        setStatus('Report copied. Share it with the Codex maintainer.');
    } catch {
      if (id !== attempt.current) return;
      setStatus('Select and copy the report below.');
      setPreview(true);
      requestAnimationFrame(() => {
        reportBox.current?.focus();
        reportBox.current?.select();
      });
    }
  }
  const copied = status.startsWith('Report copied');
  return (
    <>
      <button
        type="button"
        className="scholar-about scholar-report-trigger"
        onClick={open}
      >
        <MessageSquareWarning size={16} /> Report an issue
      </button>
      <Dialog
        open={context !== null}
        onOpenChange={(value) => {
          if (!value) {
            attempt.current++;
            setContext(null);
          }
        }}
      >
        <DialogContent className="scholar-report-dialog">
          <DialogHeader>
            <DialogTitle>Report an issue</DialogTitle>
            <DialogDescription>
              Copy a report to share with the Codex maintainer.
            </DialogDescription>
          </DialogHeader>
          <div className="scholar-report-body">
            <div className="scholar-report-context">
              <span>{context?.archive}</span>
              <strong>{context?.entry}</strong>
              <small>UI release {CODEX_UI_RELEASE}</small>
            </div>
            <label htmlFor="codex-issue-details">What went wrong?</label>
            <Textarea
              id="codex-issue-details"
              value={details}
              maxLength={4000}
              rows={4}
              placeholder="What happened, and what did you expect?"
              onChange={(event) => {
                attempt.current++;
                setDetails(event.target.value);
                setStatus('');
              }}
            />
            <details
              open={preview}
              onToggle={(event) => setPreview(event.currentTarget.open)}
            >
              <summary>Preview report</summary>
              <Textarea
                ref={reportBox}
                readOnly
                value={report}
                rows={7}
                aria-label="Report text"
              />
            </details>
          </div>
          <div className="scholar-report-actions">
            <Button
              variant="outline"
              onClick={() => {
                attempt.current++;
                setContext(null);
              }}
            >
              Close
            </Button>
            <Button onClick={copy} data-copied={copied || undefined}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy report'}
            </Button>
          </div>
          <output className="scholar-report-status" aria-live="polite">
            {status}
          </output>
        </DialogContent>
      </Dialog>
    </>
  );
}
