# 🌩️ Supercomputer Weather Prediction System

โปรเจคนี้เป็นการจำลองระบบ **Distributed Supercomputer** สำหรับพยากรณ์อากาศ
โดยใช้หลายเครื่อง (Worker Nodes) มาช่วยกันคำนวณ และส่งผลลัพธ์กลับมาแสดงบนเว็บ

---

## 🧠 แนวคิดของระบบ

ระบบนี้ทำงานแบบ **Distributed System**

```
User (Frontend)
      ↓
Backend (FastAPI - Master Node)
      ↓
Worker Nodes (Python)
      ↓
Result → แสดงบนหน้าเว็บ
```

* 🔹 Backend ทำหน้าที่เป็น **Master Node**
* 🔹 Worker ทำหน้าที่เป็น **Compute Node**
* 🔹 Frontend เป็น **User Interface**

---

## ⚙️ เทคโนโลยีที่ใช้

* Frontend: Next.js (React)
* Backend: FastAPI (Python)
* Worker: Python
* Communication: REST API

---

## 📦 โครงสร้างโปรเจค

```
super-computer-PJ-main/
│
├── super-sim-frontend/   # Next.js Frontend
├── super-sim-backend/    # FastAPI Backend

```

---

# 🚀 วิธีรันโปรเจค (Step-by-step)

## 🔹 1. Clone โปรเจค

```
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd super-computer-PJ-main
```

---

## 🔹 2. รัน Backend (FastAPI)

เปิด Terminal

```
cd super-sim-backend
```

### (สร้าง virtual environment ถ้ายังไม่มี)

```
python -m venv venv
```

### เปิดใช้งาน venv (Windows PowerShell)

```
.\venv\Scripts\Activate
```

### ติดตั้ง dependencies (สำคัญ)

```
pip install fastapi uvicorn pandas requests python-multipart
```

### รัน Backend

```
uvicorn main:app --reload
```

### ทดสอบ API

เปิด browser:

```
http://127.0.0.1:8000/docs
```

---

## 🔹 3. รัน Worker Node

เปิด Terminal ใหม่

```
cd worker
```

ติดตั้ง dependency

```
pip install requests
```

รัน worker

```
python worker.py
```

💡 สามารถเปิดหลาย worker ได้เพื่อจำลอง supercomputer

---

## 🔹 4. รัน Frontend (Next.js)

เปิด Terminal ใหม่

```
cd super-sim-frontend
```

ติดตั้ง package

```
npm install
```

รันเว็บ

```
npm run dev
```

เปิดเว็บ

```
http://localhost:3000
```

---

# 🧪 วิธีใช้งาน

1. 
2. 
3.
4. 
5. 

---

# 📊 ตัวอย่างผลลัพธ์

```
<img width="1866" height="902" alt="Dashbord_Supercomputer" src="https://github.com/user-attachments/assets/377189b1-a072-415a-8d29-9ced2cec44c2" />

```

---

# ⚠️ หมายเหตุ

* ค่าที่ได้ในปัจจุบันเป็น **Simulation Random(สุ่มค่า)**
* สามารถพัฒนาเพิ่มเติมโดยใช้ Weather API จริงได้

---

# 🔥 จุดเด่นของโปรเจค

* ✅ จำลองระบบ **Distributed Computing**
* ✅ มี **Worker หลายตัวช่วยคำนวณ**
* ✅ ใช้แนวคิด **Supercomputer**
* ✅ แยก Frontend / Backend ชัดเจน

---

# 🚀 แนวทางพัฒนาต่อ

* 🌍 เชื่อมต่อ Weather API จริง
* 📊 เพิ่ม Dashboard แสดง Worker
* ⚡ เพิ่ม Real-time Processing
* 🖥 เพิ่ม Visualization (Graph / Map)

---

# 👨‍💻 Author

* Developed by [Mr.Panuwit]

---
