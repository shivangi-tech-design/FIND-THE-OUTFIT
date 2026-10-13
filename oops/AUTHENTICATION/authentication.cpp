#include<iostream>
#include<string>
#include<unordered_map>
#include <cctype>
#include"authentication.h"
using namespace std;

    void Authentication:: registerUser(){
        string username,email,password;
        cout<<"USERNAME:"<<endl;
        cin>>username;

        cout<<"E-MAIL:"<<endl;
        cin>>email;

        cout<<"PASSWORD:"<<endl;
        cin>>password;

        if(usersByUsername.find(username)!= usersByUsername.end()){
            cout<<"This username is already taken :("<<endl;
            return;
        }
        if(usersByEmail.find(email)!=usersByEmail.end()){
            cout<<"This email is already registered:("<<endl;
            return;
        }
        while(!validatepassword(password)){
        
            cout<<"invalid password"<<endl;
            cout<<"password must be of atleast 8 characters\npassword must contain atleast one special,upper and lower case character."<<endl; 
        
        
        cout<<"try another passkey:\n";
        cin>>password;
        
        }
            
        User newUser(nextsUserId, username, email, password, false);

        usersByUsername.insert({username, newUser});
        usersByEmail.insert({email, newUser});
        
        nextsUserId++;

        cout <<"Registration successful!"<< endl;

    }

    bool Authentication::validatepassword(const string& password){
        if(password.length() < 8){
            
            return 0;
        }
        bool upper=false;
        bool lower= false;
        bool special=false;
        for(int i=0;i<password.length();i++){
            if(isupper(password[i])){
                upper=true;
            }
            if(islower(password[i])){
                lower=true;
            }
            if(!isalnum(password[i])){
                special=true;
            }
             
        }
        if(upper &&lower && special){
            return true;
        }
        return false;
    }

    
    void Authentication::  login() {
    string username,password;

    if (isLoggedIn){
        cout<<"A user is already logged in.\n";
        return;
    }

    cout<<"USERNAME:\n";
    cin>>username;

    auto it=usersByUsername.find(username);

    if(it == usersByUsername.end()) {
        cout<<"Username doesn't exist.\n";
        return;
    }

    if(failedAttempts[username] >= 3) {
        cout<<"Login blocked after 3 incorrect attempts.\n";
        return;
    }

    cout<<"PASSWORD:\n";
    cin>>password;

    if(it->second.checkPassword(password)) {
        cout << "Login successful!\n";

        isLoggedIn=true;
        loggedInUsername= username;
        failedAttempts[username]= 0;
    }

    else {
        failedAttempts[username]++;

        cout<<"Incorrect password.\n";
        cout<<"Attempts used: "<< failedAttempts[username]<<"/3\n";

        if(failedAttempts[username]>= 3) {
            cout <<"Login blocked after 3 incorrect attempts.\n";
        }
    }
}



void Authentication:: logout() {
    if (!isLoggedIn) {
        cout<<"No user is currently logged in.\n";
        return;
    }
    cout<<loggedInUsername<< "logged out successfully!\n";

    isLoggedIn = false;
    loggedInUsername = "";
}
     


