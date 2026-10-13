#ifndef AUTHENTICATION_H
#define AUTHENTICATION_H

#include <string>
#include <unordered_map>
#include "user.h"
using namespace std;

class Authentication {
private:
    unordered_map<string,User>usersByUsername;
    unordered_map<string,User>usersByEmail;
    unordered_map<string,int>failedAttempts;

    int nextsUserId= 1;
    bool isLoggedIn= false;
    string loggedInUsername;

public:
    void registerUser();
    bool validatepassword(const string& password);
    void login();
    void logout();
};

#endif