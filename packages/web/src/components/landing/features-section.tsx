export function FeaturesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-light tracking-tight text-stone-900 sm:text-4xl">
            Code. Collaborate. Create.
          </h2>
          <p className="mt-4 text-lg text-stone-600">
            Everything you need for live coding performances and algorithmic music creation.
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Feature 1: Real-time Collaboration */}
            <div className="flex flex-col">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-100">
                  <svg className="w-6 h-6 text-stone-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium text-stone-900 mb-2">
                Real-time Collaboration
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Code together with others in shared sessions. See changes instantly
                and jam with musicians from anywhere in the world.
              </p>
            </div>

            {/* Feature 2: Audio + Visual Synthesis */}
            <div className="flex flex-col">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-100">
                  <svg className="w-6 h-6 text-stone-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium text-stone-900 mb-2">
                Audio + Visual Synthesis
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Combine Strudel's powerful audio patterns with Hydra's live video synthesis.
                Create immersive audiovisual performances.
              </p>
            </div>

            {/* Feature 3: No Installation Required */}
            <div className="flex flex-col">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-100">
                  <svg className="w-6 h-6 text-stone-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium text-stone-900 mb-2">
                No Installation Required
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Everything runs in your browser. Share a link and start performing.
                Perfect for workshops, live streams, and quick jams.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
