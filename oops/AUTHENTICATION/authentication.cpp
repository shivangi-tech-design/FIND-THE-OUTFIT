
#include "authentication.h"
#include "database.h"
#include <iostream>
#include <string>
#include <cctype>
#include <sstream>
#include <iomanip>
#include <vector>
#include <cstdlib>
#include <mysql.h>
#include <openssl/evp.h>
#include <openssl/rand.h>
#include <openssl/crypto.h>

using namespace std;

namespace
{
    const int HASH_ITERATIONS = 100000;
    const int SALT_SIZE = 16;
    const int HASH_SIZE = 32;

    string toHex(const unsigned char* data, int length)
    {
        stringstream ss;
        ss << hex << setfill('0');

        for (int i = 0; i < length; i++)
            ss << setw(2) << static_cast<int>(data[i]);

        return ss.str();
    }

    bool fromHex(const string& hexString, vector<unsigned char>& output)
    {
        if (hexString.size() % 2 != 0)
            return false;

        output.clear();

        for (size_t i = 0; i < hexString.size(); i += 2)
        {
            try
            {
                unsigned int value = stoul(hexString.substr(i, 2), nullptr, 16);
                output.push_back(static_cast<unsigned char>(value));
            }
            catch (...)
            {
                return false;
            }
        }

        return true;
    }

    string hashPassword(const string& password)
    {
        unsigned char salt[SALT_SIZE];
        unsigned char hash[HASH_SIZE];

        if (RAND_bytes(salt, SALT_SIZE) != 1)
            return "";

        if (PKCS5_PBKDF2_HMAC(
                password.c_str(),
                static_cast<int>(password.size()),
                salt,
                SALT_SIZE,
                HASH_ITERATIONS,
                EVP_sha256(),
                HASH_SIZE,
                hash) != 1)
            return "";

        return "pbkdf2$" +
               to_string(HASH_ITERATIONS) + "$" +
               toHex(salt, SALT_SIZE) + "$" +
               toHex(hash, HASH_SIZE);
    }

    bool verifyPassword(const string& password, const string& storedHash)
    {
        stringstream ss(storedHash);
        string algorithm, iterationsText, saltText, hashText;

        getline(ss, algorithm, '$');
        getline(ss, iterationsText, '$');
        getline(ss, saltText, '$');
        getline(ss, hashText, '$');

        if (algorithm != "pbkdf2" && algorithm != "pbkdf2_sha256")
    return false;
        int iterations;

        try
        {
            iterations = stoi(iterationsText);
        }
        catch (...)
        {
            return false;
        }

        if (iterations <= 0 || iterations > 1000000)
            return false;

        vector<unsigned char> salt;
        vector<unsigned char> originalHash;

        if (!fromHex(saltText, salt) ||
            !fromHex(hashText, originalHash))
            return false;

        if (salt.size() != SALT_SIZE ||
            originalHash.size() != HASH_SIZE)
            return false;

        unsigned char calculatedHash[HASH_SIZE];

        if (PKCS5_PBKDF2_HMAC(
                password.c_str(),
                static_cast<int>(password.size()),
                salt.data(),
                static_cast<int>(salt.size()),
                iterations,
                EVP_sha256(),
                HASH_SIZE,
                calculatedHash) != 1)
            return false;

        return CRYPTO_memcmp(
                   calculatedHash,
                   originalHash.data(),
                   HASH_SIZE) == 0;
    }

    string escapeSQL(MYSQL* connection, const string& value)
    {
        vector<char> buffer(value.size() * 2 + 1);

        unsigned long length = mysql_real_escape_string(
            connection,
            buffer.data(),
            value.c_str(),
            static_cast<unsigned long>(value.size()));

        return string(buffer.data(), length);
    }
}

// CONSTRUCTORS

Authentication::Authentication()
{
    db = nullptr;
}

Authentication::Authentication(Database& database)
{
    db = &database;
}

// PASSWORD VALIDATION

bool Authentication::validatepassword(const string& password)
{
    if (password.length() < 8)
        return false;

    bool upper = false;
    bool lower = false;
    bool special = false;

    for (unsigned char ch : password)
    {
        if (isupper(ch))
            upper = true;

        if (islower(ch))
            lower = true;

        if (!isalnum(ch))
            special = true;
    }

    return upper && lower && special;
}

