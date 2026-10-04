import torch
import csv
from PIL import Image
from transformers import AutoImageProcessor, AutoModel
import os

# Load DINOv2
processor = AutoImageProcessor.from_pretrained("facebook/dinov2-base")
model = AutoModel.from_pretrained("facebook/dinov2-base")

model.eval()

# Product images folder
image_folder = "../database/products/images"

# Output embeddings file
output_file = "../database/products/product_embeddings.csv"

# Product image names
products = ["p001", "p002", "p003"]

with open(output_file, "w", newline="") as file:
    writer = csv.writer(file)

    # CSV header
    writer.writerow(
        ["product_id"] + [f"embedding_{i}" for i in range(768)]
    )

    for product_id in products:

        # Find image
        image_path = os.path.join(
            image_folder, product_id + ".jpg"
        )

        # Open image
        image = Image.open(image_path).convert("RGB")

        # Prepare image for DINOv2
        inputs = processor(
            images=image,
            return_tensors="pt"
        )

        # Generate embedding
        with torch.no_grad():
            outputs = model(**inputs)

        # Take CLS embedding
        embedding = outputs.last_hidden_state[:, 0, :]

        # Normalize embedding
        embedding = torch.nn.functional.normalize(
            embedding, p=2, dim=1
        )

        # Convert to list
        embedding = embedding[0].tolist()

        # Save to CSV
        writer.writerow(
            [product_id] + embedding
        )

        print(f"{product_id} embedding generated")

print("All product embeddings saved!")