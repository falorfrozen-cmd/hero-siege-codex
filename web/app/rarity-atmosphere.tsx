'use client';
import { useEffect, useRef, useState } from 'react';
import scenes from '@/lib/scene-manifest.json';

type Scene = { src: string; name: string };
export default function RarityAtmosphere({
  rarity,
}: {
  rarity: string | null;
}) {
  const [layers, setLayers] = useState<{
    current: Scene | null;
    previous: Scene | null;
  }>({ current: null, previous: null });
  const revision = useRef(0);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    let image: HTMLImageElement | null = null;
    let active = true;
    const load = () => {
      const request = ++revision.current;
      if (!rarity) return;
      const name = rarity.toLowerCase() as keyof typeof scenes;
      const src = scenes[name][media.matches ? 'mobile' : 'desktop'];
      const pendingImage = new window.Image();
      image = pendingImage;
      pendingImage.decoding = 'async';
      pendingImage.onload = () => {
        void pendingImage
          .decode()
          .catch(() => {})
          .then(() => {
            if (!active || request !== revision.current) return;
            const reduced = window.matchMedia(
              '(prefers-reduced-motion: reduce)',
            ).matches;
            setLayers((old) =>
              old.current?.src === src
                ? old
                : {
                    current: { name, src },
                    previous: reduced ? null : old.current,
                  },
            );
          });
      };
      // Artwork failure keeps the existing scene/color; reading never waits for it.
      image.onerror = () => {};
      image.src = src;
    };
    load();
    media.addEventListener('change', load);
    return () => {
      active = false;
      media.removeEventListener('change', load);
      if (image) {
        image.onload = null;
        image.onerror = null;
      }
    };
  }, [rarity]);
  useEffect(() => {
    if (!layers.previous) return;
    const timer = window.setTimeout(
      () => setLayers((old) => ({ ...old, previous: null })),
      420,
    );
    return () => window.clearTimeout(timer);
  }, [layers.current, layers.previous]);
  return (
    <div className="rarity-atmosphere" aria-hidden="true">
      {layers.previous ? (
        <div
          className="scene-layer scene-previous"
          style={{ backgroundImage: `url('${layers.previous.src}')` }}
        />
      ) : null}
      {layers.current ? (
        <div
          key={layers.current.src}
          className="scene-layer scene-current"
          data-scene={layers.current.name}
          style={{ backgroundImage: `url('${layers.current.src}')` }}
        />
      ) : null}
    </div>
  );
}
