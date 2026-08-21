"""
يحوّل بيانات DetKneeData (صيغة H5/deepdish) إلى صيغة YOLO القياسية
(صور PNG + ملفات تسميات .txt) جاهزة للتدريب بمكتبة ultralytics.

تشغيل:
    pip install h5py pillow numpy
    python convert_h5_to_yolo.py
"""

import os
import h5py
import numpy as np
from PIL import Image

BASE = r"C:\Users\PCD\Downloads\KneeXrayData\KneeXrayData"
H5_ROOT = os.path.join(BASE, "DetKneeData", "H5")
OUTPUT_ROOT = os.path.join(BASE, "DetKneeData", "yolo_dataset")

SPLITS = {
    "train": "trainH5",
    "val": "valH5",
    "test": "testH5",
}


def convert_split(split_name, h5_subdir):
    h5_dir = os.path.join(H5_ROOT, h5_subdir)
    images_out = os.path.join(OUTPUT_ROOT, "images", split_name)
    labels_out = os.path.join(OUTPUT_ROOT, "labels", split_name)
    os.makedirs(images_out, exist_ok=True)
    os.makedirs(labels_out, exist_ok=True)

    h5_files = [f for f in os.listdir(h5_dir) if f.lower().endswith(".h5")]
    print(f"[{split_name}] عدد الملفات: {len(h5_files)}")

    converted = 0
    skipped = 0

    for fname in h5_files:
        h5_path = os.path.join(h5_dir, fname)
        stem = os.path.splitext(fname)[0]

        try:
            with h5py.File(h5_path, "r") as f:
                image = f["images"][()]  # (H, W, 3) float64
                boxes = []
                for key in f["gt_boxes"].keys():
                    b = f[f"gt_boxes/{key}"]
                    boxes.append([b.attrs["i0"], b.attrs["i1"], b.attrs["i2"], b.attrs["i3"]])
        except Exception as e:
            print(f"  تخطي {fname}: {e}")
            skipped += 1
            continue

        h, w = image.shape[0], image.shape[1]

        # حفظ الصورة كـ PNG (تحويل من float64 [0-239 تقريبًا] إلى uint8 [0-255])
        img_uint8 = np.clip(image, 0, 255).astype(np.uint8)
        pil_img = Image.fromarray(img_uint8)
        pil_img.save(os.path.join(images_out, f"{stem}.png"))

        # كتابة ملف التسميات بصيغة YOLO: class x_center y_center width height (كلها نسبية 0-1)
        label_lines = []
        for box in boxes:
            x1, y1, x2, y2 = box
            x_center = ((x1 + x2) / 2) / w
            y_center = ((y1 + y2) / 2) / h
            box_w = (x2 - x1) / w
            box_h = (y2 - y1) / h
            label_lines.append(f"0 {x_center:.6f} {y_center:.6f} {box_w:.6f} {box_h:.6f}")

        with open(os.path.join(labels_out, f"{stem}.txt"), "w") as lf:
            lf.write("\n".join(label_lines))

        converted += 1

    print(f"[{split_name}] تم التحويل: {converted}, تخطي: {skipped}\n")


if __name__ == "__main__":
    for split_name, h5_subdir in SPLITS.items():
        convert_split(split_name, h5_subdir)

    # كتابة ملف إعدادات dataset.yaml اللي يحتاجه ultralytics للتدريب
    yaml_content = f"""path: {OUTPUT_ROOT}
train: images/train
val: images/val
test: images/test

names:
  0: knee_joint
"""
    yaml_path = os.path.join(OUTPUT_ROOT, "dataset.yaml")
    with open(yaml_path, "w") as f:
        f.write(yaml_content)

    print(f"تم إنشاء ملف الإعدادات: {yaml_path}")
    print("\nالتحويل اكتمل. الخطوة التالية: تدريب YOLOv8.")