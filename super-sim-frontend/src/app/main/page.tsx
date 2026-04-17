// ไฟล์: src/app/main/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("./Map"), { ssr: false });

export default function MainDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [workerUrl, setWorkerUrl] = useState("");
  
  // 🎯 State สำหรับควบคุมแผนที่จากหน้าเว็บ
  const [mapRadius, setMapRadius] = useState(50000); 
  const [mapOpacity, setMapOpacity] = useState(0.4); 

  useEffect(() => {
    setWorkerUrl(`http://${window.location.hostname}:3000/worker`);
    
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`http://${window.location.hostname}:8000/api/dashboard`);
        const data = await res.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Connection failed", error);
      }
    };

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    if (confirm("⚠️ รีเซ็ตข้อมูลทั้งหมด?")) {
      await fetch(`http://${window.location.hostname}:8000/api/reset`, { method: "POST" });
    }
  };

  const handleFileUpload = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/upload-csv`, {
        method: "POST",
        body: formData,
      });
      const responseData = await res.json();
      if (res.ok) alert(`📥 ระบบแจ้งว่า: ${responseData.message}`); 
      else alert("❌ อัปโหลดไม่สำเร็จ");
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  const getMarkerColor = (status: string, temp: number | null) => {
    if (status === "pending") return "#6b7280"; 
    if (status === "processing") return "#eab308"; 
    const t = temp || 0;
    if (t < 25) return "#3b82f6"; 
    if (t < 28) return "#22c55e"; 
    if (t < 32) return "#f97316"; 
    return "#ef4444"; 
  };

  if (!dashboardData) return <div className="min-h-screen bg-[#0a0a0a] text-[#22c55e] flex justify-center items-center font-mono">CONNECTING TO CYRUS CORE...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#22c55e] p-4 md:p-8 font-sans">
      <nav className="flex justify-between items-center mb-8 border-b border-[#064e3b] pb-4">
        <h2 className="text-xl md:text-2xl font-black tracking-widest drop-shadow-[0_0_5px_#22c55e]">CYRUS // MASTER_NODE</h2>
        <div className="flex gap-6 text-sm font-bold tracking-widest">
          <Link href="/main" className="border-b-2 border-[#22c55e] text-white">DASHBOARD</Link>
          <Link href="/stats" className="text-[#064e3b] hover:text-[#22c55e] transition-colors">STATISTICS</Link>
          <button onClick={handleReset} className="text-red-500 hover:text-red-400">RESET</button>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* เลนซ้าย: แผงควบคุมทั้งหมด */}
        <div className="col-span-1 lg:col-span-4 space-y-6">
          
          {/* 1. แผงควบคุมแผนที่ */}
          <div className="bg-black/50 border border-[#064e3b] p-6 rounded-xl shadow-[0_0_15px_rgba(6,78,59,0.3)] backdrop-blur-md">
            <h3 className="text-xs uppercase tracking-widest text-[#22c55e]/70 mb-4 font-mono">Map Tuning Engine</h3>
            <div className="space-y-4">
              <div>
                <label className="flex justify-between text-xs font-mono text-[#22c55e] mb-1">
                  <span>Spread Radius:</span>
                  <span className="text-white">{(mapRadius / 1000).toFixed(0)} KM</span>
                </label>
                <input 
                  type="range" min="10000" max="150000" step="5000"
                  value={mapRadius} 
                  onChange={(e) => setMapRadius(Number(e.target.value))}
                  className="w-full accent-[#22c55e]"
                />
              </div>
              <div>
                <label className="flex justify-between text-xs font-mono text-[#22c55e] mb-1">
                  <span>Layer Opacity:</span>
                  <span className="text-white">{(mapOpacity * 100).toFixed(0)}%</span>
                </label>
                <input 
                  type="range" min="0.1" max="0.9" step="0.05"
                  value={mapOpacity} 
                  onChange={(e) => setMapOpacity(Number(e.target.value))}
                  className="w-full accent-[#22c55e]"
                />
              </div>
            </div>
          </div>

          {/* 2. อัปโหลด CSV */}
          <div className="bg-black/50 border border-[#064e3b] p-6 rounded-xl shadow-[0_0_15px_rgba(6,78,59,0.3)] backdrop-blur-md">
            <h3 className="text-xs uppercase tracking-widest text-[#22c55e]/70 mb-4 font-mono">Dataset Injector (.CSV)</h3>
            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-[#064e3b] border-dashed rounded-lg cursor-pointer hover:bg-[#064e3b]/30 transition-all">
              <span className="text-xs font-mono text-[#22c55e] opacity-80">CLICK TO UPLOAD GEODATA</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          {/* 3. 🎯 เอากลับมาแล้ว! QR Code สำหรับ Worker */}
          <div className="bg-black/50 border border-[#064e3b] p-6 rounded-xl shadow-[0_0_15px_rgba(6,78,59,0.3)] backdrop-blur-md">
            <h3 className="text-xs uppercase tracking-widest text-[#22c55e]/70 mb-4 font-mono">Worker Connection</h3>
            <div className="bg-white p-2 rounded-lg w-fit mx-auto shadow-[0_0_15px_#22c55e]">
              {workerUrl && <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(workerUrl)}`} alt="QR Code" />}
            </div>
            <p className="text-center mt-4 text-[10px] text-[#22c55e] font-mono opacity-60 break-all">{workerUrl}</p>
          </div>

          {/* 4. สถานะโปรเจกต์ */}
          <div className="bg-black/50 border border-[#064e3b] p-6 rounded-xl shadow-[0_0_15px_rgba(6,78,59,0.3)] backdrop-blur-md">
            <h3 className="text-xs uppercase tracking-widest text-[#22c55e]/70 mb-2 font-mono">Processing Status</h3>
            <div className="text-4xl font-black text-white mb-3 drop-shadow-[0_0_8px_#22c55e]">{dashboardData.progress_percent.toFixed(1)}%</div>
            <div className="w-full bg-[#111] h-2 rounded-full overflow-hidden border border-[#064e3b]">
               <div className="bg-[#22c55e] h-full transition-all duration-500 shadow-[0_0_10px_#22c55e]" style={{ width: `${dashboardData.progress_percent}%` }}></div>
            </div>
          </div>

        </div>

        {/* เลนขวา: แผนที่และตาราง */}
        <div className="col-span-1 lg:col-span-8 bg-black/50 border border-[#064e3b] p-4 md:p-6 rounded-xl shadow-[0_0_20px_rgba(6,78,59,0.2)] backdrop-blur-md flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-xs uppercase tracking-widest text-[#22c55e]/70 font-mono">Geospatial Map</h3>
             <span className="text-[10px] text-white font-mono bg-[#064e3b] px-2 py-1 rounded">ACTIVE NODES: {dashboardData.total_workers}</span>
          </div>
          
          <div className="w-full h-[450px] rounded-lg border border-[#064e3b] overflow-hidden relative z-0">
            <DynamicMap 
              mapData={dashboardData.map_data} 
              getMarkerColor={getMarkerColor} 
              radius={mapRadius} 
              opacity={mapOpacity} 
            />
          </div>

          <div className="mt-4 w-full overflow-hidden border border-[#064e3b]/50 rounded-lg bg-[#050505]">
            <table className="w-full text-[10px] font-mono text-left">
              <thead className="bg-[#064e3b]/20 text-[#22c55e]/70 uppercase tracking-tighter">
                <tr>
                  <th className="p-2 border-b border-[#064e3b]/50">Location</th>
                  <th className="p-2 border-b border-[#064e3b]/50 text-center">Consensus</th>
                  <th className="p-2 border-b border-[#064e3b]/50">AI Weight(w)</th>
                  <th className="p-2 border-b border-[#064e3b]/50">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#064e3b]/20">
                {dashboardData.map_data.filter((t: any) => t.results_count > 0).slice(-4).reverse().map((task: any) => (
                  <tr key={task.id} className="hover:bg-[#22c55e]/5">
                    <td className="p-2 font-bold text-white">{task.region}</td>
                    <td className="p-2 text-center text-[#eab308] font-bold">{task.results_count}/2</td>
                    <td className="p-2 text-[#22c55e]">{task.ai_weight ? task.ai_weight.toFixed(4) : '-'}</td>
                    <td className="p-2 italic text-[9px] opacity-80">
                      {task.status === 'completed' ? <span className="text-[#22c55e]">🟢 VERIFIED</span> : <span className="text-[#eab308]">🟡 PEER WAIT</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}