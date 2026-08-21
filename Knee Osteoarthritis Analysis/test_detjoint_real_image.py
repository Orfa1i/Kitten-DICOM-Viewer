"""
فحص سلامة كاشف مفصل الركبة: يقرأ صورة أشعة حقيقية من H5، يمررها للنموذج،
ويقارن موقع أعلى "ثقة كشف" (objectness) بموقع الصناديق الحقيقية (gt_boxes).

هذا فحص مكاني تقريبي فقط (مو فك تشفير صناديق دقيق) — لأن قيم anchor box
priors غير متوفرة عندنا من الريبو الأصلي.

تشغيل:
    python test_detjoint_real_image.py
"""

import os
import h5py
import numpy as np
import torch
import torch.nn.functional as F

from detjoint_model import KneeJointDetector, CHECKPOINT_PATH

BASE = r"C:\Users\PCD\Downloads\KneeXrayData\KneeXrayData"
H5_DIR = os.path.join(BASE, "DetKneeData", "H5", "testH5")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"الجهاز: {device}")

# ---------------------------------------------------------
# 1) تحميل النموذج
# ---------------------------------------------------------
model = KneeJointDetector(num_output=10).to(device)
checkpoint = torch.load(CHECKPOINT_PATH, map_location=device, weights_only=False)
checkpoint.pop("device_id", None)
model.load_state_dict(checkpoint, strict=True)
model.eval()
print("تم تحميل النموذج بنجاح\n")

# ---------------------------------------------------------
# 2) قراءة صورة حقيقية + صناديقها الحقيقية من H5
# ---------------------------------------------------------
h5_files = [f for f in os.listdir(H5_DIR) if f.lower().endswith(".h5")]
sample_path = os.path.join(H5_DIR, h5_files[0])
print(f"الصورة: {sample_path}")

with h5py.File(sample_path, "r") as f:
    image = f["images"][()]  # (256, 320, 3) float64
    gt_boxes = []
    for key in ["i0", "i1"]:
        box = f[f"gt_boxes/{key}"]
        gt_boxes.append([box.attrs["i0"], box.attrs["i1"], box.attrs["i2"], box.attrs["i3"]])

orig_h, orig_w = image.shape[0], image.shape[1]
print(f"أبعاد الصورة الأصلية: {orig_w}x{orig_h}")
print(f"الصناديق الحقيقية (x1,y1,x2,y2):")
for i, box in enumerate(gt_boxes):
    cx = (box[0] + box[2]) / 2
    cy = (box[1] + box[3]) / 2
    print(f"  مفصل {i}: {box}  -> المركز: ({cx:.1f}, {cy:.1f})")

# ---------------------------------------------------------
# 3) تجهيز الصورة للنموذج (تغيير حجم إلى 416x416 + تطبيع)
# ---------------------------------------------------------
image_tensor = torch.from_numpy(image).float()          # (256,320,3)
image_tensor = image_tensor.permute(2, 0, 1).unsqueeze(0)  # (1,3,256,320)
image_tensor = image_tensor / 255.0                       # تطبيع بسيط 0-1
image_resized = F.interpolate(image_tensor, size=(416, 416), mode="bilinear", align_corners=False)
image_resized = image_resized.to(device)

# ---------------------------------------------------------
# 4) الاستدلال
# ---------------------------------------------------------
with torch.no_grad():
    output = model(image_resized)  # (1, 10, 13, 13)

# إعادة الترتيب: 10 = 2 anchors x 5 (tx,ty,tw,th,obj)
output = output[0]  # (10,13,13)
output = output.view(2, 5, 13, 13)  # (anchors, values, grid_h, grid_w)

objectness = torch.sigmoid(output[:, 4, :, :])  # (2,13,13) — ثقة الكشف لكل anchor بكل خلية
print(f"\nشكل خريطة الثقة: {objectness.shape}")
print(f"أعلى قيمة ثقة: {objectness.max().item():.4f}")

# ---------------------------------------------------------
# 5) إيجاد أعلى نقطتين ثقة (نتوقع تطابق مع مفصلي الركبة)
# ---------------------------------------------------------
flat = objectness.view(-1)
top_values, top_indices = torch.topk(flat, k=5)

print("\n--- أعلى 5 نقاط ثقة (وموقعها التقريبي بالصورة الأصلية) ---")
grid_size = 13
scale_x = orig_w / grid_size
scale_y = orig_h / grid_size

for val, idx in zip(top_values, top_indices):
    idx = idx.item()
    anchor_idx = idx // (grid_size * grid_size)
    cell_idx = idx % (grid_size * grid_size)
    row = cell_idx // grid_size
    col = cell_idx % grid_size
    approx_x = (col + 0.5) * scale_x
    approx_y = (row + 0.5) * scale_y
    print(f"  ثقة={val.item():.4f}  anchor={anchor_idx}  خلية=({row},{col})  "
          f"موقع تقريبي بالصورة الأصلية=({approx_x:.1f}, {approx_y:.1f})")

print("\nقارن هذي المواقع التقريبية بمراكز الصناديق الحقيقية أعلاه.")
print("لو قريبة (فرق أقل من ~30-40 بكسل)، فالنموذج يشتغل صح مكانيًا رغم إننا")
print("ما فكينا تشفير الصندوق بدقة كاملة (لعدم توفر anchor priors الأصلية).")