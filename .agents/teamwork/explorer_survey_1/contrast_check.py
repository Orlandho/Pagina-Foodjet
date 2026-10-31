def lum(r, g, b):
    def channel(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)

def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def contrast(h1, h2):
    l1 = lum(*hex_to_rgb(h1))
    l2 = lum(*hex_to_rgb(h2))
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

colors = {
    "primary_orange": "#F4511E",
    "primary_dark": "#D94310",
    "primary_light_peach": "#FCF0E4",
    "page_bg": "#F8F8F4",
    "white": "#FFFFFF",
    "text_dark": "#1C1C1C",
    "gray": "#6B6B66",
    "border": "#E6E4DC",
    "yellow": "#FCD460",
    "success_soft": "#ECF4EC",
    "success_deep": "#1E7B4F",
    "success": "#28A745",
    "danger": "#DC3545",
}

pairs = [
    ("White (#FFFFFF) on Primary Orange (#F4511E)", "#FFFFFF", "#F4511E"),
    ("Text Dark (#1C1C1C) on Primary Orange (#F4511E)", "#1C1C1C", "#F4511E"),
    ("Primary Orange (#F4511E) text on White (#FFFFFF)", "#F4511E", "#FFFFFF"),
    ("Primary Orange (#F4511E) text on Page Bg (#F8F8F4)", "#F4511E", "#F8F8F4"),
    ("Primary Dark (#D94310) text on White (#FFFFFF)", "#D94310", "#FFFFFF"),
    ("Primary Dark (#D94310) text on Page Bg (#F8F8F4)", "#D94310", "#F8F8F4"),
    ("Primary Orange (#F4511E) on Peach (#FCF0E4)", "#F4511E", "#FCF0E4"),
    ("Primary Dark (#D94310) on Peach (#FCF0E4)", "#D94310", "#FCF0E4"),
    ("Text Dark (#1C1C1C) on White (#FFFFFF)", "#1C1C1C", "#FFFFFF"),
    ("Text Dark (#1C1C1C) on Page Bg (#F8F8F4)", "#1C1C1C", "#F8F8F4"),
    ("Gray (#6B6B66) on White (#FFFFFF)", "#6B6B66", "#FFFFFF"),
    ("Gray (#6B6B66) on Page Bg (#F8F8F4)", "#6B6B66", "#F8F8F4"),
    ("Border (#E6E4DC) on White (#FFFFFF) [decorative]", "#E6E4DC", "#FFFFFF"),
    ("Border (#E6E4DC) on Page Bg (#F8F8F4) [decorative]", "#E6E4DC", "#F8F8F4"),
    ("Success Deep (#1E7B4F) on Success Soft (#ECF4EC)", "#1E7B4F", "#ECF4EC"),
    ("Success Deep (#1E7B4F) on White (#FFFFFF)", "#1E7B4F", "#FFFFFF"),
    ("Text Dark (#1C1C1C) on Yellow (#FCD460)", "#1C1C1C", "#FCD460"),
    ("White (#FFFFFF) on Danger (#DC3545)", "#FFFFFF", "#DC3545"),
    ("White (#FFFFFF) on Success (#28A745)", "#FFFFFF", "#28A745")
]

for name, c1, c2 in pairs:
    ratio = contrast(c1, c2)
    aa_normal = "PASS" if ratio >= 4.5 else "FAIL"
    aa_large = "PASS" if ratio >= 3.0 else "FAIL"
    print(f"{name:55} | Ratio: {ratio:5.2f}:1 | AA normal: {aa_normal} | AA large: {aa_large}")

print("--- Finding WCAG AA compliant text shades ---")
for hex_c in ["#D94310", "#D5400E", "#D03D0A", "#CC3A08", "#C73807", "#BF360C"]:
    print(f"{hex_c} on #FFFFFF: {contrast(hex_c, '#FFFFFF'):.2f}:1")
    print(f"{hex_c} on #F8F8F4: {contrast(hex_c, '#F8F8F4'):.2f}:1")
