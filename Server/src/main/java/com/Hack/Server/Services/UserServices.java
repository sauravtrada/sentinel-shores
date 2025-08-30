package com.Hack.Server.Services;

import com.Hack.Server.Model.User;

import java.util.List;

public interface UserServices {

    User SaveUser(User user);

    User findUserById(Integer id);

    List<User> GetAllUser();

    void UpdateUser(int id, User user);

    int DeleteUser(int uid);

    User getUserByEmail(String email);

    boolean authenticate(String email, String password);

}
