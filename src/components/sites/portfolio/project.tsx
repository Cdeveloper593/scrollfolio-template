/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useRef } from 'react';
import content from './content.json';

export function Project({ index }: { index: number }) {
  const project = content.projects[index];
  const next = content.projects[(index + 1) % content.projects.length];
  const close = `/#project-${project.slug}`;
  const closeLink = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closeLink.current?.click();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  const images = project.images.map((src, position) => <figure key={src}>
    <img src={src} alt={`${project.title} image ${position + 1}`} decoding="async" />
  </figure>);
  for (const video of [...project.videos].reverse()) {
    if (!video.src) continue;
    images.splice(video.after ?? images.length, 0, <figure className={`pv-vid${video.after === null ? '' : ' mid'}`} key={video.src}>
      <video src={video.src} muted loop playsInline autoPlay preload="metadata" />
    </figure>);
  }

  return <>
    <link rel="stylesheet" href="/sites/portfolio/scene.css" precedence="default" />
    <main id="proj" className="show" aria-label={`${project.title} project`} tabIndex={0}>
      <div className="pv">
        <div className="pv-l">
          <span className="mono">{String(index + 1).padStart(2, '0')} / 06</span>
          <h1 className="d b9">{project.title}</h1>
          <div><span className="mono">Overview</span><div className="pv-overview">
            {project.description.split('\n').filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div></div>
          <dl className="pv-dl"><dt>Client</dt><dd>{project.client}</dd><dt>Services</dt><dd>{project.services.join(', ')}</dd></dl>
          <a className="pv-next" href={`/projects/${next.slug}`}><span className="mono">Next project</span><span className="d t1">{next.title}</span></a>
        </div>
        <div className="pv-r">{images}</div>
      </div>
    </main>
    <a ref={closeLink} className="pv-x" href={close} aria-label="Close project">×</a>
  </>;
}
