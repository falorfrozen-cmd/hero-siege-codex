import pkg from '../package.json' with { type: 'json' };
import {
  CODEX_UI_RELEASE as WEBSITE_UI_RELEASE,
  issueReport as websiteReport,
  reportEntryLink as websiteLink,
  type IssueContext,
} from '../web/lib/issue-report.ts';
import { sharedArchiveHref } from './links.ts';

export const CODEX_UI_RELEASE = `${WEBSITE_UI_RELEASE} · Desktop ${pkg.version}`;
export type { IssueContext };

export function reportEntryLink(href: string) {
  const canonical = websiteLink(href);
  try {
    return sharedArchiveHref(canonical);
  } catch {
    // Keep a malformed route in the report so the maintainer can reproduce it.
    return canonical;
  }
}

export function issueReport(context: IssueContext, details: string) {
  return `${websiteReport(context, details)}\n\nDesktop release: ${pkg.version} (Windows x64)`;
}
