const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smooth = (value: number) => {
  const progress = clamp(value);
  return progress ** 3 * (10 + progress * (-15 + progress * 6));
};
const lerp = (from: number, to: number, fraction: number) => from + (to - from) * fraction;
const pair = (value?: string) => (value ?? '0,0').split(',').map(Number);

type Point = { z: number; x: number; y: number };
const palette = {
  bg: [[236,234,226],[11,12,11]], ink: [[18,20,19],[241,241,238]], muted: [[94,99,96],[154,160,156]],
  hair: [[211,208,198],[44,47,45]], line: [[34,52,224],[124,138,255]],
};

function interpolatePath(points: Point[]) {
  const output: Point[] = [];
  function slope(index: number, axis: 'x' | 'y') {
    if (!index || index === points.length - 1) return 0;
    return (points[index + 1][axis] - points[index - 1][axis]) / (points[index + 1].z - points[index - 1].z);
  }
  points.slice(0, -1).forEach((start, index) => {
    const end = points[index + 1];
    const distance = end.z - start.z;
    for (let step = 0; step < 80; step++) {
      const t = step / 80;
      const axis = (key: 'x' | 'y') => (2*t**3-3*t**2+1)*start[key] + (t**3-2*t**2+t)*distance*slope(index,key)
        + (-2*t**3+3*t**2)*end[key] + (t**3-t**2)*distance*slope(index+1,key);
      output.push({ z: start.z + distance * t, x: axis('x'), y: axis('y') });
    }
  });
  return [...output, points[points.length - 1]];
}

function splitHeadings(root: HTMLElement) {
  for (const heading of root.querySelectorAll('.split:not([aria-label])')) {
    heading.setAttribute('aria-label', heading.textContent?.trim() ?? '');
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let order = 0;
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      for (const word of node.data.split(/(\s+)/)) {
        if (!word.trim()) { fragment.append(word); continue; }
        const group = document.createElement('span');
        group.className = 'w'; group.setAttribute('aria-hidden', 'true');
        for (const character of word) {
          const letter = document.createElement('span');
          letter.className = 'c'; letter.textContent = character;
          letter.style.setProperty('--i', String(order++));
          group.append(letter);
        }
        fragment.append(group);
      }
      node.replaceWith(fragment);
    }
  }
}

