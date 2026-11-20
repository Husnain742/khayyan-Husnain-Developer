const COLORS = ['#8b5e75', '#b8924a', '#572b4c', '#a57a90', '#2f7d5b'];

/** Smooth line chart (Catmull-Rom -> Bezier). data: [{label, count}] */
export function LineChart({ data, height = 230 }) {
  const W = 640, H = height, L = 44, R = 16, T = 16, B = 32;
  if (!data?.length) return <p className="text-sm text-muted py-10 text-center">Abhi data mojood nahi.</p>;

  const max = Math.max(1, ...data.map((d) => d.count));
  const niceMax = Math.ceil(max / 4) * 4 || 4;
  const x = (i) => (data.length === 1 ? (W + L - R) / 2 : L + (i * (W - L - R)) / (data.length - 1));
  const y = (v) => T + (1 - v / niceMax) * (H - T - B);
  const pts = data.map((d, i) => [x(i), y(d.count)]);

  let path = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    path += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  const ticks = [0, 1, 2, 3, 4].map((t) => (niceMax / 4) * t);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Saal ba saal records ka chart">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e4d9d3" strokeDasharray="3 4" />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#6b5b63">{t}</text>
        </g>
      ))}
      <path d={`${path} L ${pts.at(-1)[0]} ${y(0)} L ${pts[0][0]} ${y(0)} Z`} fill="#8b5e75" opacity="0.1" />
      <path d={path} fill="none" stroke="#8b5e75" strokeWidth="3" strokeLinecap="round" />
      {pts.map(([px, py], i) => (
        <g key={data[i].label}>
          <circle cx={px} cy={py} r="4.5" fill="#8b5e75" stroke="#faf6f3" strokeWidth="2"><title>{`${data[i].label}: ${data[i].count}`}</title></circle>
          <text x={px} y={H - 10} textAnchor="middle" fontSize="11" fill="#6b5b63">{data[i].label}</text>
        </g>
      ))}
    </svg>
  );
}

/** Donut chart with legend. data: [{label, count}] */
export function Donut({ data }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return <p className="text-sm text-muted py-10 text-center">Abhi data mojood nahi.</p>;
  const r = 54, C = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 140 140" className="w-40 h-40 shrink-0 -rotate-90" role="img" aria-label="Wand ke hisaab se records">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#ece3de" strokeWidth="20" />
        {data.map((d, i) => {
          const len = (d.count / total) * C;
          const el = (
            <circle key={d.label} cx="70" cy="70" r={r} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="20"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset}><title>{`${d.label}: ${d.count}`}</title></circle>
          );
          offset += len;
          return el;
        })}
        <text x="70" y="70" textAnchor="middle" dominantBaseline="central" style={{ transform: 'rotate(90deg)', transformOrigin: '70px 70px' }} fontSize="26" fontWeight="700" fill="#2a1424">{total}</text>
      </svg>
      <ul className="w-full space-y-2.5 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="flex-1 font-medium truncate">{d.label}</span>
            <span className="font-bold tabular-nums">{d.count}</span>
            <span className="text-muted w-10 text-right tabular-nums">{Math.round((d.count / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
