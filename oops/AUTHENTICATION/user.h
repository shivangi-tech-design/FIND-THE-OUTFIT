
#ifndef USER_H
#define USER_H

#include <string>

class User
{
private:
    int userId;
    std::string username;
    std::string email;
    std::string passwordHash;
    bool isPrivate;

public:
    User(int id, std::string name, std::string mail,
         std::string pwdHash, bool privacy);

    void displayprofile();

    int getUserId() const;
    std::string getUsername() const;
    std::string getEmail() const;
    bool getPrivacy() const;

    // Generate a secure password hash
    static std::string hashPassword(const std::string& password);

    // Verify entered password against stored hash
    bool checkPassword(const std::string& password) const;
};

#endif
