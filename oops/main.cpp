#include"user.h"

int main(){
    User u1(100,"Ananya","star@gmail.com","pwd3/*A",true);
    u1.displayprofile();
    User u2(101,"Shivangi","heyshivangi@gmail.com","abS*&",false);
    u2.displayprofile();
    User u3(102,"Taniya","taniya@gmail.com","We23$#",true);
    u3.displayprofile();
    User u4(103,"Sakshi","sakshi@gmail.com","sakshi@gmail.com",false);
    u4.displayprofile();
}