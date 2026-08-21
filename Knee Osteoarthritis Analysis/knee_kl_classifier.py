"""
وحدة الاستدلال النهائية لتصنيف درجة KL — جاهزة للدمج داخل API لاحقًا.

يجمع 3 نماذج (resnet34 + resnet101 + densenet201)، يطبّق تبسيط KL0/KL1
السريري، ويعيد النتيجة كـ JSON منظّم مع علامة "غير حاسم" عند الحاجة.

استخدام مباشر:
    python knee_kl_classifier.py "C:\\path\\to\\xray.png"

استخدام كوحدة (لبناء الـ API لاحقًا):
    from knee_kl_classifier import KneeKLClassifier
    clf = KneeKLClassifier()
    result = clf.predict("path/to/image.png")
"""

import os
import sys
import json
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

BASE = r"C:\Users\PCD\Downloads\KneeXrayData\KneeXrayData"
MODELS_DIR = os.path.join(BASE, "ClsKLData", "models", "model_best")

UNCERTAIN_THRESHOLD = 0.50  # عدّلها حسب تفضيلك السريري لاحقًا

# النماذج المعتمدة نهائيًا (استبعدنا inceptionv3 لأنه خفّض الأداء)
ARCH_CONFIGS = {
    "resnet34":    (models.resnet34,    "resnet-34-SGD-0"),
    "resnet101":   (models.resnet101,   "resnet-101-SGD-0"),
    "densenet201": (models.densenet201, "densenet-201-SGD-0"),
}


class KneeKLClassifier:
    def __init__(self, models_dir=MODELS_DIR, device=None):
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.models_dir = models_dir
        self.models = self._load_all_models()
        self.preprocess = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.Grayscale(num_output_channels=3),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def _find_pth_file(self, folder):
        pth_files = [f for f in os.listdir(folder) if f.lower().endswith(".pth")]
        if not pth_files:
            raise FileNotFoundError(f"ما فيه ملف .pth داخل: {folder}")
        return os.path.join(folder, pth_files[0])

    def _load_all_models(self):
        loaded = {}
        for name, (ctor, subdir) in ARCH_CONFIGS.items():
            folder = os.path.join(self.models_dir, name, subdir)
            ckpt_path = self._find_pth_file(folder)

            model = ctor(weights=None)
            if name == "densenet201":
                model.classifier = nn.Linear(model.classifier.in_features, 5)
            else:
                model.fc = nn.Linear(model.fc.in_features, 5)

            checkpoint = torch.load(ckpt_path, map_location=self.device, weights_only=False)
            if isinstance(checkpoint, nn.Module):
                old_state = checkpoint.state_dict()
                del checkpoint
            else:
                old_state = checkpoint.get("state_dict", checkpoint.get("model", checkpoint))
            new_state = {k.replace("module.", ""): v for k, v in old_state.items()}

            try:
                model.load_state_dict(new_state, strict=True)
            except RuntimeError:
                model.load_state_dict(new_state, strict=False)

            model.to(self.device)
            model.eval()
            loaded[name] = model
        return loaded

    def predict(self, image_path):
        """
        يرجع dict فيه:
        - kl_grade: الدرجة المتوقعة (0-4)
        - kl_grade_simplified: "0-1" أو "2" أو "3" أو "4" (التبسيط السريري)
        - confidence: نسبة الثقة بأعلى درجة
        - is_uncertain: هل الثقة أقل من العتبة
        - probabilities: احتمال كل درجة كاملة
        """
        image = Image.open(image_path).convert("L")
        input_tensor = self.preprocess(image).unsqueeze(0).to(self.device)

        probs_sum = torch.zeros(5).to(self.device)
        with torch.no_grad():
            for model in self.models.values():
                output = model(input_tensor)
                probs_sum += torch.softmax(output, dim=1)[0]

        probs_avg = (probs_sum / len(self.models)).cpu().tolist()
        predicted = int(torch.tensor(probs_avg).argmax())
        confidence = probs_avg[predicted]
        is_uncertain = confidence < UNCERTAIN_THRESHOLD

        # التبسيط السريري: دمج KL0/KL1 باحتمال مجموع
        simplified_01 = probs_avg[0] + probs_avg[1]
        simplified_probs = {
            "0-1 (طبيعي/شك بسيط)": round(simplified_01, 4),
            "2 (خفيف)": round(probs_avg[2], 4),
            "3 (متوسط)": round(probs_avg[3], 4),
            "4 (شديد)": round(probs_avg[4], 4),
        }
        simplified_grade = max(simplified_probs, key=simplified_probs.get)

        return {
            "kl_grade": predicted,
            "kl_grade_simplified": simplified_grade,
            "confidence": round(confidence, 4),
            "is_uncertain": is_uncertain,
            "probabilities": {f"KL{i}": round(p, 4) for i, p in enumerate(probs_avg)},
            "disclaimer": "نتيجة مساعدة فقط، ليست تشخيصًا نهائيًا. يُنصح بمراجعة طبيب مختص.",
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        # ما فيه مسار ممرر — نختار صورة عشوائية تلقائيًا من test للتجربة السريعة
        import random
        sample_root = os.path.join(BASE, "ClsKLData", "kneeKL224", "test")
        grade = random.choice(["0", "1", "2", "3", "4"])
        folder = os.path.join(sample_root, grade)
        candidates = [f for f in os.listdir(folder) if f.lower().endswith(".png")]
        image_path = os.path.join(folder, random.choice(candidates))
        print(f"ما فيه مسار ممرر — بنجرب صورة عشوائية من KL{grade}:")
        print(f"  {image_path}\n")
    else:
        image_path = sys.argv[1]

    print("جاري تحميل النماذج...")
    clf = KneeKLClassifier()
    print("جاري التصنيف...\n")
    result = clf.predict(image_path)
    print(json.dumps(result, ensure_ascii=False, indent=2))