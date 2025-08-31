package com.Hack.Server.Repo;

import com.Hack.Server.Model.ImageLocation;
import com.Hack.Server.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ImageLocationRepo  extends JpaRepository<ImageLocation, Integer> {
    List<ImageLocation> findByUser(User user);

    List<ImageLocation> findByUserId(int userId);
}
