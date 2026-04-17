// ไฟล์: src/app/page.tsx
"use client";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white overflow-hidden relative font-sans">
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#064e3b]/40 via-[#0a0a0a] to-[#0a0a0a] animate-pulse"></div>
      
      {/* Main Content */}
      <div className="z-10 flex flex-col items-center">
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#22c55e] to-[#059669] mb-2 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">
          CYRUS
        </h1>
        <p className="text-[#22c55e]/70 text-lg md:text-2xl font-light tracking-[0.3em] mb-16 uppercase text-center">
          Web-Based Supercomputer Cluster
        </p>
        
        {/* Enter Button */}
        <a 
          href="/main" 
          className="group relative px-10 py-4 font-bold border border-[#22c55e] text-[#22c55e] rounded-sm hover:bg-[#22c55e] hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_40px_rgba(34,197,94,0.6)] uppercase tracking-widest overflow-hidden"
        >
          <span className="relative z-10">Initialize System</span>
          <div className="absolute inset-0 bg-[#22c55e] w-0 group-hover:w-full transition-all duration-500 ease-out z-0"></div>
        </a>
      </div>

      {/* Footer Text */}
      <div className="absolute bottom-5 text-[#22c55e]/30 text-xs font-mono tracking-widest">
        SYSTEM V_1.0.0 // AWAITING MASTER NODE
      </div>
    </div>
  );
}