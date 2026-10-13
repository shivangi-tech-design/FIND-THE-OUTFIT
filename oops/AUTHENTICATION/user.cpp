 #include"user.h"
#include<iostream>
using namespace std;

User::User(int id,string name,string mail,string pwd,bool privacy){
userId=id;
username=name;
email=mail;
password=pwd;
isPrivate=privacy;
}

void User::displayprofile(){
    cout<<"-----PROFILE-----"<<endl;
    cout<<"USER ID= "<<userId<<endl;
    cout<<"NAME= "<<username<<endl;
    cout<<"EMAIL ID= "<<email<<endl;
    cout<<"YOUR ACCOUNT IS "<<(isPrivate ? "PRIVATE" : "PUBLIC")<<endl<<endl;
}

bool User::checkPassword(const string& password) {
    return this->password == password;
}

