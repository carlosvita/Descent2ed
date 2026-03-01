import { useState, useRef, useCallback, useEffect } from "react";
import "./app.css";

/* ─── Image path (local, relative to index.html) ─── */
const imgUrl = (folder, file) => `./tiles/${folder}/${file}`;

/* ─── Tile data per expansion ─── */
function numbered(prefix, folder, start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => {
    const n = String(start + i);
    return [
      { id: `${prefix}-${n}a`, file: `${prefix}-${n}a.png`, label: `${n}A` },
      { id: `${prefix}-${n}b`, file: `${prefix}-${n}b.png`, label: `${n}B` },
    ];
  }).flat();
}

function special(prefix, list) {
  return list.map(([file, label]) => ({
    id: `${prefix}-${file}`, file: `${prefix}-${file}.png`, label,
  }));
}

const EXPANSIONS = [
  {
    id: "bg", name: "Base Game", folder: "base-game",
    tiles: [
      ...numbered("bg", "base-game", 1, 30).map(t => ({
        ...t,
        file: t.file.replace(/^bg-(\d)/, "bg-0$1"),
        id: t.id.replace(/^bg-(\d)/, "bg-0$1"),
      })),
      ...special("bg", [
        ["end-cap-indoor", "End Cap Indoor"],
        ["end-cap-outdoor", "End Cap Outdoor"],
        ["entrance-indoor", "Entrance Indoor"],
        ["entrance-outdoor", "Entrance Outdoor"],
        ["exit-indoor", "Exit Indoor"],
        ["exit-outdoor", "Exit Outdoor"],
        ["extension-indoor", "Extension Indoor"],
        ["extension-outdoor", "Extension Outdoor"],
        ["transition-outdoor-indoor", "Transition"],
      ]),
    ],
  },
  {
    id: "lw", name: "Lair of the Wyrm", folder: "lair-of-the-wyrm",
    tiles: [
      ...numbered("lw", "lair-of-the-wyrm", 31, 35),
      ...special("lw", [["s1a", "S1A"], ["s1b", "S1B"]]),
    ],
  },
  {
    id: "lr", name: "Labyrinth of Ruin", folder: "labyrinth-of-ruin",
    tiles: numbered("lr", "labyrinth-of-ruin", 36, 43),
  },
  {
    id: "tf", name: "The Trollfens", folder: "the-trollfens",
    tiles: [
      ...numbered("tf", "the-trollfens", 44, 49),
      ...special("tf", [["s2a", "S2A"], ["s2b", "S2B"]]),
    ],
  },
  {
    id: "sn", name: "Shadow of Nerekhall", folder: "shadow-of-nerekhall",
    tiles: [
      ...numbered("sn", "shadow-of-nerekhall", 50, 69),
      ...special("sn", [
        ["end-cap-indoor", "End Cap Indoor"],
        ["end-cap-outdoor", "End Cap Outdoor"],
        ["entrance", "Entrance"],
        ["exit", "Exit"],
        ["extension-indoor-a", "Ext Indoor A"],
        ["extension-indoor-b", "Ext Indoor B"],
        ["extension-outdoor-a", "Ext Outdoor A"],
        ["extension-outdoor-b", "Ext Outdoor B"],
        ["transition-a", "Transition A"],
        ["transition-b", "Transition B"],
      ]),
    ],
  },
  {
    id: "mr", name: "Manor of Ravens", folder: "manor-of-ravens",
    tiles: numbered("mr", "manor-of-ravens", 70, 77),
  },
  {
    id: "mb", name: "Mists of Bilehall", folder: "mists-of-bilehall",
    tiles: [
      ...numbered("mb", "mists-of-bilehall", 78, 87),
      ...special("mb", [
        ["entrance-indoor", "Entrance Indoor"],
        ["entrance-outdoor", "Entrance Outdoor"],
      ]),
    ],
  },
  {
    id: "cr", name: "The Chains that Rust", folder: "the-chains-that-rust",
    tiles: [78, 79, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98].flatMap(n => [
      { id: `cr-${n}a`, file: `cr-${n}a.png`, label: `${n}A` },
      { id: `cr-${n}b`, file: `cr-${n}b.png`, label: `${n}B` },
    ]),
  },
];

/* ─── Fix base-game numbered padding ─── */
EXPANSIONS[0].tiles = EXPANSIONS[0].tiles.map(t => {
  const m = t.file.match(/^bg-0*(\d+)(a|b)\.png$/);
  if (m) {
    const padded = m[1].padStart(2, "0");
    return { ...t, file: `bg-${padded}${m[2]}.png`, id: `bg-${padded}${m[2]}` };
  }
  return t;
});

