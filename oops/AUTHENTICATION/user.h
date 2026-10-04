#ifndef USER_H
#define USER_H
//not including iostream bcoz we r not using iostream objects here
#include<string>
using namespace std;

class User{
    private:
    int userId;
    string username;
    string email;
    string password;
    bool isPrivate;

    public:
    User(int id,string name,string mail,string pwd,bool pvt);
    void displayprofile();
    void pass();

};
#endif