export function mountScene(root: HTMLElement) {
  const doc = document.documentElement;
  const get = <ElementType extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<ElementType>(selector)!;
  const canvas = get<HTMLCanvasElement>('#cv');
  const context = canvas.getContext('2d');
  const sections = [...root.querySelectorAll<HTMLElement>('.st')];
  const abort = new AbortController();
  const options = { signal: abort.signal };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame = 0;
  let render = () => {};
  let go = (_target: string, _smooth: boolean) => { void _target; void _smooth; };
  let lastWidth = 0;
  let position = scrollY;
  let previous = -1;
  let timestamp = performance.now();
  let routeTarget = location.hash.slice(1);
  const count = get('#count');
  const distinkt = get('#distinkt');
  const panel = get('#distinkt .panel');
  const video = get<HTMLVideoElement>('#dkvid');
  const cue = get('#dkfig');
  const seek = get<HTMLInputElement>('#dkseek');
  const burger = get('#burger');
  let menuOpen = false;
  splitHeadings(root);
  doc.classList.add('is3d');

  function measure() {
    if (abort.signal.aborted) return;
    const width = innerWidth;
    const height = canvas.getBoundingClientRect().height || innerHeight;
    const mobile = width < 760;
    lastWidth = width;
    const unit = mobile ? 900 : clamp(width * .8, 900, 1400);
    const scale = Math.min(devicePixelRatio, 2);
    canvas.width = width * scale;
    canvas.height = height * scale;
    context?.setTransform(scale, 0, 0, scale, 0, 0);
    const stops: { s: number; z: number; ease: number }[] = [];
    const anchors: Point[] = [];
    let depth = 0;
    let scroll = 0;
    let direction = 1;
    const scenes = sections.map((section, index) => {
      const gap = Number(section.dataset.gap ?? 3);
      const [ax, ay] = pair((mobile && section.dataset.ma) || section.dataset.a);
      if (index && gap >= 2.2) {
        direction *= -1;
        anchors.push({ z: depth + gap * unit / 2, x: direction * (mobile ? .85 : 1.05) * width, y: (direction > 0 ? -.42 : .46) * height });
      }
      if (index) { depth += gap * unit; scroll += gap * (mobile ? .52 : .46) * height; }
      const special = section.hasAttribute('data-dk');
      const hold = Number(section.dataset.hold ?? .6) * height * (special ? 1 : .55);
      const start = scroll;
      anchors.push({ z: depth, x: ax * width, y: ay * height });
      stops.push({ s: start, z: depth - unit * (special || !index ? 1 : 1.11), ease: Number(section.dataset.ease ?? 1) * .45 });
      scroll += hold;
      stops.push({ s: scroll, z: depth - unit * (special ? 1 : index ? .89 : .82), ease: 0 });
      const elements = [...section.querySelectorAll<HTMLElement>('.el')].map((element) => {
        const [x, y] = pair((mobile && element.dataset.mp) || element.dataset.p);
        const [fx, fy] = pair(element.dataset.f);
        const offset = Number(element.dataset.z ?? 0);
        const absolute = Number(element.dataset.abs ?? 0);
        const rotate = mobile ? 0 : Number(element.dataset.r ?? 0);
        element.classList.toggle('far', offset > .2);
        for (const text of element.querySelectorAll<HTMLElement>('.d')) {
          if (getComputedStyle(text).whiteSpace !== 'nowrap') continue;
          text.style.fontSize = '';
          if (text.offsetWidth > width * .9) text.style.fontSize = `${parseFloat(getComputedStyle(text).fontSize) * width * .9 / text.offsetWidth}px`;
        }
        return { element, x, y, fx: fx * (mobile ? .5 : 1), fy, offset, absolute, rotate,
          poses: [...element.querySelectorAll('.pose img')], node: element.querySelector('.node'),
          runner: element.querySelector<HTMLElement>('.runner'), spray: element.querySelector('.spray'),
          letters: [...element.querySelectorAll<HTMLElement>('.jr-h .c')] };
      });
      return { section, depth, gap, hold, start, ax, ay, elements, label: section.dataset.label ?? '' };
    });
    const path = interpolatePath(anchors);
    const markers = scenes.filter((scene, index) => !index || scene.gap >= 2.2);
    let labelNumber = 0;
    const markerNumbers = markers.map(({ label }, index) => {
      if (!index || label !== markers[index - 1].label) labelNumber = index + 1;
      return labelNumber;
    });
    const ticks = get('#ticks');
    ticks.replaceChildren(...markers.map(({ start }) => {
      const tick = document.createElement('i');
      tick.className = 'tk'; tick.style.top = `${start / scroll * 100}%`;
      return tick;
    }));
    get('#spacer').style.height = `${scroll + height}px`;
    const distinktScene = scenes.find(({ section }) => section.id === 'dk-stop')!;
    const inner = get('.dk-in');
    inner.style.transform = '';
    if (inner.offsetHeight > height - (mobile ? 126 : 160)) inner.style.transform = `scale(${(height - (mobile ? 126 : 160)) / inner.offsetHeight})`;

    go = (target, animated) => {
      const scene = scenes.find(({ section }) => section.id === (target === 'distinkt' ? 'dk-stop' : target));
      if (!scene) return;
      const top = scene.start + (target === 'distinkt' ? scene.hold * .45 : target === 'hero' ? 0 : 2);
      window.scrollTo({ top, behavior: 'instant' });
      if (!animated) { position = top; previous = -1; render(); }
    };

    render = () => {
      const progress = clamp(position, 0, scroll);
      const stopIndex = stops.findIndex((stop) => stop.s >= progress);
      const end = stops[Math.max(1, stopIndex)];
      const start = stops[Math.max(0, stopIndex - 1)];
      const t = clamp((progress - start.s) / Math.max(1, end.s - start.s));
      const camera = lerp(start.z, end.z, lerp(t, smooth(t), end.ease));
      let dark = 0;
      scenes.forEach((scene) => {
        const delta = scene.depth - camera - unit;
        if (scene.section.dataset.dark) dark = Math.max(dark, Math.min(1-smooth((delta/unit-.45)/.85), 1-smooth((-delta/unit-.6)/.65)));
        for (const item of scene.elements) {
          const { element, offset } = item;
          const distance = scene.depth + offset * unit - camera;
          const fade = clamp(scene.gap * .82, 1, 1.7) * unit;
          const opacity = delta > 0 ? 1-smooth((delta-.45*fade)/(.55*fade)) : 1-smooth((-delta-.22*unit)/(.42*unit));
          if (distance < .16 * unit || opacity < .01) { element.style.visibility = 'hidden'; continue; }
          const zoom = unit * (item.absolute || 1 + offset) / distance;
          const drift = smooth(delta / (1.9 * unit));
          const reveal = clamp((.55 * unit - delta) / (.65 * unit));
          element.style.visibility = 'visible';
          element.style.opacity = String(opacity);
          element.style.pointerEvents = opacity > .6 && zoom < 1.6 ? 'auto' : 'none';
          element.style.transform = `translate3d(${width * (.5 + (item.x + item.fx * drift)*zoom)}px,${height * (.5 + (item.y + item.fy * drift)*zoom)}px,0) translate(-50%,-50%) perspective(1100px) rotateY(${item.rotate * drift}deg) scale(${zoom})`;
          element.style.setProperty('--k', String(drift));
          element.style.setProperty('--fp', String(reveal));
          element.style.setProperty('--dp', String(smooth((-delta/unit-.03)/.38)));
          element.style.setProperty('--sp', String(smooth((-delta/unit-.03)/.38)));
          item.node?.classList.toggle('on', delta < .05 * unit);
          item.poses.forEach((pose, index) => pose.classList.toggle('on', index === Math.round(clamp((.04-delta/unit)/.42) * (item.poses.length - 1))));
          if (item.runner) {
            const leap = clamp((-delta / unit - .1) / .42);
            item.runner.style.left = `${reveal * 96 + leap * 26}%`;
            item.runner.style.transform = `translate(-50%,${-1.5*leap + 2.9*leap**2}em) rotate(${leap*24}deg)`;
            item.runner.classList.toggle('pj', leap > .01);
            item.runner.classList.toggle('run', leap <= .01);
            item.letters.forEach((letter, index) => letter.style.setProperty('--cf', `${clamp(reveal * (item.letters.length+1) - index) * 100}%`));
          }
          if (item.spray) {
            const sprayProgress = clamp((reveal-.3)/.68);
            for (const pool of item.spray.querySelectorAll<SVGElement>('.spray-pool')) pool.style.transform = `scale(${smooth(sprayProgress)})`;
            for (const spray of item.spray.querySelectorAll<SVGElement>('.spray-p, .spray-mist, .spray-drip')) {
              spray.style.opacity = String(smooth(sprayProgress));
              spray.style.strokeDashoffset = String(40 * (1-sprayProgress));
            }
          }
        }
      });
      const stats = scenes.find(({ section }) => section.id === 'numbers')!;
      count.textContent = String(Math.round(250 * smooth((progress - stats.start + .28*height)/(.56*height))));
      const colors = Object.entries(palette).map(([key, [from, to]]) => {
        const color = `rgb(${from.map((channel, index) => Math.round(lerp(channel, to[index], dark))).join(',')})`;
        doc.style.setProperty(`--${key}`, color);
        return color;
      });
      if (context) {
        context.clearRect(0, 0, width, height);
        context.strokeStyle = context.fillStyle = colors[4];
        const reach = unit * (mobile ? 3 : 3.3);
        const tip = Math.min(camera + reach, path[path.length - 1].z);
        let last: { x: number; y: number; w: number } | undefined;
        for (let index = 0; index < path.length; index++) {
          let point = path[index];
          if (point.z < camera + .1 * unit) continue;
          if (point.z > tip && index) {
            const prior = path[index - 1];
            const blend = clamp((tip - prior.z) / (point.z - prior.z));
            point = { z: tip, x: lerp(prior.x, point.x, blend), y: lerp(prior.y, point.y, blend) };
          }
          const distance = point.z - camera;
          const w = unit / distance;
          const next = { x: width / 2 + point.x * w, y: height / 2 + point.y * w, w };
          if (last) {
            context.globalAlpha = (1-.82*smooth((distance-1.2*unit)/(reach-1.2*unit))) * smooth((distance/unit-.1)/.3);
            context.lineWidth = clamp(2.4*w, .5, 7);
            context.beginPath(); context.moveTo(last.x, last.y); context.lineTo(next.x, next.y); context.stroke();
          }
          last = next;
          if (point.z >= tip) break;
        }
        if (last) {
          const final = tip >= path[path.length - 1].z - 1;
          const radius = final ? clamp(11 * last.w, 6, 22) : clamp(5 * last.w, 2.5, 14);
          if (!final) {
            context.globalAlpha = .18; context.beginPath(); context.arc(last.x, last.y, radius*2.6, 0, Math.PI*2); context.fill();
          }
          context.globalAlpha = 1; context.beginPath(); context.arc(last.x, last.y, radius, 0, Math.PI*2); context.fill();
        }
      }
      const marker = Math.max(0, markers.findLastIndex(({ start }) => progress >= start - .6 * height));
      get('#hud').style.setProperty('--p', String(progress / scroll));
      get('#hudn').textContent = String(markerNumbers[marker]).padStart(2, '0');
      get('#hudl').textContent = markers[marker].label;
      [...ticks.children].forEach((tick, index) => tick.classList.toggle('on', markers[index].start <= progress + 2));
      const incoming = smooth((progress - distinktScene.start + .75 * height) / (1.05 * height));
      const outgoing = smooth((progress - distinktScene.start - distinktScene.hold + 1.05 * height) / height);
      const shown = incoming > 0 && outgoing < 1;
      distinkt.style.visibility = shown ? 'visible' : 'hidden';
      distinkt.style.pointerEvents = incoming > .98 && outgoing < .2 ? 'auto' : 'none';
      if (shown) {
        panel.style.clipPath = `circle(${Math.hypot(width, height)*.62*incoming+1}px at 50% 50%)`;
        panel.style.transform = `perspective(1200px) translateY(${-outgoing*height*.04}px) rotateX(${outgoing*14}deg) scale(${1-.84*outgoing})`;
        panel.style.opacity = String(1-smooth((outgoing-.7)/.3));
        distinkt.querySelectorAll<HTMLElement>('.fly').forEach((element, index) => element.style.setProperty('--q', String(1-smooth((progress-distinktScene.start-.05*height)/(.95*height)*1.6-index*.13))));
      }
      if (!video.paused && (incoming < .9 || outgoing > .85)) video.pause();
    };
    previous = -1;
    if (routeTarget) go(routeTarget, false);
    render();
  }

  function animate(now: number) {
    const elapsed = Math.min(.05, (now - timestamp) / 1000);
    timestamp = now;
    const distance = scrollY - position;
    position = reduced || Math.abs(distance) < .3 ? scrollY : position + distance * (1 - Math.exp(-elapsed * (Math.abs(distance) > innerHeight * 3 ? 9 : 5.5)));
    if (position !== previous) { previous = position; render(); }
    frame = requestAnimationFrame(animate);
  }

  function toggleMenu(open: boolean) {
    menuOpen = open;
    doc.classList.toggle('menu-open', open);
    doc.style.overflow = open ? 'hidden' : '';
    burger.setAttribute('aria-expanded', String(open));
  }
  function toggleVideo() {
    if (video.paused) { video.preload = 'auto'; void video.play().catch(() => {}); }
    else video.pause();
  }
  root.addEventListener('click', (event) => {
    const control = (event.target as Element).closest<HTMLElement>('[data-go],button');
    if (!control) return;
    if (control.dataset.go) {
      event.preventDefault(); routeTarget = ''; toggleMenu(false); go(control.dataset.go, true); return;
    }
    switch (control.id) {
      case 'burger': toggleMenu(!menuOpen); break;
      case 'copy': navigator.clipboard.writeText('hello@alexcarter.studio').then(() => {
        control.textContent = 'Copied'; setTimeout(() => { control.textContent = 'Copy email'; }, 1800);
      }).catch(() => get('#mail').focus()); break;
      case 'thumbs': get('#thumbtt').textContent = 'You remember Flash!'; break;
      case 'thumbsdn': get('#thumbtt').textContent = 'Ah, a youngster. Ask your parents about Skip Intro buttons.'; break;
      case 'dkbig':
      case 'dkpp': toggleVideo(); break;
      case 'dksnd':
        video.muted = !video.muted;
        control.setAttribute('aria-pressed', String(!video.muted));
        control.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute');
        break;
    }
  }, options);
  const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  function updateVideo() {
    cue.classList.toggle('playing', !video.paused);
    get('#dkpp').setAttribute('aria-label', video.paused ? 'Play' : 'Pause');
    if (Number.isFinite(video.duration)) {
      seek.value = String(video.currentTime / video.duration * 1000);
      seek.style.setProperty('--pct', `${video.currentTime / video.duration * 100}%`);
      get('#dktime').textContent = `${time(video.currentTime)} / ${time(video.duration)}`;
    }
  }
  for (const event of ['play', 'pause', 'timeupdate', 'loadedmetadata']) video.addEventListener(event, updateVideo, options);
  video.addEventListener('click', toggleVideo, options);
  video.addEventListener('ended', () => { video.currentTime = 0; updateVideo(); }, options);
  seek.addEventListener('input', () => { if (Number.isFinite(video.duration)) video.currentTime = Number(seek.value) / 1000 * video.duration; }, options);
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && menuOpen) { toggleMenu(false); burger.focus(); } }, options);
  window.addEventListener('resize', () => { if (innerWidth !== lastWidth || !matchMedia('(pointer: coarse)').matches) measure(); }, options);
  window.addEventListener('hashchange', () => go(location.hash.slice(1), false), options);
  measure();
  void document.fonts.ready.then(() => { measure(); routeTarget = ''; });
  frame = requestAnimationFrame(animate);
  return () => {
    abort.abort(); cancelAnimationFrame(frame); toggleMenu(false); doc.classList.remove('is3d');
    for (const key of Object.keys(palette)) doc.style.removeProperty(`--${key}`);
  };
}
