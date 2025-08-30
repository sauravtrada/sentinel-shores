package com.Hack.Server.Repo;

import com.Hack.Server.Model.ImageLocation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ImageLocationRepo  extends JpaRepository<ImageLocation, Integer> {
}
