package com.Hack.Server.Repo;

import com.Hack.Server.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepo extends JpaRepository<User, Integer> {
}
