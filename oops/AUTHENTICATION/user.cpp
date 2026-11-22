
#include "user.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <vector>
#include <openssl/evp.h>
#include <openssl/rand.h>
#include <openssl/crypto.h>

using namespace std;

const int ITERATIONS = 210000;
const int SALT_SIZE = 16;
const int HASH_SIZE = 32;

// Convert bytes into hexadecimal string
string toHex(const unsigned char* data, int length)
{
    stringstream ss;

    for (int i = 0; i < length; i++)
    {
        ss << hex << setw(2) << setfill('0')
           << (int)data[i];
    }

    return ss.str();
}

// Convert hexadecimal string into bytes
bool fromHex(const string& hexString,
             vector<unsigned char>& result)
{
    if (hexString.length() % 2 != 0)
        return false;

    result.clear();

    for (size_t i = 0; i < hexString.length(); i += 2)
    {
        try
        {
            unsigned int value =
                stoul(hexString.substr(i, 2), nullptr, 16);

            result.push_back(static_cast<unsigned char>(value));
        }
        catch (...)
        {
            return false;
        }
    }

    return true;
}

// Constructor
User::User(int id, string name, string mail,
           string pwdHash, bool privacy)
{
    userId = id;
    username = name;
    email = mail;
    passwordHash = pwdHash;
    isPrivate = privacy;
}

// Display profile
void User::displayprofile()
{
    cout << "User ID: " << userId << endl;
    cout << "Username: " << username << endl;
    cout << "Email: " << email << endl;
    cout << "Privacy: "
         << (isPrivate ? "Private" : "Public") << endl;
}

// Getters
int User::getUserId() const
{
    return userId;
}

string User::getUsername() const
{
    return username;
}

string User::getEmail() const
{
    return email;
}

bool User::getPrivacy() const
{
    return isPrivate;
}

// Generate password hash
string User::hashPassword(const string& password)
{
    unsigned char salt[SALT_SIZE];
    unsigned char hash[HASH_SIZE];

    if (RAND_bytes(salt, SALT_SIZE) != 1)
        return "";

    if (PKCS5_PBKDF2_HMAC(
            password.c_str(),
            static_cast<int>(password.length()),
            salt,
            SALT_SIZE,
            ITERATIONS,
            EVP_sha256(),//	SHA-256 as the underlying hash algorithm
            HASH_SIZE,//REQUIRED OP SIZE
            hash) != 1) //array where generated hash is stored
    {
        return "";
    }

    return "pbkdf2_sha256$" +
           to_string(ITERATIONS) + "$" +
           toHex(salt, SALT_SIZE) + "$" +
           toHex(hash, HASH_SIZE);
}

// Verify password
bool User::checkPassword(const string& password) const
{
    stringstream ss(passwordHash);

    string algorithm;
    string iterationText;
    string saltText;
    string hashText;

    getline(ss, algorithm, '$');
    getline(ss, iterationText, '$');
    getline(ss, saltText, '$');
    getline(ss, hashText, '$');

    if (algorithm != "pbkdf2_sha256")
        return false;

    int iterations;

    try
    {
        size_t pos = 0;
        iterations = stoi(iterationText, &pos);

        if (pos != iterationText.length() ||
            iterations < 100000 ||
            iterations > 1000000)
            return false;
    }
    catch (...)
    {
        return false;
    }

    vector<unsigned char> salt;
    vector<unsigned char> storedHash;

    if (!fromHex(saltText, salt) ||
        !fromHex(hashText, storedHash))
        return false;

    if (salt.size() != SALT_SIZE ||
        storedHash.size() != HASH_SIZE)
        return false;

    unsigned char newHash[HASH_SIZE];

    if (PKCS5_PBKDF2_HMAC(
            password.c_str(),
            static_cast<int>(password.length()),
            salt.data(),
            static_cast<int>(salt.size()),
            iterations,
            EVP_sha256(),
            HASH_SIZE,
            newHash) != 1)
    {
        return false;
    }

    return CRYPTO_memcmp(
        newHash,
        storedHash.data(),
        HASH_SIZE) == 0;
}
