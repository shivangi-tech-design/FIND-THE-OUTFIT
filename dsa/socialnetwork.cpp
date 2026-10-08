#include "SocialNetwork.h"

//Add users
void SocialNetwork::addUser(int userId)
{
    if (graph.find(userId) != graph.end())
    {
        cout<<"User already exists."<<endl;
        return;
    }
    graph[userId] = vector<int>();

    cout<<"User added successfully."<<endl;
}

//Follow users
void SocialNetwork::followUser(int user1,int user2){
    if(graph.find(user1) == graph.end() || graph.find(user2) == graph.end()){

        cout<<"one or both users do not exist."<<endl;
        return;
    }
    
    if(user1 == user2){

        cout<<"A user cannot follow themselves."<<endl;
        return;
    }

    for(int user : graph[user1]){
        
        if(user == user2){
            
            cout<<"User already follows this user."<<endl;
            return;

        }
    }

    graph[user1].push_back(user2);

    cout<<"User followed successfully."<<endl;
}

//Unfollow users
void SocialNetwork::unfollowUser(int user1, int user2)
{
    if (graph.find(user1) == graph.end() ||
        graph.find(user2) == graph.end())
    {
        cout << "One or both users do not exist." << endl;
        return;
    }

    for (auto it = graph[user1].begin(); it != graph[user1].end(); ++it)
    {
        if (*it == user2)
        {
            graph[user1].erase(it);
            cout << "User unfollowed successfully." << endl;
            return;
        }
    }

    cout << "User is not following this user." << endl;
}

//Check the following of user
void SocialNetwork::getFollowing(int userId)
{
    if (graph.find(userId) == graph.end())
    {
        cout << "User does not exist." << endl;
        return;
    }

    cout << "User " << userId << " follows: ";

    for (int user : graph[userId])
    {
        cout << user << " ";
    }

    cout << endl;
}

//Find the followers list(Searching everyone following list)
void SocialNetwork::getFollowers(int userId)
{
    if (graph.find(userId) == graph.end())
    {
        cout << "User does not exist." << endl;
        return;
    }

    cout << "Followers of User " << userId << ": ";

    for (auto& pair : graph)
    {
        int currentUser = pair.first;

        for (int followedUser : pair.second)
        {
            if (followedUser == userId)
            {
                cout << currentUser << " ";
            }
        }
    }

    cout << endl;
}