#include "SocialNetwok.h"
#include<iostream>
int main(){
    SocialNetwork network;
    //adding users
    network.addUser("Sakshi");
    network.addUser("Shivangi");
    network.addUser("Ananya");
    network.addUser("Taniya");
    
    //adding friends to users
    network.addFriend("Sakshi","Shivangi");
    network.addFriend("Sakshi","Ananya");
    
    //show the friends
    network.showFriends("Sakshi");
   
    //remove friend
    network.removeFriend("Sakshi","Shivangi");
    cout<<"\nAfter removing Shivangi :\n";
    network.showFriends("Sakshi");

    return 0;
}