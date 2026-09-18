'use client';
/* oxlint-disable next/no-html-link-for-pages */
import { useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import coverage from '@/lib/archive-coverage.json';
export default function ArchiveCoverage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="scholar-about"
        onClick={() => setOpen(true)}
      >
        <Info size={16} /> About the records
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="scholar-coverage-dialog">
          <DialogHeader>
            <DialogTitle>About the records</DialogTitle>
            <DialogDescription>
              What is recorded, and what still needs verification.
            </DialogDescription>
          </DialogHeader>
          <div className="scholar-coverage-body">
            <p>
              The Codex brings together original game text and recorded data.
              Class introductions and item summaries are editorial
              interpretations; creature illustrations are custom artwork.
            </p>
            <h3>Creature coverage</h3>
            <dl className="scholar-coverage-counts">
              <div>
                <dt>Archive records</dt>
                <dd>{coverage.records}</dd>
              </div>
              <div>
                <dt>Illustrated records</dt>
                <dd>{coverage.illustrated}</dd>
              </div>
              <div>
                <dt>Partial encounter guides</dt>
                <dd>{coverage.guides}</dd>
              </div>
              <div>
                <dt>Unconfirmed appearances</dt>
                <dd>{coverage.unconfirmed.length}</dd>
              </div>
            </dl>
            <p>
              Encounter evidence was reviewed against game{' '}
              {coverage.snapshotVersion}. It does not establish every active
              encounter, attack, statistic or drop.
            </p>
            <p className="scholar-coverage-note">{coverage.currentReview}</p>
            <details>
              <summary>View records with unconfirmed appearances</summary>
              <ul>
                {coverage.unconfirmed.map((entry) => (
                  <li key={entry.slug}>
                    <a href={`/creature-archive?creature=${entry.slug}`}>
                      {entry.name}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
            <h3>Missing information</h3>
            <p>
              “Not yet verified” means the archive has no approved evidence for
              that field. It does not mean an item cannot drop or an encounter
              no longer exists. No drop rates or combat values are guessed.
            </p>
          </div>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Return to the archive
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
