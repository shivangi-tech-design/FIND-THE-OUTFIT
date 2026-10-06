#include <iostream>
#include <unordered_map>
#include <queue>
#include <string>
#include <vector>
#include <fstream>
#include <sstream>
using namespace std;

class MatchingEngine {
    private:
    unordered_map<string, float> scores;
    public:
    void addScore(string productId, float similarity) {
        scores[productId] = similarity;
    }
    float calculateSimilarity(
    vector<float>& query,
    vector<float>& product
) {
    float similarity = 0;

    for (int i = 0; i < 768; i++) {
        similarity += query[i] * product[i];
    }

    return similarity;
}

vector<float> readEmbedding(string filePath) {

    ifstream file(filePath);

    vector<float> embedding;

    if (!file) {
        cout << "Could not open file!" << endl;
        return embedding;
    }

    string line;

    // Skip header
    getline(file, line);

    // Read embedding values
    getline(file, line);

    stringstream ss(line);
    string value;

    while (getline(ss, value, ',')) {
        embedding.push_back(stof(value));
    }

    return embedding;
}

unordered_map<string, vector<float>> readProductEmbeddings(string filePath) {

    ifstream file(filePath);

    unordered_map<string, vector<float>> products;

    if (!file) {
        cout << "Could not open file!" << endl;
        return products;
    }

    string line;

    // Skip header
    getline(file, line);

    while (getline(file, line)) {

        stringstream ss(line);
        string value;

        // First value is product ID
        getline(ss, value, ',');
        string productId = value;

        vector<float> embedding;

        // Remaining values are embedding numbers
        while (getline(ss, value, ',')) {
            embedding.push_back(stof(value));
        }

        products[productId] = embedding;
    }

    return products;
}

void matchProducts(
    vector<float>& query,
    unordered_map<string, vector<float>>& products
) {
    for (auto& product : products) {

        string productId = product.first;
        vector<float>& embedding = product.second;

        float similarity =
            calculateSimilarity(query, embedding);

        addScore(productId, similarity);
    }
}

    void rankProducts() {

    priority_queue<pair<float, string>> pq;

    for (auto &item : scores) {
        pq.push({item.second, item.first});
    }

    while (!pq.empty()) {
        cout << pq.top().second
             << " → "
             << pq.top().first
             << endl;

        pq.pop();
    }
}
    
};



int main() {

    MatchingEngine engine;

    // Read query embedding
    vector<float> query =
        engine.readEmbedding("../database/products/query_embedding.csv");

    // Read all product embeddings
    unordered_map<string, vector<float>> products =
        engine.readProductEmbeddings(
            "../database/products/product_embeddings.csv"
        );

    // Calculate similarity for every product
    engine.matchProducts(query, products);

    // Rank products
    engine.rankProducts();

    return 0;
}