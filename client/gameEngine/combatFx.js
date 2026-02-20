var fx = { shapes: [], texts: [], sprites: [] };

// Sprite-Sheet Cache
const spriteCache = new Map();

// Load sprite sheet
function loadSpriteSheet(path) {
  if (spriteCache.has(path)) return spriteCache.get(path);
  const img = new Image();
  img.src = path;
  spriteCache.set(path, img);
  return img;
}

function fxAddShape(s) { fx.shapes.push(s); }
function fxAddText(t) { fx.texts.push(t); }
function fxAddSprite(s) { fx.sprites.push(s); }

function fxRenderAndUpdate() {
  const t = Date.now();

  // SHAPES
  for (let i = fx.shapes.length - 1; i >= 0; i--) {
    const s = fx.shapes[i];
    const age = t - s.start;
    if (age > s.duration) { fx.shapes.splice(i, 1); continue; }

    const p = Math.max(0, Math.min(1, age / s.duration));
    const alpha = (s.fadeOut) ? (1 - p) : (s.alpha ?? 0.7);

    if (s.type === "circle") {
      context.lineWidth = s.lineWidth ?? 4;
      context.strokeStyle = `rgba(${s.r??255},${s.g??0},${s.b??0},${alpha})`;
      context.beginPath();
      context.arc(s.x, s.y, s.radius, 0, Math.PI*2);
      context.stroke();
    }

    if (s.type === "filledCircle") {
      context.fillStyle = `rgba(${s.r??255},${s.g??0},${s.b??0},${alpha})`;
      context.beginPath();
      context.arc(s.x, s.y, s.radius, 0, Math.PI*2);
      context.fill();
      
      // Add pulsing border for better visibility
      if (s.warning) {
        const pulseAlpha = 0.4 + 0.3 * Math.sin(t / 150);
        context.lineWidth = 3;
        context.strokeStyle = `rgba(255,100,100,${pulseAlpha})`;
        context.stroke();
      }
    }

    if (s.type === "ringPulse") {
      const r = s.radius + p * (s.pulse ?? 20);
      context.lineWidth = s.lineWidth ?? 6;
      context.strokeStyle = `rgba(${s.r??255},${s.g??255},${s.b??255},${alpha})`;
      context.beginPath();
      context.arc(s.x, s.y, r, 0, Math.PI*2);
      context.stroke();
    }

    if (s.type === "beam") {
      const ex = s.x + s.nx * s.length;
      const ey = s.y + s.ny * s.length;
      context.lineWidth = (s.width ?? 8) * 2;
      context.strokeStyle = `rgba(${s.r??255},${s.g??0},${s.b??0},${alpha})`;
      context.beginPath();
      context.moveTo(s.x, s.y);
      context.lineTo(ex, ey);
      context.stroke();
    }

    if (s.type === "cone") {
      const a = s.angle ?? (Math.PI / 3);
      const dir = Math.atan2(s.ny, s.nx);
      const a1 = dir - a/2;
      const a2 = dir + a/2;
      const r = s.length;

      context.lineWidth = s.lineWidth ?? 4;
      context.strokeStyle = `rgba(${s.r??255},${s.g??120},${s.b??0},${alpha})`;

      context.beginPath();
      context.moveTo(s.x, s.y);
      context.lineTo(s.x + Math.cos(a1)*r, s.y + Math.sin(a1)*r);
      context.stroke();

      context.beginPath();
      context.moveTo(s.x, s.y);
      context.lineTo(s.x + Math.cos(a2)*r, s.y + Math.sin(a2)*r);
      context.stroke();

      context.beginPath();
      context.arc(s.x, s.y, r, a1, a2);
      context.stroke();
    }
  }

  // SPRITE EFFECTS
  for (let i = fx.sprites.length - 1; i >= 0; i--) {
    try {
      const sprite = fx.sprites[i];
      const age = t - sprite.start;
      if (age > sprite.duration) { fx.sprites.splice(i, 1); continue; }

      // Skip if no path
      if (!sprite.path) continue;

      const img = loadSpriteSheet(sprite.path);
      
      // Skip if image not loaded yet
      if (!img || !img.complete || img.naturalWidth === 0) continue;

      const p = age / sprite.duration;
      const alpha = sprite.fadeOut ? (1 - p) : 1;
      
      // Calculate scale with pulse effect
      let scale = sprite.scale ?? 1.0;
      if (sprite.pulse) {
        scale *= (1 + 0.2 * Math.sin(p * Math.PI * 4));
      }
      
      const w = (sprite.size ?? 64) * scale;
      const h = (sprite.size ?? 64) * scale;
      
      context.save();
      context.globalAlpha = Math.max(0, Math.min(1, alpha));
      context.translate(sprite.x, sprite.y);
      
      // Rotation animation
      if (sprite.rotate) {
        context.rotate(p * Math.PI * 4);
      }
      
      context.drawImage(img, -w/2, -h/2, w, h);
      context.restore();
    } catch (err) {
      // Silently ignore sprite rendering errors
      console.warn('Sprite rendering error:', err);
      fx.sprites.splice(i, 1);
    }
  }

  // FLOATING TEXTS
  for (let i = fx.texts.length - 1; i >= 0; i--) {
    const ft = fx.texts[i];
    const age = t - ft.start;
    if (age > ft.duration) { fx.texts.splice(i, 1); continue; }

    const p = age / ft.duration;
    const y = ft.y - p * (ft.rise ?? 30);
    const alpha = 1 - p;

    context.font = ft.font ?? "14px Arial";
    context.textAlign = "center";
    context.fillStyle = `rgba(255,255,255,${alpha})`;
    context.fillText(ft.text, ft.x, y);
  }
}
