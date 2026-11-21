'use client';

import { useEffect, useRef } from 'react';
import content from './content.json';
import { mountScene } from './scene';

const layouts = [
  [-.22, -.02, 30, '4/3', .05, .3], [.21, .05, 30, '4/3', -.02, -.3],
  [-.18, 0, 34, '16/9', .26, .34], [.19, -.04, 34, '16/9', 0, .32],
  [-.24, .03, 25, '3/2', .04, -.3], [.23, 0, 25, '3/2', -.12, .36],
] as const;
const servicePositions = [[-.27,-.1,.5,-.16,-.2],[.26,.2,.18,.16,.02],[.29,-.24,.85,.2,-.3],[-.2,.27,-.12,0,.22],[-.02,.04,1.2,-.1,.38]];
const cards = content.projects.map((project, index) => {
  const [x, y, width, ratio, anchorX, anchorY] = layouts[index];
  const side = x < 0 ? 'l' : 'r';
  const widths = width === 30 ? [260, 560] : width === 34 ? [280, 640] : [230, 460];
  return `<section id="project-${project.slug}" class="st" data-label="Work" data-gap="${index ? 1.55 : 2.2}" data-hold=".38" data-ease=".5" data-a="${anchorX},${anchorY}" data-ma="${x < 0 ? .43 : -.43},.36">
    <div class="el" data-p="${x},${y}" data-mp="0,-.02" data-f="${x < 0 ? -.25 : .25},0" data-r="${x < 0 ? 18 : -18}">
    <a href="/projects/${project.slug}" class="card ${side}${project.coverAr ? ' full' : ''}" style="width:clamp(${widths[0]}px,${width}vw,${widths[1]}px)">
    <span class="fig" style="--ar:${project.coverAr ?? ratio}"><img src="${project.cover}" alt="${project.title} project" decoding="async"></span>
    <span class="meta"><span class="mono">0${index + 1} / 06</span></span><span class="d ${index % 2 ? 't2' : 'b7'}">${project.title}</span>
    <span class="small">${project.category}</span><span class="mono open">View project<i aria-hidden="true"></i></span></a></div></section>`;
}).join('');
const services = content.services.map(([name], index) => {
  const [x, y, depth, mx, my] = servicePositions[index];
  return `<div class="el" data-abs="1" data-p="${x},${y}" data-mp="${mx},${my}" data-z="${depth}"><p class="d svc-nm">${name}</p></div>`;
}).join('');
let seed = 7;
const random = () => (seed = seed * 16807 % 2147483647) / 2147483647;
const stars = Array.from({ length: 34 }, () => {
  const x = (random() - .5) * 1.3;
  const y = (random() - .5) * 1.05;
  const depth = -.3 + random() * 1.9;
  const size = 3 + Math.round(random() * 4);
  return `<div class="el" data-abs="1" data-p="${x},${y}" data-mp="${x*.8},${y}" data-z="${depth}" aria-hidden="true"><i class="star" style="width:${size}px;height:${size}px"></i></div>`;
}).join('');
const html = content.home
  .replace(/<div id="work-stops">\s*<\/div>/, cards)
  .replace(/(<section class="st svc-st"[\s\S]*?)(<\/section>)/, `$1${services}${stars}$2`)
  .replace(/<div id="proj"[\s\S]*?(?=<div id="hud")/, '');
const markup = { __html: html };

export function Home() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => root.current ? mountScene(root.current) : undefined, []);
  return <>
    <link rel="stylesheet" href="/sites/portfolio/scene.css" precedence="default" />
    <div ref={root} dangerouslySetInnerHTML={markup} />
  </>;
}