/* ─── Image component with loading state ─── */
function Img({ folder, file, alt, className, style, onLoad: onLoadProp }) {
  const [ok, setOk] = useState(false);
  const [fail, setFail] = useState(false);
  const url = imgUrl(folder, file);

  if (fail) {
    return (
      <div className="img-fail" style={style}>
        <span>{alt}</span>
      </div>
    );
  }

  return (
    <>
      {!ok && (
        <div className="img-loading" style={style}>
          <div className="spinner" />
        </div>
      )}
      <img
        src={url}
        alt={alt}
        loading="lazy"
        draggable={false}
        className={className}
        onLoad={() => {
          setOk(true);
          onLoadProp?.();
        }}
        onError={() => setFail(true)}
        style={{ ...style, display: ok ? (style?.display || "block") : "none" }}
      />
    </>
  );
}

/* ─── Sidebar tile thumbnail ─── */
function TileThumb({ exp, tile, onAdd }) {
  return (
    <button className="tile-thumb" onClick={() => onAdd(exp, tile)} title={`Add ${tile.label}`}>
      <Img folder={exp.folder} file={tile.file} alt={tile.label} className="tile-thumb-img" />
      <span className="tile-thumb-label">{tile.label}</span>
    </button>
  );
}

/* ─── Canvas placed tile ─── */
function CanvasTile({ tile, isSel, onSel, onMov, zoom }) {
  const [drag, setDrag] = useState(false);
  const off = useRef({ x: 0, y: 0 });

  const handleDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSel(tile.uid);
    setDrag(true);
    const r = document.getElementById("canvas-inner").getBoundingClientRect();
    off.current = {
      x: (e.clientX - r.left) / zoom - tile.x,
      y: (e.clientY - r.top) / zoom - tile.y,
    };
  };

  useEffect(() => {
    if (!drag) return;
    const mm = (e) => {
      const r = document.getElementById("canvas-inner")?.getBoundingClientRect();
      if (!r) return;
      onMov(tile.uid, (e.clientX - r.left) / zoom - off.current.x, (e.clientY - r.top) / zoom - off.current.y);
    };
    const mu = () => setDrag(false);
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
    };
  }, [drag, zoom, tile.uid, onMov]);

  return (
    <div
      className={`canvas-tile${isSel ? " selected" : ""}${drag ? " dragging" : ""}`}
      onMouseDown={handleDown}
      style={{
        left: tile.x,
        top: tile.y,
        transform: `rotate(${tile.rot}deg)${tile.flip ? " scaleX(-1)" : ""}`,
        zIndex: isSel ? 9999 : tile.z,
      }}
    >
      <Img folder={tile.folder} file={tile.file} alt={tile.label} className="canvas-tile-img" />
    </div>
  );
}

