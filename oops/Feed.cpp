#include "Feed.h"

#include <iostream>

Feed::Node::Node(int userId, const std::string& imagePath,
                 const std::string& caption)
    : post(userId, imagePath, caption), next(NULL), prev(NULL) {
}

Feed::Feed() : head(NULL), tail(NULL), current(NULL), postCount(0) {
}

Feed::~Feed() {
    Node* node = head;
    while (node != NULL) {
        Node* nextNode = node->next;
        delete node;
        node = nextNode;
    }
}

int Feed::addPost(int userId, const std::string& imagePath,
                  const std::string& caption) {
    Node* newNode = new Node(userId, imagePath, caption);

    // Link the old tail to the new node. An empty list has no old tail.
    newNode->prev = tail;
    if (tail != NULL) tail->next = newNode;
    else head = newNode;

    tail = newNode;
    if (current == NULL) current = newNode;
    ++postCount;
    return newNode->post.getPostId();
}

Feed::Node* Feed::findNode(int postId) const {
    Node* node = head;
    while (node != NULL) {
        if (node->post.getPostId() == postId) return node;
        node = node->next;
    }
    return NULL;
}

bool Feed::deletePost(int postId) {
    Node* node = findNode(postId);
    if (node == NULL) return false;

    // Connect the removed node's neighbors, or update an endpoint.
    if (node->prev != NULL) node->prev->next = node->next;
    else head = node->next;

    if (node->next != NULL) node->next->prev = node->prev;
    else tail = node->prev;

    // Do not leave current pointing to a node that is about to be freed.
    if (current == node)
        current = (node->next != NULL) ? node->next : node->prev;

    delete node;
    --postCount;
    return true;
}

void Feed::displayFeed() const {
    if (head == NULL) {
        std::cout << "The feed is empty.\n";
        return;
    }

    std::cout << "\nFeed (" << postCount << " post"
              << (postCount == 1 ? "" : "s") << ")\n";
    Node* node = head;
    while (node != NULL) {
        std::cout << "------------------------------\n";
        node->post.display();
        node = node->next;
    }
    std::cout << "------------------------------\n";
}

Post* Feed::nextPost() {
    if (current == NULL || current->next == NULL) return NULL;
    current = current->next;
    return &current->post;
}

Post* Feed::previousPost() {
    if (current == NULL || current->prev == NULL) return NULL;
    current = current->prev;
    return &current->post;
}

Post* Feed::findPost(int postId) const {
    Node* node = findNode(postId);
    return node == NULL ? NULL : &node->post;
}

Post* Feed::currentPost() const {
    return current == NULL ? NULL : &current->post;
}

std::size_t Feed::size() const { return postCount; }
