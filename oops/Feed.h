#ifndef FEED_H
#define FEED_H

#include "Post.h"

#include <cstddef>

class Feed {
private:
    struct Node {
        Post post;
        Node* next;
        Node* prev;

        Node(int userId, const std::string& imagePath, const std::string& caption);
    };

    Node* head;
    Node* tail;
    Node* current;
    std::size_t postCount;

    Node* findNode(int postId) const;

public:
    Feed();
    ~Feed();

    Feed(const Feed&) = delete;
    Feed& operator=(const Feed&) = delete;

    int addPost(int userId, const std::string& imagePath,
                const std::string& caption);
    bool deletePost(int postId);
    void displayFeed() const;
    Post* nextPost();
    Post* previousPost();
    Post* findPost(int postId) const;
    Post* currentPost() const;
    std::size_t size() const;
};

#endif
