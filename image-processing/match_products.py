import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModel
import torch.nn.functional as F
import csv

# Load DINOv2
processor = AutoImageProcessor.from_pretrained("facebook/dinov2-base")
model = AutoModel.from_pretrained("facebook/dinov2-base")
model.eval()


# Generate embedding
def get_embedding(image_path):

    image = Image.open(image_path).convert("RGB")

    inputs = processor(
        images=image,
        return_tensors="pt"
    )

    with torch.no_grad():
        outputs = model(**inputs)

    embedding = outputs.last_hidden_state[:, 0, :]

    # Normalize embedding
    embedding = F.normalize(
        embedding,
        p=2,
        dim=1
    )

    return embedding[0].tolist()


# Test image
user_image = "test_image.jpg"

# Generate embedding
embedding = get_embedding(user_image)


# Save embedding
output_file = "../database/products/query_embedding.csv"

with open(output_file, "w", newline="") as file:

    writer = csv.writer(file)

    writer.writerow(
        ["embedding_" + str(i) for i in range(768)]
    )

    writer.writerow(embedding)


print("Query embedding saved!")
print("Embedding size:", len(embedding))