/* ─── Toolbar button ─── */
function Btn({ children, onClick, title, danger, active, className }) {
  return (
    <button
      className={`tool-btn${danger ? " danger" : ""}${active ? " active" : ""} ${className || ""}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

/* ─── Main App ─── */
export default function App() {
  const [tiles, setTiles] = useState([]);
  const [sel, setSel] = useState(null);
  const [query, setQuery] = useState("");
  const [openExp, setOpenExp] = useState("bg");
  const [zoom, setZoom] = useState(0.45);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const panRef = useRef({});
  const canvasRef = useRef(null);
  const uidRef = useRef(0);
  const [showHelp, setShowHelp] = useState(false);
  const [snap, setSnap] = useState(false);
  const [status] = useState("Local tiles");
  const [sideCollapsed, setSideCollapsed] = useState(false);

  /* Add tile */
  const addTile = useCallback((exp, tile) => {
    const id = `t${uidRef.current++}`;
    const cx = (-pan.x + window.innerWidth / 2 - (sideCollapsed ? 20 : 136)) / zoom;
    const cy = (-pan.y + window.innerHeight / 2) / zoom;
    setTiles(p => [...p, {
      uid: id, folder: exp.folder, file: tile.file, label: tile.label,
      x: cx + (Math.random() - 0.5) * 50,
      y: cy + (Math.random() - 0.5) * 50,
      rot: 0, flip: false, z: p.length,
    }]);
    setSel(id);
  }, [zoom, pan, sideCollapsed]);

  /* Tile actions */
  const moveTile = useCallback((id, x, y) => {
    const sx = snap ? Math.round(x / 16) * 16 : x;
    const sy = snap ? Math.round(y / 16) * 16 : y;
    setTiles(p => p.map(t => t.uid === id ? { ...t, x: sx, y: sy } : t));
  }, [snap]);

  const rotateTile = useCallback((id, d) =>
    setTiles(p => p.map(t => t.uid === id ? { ...t, rot: (t.rot + d + 360) % 360 } : t)), []);

  const flipTile = useCallback((id) =>
    setTiles(p => p.map(t => t.uid === id ? { ...t, flip: !t.flip } : t)), []);

  const deleteTile = useCallback((id) => {
    setTiles(p => p.filter(t => t.uid !== id));
    setSel(s => s === id ? null : s);
  }, []);

  const bringFront = useCallback((id) =>
    setTiles(p => { const m = Math.max(...p.map(t => t.z)); return p.map(t => t.uid === id ? { ...t, z: m + 1 } : t); }), []);

  const sendBack = useCallback((id) =>
    setTiles(p => { const m = Math.min(...p.map(t => t.z)); return p.map(t => t.uid === id ? { ...t, z: m - 1 } : t); }), []);

  const duplicateTile = useCallback((id) =>
    setTiles(p => {
      const o = p.find(t => t.uid === id);
      if (!o) return p;
      const ni = `t${uidRef.current++}`;
      setSel(ni);
      return [...p, { ...o, uid: ni, x: o.x + 30, y: o.y + 30, z: p.length }];
    }), []);

  /* Keyboard shortcuts */
  useEffect(() => {
    const fn = (e) => {
      if (!sel) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      switch (e.key) {
        case "r": case "R": e.preventDefault(); rotateTile(sel, e.shiftKey ? -90 : 90); break;
        case "f": case "F": e.preventDefault(); flipTile(sel); break;
        case "Delete": case "Backspace": e.preventDefault(); deleteTile(sel); break;
        case "d": case "D": e.preventDefault(); duplicateTile(sel); break;
        case "Escape": setSel(null); break;
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [sel, rotateTile, flipTile, deleteTile, duplicateTile]);

  /* Pan */
  const startPan = (e) => {
    if (e.target === canvasRef.current || e.target.dataset.cv) {
      setSel(null);
      setPanning(true);
      panRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
    }
  };

  useEffect(() => {
    if (!panning) return;
    const mm = (e) => setPan({
      x: panRef.current.px + e.clientX - panRef.current.sx,
      y: panRef.current.py + e.clientY - panRef.current.sy,
    });
    const mu = () => setPanning(false);
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
    };
  }, [panning]);

  /* Zoom with wheel */
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const fn = (e) => {
      e.preventDefault();
      setZoom(z => Math.max(0.05, Math.min(4, z * (e.deltaY > 0 ? 0.9 : 1.1))));
    };
    el.addEventListener("wheel", fn, { passive: false });
    return () => el.removeEventListener("wheel", fn);
  }, []);

  /* Filter expansions by search */
  const filtered = EXPANSIONS.map(e => ({
    ...e,
    tiles: e.tiles.filter(t =>
      t.label.toLowerCase().includes(query.toLowerCase()) ||
      t.file.toLowerCase().includes(query.toLowerCase()) ||
      e.name.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter(e => e.tiles.length > 0);

  const selTile = tiles.find(t => t.uid === sel);

  return (
    <div className="app">
      {/* ─── SIDEBAR ─── */}
      <aside className={`sidebar${sideCollapsed ? " collapsed" : ""}`}>
        <div className="sidebar-header">
          <div>
            <h1 className="logo">⚔ DESCENT 2E</h1>
            <p className="subtitle">Map Builder</p>
          </div>
          <button className="collapse-btn" onClick={() => setSideCollapsed(!sideCollapsed)} title={sideCollapsed ? "Open panel" : "Close panel"}>
            {sideCollapsed ? "▸" : "◂"}
          </button>
        </div>

        {!sideCollapsed && (
          <>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search tiles... (1A, 23B, entrance)"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>

            <div className="tile-list">
              {filtered.map(exp => (
                <div key={exp.id} className="expansion">
                  <button
                    className={`exp-header${openExp === exp.id ? " open" : ""}`}
                    onClick={() => setOpenExp(openExp === exp.id ? null : exp.id)}
                  >
                    <span>{exp.name}</span>
                    <span className="exp-count">{exp.tiles.length} {openExp === exp.id ? "▾" : "▸"}</span>
                  </button>
                  {openExp === exp.id && (
                    <div className="tile-grid">
                      {exp.tiles.map(tile => (
                        <TileThumb key={tile.id} exp={exp} tile={tile} onAdd={addTile} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="sidebar-footer">
              <span>{tiles.length} tile{tiles.length !== 1 ? "s" : ""} · {status}</span>
              <div className="footer-btns">
                <button className="small-btn" onClick={() => setShowHelp(true)}>?</button>
                <button className="small-btn danger" onClick={() => { setTiles([]); setSel(null); }}>Clear</button>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* ─── CANVAS ─── */}
      <main
        ref={canvasRef}
        className={`canvas${panning ? " panning" : ""}`}
        data-cv="1"
        onMouseDown={startPan}
      >
        {/* Grid */}
        <div
          className="grid-bg"
          data-cv="1"
          style={{
            backgroundSize: `${50 * zoom}px ${50 * zoom}px`,
            backgroundPosition: `${pan.x % (50 * zoom)}px ${pan.y % (50 * zoom)}px`,
          }}
        />

        {/* Inner transform layer */}
        <div
          id="canvas-inner"
          data-cv="1"
          className="canvas-inner"
          style={{
            left: pan.x,
            top: pan.y,
            transform: `scale(${zoom})`,
          }}
        >
          {tiles.map(t => (
            <CanvasTile
              key={t.uid}
              tile={t}
              isSel={t.uid === sel}
              onSel={(id) => { setSel(id); bringFront(id); }}
              onMov={moveTile}
              zoom={zoom}
            />
          ))}
        </div>

        {/* Empty state */}
        {tiles.length === 0 && (
          <div className="empty-state" data-cv="1">
            <div className="empty-icon">🏰</div>
            <p className="empty-title">Your Dungeon Awaits</p>
            <p className="empty-sub">
              Select tiles from the panel to start building your custom map.
              <br />Click to add, drag to move, scroll to zoom.
            </p>
          </div>
        )}

        {/* Zoom bar */}
        <div className="zoom-bar">
          <Btn onClick={() => setSnap(!snap)} title="Snap to grid" active={snap}>⊞</Btn>
          <div className="spacer" />
          <Btn onClick={() => setZoom(z => Math.max(0.05, z * 0.75))}>−</Btn>
          <div className="zoom-display">{Math.round(zoom * 100)}%</div>
          <Btn onClick={() => setZoom(z => Math.min(4, z * 1.25))}>+</Btn>
          <Btn onClick={() => { setZoom(0.45); setPan({ x: 0, y: 0 }); }} title="Reset view">⟲</Btn>
        </div>

        {/* Tile controls bar */}
        {selTile && (
          <div className="tile-controls">
            <span className="tile-controls-label">{selTile.label}</span>
            <div className="sep" />
            <Btn onClick={() => rotateTile(sel, -90)} title="Rotate left (Shift+R)">↺ 90°</Btn>
            <Btn onClick={() => rotateTile(sel, 90)} title="Rotate right (R)">↻ 90°</Btn>
            <Btn onClick={() => flipTile(sel)} title="Flip (F)">⇔ Flip</Btn>
            <div className="sep" />
            <Btn onClick={() => bringFront(sel)} title="Bring front">▲</Btn>
            <Btn onClick={() => sendBack(sel)} title="Send back">▼</Btn>
            <div className="sep" />
            <Btn onClick={() => duplicateTile(sel)} title="Duplicate (D)">⧉</Btn>
            <Btn onClick={() => deleteTile(sel)} title="Delete (Del)" danger>✕</Btn>
          </div>
        )}

        {/* Help modal */}
        {showHelp && (
          <div className="modal-overlay" onClick={() => setShowHelp(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2 className="modal-title">⚔ Keyboard Shortcuts</h2>
              <div className="shortcuts">
                {[
                  ["Click sidebar tile", "Add to canvas"],
                  ["Drag tile", "Move"],
                  ["R / Shift+R", "Rotate 90° CW / CCW"],
                  ["F", "Flip horizontally"],
                  ["D", "Duplicate tile"],
                  ["Delete", "Remove tile"],
                  ["Scroll wheel", "Zoom in/out"],
                  ["Click + drag background", "Pan canvas"],
                  ["Escape", "Deselect"],
                ].map(([k, v]) => (
                  <div className="shortcut-row" key={k}>
                    <kbd>{k}</kbd>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
              <button className="modal-close" onClick={() => setShowHelp(false)}>Close</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
