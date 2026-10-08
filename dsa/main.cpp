#include "SocialNetwork.h"

int main()
{
    SocialNetwork network;

    //Test1
    // network.addUser(1);
    // network.addUser(2);
    // network.addUser(3);

    // network.followUser(1, 2);
    // network.followUser(1, 3);
    // network.followUser(2, 3);

    // network.getFollowing(1);
    // network.getFollowing(2);

    // network.getFollowers(3);

    // network.unfollowUser(1, 2);

    // network.getFollowing(1);

    //Test2
    network.addUser(1);
    network.addUser(1);
    network.addUser(2);
    network.addUser(3);

    network.followUser(1,5);

    network.followUser(1,2);
    network.followUser(1,2);

    network.unfollowUser(3,1);
    network.followUser(1,1);



     return 0;
}