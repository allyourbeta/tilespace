import { Folder, Briefcase, Gamepad2, ShoppingCart, BookOpen, Music } from 'lucide-react';

const mockTiles = [
  { title: 'Work', icon: Briefcase, color: '#0891b2', links: 12 },
  { title: 'Projects', icon: Folder, color: '#16a34a', links: 8 },
  { title: 'Gaming', icon: Gamepad2, color: '#dc2626', links: 5 },
  { title: 'Shopping', icon: ShoppingCart, color: '#d97706', links: 3 },
  { title: 'Learning', icon: BookOpen, color: '#2563eb', links: 15 },
  { title: 'Music', icon: Music, color: '#7c3aed', links: 7 },
];

function LeftBorderCard({ title, icon: Icon, color, links }: typeof mockTiles[0]) {
  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden flex"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="p-4 flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{links} links</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopStripCard({ title, icon: Icon, color, links }: typeof mockTiles[0]) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
      <div className="h-2" style={{ backgroundColor: color }} />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{links} links</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColoredIconCard({ title, icon: Icon, color, links }: typeof mockTiles[0]) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-4">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{links} links</p>
        </div>
      </div>
    </div>
  );
}

function GridLeftBorder() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {mockTiles.map((tile) => (
        <LeftBorderCard key={tile.title} {...tile} />
      ))}
    </div>
  );
}

function GridTopStrip() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {mockTiles.map((tile) => (
        <TopStripCard key={tile.title} {...tile} />
      ))}
    </div>
  );
}

function GridColoredIcon() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {mockTiles.map((tile) => (
        <ColoredIconCard key={tile.title} {...tile} />
      ))}
    </div>
  );
}

function FullScreenLeftBorder() {
  return (
    <div className="h-full grid grid-cols-3 grid-rows-2 gap-1">
      {mockTiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div
            key={tile.title}
            className="bg-white hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center relative"
            style={{ borderLeft: `6px solid ${tile.color}` }}
          >
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: `${tile.color}12` }}
              >
                <Icon className="w-8 h-8" style={{ color: tile.color }} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">{tile.title}</h3>
              <span className="text-sm text-gray-500">{tile.links} links</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FullScreenTopStrip() {
  return (
    <div className="h-full grid grid-cols-3 grid-rows-2 gap-1">
      {mockTiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div
            key={tile.title}
            className="bg-white hover:bg-gray-50 transition-colors cursor-pointer flex flex-col relative"
          >
            <div className="h-2" style={{ backgroundColor: tile.color }} />
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `${tile.color}12` }}
                >
                  <Icon className="w-8 h-8" style={{ color: tile.color }} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">{tile.title}</h3>
                <span className="text-sm text-gray-500">{tile.links} links</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FullScreenColoredIcon() {
  return (
    <div className="h-full grid grid-cols-3 grid-rows-2 gap-1 bg-gray-100">
      {mockTiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div
            key={tile.title}
            className="bg-white hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center shadow-sm"
          >
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
                style={{ backgroundColor: tile.color }}
              >
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">{tile.title}</h3>
              <span className="text-sm text-gray-500">{tile.links} links</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface StyleMockupsProps {
  onClose: () => void;
}

export function StyleMockups({ onClose }: StyleMockupsProps) {
  return (
    <div className="fixed inset-0 bg-gray-900/80 z-50 overflow-auto">
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Trello-Style Mockups</h1>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Close Mockups
            </button>
          </div>

          <div className="space-y-16">
            <section>
              <h2 className="text-xl font-semibold text-white mb-2">Option A: Left Border (Spine)</h2>
              <p className="text-gray-400 mb-4">Color accent on the left edge, like a book spine</p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Card View</h3>
                  <div className="bg-stone-100 rounded-xl p-6">
                    <GridLeftBorder />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Full Screen Grid</h3>
                  <div className="bg-stone-100 rounded-xl overflow-hidden" style={{ height: '400px' }}>
                    <FullScreenLeftBorder />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-2">Option B: Top Strip</h2>
              <p className="text-gray-400 mb-4">Thin colored bar at the top, like Trello labels</p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Card View</h3>
                  <div className="bg-stone-100 rounded-xl p-6">
                    <GridTopStrip />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Full Screen Grid</h3>
                  <div className="bg-stone-100 rounded-xl overflow-hidden" style={{ height: '400px' }}>
                    <FullScreenTopStrip />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-2">Option C: Colored Icon Only</h2>
              <p className="text-gray-400 mb-4">Icon carries all the color, card stays neutral</p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Card View</h3>
                  <div className="bg-stone-100 rounded-xl p-6">
                    <GridColoredIcon />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Full Screen Grid</h3>
                  <div className="bg-stone-100 rounded-xl overflow-hidden" style={{ height: '400px' }}>
                    <FullScreenColoredIcon />
                  </div>
                </div>
              </div>
            </section>

            <section className="pb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Comparison</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2 text-center">Left Border</h3>
                  <div className="bg-stone-100 rounded-xl p-4">
                    <LeftBorderCard {...mockTiles[0]} />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2 text-center">Top Strip</h3>
                  <div className="bg-stone-100 rounded-xl p-4">
                    <TopStripCard {...mockTiles[0]} />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2 text-center">Colored Icon</h3>
                  <div className="bg-stone-100 rounded-xl p-4">
                    <ColoredIconCard {...mockTiles[0]} />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
