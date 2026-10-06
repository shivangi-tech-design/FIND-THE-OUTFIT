#include "SocialNetwok.h"
#include<iostream>
void SocialNetwork :: addUser(string username)
{
    if(friends.find(username)==friends.end())
    {
       friends[username]={};
    }
}
void SocialNetwork :: addFriend(string user1 ,string user2)
{
    friends[user1].push_back(user2);
    friends[user2].push_back(user1);
}
void SocialNetwork :: showFriends(string username)
{
    cout<<"Friends of "<<username<<":\n";
    for(string friendName : friends[username])
    {
        cout<<friendName<<endl;
    }
}
void SocialNetwork::removeFriend(string user1, string user2)
{
    for (auto it = friends[user1].begin(); it != friends[user1].end(); it++)
    { 
        if (*it == user2)
        { friends[user1].erase(it);
          break;
        }
    }

    for (auto it = friends[user2].begin(); it != friends[user2].end(); it++)
    {
        if (*it == user1)
        { friends[user2].erase(it);
          break;
        }
    }
}