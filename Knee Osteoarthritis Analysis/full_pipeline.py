"""
الخط الكامل: صورة أشعة ركبة كاملة -> كشف المفصلين (YOLOv8) -> قص كل مفصل
-> تصنيف درجة KL لكل مفصل (KneeKLClassifier).

استخدام مباشر:
    python full_pipeline.py "C:\\path\\to\\full_xray.png"

استخدام كوحدة (للـAPI لاحقًا):
    from full_pipeline import KneeOAPipeline
    pipeline = KneeOAPipeline()
    result = pipeline.analyze("path/to/xray.png")
"""

import os
import sys
import json
from PIL import Image
from ultralytics import YOLO

from knee_kl_classifier import KneeKLClassifier

DETECTOR_WEIGHTS = (
    r"C:\Users\PCD\orca\projects\Kitten-new\Knee Osteoarthritis Analysis"
    r"\runs\detect\train-4\weights\best.pt"
)
DETECTION_CONF_THRESHOLD = 0.5


class KneeOAPipeline:
    def __init__(self, detector_weights=DETECTOR_WEIGHTS):
        print("جاري تحميل كاشف المفصل (YOLOv8)...")
        self.detector = YOLO(detector_weights)
        print("جاري تحميل مصنّف درجة KL (ensemble)...")
        self.classifier = KneeKLClassifier()
        print("الخط الكامل جاهز\n")

    def analyze(self, image_path, crop_margin=0.1):
        """
        يرجع dict فيه:
        - num_joints_detected: عدد المفاصل المكتشفة
        - joints: قائمة فيها لكل مفصل نتيجة الكشف (الصندوق + الثقة) ونتيجة التصنيف الكاملة
        """
        results = self.detector(image_path, conf=DETECTION_CONF_THRESHOLD, verbose=False)
        boxes = results[0].boxes

        if len(boxes) == 0:
            return {
                "num_joints_detected": 0,
                "joints": [],
                "warning": "ما تم اكتشاف أي مفصل ركبة بالصورة. تأكد إن الصورة أشعة ركبة واضحة.",
            }

        original_image = Image.open(image_path).convert("RGB")
        img_w, img_h = original_image.size

        # ترتيب المفاصل من اليسار لليمين (بالصورة) عشان تسمية ثابتة
        box_list = sorted(boxes.xyxy.cpu().tolist(), key=lambda b: b[0])
        confidences = boxes.conf.cpu().tolist()
        conf_sorted = [c for _, c in sorted(zip(boxes.xyxy.cpu().tolist(), confidences), key=lambda p: p[0][0])]

        joints_result = []
        for i, (box, conf) in enumerate(zip(box_list, conf_sorted)):
            x1, y1, x2, y2 = box
            # هامش إضافي حول الصندوق عشان ما نقص حواف المفصل
            box_w, box_h = x2 - x1, y2 - y1
            x1 = max(0, x1 - box_w * crop_margin)
            y1 = max(0, y1 - box_h * crop_margin)
            x2 = min(img_w, x2 + box_w * crop_margin)
            y2 = min(img_h, y2 + box_h * crop_margin)

            cropped = original_image.crop((x1, y1, x2, y2))
            temp_path = f"_temp_joint_{i}.png"
            cropped.save(temp_path)

            classification = self.classifier.predict(temp_path)
            os.remove(temp_path)

            side = "يسار" if i == 0 and len(box_list) == 2 else ("يمين" if i == 1 else f"مفصل {i}")

            joints_result.append({
                "side": side,
                "detection_confidence": round(conf, 4),
                "bounding_box": [round(v, 1) for v in [x1, y1, x2, y2]],
                "classification": classification,
            })

        return {
            "num_joints_detected": len(joints_result),
            "joints": joints_result,
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("الاستخدام: python full_pipeline.py <path_to_xray_image>")
        sys.exit(1)

    pipeline = KneeOAPipeline()
    result = pipeline.analyze(sys.argv[1])
    print(json.dumps(result, ensure_ascii=False, indent=2))