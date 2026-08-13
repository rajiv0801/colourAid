import math
import random
from PIL import Image, ImageDraw, ImageFont
import os

def generate_ishihara_plate(number, bg_colors, fg_colors, filename):
    width, height = 400, 400
    img = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Draw the number mask
    mask = Image.new('L', (width, height), 0)
    mask_draw = ImageDraw.Draw(mask)
    
    try:
        font = ImageFont.truetype("arial.ttf", 250)
    except:
        font = ImageFont.load_default()
        
    # Center the text
    text_bbox = mask_draw.textbbox((0, 0), str(number), font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    x = (width - text_width) / 2
    y = (height - text_height) / 2 - text_bbox[1] # Adjust for font ascent
    mask_draw.text((x, y), str(number), fill=255, font=font)

    # Generate dots
    dots = []
    center_x, center_y = width / 2, height / 2
    radius = 180

    # Try to place many dots
    for _ in range(8000):
        dot_r = random.uniform(3, 8)
        dot_x = random.uniform(center_x - radius + dot_r, center_x + radius - dot_r)
        dot_y = random.uniform(center_y - radius + dot_r, center_y + radius - dot_r)
        
        # Check if inside main circle
        if math.hypot(dot_x - center_x, dot_y - center_y) < radius - dot_r:
            # Check overlap with existing dots
            overlap = False
            for dx, dy, dr in dots:
                if math.hypot(dot_x - dx, dot_y - dy) < dot_r + dr + 1:
                    overlap = True
                    break
            
            if not overlap:
                dots.append((dot_x, dot_y, dot_r))
                
                # Check if dot is inside the number text
                is_fg = mask.getpixel((int(dot_x), int(dot_y))) > 128
                
                color = random.choice(fg_colors) if is_fg else random.choice(bg_colors)
                # Add slight random brightness variation
                variation = random.randint(-10, 10)
                color = tuple(max(0, min(255, c + variation)) for c in color)
                
                draw.ellipse(
                    [(dot_x - dot_r, dot_y - dot_r), (dot_x + dot_r, dot_y + dot_r)],
                    fill=color
                )

    # Make background transparent and return crop to circle
    img = img.convert("RGBA")
    datas = img.getdata()
    newData = []
    for item in datas:
        if item[0] == 255 and item[1] == 255 and item[2] == 255:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    img.putdata(newData)
    
    os.makedirs('assets', exist_ok=True)
    img.save(f'assets/{filename}')

# Plate 1: Control (Everyone sees 12) - Orange/Yellow BG, Green/Blue FG
generate_ishihara_plate(
    12,
    bg_colors=[(235, 120, 50), (240, 160, 60), (220, 140, 80), (250, 200, 100)],
    fg_colors=[(70, 150, 100), (90, 170, 120), (50, 130, 80), (80, 160, 140)],
    filename='plate_1.png'
)

# Plate 2: Protan/Deutan (Normal sees 8, RG sees 3) - Red/Orange BG, Green FG
generate_ishihara_plate(
    8,
    bg_colors=[(210, 80, 60), (230, 100, 80), (240, 130, 100), (200, 60, 40)],
    fg_colors=[(80, 160, 90), (100, 180, 110), (60, 140, 70), (120, 180, 140)],
    filename='plate_2.png'
)

# Plate 3: Tritan (Normal sees 6, BY might miss it) - Green/Yellow BG, Purple/Blue FG
generate_ishihara_plate(
    6,
    bg_colors=[(120, 180, 100), (140, 200, 120), (160, 210, 80), (180, 220, 140)],
    fg_colors=[(150, 100, 180), (120, 80, 150), (170, 120, 200), (100, 70, 130)],
    filename='plate_3.png'
)
print("Finished generating plates.")
