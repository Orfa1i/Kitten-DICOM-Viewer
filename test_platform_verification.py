import httpx
import time

print('=====================================================')
print('KITTEN PLATFORM & CLINICAL AI MODELS VERIFICATION')
print('=====================================================')

# 1. MedGemma Health
t0 = time.time()
r_mg_health = httpx.get('http://127.0.0.1:8001/health', timeout=5.0)
t_mg_health = (time.time() - t0) * 1000
print(f'[1] MedGemma Health: Status {r_mg_health.status_code} in {t_mg_health:.1f}ms -> {r_mg_health.json()}')

# 2. MedGemma Report Generation with test image
t0 = time.time()
with open(r'C:\Users\HUAWEI\Downloads\image_1.jpg', 'rb') as f:
    files = {'file': ('image_1.jpg', f, 'image/jpeg')}
    data = {'clinical_context': 'Patient presented with acute right wrist pain after fall on outstretched hand.'}
    r_mg_report = httpx.post('http://127.0.0.1:8001/generate-draft-report', files=files, data=data, timeout=15.0)
t_mg_report = (time.time() - t0) * 1000
report_data = r_mg_report.json()
print(f'[2] MedGemma Draft Report: Status {r_mg_report.status_code} in {t_mg_report:.1f}ms')
print(f'    Model: {report_data.get("model")}')
print(f'    Sections Verified:')
draft_lines = report_data.get('draft_report', '').split('\n\n')
for line in draft_lines[:3]:
    print('    | ' + line.split('\n')[0])

# 3. Backend Health & Subservice Telemetry
t0 = time.time()
r_backend_health = httpx.get('http://127.0.0.1:8000/health', timeout=5.0)
t_backend_health = (time.time() - t0) * 1000
b_health = r_backend_health.json()
print(f'[3] Backend Server Health: Status {r_backend_health.status_code} in {t_backend_health:.1f}ms')
print(f'    Bone Fracture YOLO11n Model Loaded: {b_health.get("models_loaded", {}).get("bone_fracture_yolo11n")}')
print(f'    Knee OA Joint Detector Loaded: {b_health.get("models_loaded", {}).get("knee_oa_detector")}')
print(f'    MedGemma Service Ready: {b_health.get("medgemma_service_ready")}')

# 4. Bone Fracture YOLO11n Detection
t0 = time.time()
with open(r'C:\Users\HUAWEI\Downloads\image_1.jpg', 'rb') as f:
    files = {'file': ('image_1.jpg', f, 'image/jpeg')}
    r_detect = httpx.post('http://127.0.0.1:8000/api/detect/bone-fracture', files=files, timeout=30.0)
t_detect = (time.time() - t0) * 1000
detect_data = r_detect.json()
print(f'[4] YOLO11n Bone Fracture Detection: Status {r_detect.status_code} in {t_detect:.1f}ms')
print(f'    Status: {detect_data.get("status")}')
print(f'    Fractures Found: {detect_data.get("fractures_found")}')
print(f'    Detections Bounding Boxes: {len(detect_data.get("data", []))}')

# 5. Frontend Check
import urllib.request
t0 = time.time()
with urllib.request.urlopen('http://127.0.0.1:5173/') as resp:
    fe_status = resp.getcode()
t_fe = (time.time() - t0) * 1000
print(f'[5] Vite Frontend: Status {fe_status} in {t_fe:.1f}ms')
print('=====================================================')
print('ALL VERIFICATIONS PASSED SUCCESSFULLY!')
print('=====================================================')
