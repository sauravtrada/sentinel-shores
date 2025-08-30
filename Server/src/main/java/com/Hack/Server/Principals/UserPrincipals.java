package com.Hack.Server.Principals;

import com.Hack.Server.Model.User;
import com.Hack.Server.Repo.UserRepo;
import com.Hack.Server.Services.UserServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;


@Service
    public class UserPrincipals implements UserServices {

        @Autowired
        private UserRepo userRepo;


        public boolean authenticate(String email, String password) {
            Optional<User> userOpt = userRepo.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                // Plain text password check (for demo only)
                return user.getPassword().equals(password);
            }
            return false;
        }

        public User getUserByEmail(String email) {
            return userRepo.findByEmail(email).orElse(null);
        }

        @Override
        public User findUserById(Integer id) {
            User user = userRepo.findById(id).get();
            return user;
        }

        @Override
        public List<User> GetAllUser() {
            List<User> users = userRepo.findAll();
            return users;
        }

        @Override
        public User SaveUser(User user) {


            if(userRepo.save(user)!=null){
                System.out.println(HttpStatus.OK);
            }
            else{
                System.out.println("Somthing went Wrong");
            }
            // return HttpStatus.OK;
            return user;
        }

        @Override
        public void UpdateUser(int UID,User user) {
            User NewUser = userRepo.findById(UID).get();
            NewUser.setEmail(user.getEmail());
            NewUser.setPassword(user.getPassword());
            NewUser.setFoulConunt(user.getFoulConunt());
            NewUser.setMarit(user.getMarit());

            userRepo.save(NewUser);
        }

        @Override
        public int DeleteUser(int uid) {
            userRepo.deleteById(uid);
            return uid;
        }



}
