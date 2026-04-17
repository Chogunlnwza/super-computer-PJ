from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import os
import pandas as pd
import io

app = FastAPI(title="Cyrus AI Distributed Cluster (Consensus Mode)")

# เปิด CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "weather_cluster.db"

# ==========================================
# 1. ฟังก์ชันจัดการ Database (อัปเกรด Schema)
# ==========================================
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # เพิ่ม columns สำหรับระบบ Consensus และ AI
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS grid_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            grid_x FLOAT,
            grid_y FLOAT,
            start_temp FLOAT,
            final_temp FLOAT,
            status TEXT DEFAULT 'pending',
            results_count INTEGER DEFAULT 0,  -- จำนวนเครื่องที่ส่งผลมาแล้ว
            sum_temp FLOAT DEFAULT 0.0,       -- ผลรวมอุณหภูมิเพื่อหาค่าเฉลี่ย
            region TEXT,
            last_worker TEXT,                 -- เก็บชื่อเครื่องล่าสุดที่ทำ
            ai_weight FLOAT DEFAULT 0.0,      -- 🎯 เก็บค่าน้ำหนัก AI
            ai_bias FLOAT DEFAULT 0.0         -- 🎯 เก็บค่าความเบี่ยงเบน AI
        )
    ''')   
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS workers (
            worker_id TEXT PRIMARY KEY,
            tasks_completed INTEGER DEFAULT 0
        )
    ''')
    
    conn.commit()
    conn.close()

init_db()

class WorkerRegister(BaseModel):
    worker_id: str

class TaskResult(BaseModel):
    task_id: int
    worker_id: str
    final_temp: float
    ai_weight: float = 0.0  # 🎯 รับค่าจาก Worker
    ai_bias: float = 0.0    # 🎯 รับค่าจาก Worker

# ==========================================
# 2. API จ่ายงาน (แบบกระจายซ้ำ - Redundancy)
# ==========================================

@app.get("/api/get-task")
def get_task():
    """จ่ายงานที่ยังไม่เสร็จ และยังถูกยืนยัน (Consensus) ไม่ครบ 2 เครื่อง"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  
    cursor = conn.cursor()
    
    # Logic: หางานที่สถานะไม่ใช่ 'completed' และมีเครื่องทำไม่ถึง 2 เครื่อง
    # เพื่อให้แน่ใจว่า 1 งานจะมีอย่างน้อย 2 เครื่องช่วยกันทำเพื่อเช็คความถูกต้อง
    cursor.execute('''
        SELECT * FROM grid_tasks 
        WHERE status != 'completed' 
        AND results_count < 2 
        ORDER BY results_count ASC, id ASC LIMIT 1
    ''')
    task = cursor.fetchone()
    
    if task:
        cursor.execute("UPDATE grid_tasks SET status = 'processing' WHERE id = ?", (task['id'],))
        conn.commit()
        conn.close()
        return {"has_task": True, "task": dict(task)}
    
    conn.close()
    return {"has_task": False, "message": "All Nodes Verified!"}

# ==========================================
# 3. API รับงาน (พร้อมอัลกอริทึม Consensus และ AI)
# ==========================================

@app.post("/api/submit-result")
def submit_result(data: TaskResult):
    """รับผลลัพธ์และใช้ระบบ Consensus เพื่อตัดสินใจยืนยันข้อมูล"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # 1. อัปเดตยอดรวม นับจำนวนเครื่อง และบันทึกค่า AI
    cursor.execute('''
        UPDATE grid_tasks 
        SET results_count = results_count + 1,
            sum_temp = sum_temp + ?,
            last_worker = ?,
            ai_weight = ?,
            ai_bias = ?
        WHERE id = ?
    ''', (data.final_temp, data.worker_id, data.ai_weight, data.ai_bias, data.task_id))
    
    # 2. ตรวจสอบเงื่อนไขฉันทามติ (ถ้าส่งมาครบ 2 เครื่องแล้ว)
    cursor.execute("SELECT results_count, sum_temp FROM grid_tasks WHERE id = ?", (data.task_id,))
    row = cursor.fetchone()
    
    if row[0] >= 2:
        # คำนวณค่าเฉลี่ยจากทุกเครื่องที่ช่วยกันทำ (Consensus Reached)
        final_consensus_temp = row[1] / row[0]
        cursor.execute('''
            UPDATE grid_tasks 
            SET status = 'completed', 
                final_temp = ? 
            WHERE id = ?
        ''', (final_consensus_temp, data.task_id))
    else:
        # ถ้ายังส่งไม่ครบ 2 เครื่อง ให้เปลี่ยนสถานะกลับเป็น pending เพื่อเปิดโอกาสให้เครื่องอื่นมารับงานไปซ้ำ
        cursor.execute("UPDATE grid_tasks SET status = 'pending' WHERE id = ?", (data.task_id,))

    # เพิ่มแต้มให้ Worker
    cursor.execute("INSERT OR IGNORE INTO workers (worker_id) VALUES (?)", (data.worker_id,))
    cursor.execute("UPDATE workers SET tasks_completed = tasks_completed + 1 WHERE worker_id = ?", (data.worker_id,))
    
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Partial result saved, awaiting consensus."}

# ==========================================
# 4. APIs อื่นๆ (Dashboard & Upload)
# ==========================================

@app.get("/api/dashboard")
def get_dashboard_data():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM grid_tasks")
    tasks = [dict(row) for row in cursor.fetchall()]
    cursor.execute("SELECT * FROM workers")
    workers = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    completed = sum(1 for t in tasks if t['status'] == 'completed')
    return {
        "progress_percent": (completed / len(tasks)) * 100 if tasks else 0,
        "total_workers": len(workers),
        "map_data": tasks,
        "worker_stats": workers
    }

@app.post("/api/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM grid_tasks')
    cursor.execute('DELETE FROM workers')
    for index, row in df.iterrows():
        cursor.execute('''
            INSERT INTO grid_tasks (grid_x, grid_y, start_temp, region, status, results_count, sum_temp, ai_weight, ai_bias)
            VALUES (?, ?, ?, ?, 'pending', 0, 0.0, 0.0, 0.0)
        ''', (row['lat'], row['lng'], row['temp'], row['region']))
    conn.commit()
    conn.close()
    return {"message": f"Successfully loaded {len(df)} locations. Consensus required: 2 nodes/point."}

@app.post("/api/register")
def register_worker(data: WorkerRegister):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO workers (worker_id) VALUES (?)", (data.worker_id,))
    conn.commit()
    conn.close()
    return {"message": "Registered"}

@app.post("/api/reset")
def reset_simulation():
    if os.path.exists(DB_FILE): os.remove(DB_FILE)
    init_db()
    return {"message": "System Purged and Re-initialized"}