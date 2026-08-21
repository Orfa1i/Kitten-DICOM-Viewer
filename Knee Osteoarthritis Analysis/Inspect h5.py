"""
سكربت استكشافي: يفحص بنية أول ملف H5 داخل testH5 عشان نعرف
كيف نستخرج صورة الأشعة الحقيقية منه (المفاتيح، الأبعاد، نوع البيانات).

تشغيل:
    pip install h5py   (إذا ما كانت مثبتة)
    python inspect_h5.py
"""

import os
import h5py
import numpy as np

BASE = r"C:\Users\PCD\Downloads\KneeXrayData\KneeXrayData"
H5_DIR = os.path.join(BASE, "DetKneeData", "H5", "testH5")

h5_files = [f for f in os.listdir(H5_DIR) if f.lower().endswith(".h5")]
print(f"عدد ملفات H5 في المجلد: {len(h5_files)}")

sample_file = os.path.join(H5_DIR, h5_files[0])
print(f"فحص الملف: {sample_file}\n")

def print_structure(name, obj):
    if isinstance(obj, h5py.Dataset):
        print(f"  Dataset: {name}")
        print(f"    shape: {obj.shape}")
        print(f"    dtype: {obj.dtype}")
        if obj.size < 20:
            print(f"    value: {obj[()]}")
        else:
            arr = obj[()]
            if hasattr(arr, "min"):
                print(f"    min/max: {np.min(arr)} / {np.max(arr)}")
    elif isinstance(obj, h5py.Group):
        print(f"  Group: {name}")
        if len(obj.attrs) > 0:
            for k, v in obj.attrs.items():
                print(f"    attr[{k}]: {v}")
        if len(obj.keys()) == 0:
            print(f"    (لا توجد عناصر فرعية داخلها)")

with h5py.File(sample_file, "r") as f:
    print("--- بنية الملف الكاملة ---")
    f.visititems(print_structure)

    print("\n--- الخصائص (attrs) على مستوى الجذر ---")
    for k, v in f.attrs.items():
        print(f"  {k}: {v}")