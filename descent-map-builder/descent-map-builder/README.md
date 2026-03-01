# ⚔ Descent 2E — Map Builder

Interactive map builder for **Descent: Journeys in the Dark (2nd Edition)**. Select tiles by number and assemble custom dungeon layouts with drag & drop.

![Descent 2E Map Builder](https://img.shields.io/badge/Descent_2E-Map_Builder-d1ab52?style=for-the-badge)

## Features

- 🗺️ **All Expansions** — Base Game, Lair of the Wyrm, Labyrinth of Ruin, The Trollfens, Shadow of Nerekhall, Manor of Ravens, Mists of Bilehall, The Chains that Rust
- 🔍 **Search** tiles by number (1A, 23B, etc.) or name
- 🖱️ **Drag & Drop** tiles on an infinite canvas
- 🔄 **Rotate** (90° increments), **Flip**, **Duplicate** tiles
- 📐 **Snap to grid** for precise alignment
- 🔎 **Zoom & Pan** with scroll wheel and drag
- ⌨️ **Keyboard shortcuts** for fast editing

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `R` | Rotate 90° clockwise |
| `Shift+R` | Rotate 90° counter-clockwise |
| `F` | Flip horizontally |
| `D` | Duplicate tile |
| `Delete` | Remove selected tile |
| `Scroll` | Zoom in/out |
| `Esc` | Deselect |

## Publishing on GitHub Pages

This project is pre-built and ready to deploy. The `docs/` folder contains all the static files.

### Steps:

1. Push this entire repo to GitHub
2. Go to **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Choose branch: `main`, folder: `/docs`
5. Click **Save**
6. Your site will be live at `https://<username>.github.io/<repo-name>/`

### To develop locally:

```bash
npm install
npm run dev
```

### To rebuild:

```bash
npm run build
```

The output goes to `docs/` and is ready for GitHub Pages.

## Credits

- Tile images from [any2cards/d2e](https://github.com/any2cards/d2e)
- Descent: Journeys in the Dark (2nd Edition) is © Fantasy Flight Games

## License

MIT — Feel free to use, modify and share!
