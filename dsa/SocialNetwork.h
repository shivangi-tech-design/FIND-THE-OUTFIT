#ifndef SOCIALNETWORK_H
#define SOCIALNETWORK_H

#include <unordered_map>
#include <vector>
#include <iostream>

using namespace std;

class SocialNetwork
{
private:
    unordered_map<int, vector<int>> graph;

public:
    void addUser(int userId);
    void followUser(int user1, int user2);
    void unfollowUser(int user1, int user2);
    void getFollowing(int userId);
    void getFollowers(int userId);
};

#endif