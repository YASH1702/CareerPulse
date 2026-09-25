import fitz
import json

doc = fitz.open(r"C:\Users\karih\Downloads\yashk.pdf")
page = doc[0]

# Render to PNG
pix = page.get_pixmap(dpi=150)
img_path = r"C:\Users\karih\.gemini\antigravity\brain\3826bc1f-ac8c-4c03-ba54-4ac2cabdb9ee\yashk_page1.png"
pix.save(img_path)
print(f"Saved image to {img_path}")

# Extract structured text with font, size, color, bbox
text_data = page.get_text("dict")
with open(r"D:\CareerPulse\CareerPulse\scripts\extracted_resume.json", "w", encoding="utf-8") as f:
    json.dump(text_data, f, indent=2)

print("Page rect:", page.rect)
fonts = set()
for b in text_data.get("blocks", []):
    if "lines" in b:
        for line in b["lines"]:
            for span in line["spans"]:
                fonts.add((span["font"], round(span["size"], 1), f"#{span['color']:06x}"))

print("=== FONTS, SIZES, COLORS USED ===")
for f in sorted(fonts):
    print(f)