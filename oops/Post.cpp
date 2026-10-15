#include "Post.h"

#include <ctime>
#include <iomanip>
#include <iostream>
#include <sstream>

int Post::nextPostId = 1001;

Post::Post(int userIdValue, const std::string& imagePathValue,
           const std::string& captionValue)
    : postId(nextPostId++),
      userId(userIdValue),
      imagePath(imagePathValue),
      caption(captionValue),
      timestamp(currentTimestamp()) {
}

std::string Post::currentTimestamp() {
    const std::time_t now = std::time(NULL);
    const std::tm* localTime = std::localtime(&now);
    if (localTime == NULL) return "Time unavailable";

    std::ostringstream output;
    output << std::put_time(localTime, "%d %B %Y, %I:%M %p");
    return output.str();
}

int Post::getPostId() const { return postId; }
int Post::getUserId() const { return userId; }
const std::string& Post::getImagePath() const { return imagePath; }
const std::string& Post::getCaption() const { return caption; }
const std::string& Post::getTimestamp() const { return timestamp; }

void Post::setImagePath(const std::string& newImagePath) {
    imagePath = newImagePath;
}

void Post::setCaption(const std::string& newCaption) {
    caption = newCaption;
}

void Post::display() const {
    std::cout << "Post ID: " << postId
              << "\nUser ID: " << userId
              << "\nImage path/reference: " << imagePath
              << "\nCaption: " << caption
              << "\nTimestamp: " << timestamp << '\n';
}
