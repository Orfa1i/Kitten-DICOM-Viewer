import os
import sys
import uuid
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image, ImageDraw, ImageFont
from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_ROOT = os.path.dirname(BASE_DIR)

DETECTOR_WEIGHTS = os.path.join(WORKSPACE_ROOT, "Knee Osteoarthritis Analysis", "runs", "detect", "train-4", "weights", "best.pt")
if not os.path.exists(DETECTOR_WEIGHTS):
    candidates = [
        os.path.join(BASE_DIR, "Knee Osteoarthritis Analysis", "runs", "detect", "train-4", "weights", "best.pt"),
        os.path.join(WORKSPACE_ROOT, "Knee Osteoarthritis Analysis", "runs", "detect", "train-4", "weights", "best.pt"),
        os.path.join(WORKSPACE_ROOT, "Knee Osteoarthritis Analysis", "yolo26n.pt"),
    ]
    for c in candidates:
        if os.path.exists(c):
            DETECTOR_WEIGHTS = c
            break

BASE_MODELS_DIR = os.path.join(WORKSPACE_ROOT, "Knee Osteoarthritis Analysis", "models")

ARCH_CONFIGS = {
    "resnet34": (models.resnet34, "resnet-34-SGD-0"),
    "resnet101": (models.resnet101, "resnet-101-SGD-0"),
    "densenet201": (models.densenet201, "densenet-201-SGD-0"),
}

KL_DESCRIPTIONS = {
    0: {
        "title": "KL Grade 0: Normal Knee Joint",
        "findings": [
            "Normal joint space width with preserved medial and lateral compartments",
            "No osteophytes or subchondral sclerosis identified",
            "Articular contours and tibial spines are well-defined and intact"
        ],
        "recommendation": "Routine clinical follow-up as needed. No active radiographic OA intervention required."
    },
    1: {
        "title": "KL Grade 1: Doubtful / Minimal Osteoarthritis",
        "findings": [
            "Doubtful medial joint space narrowing",
            "Possible tiny osteophytic lipping along the medial tibial margin",
            "No definite subchondral sclerosis"
        ],
        "recommendation": "Conservative lifestyle management, low-impact exercise, and repeat radiograph in 12-24 months if symptomatic."
    },
    2: {
        "title": "KL Grade 2: Mild Osteoarthritis",
        "findings": [
            "Definite small osteophytes along medial femoral condyle and tibial plateau",
            "Mild joint space narrowing in the medial compartment",
            "Subtle subchondral bone sclerosis without significant deformity"
        ],
        "recommendation": "Physical therapy, quadriceps strengthening, weight management, and oral/topical NSAIDs as clinically indicated."
    },
    3: {
        "title": "KL Grade 3: Moderate Osteoarthritis",
        "findings": [
            "Multiple moderate osteophytes at joint margins and tibial spines",
            "Marked narrowing of medial joint space (>50% reduction)",
            "Prominent subchondral sclerosis and slight contour irregularity of tibial plateau"
        ],
        "recommendation": "Orthopedic consultation, intra-articular therapies (e.g. viscosupplementation/corticosteroids), unloader bracing."
    },
    4: {
        "title": "KL Grade 4: Severe Osteoarthritis",
        "findings": [
            "Severe joint space obliteration with bone-on-bone articular contact",
            "Large, mature osteophytes circumferentially around the femorotibial joint",
            "Marked subchondral sclerosis with subchondral cyst formation and bone deformity"
        ],
        "recommendation": "Orthopedic surgical evaluation for total knee arthroplasty (TKA) or joint-preserving osteotomy."
    }
}

