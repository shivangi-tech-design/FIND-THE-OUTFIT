#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
using namespace std;

int main() {
    // query emvedding.cpp mein se file ko open karo 
    ifstream file("../database/products/query_embedding.csv");

    if (!file) {
        cout << "Could not open file!" << endl;
        return 1;
    }

    string line;

    // Skip header
    getline(file, line);
 
    // Read embedding values
    getline(file, line);
     // line ko ss mein store krdo
    stringstream ss(line);
    string value;

    vector<float> embedding;
    // stof means string to float 
    while (getline(ss, value, ',')) {
        embedding.push_back(stof(value));
    }

    cout << "Embedding size: " << embedding.size() << endl;

    return 0;
}