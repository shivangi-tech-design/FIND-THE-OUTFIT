import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModel
import torch.nn.functional as F
import csv

# Load DINOv2
processor = AutoImageProcessor.from_pretrained("facebook/dinov2-base")
model = AutoModel.from_pretrained("facebook/dinov2-base")
model.eval()


# Generate embedding for an image
def get_embedding(image_path):
    image = Image.open(image_path).convert("RGB")

    inputs = processor(images=image, return_tensors="pt")

    with torch.no_grad():
        outputs = model(**inputs)

    embedding = outputs.last_hidden_state[:, 0, :]

    # Normalize
    embedding = F.normalize(embedding, p=2, dim=1)

    return embedding


# Compare user image with product embeddings
def match_products(user_image):

    user_embedding = get_embedding(user_image)

    results = []

    with open("../database/products/product_embeddings.csv", "r") as file:
        reader = csv.reader(file)

        next(reader)  # Skip header

        for row in reader:
            product_id = row[0]

            values = [float(x) for x in row[1:]]

            product_embedding = torch.tensor(values).unsqueeze(0)

            similarity = F.cosine_similarity(
                user_embedding,
                product_embedding
            ).item()

            results.append((product_id, similarity))

    # Sort by similarity
    results.sort(key=lambda x: x[1], reverse=True)

    return results


# Test
user_image = "test_image.jpg"

results = match_products(user_image)

for product_id, score in results:
    print(product_id, "→", round(score, 4))