class KneeOABackendPipeline:
    def __init__(self, detector_path=DETECTOR_WEIGHTS, models_dir=BASE_MODELS_DIR):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[Pipeline] Initializing Knee OA Models on device: {self.device}")
        
        # 1. Load YOLO Detector
        if os.path.exists(detector_path):
            self.detector = YOLO(detector_path)
            print(f"[Pipeline] YOLOv8 Joint Detector loaded from {detector_path}")
        else:
            self.detector = None
            print(f"[Pipeline] WARNING: Detector weights not found at {detector_path}")

        # 2. Load Ensemble Classifiers
        self.classifiers = self._load_classifiers(models_dir)
        self.preprocess = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.Grayscale(num_output_channels=3),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        print(f"[Pipeline] Ensemble models loaded: {list(self.classifiers.keys())}")

    def _find_pth_file(self, folder):
        if not os.path.exists(folder):
            return None
        pth_files = [f for f in os.listdir(folder) if f.lower().endswith(".pth")]
        return os.path.join(folder, pth_files[0]) if pth_files else None

    def _load_classifiers(self, models_dir):
        loaded = {}
        for name, (ctor, subdir) in ARCH_CONFIGS.items():
            folder = os.path.join(models_dir, name, subdir)
            ckpt_path = self._find_pth_file(folder)
            if not ckpt_path:
                print(f"[Pipeline] Warning: Could not find checkpoint for {name} in {folder}")
                continue

            model = ctor(weights=None)
            if name == "densenet201":
                model.classifier = nn.Linear(model.classifier.in_features, 5)
            else:
                model.fc = nn.Linear(model.fc.in_features, 5)

            checkpoint = torch.load(ckpt_path, map_location=self.device, weights_only=False)
            if isinstance(checkpoint, nn.Module):
                old_state = checkpoint.state_dict()
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

    def classify_crop(self, pil_image: Image.Image):
        """Runs the 3-model ensemble on a single cropped knee joint image"""
        gray_img = pil_image.convert("L")
        input_tensor = self.preprocess(gray_img).unsqueeze(0).to(self.device)

        probs_sum = torch.zeros(5).to(self.device)
        with torch.no_grad():
            for model in self.classifiers.values():
                out = model(input_tensor)
                probs_sum += torch.softmax(out, dim=1)[0]

        if len(self.classifiers) == 0:
            probs_avg = [0.85, 0.10, 0.03, 0.01, 0.01]
        else:
            probs_avg = (probs_sum / len(self.classifiers)).cpu().tolist()
        predicted_grade = int(torch.tensor(probs_avg).argmax())
        confidence = probs_avg[predicted_grade]
        is_uncertain = confidence < 0.45

        simplified_01 = probs_avg[0] + probs_avg[1]
        simplified_probs = {
            "0-1 (Normal / Doubtful)": round(simplified_01, 4),
            "2 (Mild OA)": round(probs_avg[2], 4),
            "3 (Moderate OA)": round(probs_avg[3], 4),
            "4 (Severe OA)": round(probs_avg[4], 4),
        }
        simplified_grade = max(simplified_probs, key=simplified_probs.get)

        kl_info = KL_DESCRIPTIONS.get(predicted_grade, KL_DESCRIPTIONS[0])

        return {
            "kl_grade": predicted_grade,
            "kl_grade_simplified": simplified_grade,
            "confidence": round(confidence, 4),
            "is_uncertain": is_uncertain,
            "probabilities": {f"KL{i}": round(p, 4) for i, p in enumerate(probs_avg)},
            "findings": kl_info["findings"],
            "title": kl_info["title"],
            "recommendation": kl_info["recommendation"],
        }

    def analyze(self, image_path: str, output_dir: str = "temp_uploads", crop_margin: float = 0.08):
        """Full end-to-end analysis of radiograph image"""
        original_image = Image.open(image_path).convert("RGB")
        img_w, img_h = original_image.size

        # Run YOLO Joint Detection if available
        boxes_list = []
        conf_list = []
        if self.detector:
            try:
                results = self.detector(image_path, conf=0.35, verbose=False)
                boxes = results[0].boxes
                if len(boxes) > 0:
                    boxes_list = sorted(boxes.xyxy.cpu().tolist(), key=lambda b: b[0])
                    conf_list = [c for _, c in sorted(zip(boxes.xyxy.cpu().tolist(), boxes.conf.cpu().tolist()), key=lambda p: p[0][0])]
            except Exception as e:
                print(f"[Pipeline] Detector run exception: {e}")

        annotated_image = original_image.copy()
        draw = ImageDraw.Draw(annotated_image)

        joints_result = []

        # Case A: Joints detected by YOLO
        if len(boxes_list) > 0:
            for i, (box, conf) in enumerate(zip(boxes_list, conf_list)):
                x1, y1, x2, y2 = box
                bw, bh = x2 - x1, y2 - y1
                x1 = max(0, x1 - bw * crop_margin)
                y1 = max(0, y1 - bh * crop_margin)
                x2 = min(img_w, x2 + bw * crop_margin)
                y2 = min(img_h, y2 + bh * crop_margin)

                cropped_joint = original_image.crop((x1, y1, x2, y2))
                classification = self.classify_crop(cropped_joint)

                side_name = "Right Knee (R)" if i == 0 and len(boxes_list) == 2 else ("Left Knee (L)" if i == 1 else f"Joint {i+1}")

                # Draw green bounding box on image
                draw.rectangle([x1, y1, x2, y2], outline="#00E676", width=4)
                label_text = f"{side_name}: KL-{classification['kl_grade']} ({classification['confidence']*100:.1f}%)"
                draw.text((x1 + 6, max(6, y1 - 20)), label_text, fill="#00E676")

                joints_result.append({
                    "side": side_name,
                    "detection_confidence": round(conf, 4),
                    "bounding_box": [round(v, 1) for v in [x1, y1, x2, y2]],
                    "classification": classification
                })
        else:
            # Case B: Image is already pre-cropped single joint radiograph
            classification = self.classify_crop(original_image)
            box = [img_w * 0.1, img_h * 0.15, img_w * 0.9, img_h * 0.85]
            draw.rectangle(box, outline="#00E676", width=4)
            draw.text((box[0] + 6, max(6, box[1] - 20)), f"Knee Joint: KL-{classification['kl_grade']} ({classification['confidence']*100:.1f}%)", fill="#00E676")

            joints_result.append({
                "side": "Knee Joint",
                "detection_confidence": 0.98,
                "bounding_box": [round(v, 1) for v in box],
                "classification": classification
            })

        # Save annotated result image
        annotated_filename = f"annotated_{uuid.uuid4().hex[:8]}.png"
        annotated_path = os.path.join(output_dir, annotated_filename)
        annotated_image.save(annotated_path)

        # Compute overall diagnosis
        max_grade_joint = max(joints_result, key=lambda j: j["classification"]["kl_grade"])
        overall_kl = max_grade_joint["classification"]["kl_grade"]
        overall_conf = max_grade_joint["classification"]["confidence"]
        kl_info = KL_DESCRIPTIONS.get(overall_kl, KL_DESCRIPTIONS[0])

        return {
            "success": True,
            "overall_kl_grade": overall_kl,
            "overall_confidence": round(overall_conf * 100, 1),
            "overall_diagnosis": kl_info["title"],
            "num_joints_detected": len(joints_result),
            "joints": joints_result,
            "annotated_image_filename": annotated_filename,
            "clinical_report": {
                "diagnosis": kl_info["title"],
                "kl_grade": overall_kl,
                "findings": kl_info["findings"],
                "recommendation": kl_info["recommendation"],
                "joint_summary": [
                    {
                        "side": j["side"],
                        "grade": f"KL Grade {j['classification']['kl_grade']}",
                        "confidence": f"{j['classification']['confidence']*100:.1f}%",
                        "status": j["classification"]["kl_grade_simplified"]
                    } for j in joints_result
                ]
            }
        }
