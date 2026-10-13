
#include <iostream>
#include "user.h"
#include "authentication.h"
using namespace std;

void showUserDemo()
{
    User u1(100, "Ananya", "star@gmail.com", "pwd3/*A", true);
    u1.displayprofile();

    User u2(101, "Shivangi", "heyshivangi@gmail.com", "abS*&", false);
    u2.displayprofile();

    User u3(102, "Taniya", "taniya@gmail.com", "We23$#", true);
    u3.displayprofile();

    User u4(103, "Sakshi", "sakshi@gmail.com",
            "sakshi@gmail.com", false);
    u4.displayprofile();
}

void showMenu()
{
    cout << "===== FIND THE OUTFIT =====" << endl;
    cout << "1. Register" << endl;
    cout << "2. Login" << endl;
    cout << "3. Logout" << endl;
    cout << "4. Show User Demo Profiles" << endl;
    cout << "5. Exit" << endl;
    cout << "Enter your choice: ";
}

int main()
{
    Authentication auth;
    int choice;

    do
    {
        showMenu();
        cin >> choice;

        switch(choice)
        {
            case 1:
                auth.registerUser();
                break;

            case 2:
                auth.login();
                break;

            case 3:
                auth.logout();
                break;

            case 4:
                showUserDemo();
                break;

            case 5:
                cout<<"Goodbye!" << endl;
                break;

            default:
                cout << "Invalid choice!" << endl;
        }

        cout << endl;

    } while(choice != 5);

    return 0;
}
