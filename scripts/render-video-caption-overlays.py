#!/usr/bin/env python3
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_VERSION = os.environ.get("VIDEO_CAPTION_VERSION", "v3")
OUTPUT_DIR = ROOT_DIR / "public" / "video-demo" / OUTPUT_VERSION / "work" / "captions"
FONT_REGULAR = "/System/Library/Fonts/STHeiti Light.ttc"
FONT_MEDIUM = "/System/Library/Fonts/STHeiti Medium.ttc"
CANVAS_SIZE = (1344, 768)

CAPTIONS = {
    "S01": [("旁白", "narration", "天天前两天身体不舒服，喝了妈妈给他熬制的中药后很快就痊愈了。经过这件事，天天对中医药产生了浓厚的兴趣。")],
    "S02": [
        ("天天 · 男童", "dialogue", "妈妈告诉我，磐安是中国药材之乡，我想去那里感受一下中医药的魅力。你们想去吗？"),
        ("图图 · 男童", "dialogue", "我想去！"),
        ("可可 · 女童", "dialogue", "我也想去！"),
    ],
    "S03": [("旁白", "narration", "天天、图图和可可到磐安拜访当地有名的中医温爷爷。")],
    "S04": [
        ("天天 · 男童", "dialogue", "温爷爷您好呀！我们想体验一下传统中医药，不知道您是否有时间指导我们呢？"),
        ("温爷爷 · 男声", "dialogue", "当然没问题了，欢迎你们！"),
    ],
    "S05": [
        ("旁白", "narration", "第二天一早，天天跟着温爷爷上山采药。"),
        ("温爷爷 · 男声", "dialogue", "今天我们要采摘金银花、菊花和薄荷，你负责采摘金银花吧！"),
    ],
    "S06": [
        ("天天 · 男童", "dialogue", "温爷爷，山上的植物太多了，我不知道哪种是金银花。"),
        ("温爷爷 · 男声", "dialogue", "金银花的花瓣呈长椭圆形，边缘微曲，且有黄色的花芯。"),
    ],
}


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines: list[str] = []
    current = ""
    for char in text:
        candidate = current + char
        width = draw.textbbox((0, 0), candidate, font=font)[2]
        if current and width > max_width:
            lines.append(current)
            current = char
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def render_caption(_label: str, _kind: str, text: str, output_path: Path) -> None:
    image = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    body_font = ImageFont.truetype(FONT_REGULAR, 40)
    lines = wrap_text(draw, text, body_font, 1110)

    line_height = 54
    box_width = 1216
    box_height = 32 + line_height * len(lines)
    box_left = (CANVAS_SIZE[0] - box_width) // 2
    box_top = CANVAS_SIZE[1] - box_height - 34
    draw.rounded_rectangle(
        (box_left, box_top, box_left + box_width, box_top + box_height),
        radius=18,
        fill=(15, 23, 42, 212),
    )

    text_top = box_top + 16
    for index, line in enumerate(lines):
        line_width = draw.textbbox((0, 0), line, font=body_font)[2]
        draw.text(
            ((CANVAS_SIZE[0] - line_width) / 2, text_top + index * line_height),
            line,
            font=body_font,
            fill=(255, 255, 255, 255),
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path)


def main() -> None:
    for shot_id, captions in CAPTIONS.items():
        for index, (label, kind, text) in enumerate(captions):
            render_caption(label, kind, text, OUTPUT_DIR / f"{shot_id}_{index}.png")


if __name__ == "__main__":
    main()