// DATABASE REGISTRATION

bool Authentication::registerUser(
    const string& username,
    const string& email,
    const string& password,
    bool isPrivate,
    string& message)
{
    if (db == nullptr || !db->isConnected())
    {
        message = "Database is not connected.";
        return false;
    }

    if (username.empty() || email.empty() || password.empty())
    {
        message = "All fields are required.";
        return false;
    }

    if (!validatepassword(password))
    {
        message = "Password must contain at least 8 characters, one uppercase letter, one lowercase letter and one special character.";
        return false;
    }

    MYSQL* connection = db->getConnection();

    string safeUsername = escapeSQL(connection, username);
    string safeEmail = escapeSQL(connection, email);

    string checkQuery =
        "SELECT user_id FROM users WHERE username='" +
        safeUsername + "' OR email='" + safeEmail + "' LIMIT 1";

    if (mysql_query(connection, checkQuery.c_str()) != 0)
    {
        message = "Could not check existing account.";
        return false;
    }

    MYSQL_RES* result = mysql_store_result(connection);

    if (result == nullptr)
    {
        message = "Could not read database result.";
        return false;
    }

    bool alreadyExists = mysql_num_rows(result) > 0;
    mysql_free_result(result);

    if (alreadyExists)
    {
        message = "Username or email is already registered.";
        return false;
    }

    string passwordHash = hashPassword(password);

    if (passwordHash.empty())
    {
        message = "Password hashing failed.";
        return false;
    }

    string safeHash = escapeSQL(connection, passwordHash);

    string insertQuery =
        "INSERT INTO users "
        "(username, email, password_hash, display_name, is_private) VALUES ('" +
        safeUsername + "', '" +
        safeEmail + "', '" +
        safeHash + "', '" +
        safeUsername + "', " +
        (isPrivate ? "1" : "0") + ")";

    if (mysql_query(connection, insertQuery.c_str()) != 0)
    {
        message = "Registration failed: " + string(mysql_error(connection));
        return false;
    }

    int newUserId = static_cast<int>(mysql_insert_id(connection));

    User newUser(newUserId, username, email, "", isPrivate);

    usersByUsername.insert_or_assign(username, newUser);
    usersByEmail.insert_or_assign(email, newUser);

    lastRegisteredUserId = newUserId;
    nextsUserId = newUserId + 1;

    message = "Registration successful!";
    return true;
}

// DATABASE LOGIN

bool Authentication::login(
    const string& username,
    const string& password,
    string& message)
{
    if (db == nullptr || !db->isConnected())
    {
        message = "Database is not connected.";
        return false;
    }

    if (failedAttempts[username] >= 3)
    {
        message = "Login blocked after 3 incorrect attempts.";
        return false;
    }

    MYSQL* connection = db->getConnection();

    string safeUsername = escapeSQL(connection, username);

    string query =
        "SELECT user_id, email, password_hash, is_private "
        "FROM users WHERE username='" +
        safeUsername + "' LIMIT 1";

    if (mysql_query(connection, query.c_str()) != 0)
    {
        message = "Login query failed.";
        return false;
    }

    MYSQL_RES* result = mysql_store_result(connection);

    if (result == nullptr)
    {
        message = "Could not read login result.";
        return false;
    }

    MYSQL_ROW row = mysql_fetch_row(result);

    if (row == nullptr)
    {
        mysql_free_result(result);
        message = "Username does not exist.";
        return false;
    }

    int userId = atoi(row[0]);
    string email = row[1] ? row[1] : "";
    string storedHash = row[2] ? row[2] : "";
    bool isPrivate = row[3] && atoi(row[3]) != 0;

    mysql_free_result(result);

    if (!verifyPassword(password, storedHash))
    {
        failedAttempts[username]++;

        message = "Incorrect password. Attempts used: " +
                  to_string(failedAttempts[username]) + "/3";

        if (failedAttempts[username] >= 3)
            message += ". Login blocked.";

        return false;
    }

    failedAttempts[username] = 0;

    User loggedInUser(userId, username, email, "", isPrivate);

    usersByUsername.insert_or_assign(username, loggedInUser);
    usersByEmail.insert_or_assign(email, loggedInUser);

    isLoggedIn = true;
    loggedInUsername = username;
    loggedInUserId = userId;

    message = "Login successful!";
    return true;
}

