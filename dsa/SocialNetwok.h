#ifndef SOCIALNETWORK_H
#define SOCIALNETWORK_H

#include<string>
#include<vector>
#include<unordered_map>
using namespace std;

class SocialNetwork{
    private :
       unordered_map<string,vector<string>>friends;
    public:
       void addUser(string username);
       void addFriend(string user1,string user2);
       void showFriends(string username);
       void removeFriend(string user1,string user2);
};

#endif