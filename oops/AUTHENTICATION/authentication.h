
#ifndef AUTHENTICATION_H
#define AUTHENTICATION_H

#include <string>
#include <unordered_map>
#include "user.h"

class Database;

class Authentication
{
private:
    // Existing OOP and DSA components
    std::unordered_map<std::string, User> usersByUsername;
    std::unordered_map<std::string, User> usersByEmail;
    std::unordered_map<std::string, int> failedAttempts;

    int nextsUserId = 1;
    int lastRegisteredUserId = -1;

    bool isLoggedIn = false;
    std::string loggedInUsername;
    int loggedInUserId = -1;

    // MySQL database connection
    Database* db = nullptr;

public:
    // Constructors
    Authentication();
    explicit Authentication(Database& database);

    // Existing console-based functions
    void registerUser();
    void login();
    void logout();

    // Functions used by the website APIs
    bool registerUser(
        const std::string& username,
        const std::string& email,
        const std::string& password,
        bool isPrivate,
        std::string& message
    );

    bool login(
        const std::string& username,
        const std::string& password,
        std::string& message
    );

    bool isUsernameAvailable(const std::string& username);

    // Password validation
    bool validatepassword(const std::string& password);

    // Existing getter functions
    int getLoggedInUserId() const;
    bool isUserLoggedIn() const;
    int getLastRegisteredUserId() const;
    bool isAccountPrivate(int userId) const;
    int getUserIdByUsername(const std::string& username) const;
};

#endif
