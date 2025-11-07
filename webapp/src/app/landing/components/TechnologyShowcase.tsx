'use client';

export default function TechnologyShowcase() {
  const techStack = [
    'PyTorch',
    'MediaPipe',
    'OpenCV',
    'Next.js',
    'Supabase',
    'TensorFlow'
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Built on Cutting-Edge AI
          </h2>
          <p className="text-xl text-gray-300">
            Advanced computer vision and deep learning technology
          </p>
        </div>

        {/* AI Pipeline Visualization */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 md:p-12 border border-white/10 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            {/* Input */}
            <div className="text-center">
              <div className="bg-blue-500/20 rounded-lg p-6 mb-3 border border-blue-500/30">
                <div className="text-sm font-semibold text-blue-300 mb-2">Input</div>
                <div className="text-xs text-gray-400">Camera Feed</div>
              </div>
            </div>

            <div className="hidden md:block text-center text-2xl text-gray-500">→</div>

            {/* Processing */}
            <div className="text-center">
              <div className="bg-purple-500/20 rounded-lg p-6 mb-3 border border-purple-500/30">
                <div className="text-sm font-semibold text-purple-300 mb-2">Detection</div>
                <div className="text-xs text-gray-400">68 Face Points</div>
              </div>
            </div>

            <div className="hidden md:block text-center text-2xl text-gray-500">→</div>

            {/* Analysis */}
            <div className="text-center">
              <div className="bg-green-500/20 rounded-lg p-6 mb-3 border border-green-500/30">
                <div className="text-sm font-semibold text-green-300 mb-2">Analysis</div>
                <div className="text-xs text-gray-400">Signal Fusion</div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg px-6 py-3">
              <div className="text-sm font-semibold mb-1">Attention Score</div>
              <div className="text-3xl font-bold">0 - 100</div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">68</div>
            <div className="text-sm text-gray-400">Facial Landmarks</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">3D</div>
            <div className="text-sm text-gray-400">Head Pose Estimation</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">&lt;50ms</div>
            <div className="text-sm text-gray-400">Processing Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">4+</div>
            <div className="text-sm text-gray-400">Signal Sources</div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-6 text-gray-300">Powered By</h3>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {techStack.map((tech, index) => (
              <div 
                key={index}
                className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20 hover:bg-white/20 transition-all"
              >
                <span className="font-semibold">{tech}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
