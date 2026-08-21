"""
سكربت اختبار سريع لنموذج تصنيف درجة KL (ClsKL) المدرب مسبقًا.
يحمّل نموذج resnet34 (SGD-0) ويختبره على صورة واحدة من مجلد test.

تشغيل:
    python test_clskl_inference.py

قبل التشغيل:
    pip install torch torchvision pillow
"""

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import os

# ---------------------------------------------------------
# 1) عدّل هذي المسارات حسب جهازك
# ---------------------------------------------------------
BASE = r"C:\Users\PCD\Downloads\KneeXrayData\KneeXrayData"

CHECKPOINT_DIR = os.path.join(
    BASE, "ClsKLData", "models", "model_best",
    "resnet34", "resnet-34-SGD-0"
)

# يكتشف اسم ملف .pth تلقائيًا بدل ما نفترض اسمه
def find_pth_file(folder):
    if not os.path.isdir(folder):
        raise FileNotFoundError(f"المجلد غير موجود: {folder}")
    pth_files = [f for f in os.listdir(folder) if f.lower().endswith(".pth")]
    if not pth_files:
        raise FileNotFoundError(f"ما فيه أي ملف .pth داخل: {folder}")
    if len(pth_files) > 1:
        print(f"تحذير: فيه أكثر من ملف .pth، بستخدم الأول: {pth_files}")
    return os.path.join(folder, pth_files[0])

CHECKPOINT_PATH = find_pth_file(CHECKPOINT_DIR)
print(f"ملف النموذج: {CHECKPOINT_PATH}")

TEST_IMAGE_DIR = os.path.join(BASE, "ClsKLData", "kneeKL224", "test")
# جرب صورة من مجلد "2" (KL grade 2) كمثال
SAMPLE_IMAGE = None
for grade_folder in ["2", "0", "1", "3", "4"]:
    folder = os.path.join(TEST_IMAGE_DIR, grade_folder)
    if os.path.isdir(folder):
        files = [f for f in os.listdir(folder) if f.lower().endswith(".png")]
        if files:
            SAMPLE_IMAGE = os.path.join(folder, files[0])
            TRUE_LABEL = grade_folder
            break

if SAMPLE_IMAGE is None:
    raise FileNotFoundError("ما لقيت صورة تجريبية — تأكد من مسار TEST_IMAGE_DIR")

print(f"صورة الاختبار: {SAMPLE_IMAGE}")
print(f"الدرجة الحقيقية (من اسم المجلد): KL {TRUE_LABEL}")

# ---------------------------------------------------------
# 2) بناء معمارية resnet34 بنفس تعديل الطبقة الأخيرة (5 فئات)
# ---------------------------------------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"الجهاز المستخدم: {device}")

model = models.resnet34(weights=None)
model.fc = nn.Linear(model.fc.in_features, 5)  # 5 درجات KL: 0-4

# ---------------------------------------------------------
# 3) تحميل الأوزان المدربة
# ---------------------------------------------------------
checkpoint = torch.load(CHECKPOINT_PATH, map_location=device, weights_only=False)
# ملاحظة: weights_only=False يعني نثق بمصدر الملف (هنا: ريبو بحثي معروف نزّلته بنفسك).
# لا تستخدم هذا الخيار مع ملفات .pth من مصدر غير موثوق.

if isinstance(checkpoint, nn.Module):
    # النموذج المحفوظ قديم (2019) وطبقاته تحمل كود قديم غير متوافق مع PyTorch الحديث
    # (مثال: AvgPool2d بدون خاصية divisor_override). الحل: نستخرج الأوزان فقط
    # ونحمّلها في معمارية resnet34 حديثة نبنيها من الصفر.
    print("الملف يحتوي نموذج كامل قديم — بنستخرج الأوزان ونحمّلها في معمارية حديثة")
    old_state_dict = checkpoint.state_dict()
    del checkpoint  # نتخلص من الكائن القديم غير المتوافق
else:
    if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
        old_state_dict = checkpoint["state_dict"]
    elif isinstance(checkpoint, dict) and "model" in checkpoint:
        old_state_dict = checkpoint["model"]
    else:
        old_state_dict = checkpoint

new_state_dict = {}
for k, v in old_state_dict.items():
    new_key = k.replace("module.", "")
    new_state_dict[new_key] = v

try:
    model.load_state_dict(new_state_dict, strict=True)
    print("تم تحميل الأوزان بنجاح (strict=True)")
except RuntimeError as e:
    print("تحذير: فشل التحميل الصارم، أجرب strict=False لمعرفة الفروقات")
    print(e)
    missing_unexpected = model.load_state_dict(new_state_dict, strict=False)
    print(missing_unexpected)

model.to(device)
model.eval()

# ---------------------------------------------------------
# 4) تجهيز الصورة (نفس معالجة ImageNet القياسية — قد تحتاج تعديل
#    لو الريبو الأصلي استخدم قيم تطبيع مختلفة)
# ---------------------------------------------------------
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.Grayscale(num_output_channels=3),  # صور الأشعة عادة رمادية
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                          std=[0.229, 0.224, 0.225]),
])

image = Image.open(SAMPLE_IMAGE).convert("L")  # grayscale
input_tensor = preprocess(image).unsqueeze(0).to(device)

# ---------------------------------------------------------
# 5) الاستدلال
# ---------------------------------------------------------
with torch.no_grad():
    output = model(input_tensor)
    probabilities = torch.softmax(output, dim=1)[0]
    predicted_class = torch.argmax(probabilities).item()

print("\n--- النتيجة ---")
print(f"الدرجة المتوقعة: KL {predicted_class}")
print(f"الدرجة الحقيقية:  KL {TRUE_LABEL}")
print("احتمالات كل درجة:")
for i, p in enumerate(probabilities):
    print(f"  KL {i}: {p.item()*100:.2f}%")