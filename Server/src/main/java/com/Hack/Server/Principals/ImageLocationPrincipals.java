package com.Hack.Server.Principals;

import com.Hack.Server.Model.ImageLocation;
import com.Hack.Server.Model.User;
import com.Hack.Server.Repo.ImageLocationRepo;
import com.Hack.Server.Repo.UserRepo;
import com.Hack.Server.Services.ImageLocationServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service  // Make Spring recognize this as a bean
public class ImageLocationPrincipals implements ImageLocationServices {

    @Autowired
    private UserRepo userRepository;

    @Autowired
    private ImageLocationRepo imageLocationRepo;

    @Override
    public ImageLocation SaveImageLocation(ImageLocation imageLocation) {
        // Check if user exists
        User user = userRepository.findByEmail(imageLocation.getUser().getEmail()).orElse(null);
        if (user == null) {
            return null;
        }

        //Attach the existing user entity
        imageLocation.setUser(user);

        // Save directly instead of creating a duplicate object
        return imageLocationRepo.save(imageLocation);
    }


    public List<ImageLocation> getImagesByUserId(int userId) {
        return imageLocationRepo.findByUserId(userId);
    }


}
