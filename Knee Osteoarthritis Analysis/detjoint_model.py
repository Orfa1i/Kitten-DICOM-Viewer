"""
إعادة بناء معمارية DetJoint (Darknet-19 + YOLOv2 مخصص لكشف مفصل الركبة)
مطابقة تمامًا لأسماء المفاتيح في det-epoch-500-0.000051.pth.

تشغيل (اختبار تحميل + تمرير مدخل تجريبي فقط):
    python detjoint_model.py
"""

import os
import torch
import torch.nn as nn

BASE = r"C:\Users\PCD\Downloads\KneeXrayData\KneeXrayData"
CHECKPOINT_PATH = os.path.join(
    BASE, "DetKneeData", "best_models", "1", "det-epoch-500-0.000051.pth"
)


class Conv2dBatchNorm(nn.Module):
    """طبقة Conv + BatchNorm + LeakyReLU (تطابق مفاتيح conv.weight / bn.weight...)"""
    def __init__(self, in_channels, out_channels, kernel_size, relu=True):
        super().__init__()
        padding = (kernel_size - 1) // 2
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size,
                               stride=1, padding=padding, bias=False)
        self.bn = nn.BatchNorm2d(out_channels, momentum=0.01)
        self.relu = nn.LeakyReLU(0.1, inplace=True) if relu else None

    def forward(self, x):
        x = self.conv(x)
        x = self.bn(x)
        if self.relu is not None:
            x = self.relu(x)
        return x


class FinalConv(nn.Module):
    """طبقة الإخراج النهائية (conv5): Conv عادي بـbias، بدون BN ولا تفعيل"""
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=1, padding=0)

    def forward(self, x):
        return self.conv(x)


def _make_block(in_channels, cfg):
    """يبني بلوك واحد (nn.Sequential) من قائمة عناصر: 'M' لـMaxPool، أو (channels, ksize) لـConv"""
    layers = []
    for item in cfg:
        if item == 'M':
            layers.append(nn.MaxPool2d(kernel_size=2, stride=2))
        else:
            out_channels, ksize = item
            layers.append(Conv2dBatchNorm(in_channels, out_channels, ksize))
            in_channels = out_channels
    return nn.Sequential(*layers), in_channels


class ReorgLayer(nn.Module):
    """طبقة passthrough القياسية في YOLOv2: تحوّل HxWxC إلى (H/2)x(W/2)x(C*4)"""
    def __init__(self, stride=2):
        super().__init__()
        self.stride = stride

    def forward(self, x):
        s = self.stride
        B, C, H, W = x.shape
        x = x.view(B, C, H // s, s, W // s, s).permute(0, 1, 3, 5, 2, 4).contiguous()
        x = x.view(B, C * s * s, H // s, W // s)
        return x


class KneeJointDetector(nn.Module):
    """
    Darknet-19 + رأس كشف YOLOv2 مخصص، لكشف مفصلي الركبة.
    مخرج نهائي: 10 قنوات = 2 anchors × 5 (x, y, w, h, objectness)
    """
    def __init__(self, num_output=10):
        super().__init__()

        conv1s_cfgs = [
            [(32, 3)],
            ['M', (64, 3)],
            ['M', (128, 3), (64, 1), (128, 3)],
            ['M', (256, 3), (128, 1), (256, 3)],
            ['M', (512, 3), (256, 1), (512, 3), (256, 1), (512, 3)],
        ]
        blocks, c = [], 3
        for cfg in conv1s_cfgs:
            block, c = _make_block(c, cfg)
            blocks.append(block)
        self.conv1s = nn.Sequential(*blocks)  # يطلع 26x26x512 (لصورة مدخل 416x416)
        c1 = c  # 512

        self.conv2, c2 = _make_block(c1, ['M', (1024, 3), (512, 1), (1024, 3), (512, 1), (1024, 3)])
        self.conv3, c3 = _make_block(c2, [(1024, 3), (1024, 3)])

        self.reorg = ReorgLayer(stride=2)
        passthrough_channels = c1 * 4  # 512*4 = 2048
        concat_channels = passthrough_channels + c3  # 2048+1024 = 3072

        self.conv4, c4 = _make_block(concat_channels, [(1024, 3)])
        self.conv5 = FinalConv(c4, num_output)

    def forward(self, x):
        conv1s_out = self.conv1s(x)          # 26x26x512
        conv2_out = self.conv2(conv1s_out)    # 13x13x1024
        conv3_out = self.conv3(conv2_out)     # 13x13x1024
        passthrough = self.reorg(conv1s_out)  # 13x13x2048
        merged = torch.cat([passthrough, conv3_out], dim=1)  # 13x13x3072
        conv4_out = self.conv4(merged)        # 13x13x1024
        out = self.conv5(conv4_out)           # 13x13x10
        return out


if __name__ == "__main__":
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"الجهاز: {device}")

    model = KneeJointDetector(num_output=10).to(device)

    checkpoint = torch.load(CHECKPOINT_PATH, map_location=device, weights_only=False)
    checkpoint.pop("device_id", None)  # مو جزء من أوزان الشبكة

    try:
        missing_unexpected = model.load_state_dict(checkpoint, strict=True)
        print("نجح التحميل الكامل (strict=True)! المعمارية مطابقة تمامًا.")
    except RuntimeError as e:
        print("فشل strict=True:")
        print(e)
        print("\nمحاولة strict=False...")
        result = model.load_state_dict(checkpoint, strict=False)
        print(f"مفاتيح ناقصة (missing_keys): {result.missing_keys}")
        print(f"مفاتيح زائدة (unexpected_keys): {result.unexpected_keys}")

    model.eval()
    dummy = torch.randn(1, 3, 416, 416).to(device)
    with torch.no_grad():
        out = model(dummy)
    print(f"\nنجح تمرير مدخل تجريبي 416x416! شكل المخرج: {out.shape}")
    print("(المتوقع: [1, 10, 13, 13] — يعني 13x13 خلية شبكية، كل واحدة فيها 2 anchor × 5 قيم)")