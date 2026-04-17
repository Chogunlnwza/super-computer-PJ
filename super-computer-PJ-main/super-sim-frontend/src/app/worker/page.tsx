"use client";
import { useState, useEffect, useRef } from "react";

// ฟังก์ชันแกะรอยอุปกรณ์ (Device Detection)
const getDeviceName = () => {
  if (typeof window === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  
  if (/iPad|Macintosh.*(?=Mac OS X.*Mobile)/.test(ua)) return "iPad"; 
  if (/iPhone/.test(ua)) return "iPhone";
  if (/Android/.test(ua)) return "Android";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  return "Node";
};

export default function WorkerPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [workerName, setWorkerName] = useState("");
  
  const isWorkingRef = useRef(false);

  // 🎯 กำหนด IP เครื่อง Mac ของคุณ
  const MASTER_NODE_IP = "172.20.10.6"; 

  useEffect(() => {
    let savedId = localStorage.getItem("cyrus_worker_id");
    
    if (!savedId) {
      const device = getDeviceName();
      const randomHex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase();
      savedId = `${device}-${randomHex}`; 
      localStorage.setItem("cyrus_worker_id", savedId); 
    }
    
    setWorkerName(savedId);

    fetch(`http://${MASTER_NODE_IP}:8000/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ worker_id: savedId }),
    }).catch(err => console.error("Register failed", err));
  }, []);

  const addLog = (msg: string) => {
    setLogs((prev) => [msg, ...prev].slice(0, 8)); 
  };

  const processNextTask = async () => {
    if (!isWorkingRef.current) {
      addLog("🛑 หยุดการทำงานชั่วคราว...");
      return;
    }

    try {
      const res = await fetch(`http://${MASTER_NODE_IP}:8000/api/get-task`);
      const data = await res.json();

      if (!data.has_task) {
        addLog("✅ ซิมูเลชันเสร็จสิ้น! รอภารกิจใหม่...");
        setIsWorking(false);
        isWorkingRef.current = false;
        return;
      }

      const task = data.task;
      
      addLog(`[RECV] TARGET: ${task.region || 'Unknown'} | BASE: ${task.start_temp.toFixed(2)}°C`);
      addLog(`🧠 [AI] INITIATING ML TRAINING (GRADIENT DESCENT)...`);

      // 🎯 1. สร้าง Dataset จำลองย้อนหลัง 5 วันสำหรับเทรน AI
      const baseTemp = task.start_temp;
      const historicalData = [
        { day: 1, temp: baseTemp - 1.5 },
        { day: 2, temp: baseTemp - 0.8 },
        { day: 3, temp: baseTemp + 0.5 },
        { day: 4, temp: baseTemp + 0.1 },
        { day: 5, temp: baseTemp + 1.2 },
      ];

      // 🎯 2. พารามิเตอร์สำหรับ Machine Learning
      let weight = 0; // ความชัน (w)
      let bias = 0;   // จุดตัดแกน Y (b)
      const learningRate = 0.01;
      const epochs = 50000; // ให้ Worker รันเทรน AI 50,000 รอบ

      // 🎯 3. กระบวนการ Training Loop
      for (let epoch = 0; epoch < epochs; epoch++) {
        let totalErrorW = 0;
        let totalErrorB = 0;

        for (let i = 0; i < historicalData.length; i++) {
          const x = historicalData[i].day;
          const y = historicalData[i].temp;
          
          // ทำนายผลชั่วคราว
          const prediction = (weight * x) + bias;
          const error = y - prediction;

          // คำนวณหาทิศทางปรับค่า
          totalErrorW += -2 * x * error;
          totalErrorB += -2 * error;
        }

        // ปรับค่าน้ำหนักให้สมการฉลาดขึ้น
        weight -= (totalErrorW / historicalData.length) * learningRate;
        bias -= (totalErrorB / historicalData.length) * learningRate;

        // พักหายใจให้ CPU มือถือทุกๆ 5,000 รอบ ป้องกันเบราว์เซอร์ค้าง
        if (epoch % 5000 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50)); 
        }
      }

      // 🎯 4. นำสมการมาทำนายผลของวันที่ 6 (พรุ่งนี้)
      const predictedTemp = (weight * 6) + bias;

      addLog(`[AI] MODEL OPTIMIZED | W: ${weight.toFixed(3)}, B: ${bias.toFixed(3)}`);

      // 🎯 5. ส่งผลการทำนายและค่าน้ำหนัก AI กลับไปที่ Master Node
      await fetch(`http://${MASTER_NODE_IP}:8000/api/submit-result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          task_id: task.id, 
          worker_id: workerName, 
          final_temp: predictedTemp,
          ai_weight: weight,
          ai_bias: bias
        }),
      });

      addLog(`[DONE] PREDICTED TEMP: ${predictedTemp.toFixed(2)}°C`);

      setTimeout(processNextTask, 1500);

    } catch (error) {
      addLog("⚠️ สัญญาณขัดข้อง กำลังเชื่อมต่อ Master Node ใหม่...");
      setTimeout(processNextTask, 3000); 
    }
  };

  const toggleWork = () => {
    if (isWorking) {
      setIsWorking(false);
      isWorkingRef.current = false;
    } else {
      setIsWorking(true);
      isWorkingRef.current = true;
      addLog(`🚀 [${workerName}] INITIATING CONNECTION...`);
      processNextTask();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#22c55e] p-6 font-sans flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#064e3b]/20 via-[#0a0a0a] to-[#0a0a0a]"></div>

      <div className="z-10 w-full max-w-md bg-black/50 border border-[#064e3b] p-6 rounded-2xl shadow-[0_0_20px_rgba(6,78,59,0.3)] backdrop-blur-md">
        <h2 className="text-center text-xl font-black tracking-widest text-[#22c55e] mb-1 drop-shadow-[0_0_5px_#22c55e]">
          CYRUS // WORKER_NODE <span className="text-[10px] text-white">v4.0 (AI)</span>
        </h2>
        <p className="text-center text-xs font-mono text-[#22c55e]/60 mb-6 uppercase">
          Identity: <span className="text-white font-bold">{workerName}</span>
        </p>
        
        <button 
          onClick={toggleWork} 
          className={`w-full py-4 text-sm font-bold uppercase tracking-widest rounded-lg transition-all duration-300 border ${
            isWorking 
              ? "bg-[#064e3b] text-[#22c55e] border-[#064e3b] shadow-[inset_0_0_10px_#000]" 
              : "bg-transparent text-[#22c55e] border-[#22c55e] hover:bg-[#22c55e] hover:text-black shadow-[0_0_15px_rgba(34,197,94,0.2)]"
          }`}
        >
          {isWorking ? "⏸️ SUSPEND AI TRAINING" : "▶️ INITIALIZE AI ENGINE"}
        </button>
      </div>

      <div className="z-10 w-full max-w-md mt-6 bg-[#050505] border border-[#064e3b]/50 p-4 rounded-xl shadow-inner h-64 overflow-hidden flex flex-col relative">
        <h3 className="text-[10px] uppercase font-mono text-[#22c55e]/50 border-b border-[#064e3b]/50 pb-2 mb-2">
          Terminal Console Output
        </h3>
        <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1">
          {logs.length === 0 ? (
            <div className="text-[#22c55e]/30 animate-pulse">AWAITING MASTER NODE DIRECTIVES...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="opacity-90">
                <span className="text-[#064e3b] mr-2">{">"}</span>{log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}