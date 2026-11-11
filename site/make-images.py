# Cuts the website's page pictures out of the generated collage sheets.
#   python site/make-images.py "<folder with the generated sheets>" [contact-sheet.png]
# then: npm run build:site
#
# Each sheet is a grid of tiles; some carry a file-name label. Every crop below is a 4:3 box
# placed inside one tile so that the label (if any) falls outside it. Names follow the
# sheets' manifest.csv: the picture for /features/smart-pause/ is img/features/smart-pause.webp.
import os
import sys
from PIL import Image

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs", "assets", "img")
SIZE = (800, 600)

SHEETS = {
    "hero": "Home hero.png",
    2: "Auto Refresh Extension UI Gallery-2.png",
    5: "Free Auto Refresh UI Showcase-5.png",
    9: "Free Auto Refresh UI Feature Grid-9.png",
    10: "Auto Refresh Feature Guide Grid-10.png",
    12: "Auto Refresh Extension Feature Guide-12.png",
    14: "Auto Refresh Settings Montage-14.png",
    15: "Free Auto Refresh UI Collage-15.png",
    17: "Auto Refresh Interface Showcase-17.png",
    20: "Auto Refresh Extension UI Collage-20.png",
    23: "Auto Refresh Extension UI Gallery-23.png",
}

# output name: (sheet, left, top, width) - height is always width * 3/4
CROPS = {
    "index": ("hero", 332, 92, 1008),
    "home-watch": (10, 1163, 438, 362),
    "chrome": (23, 772, 738, 378),
    "firefox": (20, 386, 362, 380),

    "changelog": (20, 1154, 700, 380),
    "privacy": (20, 1154, 372, 380),

    "features/index": (9, 384, 108, 384),
    "use-cases/index": (2, 773, 45, 377),
    "guides/index": (2, 1157, 42, 377),
    "faq/index": (9, 0, 420, 384),

    "features/auto-refresh-timer": (15, 393, 402, 370),
    "features/random-interval-refresh": (17, 790, 452, 344),
    "features/page-monitor-keyword-alert": (9, 768, 420, 384),
    "features/on-page-countdown": (9, 384, 722, 384),
    "features/smart-pause": (9, 0, 722, 384),
    "features/keep-scroll-position": (14, 1160, 370, 370),
    "features/hard-reload-bypass-cache": (9, 768, 722, 384),
    "features/refresh-limits": (9, 384, 420, 384),
    "features/profiles-and-backup": (9, 1152, 722, 384),
    "features/languages": (20, 386, 702, 380),

    "use-cases/restock-alerts": (2, 773, 372, 377),
    "use-cases/price-tracking": (15, 393, 735, 370),
    "use-cases/ticket-sales": (9, 1152, 420, 384),
    "use-cases/appointment-slots": (9, 1152, 108, 384),
    "use-cases/online-auctions": (12, 535, 22, 465),
    "use-cases/exam-results": (17, 1175, 452, 344),
    "use-cases/order-and-application-status": (15, 1158, 400, 370),
    "use-cases/live-dashboards": (17, 1158, 56, 376),
    "use-cases/server-and-status-pages": (20, 770, 30, 380),
    "use-cases/web-development": (17, 400, 762, 344),
    "use-cases/job-boards": (23, 770, 58, 380),
    "use-cases/freelance-marketplaces": (20, 386, 30, 380),
    "use-cases/wordpress": (20, 770, 372, 380),
    "use-cases/sports-scores": (17, 795, 762, 344),
    "use-cases/stocks-and-crypto": (10, 776, 754, 358),

    "guides/how-to-auto-refresh-a-page": (15, 1158, 62, 370),
    "guides/how-to-hard-refresh": (5, 24, 728, 340),
    "guides/how-to-stop-auto-refresh": (14, 393, 30, 372),

    "compare/easy-auto-refresh-alternative": (23, 397, 420, 360),
    "compare/auto-refresh-plus-alternative": (9, 0, 104, 384),
}


def contact(src):
    """The contact tile is wider than 4:3 and has its label in the top-left corner.
    Paint the label over with the plain background just below it, then grow the tile
    to 4:3 by repeating its (plain background) top and bottom rows."""
    im = Image.open(os.path.join(src, "Pastel Auto Refresh Extension UI Collage-4.png")).convert("RGB")
    x, y, w, h = 1068, 776, 430, 236
    tile = im.crop((x, y, x + w, y + h))
    clean = tile.crop((0, 44, 110, 45)).resize((110, 44))  # the row under the label, stretched up over it
    tile.paste(clean, (0, 0))
    pad = (round(w * 3 / 4) - h) // 2
    pic = Image.new("RGB", (w, h + 2 * pad))
    pic.paste(tile.crop((0, 0, w, 1)).resize((w, pad)), (0, 0))
    pic.paste(tile, (0, pad))
    pic.paste(tile.crop((0, h - 1, w, h)).resize((w, pad)), (0, pad + h))
    pic = pic.resize(SIZE, Image.LANCZOS)
    pic.save(os.path.join(OUT, "contact.webp"), "WEBP", quality=86, method=6)
    return pic


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__ or "usage: make-images.py <sheets folder> [contact-sheet.png]")
    src = sys.argv[1]
    sheets = {}
    thumbs = []
    for name, (sheet, x, y, w) in CROPS.items():
        if sheet not in sheets:
            sheets[sheet] = Image.open(os.path.join(src, SHEETS[sheet])).convert("RGB")
        im = sheets[sheet]
        h = round(w * 3 / 4)
        if x < 0 or y < 0 or x + w > im.width or y + h > im.height:
            sys.exit(f"{name}: crop {x},{y} {w}x{h} is outside {SHEETS[sheet]} {im.size}")
        pic = im.crop((x, y, x + w, y + h)).resize(SIZE, Image.LANCZOS)
        dest = os.path.join(OUT, name + ".webp")
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        pic.save(dest, "WEBP", quality=86, method=6)
        thumbs.append(pic)
    thumbs.insert(0, contact(src))
    print(f"Wrote {len(CROPS) + 1} pictures to docs/assets/img/")

    if len(sys.argv) > 2:  # optional overview for checking the crops by eye
        cols, rows, tw, th = 4, 3, 400, 300
        base, ext = os.path.splitext(sys.argv[2])
        for n in range(0, len(thumbs), cols * rows):
            sheet = Image.new("RGB", (cols * (tw + 8) + 8, rows * (th + 8) + 8), "#222")
            for i, pic in enumerate(thumbs[n:n + cols * rows]):
                sheet.paste(pic.resize((tw, th), Image.LANCZOS), (8 + (i % cols) * (tw + 8), 8 + (i // cols) * (th + 8)))
            sheet.save(f"{base}-{n // (cols * rows) + 1}{ext}")


main()
