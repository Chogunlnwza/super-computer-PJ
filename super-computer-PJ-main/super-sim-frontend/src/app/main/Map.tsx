// ไฟล์: src/app/main/Map.tsx
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// 🎯 รับค่า radius และ opacity ที่ส่งมาจากหน้าหลัก
export default function Map({ mapData, getMarkerColor, radius, opacity }: any) {
  return (
    <MapContainer 
      center={[13.7367, 100.5231]} 
      zoom={6} 
      style={{ height: '100%', width: '100%', backgroundColor: '#0a0a0a' }}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      
      {mapData.map((task: any) => (
        <Circle 
          key={task.id}
          center={[task.grid_x, task.grid_y]} 
          radius={radius} // 🎯 ใช้ค่าความกว้างที่ปรับจากสไลเดอร์
          pathOptions={{ 
            color: 'transparent',
            fillColor: getMarkerColor(task.status, task.final_temp),
            fillOpacity: opacity, // 🎯 ใช้ค่าความโปร่งแสงที่ปรับจากสไลเดอร์
            // ใช้ blur อย่างเดียวพอ ไม่บวกแสงทับกันแล้ว แผนที่จะได้ไม่จ้าเกินไป
            className: 'blur-[15px] transition-all duration-300'
          }}
        >
          <Popup>
            <div className="font-mono text-xs text-black min-w-[150px]">
              <strong className="text-blue-600 text-sm uppercase">{task.region || 'Unknown'}</strong><br />
              <hr className="my-1 border-gray-300"/>
              <strong>Status:</strong> {task.status === 'completed' ? '✅ Verified' : '⏳ Processing'}<br />
              <strong>Predict Temp:</strong> {task.final_temp ? `${task.final_temp.toFixed(2)}°C` : 'Calculating...'}<br />
              
              <div className="mt-2 p-1.5 bg-gray-100 rounded border border-gray-300">
                <strong>Consensus:</strong> {task.results_count}/2 Nodes<br />
                <strong>AI Weight (w):</strong> {task.ai_weight ? task.ai_weight.toFixed(4) : '-'}<br />
                <strong>AI Bias (b):</strong> {task.ai_bias ? task.ai_bias.toFixed(4) : '-'}<br />
                <span className="text-[9px] text-gray-500 italic break-all">Node: {task.last_worker || '-'}</span>
              </div>
            </div>
          </Popup>
        </Circle>
      ))}
    </MapContainer>
  );
}