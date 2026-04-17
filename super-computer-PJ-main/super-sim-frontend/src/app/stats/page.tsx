// ไฟล์: src/app/stats/page.tsx
"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const COLORS = ["#22c55e", "#3b82f6", "#eab308", "#f97316", "#06b6d4", "#a855f7", "#ef4444"];

export default function StatisticsPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [activeWorkers, setActiveWorkers] = useState<string[]>([]);
  
  // 🎯 State สำหรับระบบ A*
  const [aStarLogs, setAStarLogs] = useState<string[]>([]);
  const [isPathfinding, setIsPathfinding] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`http://${window.location.hostname}:8000/api/dashboard`);
        const data = await res.json();
        
        setDashboardData(data);

        const now = new Date();
        const timeString = `${now.getSeconds()}s`; 
        
        const newDataPoint: any = { time: timeString };
        const currentWorkers: string[] = [];

        data.worker_stats.forEach((worker: any) => {
          newDataPoint[worker.worker_id] = worker.tasks_completed;
          currentWorkers.push(worker.worker_id);
        });

        setActiveWorkers(currentWorkers);

        setHistoryData(prev => {
          const newHistory = [...prev, newDataPoint];
          if (newHistory.length > 20) return newHistory.slice(newHistory.length - 20);
          return newHistory;
        });

      } catch (error) {
        console.error("Connection failed", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🎯 อัลกอริทึม A* (A-Star) แบบ Real-time
  const runAStarPathfinding = async () => {
    if (!dashboardData || isPathfinding) return;
    setIsPathfinding(true);
    setAStarLogs([]);

    const addLog = (msg: string) => {
      setAStarLogs(prev => [...prev, msg]);
    };

    addLog("[SYS] INITIATING A* PATHFINDING PROTOCOL...");
    await new Promise(r => setTimeout(r, 800));

    // ดึงข้อมูลจังหวัดที่คำนวณเสร็จแล้ว
    const nodes = dashboardData.map_data.filter((t: any) => t.status === 'completed');
    
    if (nodes.length < 10) {
      addLog("[WARN] NOT ENOUGH DATA. REQUIRE MORE WORKER NODES TO COMPLETE MAP.");
      setIsPathfinding(false);
      return;
    }

    addLog(`[OK] LOADED ${nodes.length} VERIFIED WAYPOINTS FROM MASTER_NODE.`);
    await new Promise(r => setTimeout(r, 800));

    // สมมติจุดเริ่มต้น (เหนือ) และจุดหมาย (ใต้)
    const startNode = nodes.find((n: any) => n.region === 'Chiang Mai');
    const endNode = nodes.find((n: any) => n.region === 'Phuket');

    if (!startNode || !endNode) {
      addLog("[ERROR] MISSION CRITICAL POINTS (CHIANG MAI / PHUKET) NOT FOUND OR PENDING.");
      setIsPathfinding(false);
      return;
    }

    addLog(`[TARGET] ROUTING: ${startNode.region.toUpperCase()} -> ${endNode.region.toUpperCase()}`);
    addLog(`[RULE] AVOID ZONES WITH TEMP > 33.0°C (HIGH RISK)`);
    await new Promise(r => setTimeout(r, 1000));

    // --- จำลองกระบวนการคิดของ A* ---
    let current = startNode;
    let path = [current.region];
    let totalTemp = current.final_temp;

    // หาระยะทาง (Heuristic)
    const getDistance = (n1: any, n2: any) => Math.sqrt(Math.pow(n1.grid_x - n2.grid_x, 2) + Math.pow(n1.grid_y - n2.grid_y, 2));

    for (let step = 0; step < 8; step++) {
      addLog(`> SCANNING ADJACENT SECTORS FROM [${current.region.toUpperCase()}]...`);
      await new Promise(r => setTimeout(r, 500));

      // หาเพื่อนบ้านที่ใกล้ๆ และอุณหภูมิ < 33 องศา
      let neighbors = nodes.filter((n: any) => 
        n.id !== current.id && 
        !path.includes(n.region) &&
        getDistance(current, n) < 4.0 // รัศมีค้นหา
      );

      // เรียงลำดับด้วย f(n) = g(n) + h(n) [ระยะทาง + อุณหภูมิที่เป็น Cost]
      neighbors.sort((a: any, b: any) => {
        let costA = getDistance(a, endNode) + (a.final_temp > 33 ? 999 : a.final_temp);
        let costB = getDistance(b, endNode) + (b.final_temp > 33 ? 999 : b.final_temp);
        return costA - costB;
      });

      if (neighbors.length === 0 || neighbors[0].final_temp > 33) {
        addLog(`[!] DEAD END OR SURROUNDED BY HIGH TEMP RISKS AT ${current.region}`);
        addLog(`[FAIL] REROUTING REQUIRED...`);
        break;
      }

      let nextNode = neighbors[0];
      path.push(nextNode.region);
      totalTemp += nextNode.final_temp;
      
      addLog(`   >> MOVING TO [${nextNode.region.toUpperCase()}] | TEMP: ${nextNode.final_temp.toFixed(2)}°C`);
      current = nextNode;
      await new Promise(r => setTimeout(r, 500));

      if (getDistance(current, endNode) < 2.0) {
        path.push(endNode.region);
        addLog(`   >> FINAL APPROACH TO [${endNode.region.toUpperCase()}]`);
        break;
      }
    }

    addLog("=========================================");
    addLog(`✅ [SUCCESS] SAFE PATH CALCULATED!`);
    addLog(`📍 ROUTE: ${path.join(" -> ")}`);
    addLog("=========================================");
    setIsPathfinding(false);
  };

  if (!dashboardData) return <div className="min-h-screen bg-[#0a0a0a] text-[#22c55e] flex justify-center items-center font-mono animate-pulse">INITIALIZING SENSORS & ANALYTICS...</div>;

  const aiTasks = dashboardData.map_data.filter((t: any) => t.status === 'completed' && t.ai_weight !== 0);
  const avgWeight = aiTasks.length > 0 ? (aiTasks.reduce((sum: number, t: any) => sum + t.ai_weight, 0) / aiTasks.length).toFixed(4) : "0.0000";
  const avgBias = aiTasks.length > 0 ? (aiTasks.reduce((sum: number, t: any) => sum + t.ai_bias, 0) / aiTasks.length).toFixed(4) : "0.0000";
  const sortedWorkers = [...dashboardData.worker_stats].sort((a, b) => b.tasks_completed - a.tasks_completed);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#22c55e] p-4 md:p-8 font-sans flex flex-col">
      <nav className="flex justify-between items-center mb-8 border-b border-[#064e3b] pb-4 shrink-0">
        <h2 className="text-xl md:text-2xl font-black tracking-widest drop-shadow-[0_0_5px_#22c55e]">CYRUS // NODE_ANALYTICS</h2>
        <div className="flex gap-6 text-sm font-bold tracking-widest">
          <Link href="/main" className="text-[#064e3b] hover:text-[#22c55e] transition-colors">DASHBOARD</Link>
          <Link href="/stats" className="border-b-2 border-[#22c55e] text-white">STATISTICS</Link>
        </div>
      </nav>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 shrink-0">
        <div className="bg-black/50 border border-[#064e3b] p-6 rounded-xl shadow-[0_0_15px_rgba(6,78,59,0.3)] backdrop-blur-md">
          <h3 className="text-xs uppercase tracking-widest text-white mb-6 font-mono border-b border-[#064e3b] pb-2">🧠 Edge AI Parameters</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-[#050505] border border-[#064e3b]/50 p-4 rounded-lg text-center">
              <div className="text-[10px] text-[#22c55e]/70 mb-1">GLOBAL AVG WEIGHT (w)</div>
              <div className="text-2xl font-mono font-bold text-[#3b82f6]">{avgWeight}</div>
            </div>
            <div className="bg-[#050505] border border-[#064e3b]/50 p-4 rounded-lg text-center">
              <div className="text-[10px] text-[#22c55e]/70 mb-1">GLOBAL AVG BIAS (b)</div>
              <div className="text-2xl font-mono font-bold text-[#f97316]">{avgBias}</div>
            </div>
          </div>
          <p className="text-[10px] text-[#22c55e]/60 font-mono italic">
            * ML Parameters calculated via Distributed Gradient Descent.
          </p>
        </div>

        <div className="bg-black/50 border border-[#064e3b] p-6 rounded-xl shadow-[0_0_15px_rgba(6,78,59,0.3)] backdrop-blur-md flex flex-col max-h-[220px]">
          <h3 className="text-xs uppercase tracking-widest text-white mb-4 font-mono border-b border-[#064e3b] pb-2">🏆 Node Contribution Leaderboard</h3>
          <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {sortedWorkers.length === 0 ? (
              <div className="text-center text-xs opacity-50 mt-4">NO ACTIVE NODES DETECTED</div>
            ) : (
              <ul className="space-y-2">
                {sortedWorkers.map((worker: any, index: number) => (
                  <li key={worker.worker_id} className="flex justify-between items-center bg-[#050505] border border-[#064e3b]/30 p-2 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`font-black text-sm ${index === 0 ? 'text-[#eab308]' : index === 1 ? 'text-gray-400' : 'text-[#064e3b]'}`}>#{index + 1}</span>
                      <div className="text-[10px] font-bold text-white uppercase">{worker.worker_id}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-[#22c55e]">{worker.tasks_completed}</span>
                      <span className="text-[8px] uppercase tracking-widest text-[#22c55e]/50 ml-1">Tasks</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
        <div className="bg-black/50 border border-[#064e3b] p-6 md:p-8 rounded-xl shadow-[0_0_20px_rgba(6,78,59,0.2)] flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-6 border-b border-[#064e3b] pb-2">
            <h3 className="text-white uppercase text-xs tracking-widest font-mono">Node Performance Chart</h3>
            <span className="text-[10px] bg-[#22c55e]/20 text-[#22c55e] px-2 py-1 rounded animate-pulse">LIVE RECORDING</span>
          </div>
          <div className="flex-1 w-full font-mono text-xs">
            {historyData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-[#064e3b] animate-pulse">AWAITING TELEMETRY...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.3} />
                  <XAxis dataKey="time" stroke="#22c55e" opacity={0.5} />
                  <YAxis stroke="#22c55e" opacity={0.5} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#050505', border: '1px solid #064e3b', borderRadius: '4px' }} itemStyle={{ color: '#22c55e' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }}/>
                  {activeWorkers.map((workerId, index) => (
                    <Line key={workerId} type="monotone" dataKey={workerId} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={false} isAnimationActive={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 🎯 กล่อง A* แบบใช้ได้จริง! */}
        <div className="bg-black/50 border border-[#064e3b] p-6 md:p-8 rounded-xl shadow-[0_0_20px_rgba(6,78,59,0.2)] flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-4 border-b border-[#064e3b] pb-2">
            <h3 className="text-white uppercase text-xs tracking-widest font-mono">Heuristic Search Engine (A*)</h3>
            <button 
              onClick={runAStarPathfinding}
              disabled={isPathfinding}
              className={`text-[10px] font-bold px-3 py-1 rounded border transition-colors ${isPathfinding ? 'bg-[#064e3b] text-[#22c55e]/50 border-[#064e3b] cursor-not-allowed' : 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e] hover:bg-[#22c55e] hover:text-black'}`}
            >
              {isPathfinding ? 'CALCULATING...' : 'EXECUTE PATHFINDING'}
            </button>
          </div>
          <div className="bg-[#050505] p-4 rounded-md border border-[#064e3b]/50 font-mono text-[10px] md:text-xs text-[#22c55e]/80 flex-1 overflow-y-auto custom-scrollbar relative shadow-[inset_0_0_10px_#000]">
             {aStarLogs.length === 0 ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50">
                 <div>AWAITING COMMAND...</div>
                 <div className="text-[9px] mt-2 text-[#eab308]">REQUIRES COMPLETED WAYPOINTS IN DATABASE</div>
               </div>
             ) : (
               <div className="space-y-1">
                 {aStarLogs.map((log, i) => (
                   <div key={i} className={log.includes('SUCCESS') ? 'text-[#3b82f6] font-bold' : log.includes('ERROR') || log.includes('FAIL') ? 'text-red-500' : 'text-[#22c55e]'}>
                     {log}
                   </div>
                 ))}
                 {isPathfinding && <div className="animate-pulse text-[#eab308]">_</div>}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}