// CHECK USERNAME AVAILABILITY

bool Authentication::isUsernameAvailable(const string& username)
{
    if (db == nullptr || !db->isConnected())
        return false;

    MYSQL* connection = db->getConnection();

    string safeUsername = escapeSQL(connection, username);

    string query =
        "SELECT user_id FROM users WHERE username='" +
        safeUsername + "' LIMIT 1";

    if (mysql_query(connection, query.c_str()) != 0)
        return false;

    MYSQL_RES* result = mysql_store_result(connection);

    if (result == nullptr)
        return false;

    bool available = mysql_num_rows(result) == 0;

    mysql_free_result(result);

    return available;
}

// ORIGINAL CONSOLE REGISTRATION

void Authentication::registerUser()
{
    string username, email, password;

    cout << "USERNAME:\n";
    cin >> username;

    cout << "E-MAIL:\n";
    cin >> email;

    cout << "PASSWORD:\n";
    cin >> password;

    if (usersByUsername.find(username) != usersByUsername.end())
    {
        cout << "This username is already taken.\n";
        return;
    }

    if (usersByEmail.find(email) != usersByEmail.end())
    {
        cout << "This email is already registered.\n";
        return;
    }

    while (!validatepassword(password))
    {
        cout << "Invalid password. Use at least 8 characters, "
             << "one uppercase, one lowercase and one special character.\n";
        cin >> password;
    }

    int privacyChoice;

    cout << "1. Public account\n";
    cout << "2. Private account\n";
    cout << "Enter choice: ";
    cin >> privacyChoice;

    while (privacyChoice != 1 && privacyChoice != 2)
    {
        cout << "Enter 1 or 2: ";
        cin >> privacyChoice;
    }

    bool isPrivate = (privacyChoice == 2);

    User newUser(nextsUserId, username, email, password, isPrivate);

    usersByUsername.insert_or_assign(username, newUser);
    usersByEmail.insert_or_assign(email, newUser);

    lastRegisteredUserId = nextsUserId;
    nextsUserId++;

    cout << "Registration successful!\n";
}

// ORIGINAL CONSOLE LOGIN

void Authentication::login()
{
    string username, password;

    if (isLoggedIn)
    {
        cout << "A user is already logged in.\n";
        return;
    }

    cout << "USERNAME:\n";
    cin >> username;

    auto it = usersByUsername.find(username);

    if (it == usersByUsername.end())
    {
        cout << "Username doesn't exist.\n";
        return;
    }

    if (failedAttempts[username] >= 3)
    {
        cout << "Login blocked after 3 incorrect attempts.\n";
        return;
    }

    cout << "PASSWORD:\n";
    cin >> password;

    if (it->second.checkPassword(password))
    {
        isLoggedIn = true;
        loggedInUsername = username;
        loggedInUserId = it->second.getUserId();
        failedAttempts[username] = 0;

        cout << "Login successful!\n";
    }
    else
    {
        failedAttempts[username]++;

        cout << "Incorrect password. Attempts used: "
             << failedAttempts[username] << "/3\n";
    }
}

// LOGOUT

void Authentication::logout()
{
    if (!isLoggedIn)
    {
        cout << "No user is currently logged in.\n";
        return;
    }

    cout << loggedInUsername << " logged out successfully!\n";

    isLoggedIn = false;
    loggedInUsername = "";
    loggedInUserId = -1;
}

// GETTERS

int Authentication::getLoggedInUserId() const
{
    return loggedInUserId;
}

bool Authentication::isUserLoggedIn() const
{
    return isLoggedIn;
}

int Authentication::getLastRegisteredUserId() const
{
    return lastRegisteredUserId;
}

bool Authentication::isAccountPrivate(int userId) const
{
    for (const auto& entry : usersByUsername)
    {
        if (entry.second.getUserId() == userId)
            return entry.second.getPrivacy();
    }

    return true;
}

int Authentication::getUserIdByUsername(const string& username) const
{
    auto it = usersByUsername.find(username);

    if (it == usersByUsername.end())
        return -1;

    return it->second.getUserId();
}
