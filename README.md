# Hocket

**Collaborative, live, creative coding in the browser, built on ATProto**

Hocket is a fork of [Flok](https://codeberg.org/munshkr/flok) that extends collaborative live coding with decentralized federation capabilities. Create algorithmic music and visuals in real-time with your friends, and persist, share, remix your creative sketches on the ATProtocol network.

## What is Hocket?

Hocket builds on Flok's powerful real-time collaborative live coding platform, adding:

- 🌐 **Decentralized sketch persistence** via AT Protocol (Bluesky, Leaflet, Tangled, Custom PDS, it aims to be platform agnostic)
- 👥 **Social creative coding** - share, fork, and remix sketches across the network
- 🎨 **Multiple creative targets** - Strudel, Hydra and many more to come
- 🤝 **Real-time collaboration** - code together using WebRTC and WebSockets, standing in the shoulder of P2P giants
- 📦 **Modular architecture** - built on CodeMirror 6, Yjs, and modern web technologies

### What Makes Hocket Different Than Flok and others?

Hocket adds a **social layer** built on AT Protocol:

- **Persistent sketches** - Save your live coding sessions to your ATProto repository
- **Sketch ownership & attribution** - Track creators and contributors
- **Fork & remix** - Build on others' work while maintaining provenance
- **Cross-platform federation** - Your sketches live on decentralized infrastructure
- **Privacy controls** - Choose to keep sketches private or share publicly

__And all of these, without having to sign up with yet another account, on yet another platform.__

Hocket doesn't store your data, you authenticate with generated one time app passwords, and Hocket writes your sketch data to your PDS, so it belongs to you.

More social features coming soon: collaborative playlists, performance recordings, community curation, and cross-instance discovery.

## Features

### Creative Targets

Hocket supports multiple live coding environments:

- **[Strudel](https://strudel.cc/)** - Pattern-based music composition
- **[Hydra](https://hydra.ojack.xyz/)** - Live video synthesis

with many other options as supported by Flok.

### Collaboration Features

- **Real-time editing** - See your collaborators' cursors and edits instantly
- **Multiple editors** - Split your workspace into customizable panes
- **REPL integration** - View evaluation feedback and errors
- **Command palette** - Quick access to all editor commands
- **Flexible layouts** - Dynamically adjust your workspace

### Technical Architecture

Built with:

- [CodeMirror 6](https://codemirror.net/) - Modern code editor
- [Yjs](https://yjs.dev/) - CRDT-based collaboration
- [AT Protocol SDK](https://atproto.com/) - Decentralized social networking
- [Vite](https://vitejs.dev/) - Fast build tooling
- [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) - Modern UI components

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/berraknil/hocket.git
cd hocket

# Install dependencies
npm install

# Build all packages
npm run build
```

### Development

```bash
# Start the development server (web + server)
cd packages/web
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production Deployment

```bash
# Build for production
npm run build

# Start the production server
cd packages/web
npm start
```

Or use Docker:

```bash
docker build -t hocket .
docker run -p 3000:3000 hocket
```

### Configuration

The web server supports several options:

```bash
npm start -- --help

Options:
  -H, --host [HOST]       Server host (default: "0.0.0.0")
  -P, --port [PORT]       Server port (default: 3000)
  -s, --secure            Serve on https (use SSL)
  --ssl-cert [PATH]       Path to SSL certificate file
  --ssl-key [PATH]        Path to SSL key file
```

## Using Hocket

### Creating a Session

1. Visit the Hocket web interface
2. Create a new session or join an existing one with an invite link
3. Choose your creative target (Strudel, Hydra, etc.)
4. Start live coding!

### Saving to AT Protocol

1. Configure your AT Protocol credentials in settings
2. Click "Save Sketch" to persist to your Bluesky/ATProto repository (it is also autosaved)
3. Your sketch is now stored permanently, until you decide to delete it, and can be shared/forked anytime

### Collaborating

Share your session URL with collaborators.  They'll join your workspace and see your code in real-time.  All edits are synchronized using operational transformation (Yjs).

## Architecture

Hocket follows a distributed architecture:

```
┌─────────────┐
│   Browser   │  ← WebRTC P2P or WebSocket
│  (Editors)  │
└──────┬──────┘
       │
┌──────▼──────────────┐
│  Signaling Server   │  ← Session coordination
│   (WebSocket/HTTP)  │
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│   AT Protocol PDS   │  ← Sketch persistence
│   (Decentralized)   │
└─────────────────────┘
```

- **Client-side**: CodeMirror editors with Yjs bindings
- **Signaling**: Node.js WebSocket server for session coordination
- **Persistence**: AT Protocol repositories for sketch storage
- **Federation**: Cross-PDS discovery and sharing (coming soon)

## Roadmap

### Short-term

- [ ] Improved sketch discovery UI
- [ ] Public sketch gallery
- [ ] Better mobile support
- [ ] Performance optimizations
- [ ] Comprehensive documentation

### Medium-term

- [ ] Collaborative sketch playlists
- [ ] Live performance recording/playback
- [ ] Community curation tools
- [ ] Comments and reactions on sketches
- [ ] Search and filtering

### Long-term

- [ ] Cross-instance sketch federation
- [ ] Encrypted private collaboration
- [ ] Version control integration
- [ ] Plugin system for new targets
- [ ] Educational resources and tutorials

## Contributing

Hocket is open source and welcomes contributions! Areas where help is needed:

- **Documentation** - Tutorials, API docs, examples
- **Creative targets** - Integration with new live coding environments
- **UI/UX** - Design improvements and accessibility
- **Testing** - Unit tests, integration tests, E2E tests
- **Federation** - Protocol design for cross-instance features

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Credits

Hocket is built on the shoulders of giants:

- **[Flok](https://codeberg.org/munshkr/flok)** by [Damián Silvani](https://github.com/munshkr) - The original collaborative live coding platform
- **[Strudel](https://strudel.cc/)** - Pattern-based music composition
- **[Hydra](https://hydra.ojack.xyz/)** - Live video synthesis by Olivia Jack
- **[TidalCycles](https://tidalcycles.org/)** - Pattern language inspiration
- **[AT Protocol](https://atproto.com/)** - Decentralized social infrastructure by Bluesky

## License

Hocket is licensed under the GNU General Public License v3.0 or later (GPL-3.0+).

This ensures that Hocket and all derivative works remain free and open source software, contributing to the digital commons.

See [LICENSE. txt](LICENSE.txt) for full details.

## Community

- **Issues**: [GitHub Issues](https://github.com/berraknil/hocket/issues)
- **Discussions**: [GitHub Discussions](https://github.com/berraknil/hocket/discussions)
- **Original Flok**: [Codeberg](https://codeberg.org/munshkr/flok)

## Support This Project

Hocket is developed as a public good and made freely available to everyone. If you'd like to support its development:

- ⭐ Star this repository
- 🐛 Report bugs and suggest features
- 🔧 Contribute code or documentation
- 💬 Share your creations with the community

---

**Built with ❤️ for the live coding community**
