import cv2
import numpy as np
import os
import glob
import json
import uuid
import sys

def process_frames(source_path):
    # Setup directories
    masks_dir = os.path.join(source_path, 'masks')
    marked_dir = os.path.join(source_path, 'marked_frames')
    
    os.makedirs(masks_dir, exist_ok=True)
    os.makedirs(marked_dir, exist_ok=True)

    # Supported extensions (Transparency requires Alpha channel)
    extensions = ['*.png', '*.webp']
    files = []
    for ext in extensions:
        files.extend(glob.glob(os.path.join(source_path, ext)))

    all_coordinates = []

    for img_path in files:
        full_name = os.path.basename(img_path)
        name_without_ext = os.path.splitext(full_name)[0]
        
        img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
        
        if img is None or img.shape[2] < 4:
            continue

        # Extract Alpha Channel and create mask
        alpha = img[:, :, 3]
        _, mask = cv2.threshold(alpha, 10, 255, cv2.THRESH_BINARY_INV)
        cv2.imwrite(os.path.join(masks_dir, full_name), mask)

        # Find contours
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        marked_img = img.copy()
        
        for cnt in contours:
            if cv2.contourArea(cnt) < 500: # Filter noise
                continue

            rect = cv2.minAreaRect(cnt)
            (x, y), (w, h), angle = rect

            # Normalization logic for width/height and rotation (-45 to 45)
            if w < h:
                angle = angle - 90
                w, h = h, w
            
            while angle > 45:
                angle -= 90
                w, h = h, w
            while angle < -45:
                angle += 90
                w, h = h, w

            # Add to JSON list
            all_coordinates.append({
                "name": str(name_without_ext),
                "x": str(round(float(x), 2)),
                "y": str(round(float(y), 2)),
                "width": str(round(float(w), 2)),
                "height": str(round(float(h), 2)),
                "rotation": str(round(float(angle), 2)),
                "elevation": "0"
            })

            # Visualization on marked frames
            box = cv2.boxPoints(((x, y), (w, h), angle))
            box = box.astype(int)
            cv2.drawContours(marked_img, [box], 0, (0, 255, 0, 255), 3)
            cv2.circle(marked_img, (int(x), int(y)), 7, (0, 0, 255, 255), -1)

        cv2.imwrite(os.path.join(marked_dir, full_name), marked_img)

    # Sorting Logic: Name (ASC) -> X (ASC) -> Y (ASC)
    sorted_data = sorted(all_coordinates, key=lambda k: (k['name'], k['x'], k['y']))

    # Write to JSON
    json_path = os.path.join(source_path, 'coordinates.json')
    try:
        with open(json_path, 'w') as f:
            json.dump(sorted_data, f, indent=4)
    except Exception:
        pass

    # Print to stdout for Node.js
    print(json.dumps(sorted_data))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        folderpath = sys.argv[1]
        process_frames(folderpath)
    else:
        print(json.dumps([]))
