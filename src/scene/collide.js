/**
 * Characters are solid. Every frame the scripted positions (pure functions of t) are separated by a stateless relaxation:
 * overlapping bodies are pushed apart along the line between them (lighter ones move more), nothing is pushed into the
 * booth or the desk, and fixed bodies (band, sentinels, rock) never move. The result is still a pure function of t, so freezing
 * a frame, seeking and the 90 s loop seam all keep working.
 */
export function createCollider(items, rects = []) {
  items.forEach((it) => { it.bx = it.root.position.x; it.bz = it.root.position.z; it.x = it.bx; it.z = it.bz; });
  const shown = (o) => { for (let n = o; n; n = n.parent) if (n.visible === false) return false; return true; };
  let act = [];
  return {
    items,
    restore() { for (const it of items) { it.root.position.x = it.bx; it.root.position.z = it.bz; } },
    resolve() {
      for (const it of items) { it.bx = it.root.position.x; it.bz = it.root.position.z; it.x = it.bx; it.z = it.bz; }
      act = items.filter((it) => shown(it.root));
      for (let k = 0; k < 5; k++) {
        for (let i = 0; i < act.length; i++) for (let j = i + 1; j < act.length; j++) {
          const a = act[i], b = act[j]; if (a.fixed && b.fixed) continue;
          let dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz); const min = a.r + b.r; if (d >= min) continue;
          if (d < 1e-3) { dx = ((i + j) % 2 ? 1 : -1) * 0.01; dz = 0.004; d = Math.hypot(dx, dz); }
          const ov = min - d, nx = dx / d, nz = dz / d, wa = a.fixed ? 0 : b.fixed ? 1 : b.mass / (a.mass + b.mass), wb = b.fixed ? 0 : a.fixed ? 1 : a.mass / (a.mass + b.mass);
          a.x -= nx * ov * wa; a.z -= nz * ov * wa; b.x += nx * ov * wb; b.z += nz * ov * wb;
        }
        for (const it of act) if (!it.fixed) for (const q of rects) {
          const x0 = q.x0 - it.r, x1 = q.x1 + it.r, z0 = q.z0 - it.r, z1 = q.z1 + it.r; if (it.x <= x0 || it.x >= x1 || it.z <= z0 || it.z >= z1) continue;
          const w = q.x1 - q.x0, d = q.z1 - q.z0;
          if (Math.max(w, d) / Math.min(w, d) < 4) { // furniture: push radially from its centre, which is continuous as a body slides past
            const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hx = (x1 - x0) / 2, hz = (z1 - z0) / 2, dx = it.x - cx, dz = it.z - cz, sc = Math.max(Math.abs(dx) / hx, Math.abs(dz) / hz, 1e-6); it.x = cx + dx / sc; it.z = cz + dz / sc; continue; }
          const l = it.x - x0, r = x1 - it.x, f = it.z - z0, bk = z1 - it.z, m = Math.min(l, r, f, bk);
          if (m === l) it.x = x0; else if (m === r) it.x = x1; else if (m === f) it.z = z0; else it.z = z1;
        }
      }
      for (const it of act) if (!it.fixed) { it.root.position.x = it.x; it.root.position.z = it.z; }
    },
    /** deepest overlap between any two active bodies (0 when nobody overlaps) */
    penetration() { let m = 0, who = ''; for (let i = 0; i < act.length; i++) for (let j = i + 1; j < act.length; j++) { const a = act[i], b = act[j]; if (a.fixed && b.fixed) continue; const ov = a.r + b.r - Math.hypot(a.root.position.x - b.root.position.x, a.root.position.z - b.root.position.z); if (ov > m) { m = ov; who = (a.name || i) + '/' + (b.name || j); } } return { m, who }; },
  };
}
