import ScholarShell, { ExploreArchives } from './scholar/shell';

export default function NotFound() {
  return (
    <ScholarShell
      active=""
      title="The Index"
      count="Six volumes, one archive"
      index={
        <p className="scholar-caption">
          Choose an archive from the navigation to continue browsing.
        </p>
      }
    >
      <article>
        <p className="scholar-eyebrow">Entry unavailable</p>
        <header className="scholar-record-head">
          <h1>This record could not be found.</h1>
        </header>
        <p>
          The link may be incomplete or refer to an entry that is no longer
          available. Browse the index to find the record you need.
        </p>
        <ExploreArchives current="" />
      </article>
    </ScholarShell>
  );
}
