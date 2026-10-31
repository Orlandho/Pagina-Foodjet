import re

with open(r'c:\Users\ORLANDO\Desktop\Pagina-Foodjet\frontend\index.html', encoding='utf-8') as f:
    html = f.read()

ids = re.findall(r'id=["\']([a-zA-Z0-9_-]+)["\']', html)
print(f"Total IDs found: {len(ids)}, Unique IDs: {len(set(ids))}")

# Group IDs by section/context
sections = {}
current_sec = "global"

for line in html.splitlines():
    sec_match = re.search(r'<div\s+id=["\']([a-zA-Z0-9_-]+View|.*Offcanvas|.*Modal)["\']', line)
    if sec_match:
        current_sec = sec_match.group(1)
        sections[current_sec] = []
    id_matches = re.findall(r'id=["\']([a-zA-Z0-9_-]+)["\']', line)
    for m in id_matches:
        sections.setdefault(current_sec, []).append(m)

for sec, id_list in sections.items():
    print(f"\n--- Section: {sec} ({len(id_list)} IDs) ---")
    print(", ".join(sorted(set(id_list))))
