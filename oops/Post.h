#ifndef POST_H
#define POST_H

#include <string>

class Post {
private:
    int postId;
    int userId;
    std::string imagePath;
    std::string caption;
    std::string timestamp;

    static int nextPostId;
    static std::string currentTimestamp();

public:
    Post(int userId, const std::string& imagePath, const std::string& caption);

    int getPostId() const;
    int getUserId() const;
    const std::string& getImagePath() const;
    const std::string& getCaption() const;
    const std::string& getTimestamp() const;

    void setImagePath(const std::string& imagePath);
    void setCaption(const std::string& caption);
    void display() const;
};

#endif
