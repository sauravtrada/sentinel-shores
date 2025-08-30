package com.Hack.Server.Principals;

import com.Hack.Server.Model.ImageLocation;
import com.Hack.Server.Model.User;
import com.Hack.Server.Repo.ImageLocationRepo;
import com.Hack.Server.Repo.UserRepo;
import com.Hack.Server.Services.ImageLocationServices;
import org.springframework.beans.factory.annotation.Autowired;

public class ImageLocationPrincipals implements ImageLocationServices {

    @Autowired
    private UserRepo userRepository;

    @Autowired
    private ImageLocationRepo IR;



    @Override
    public ImageLocation SaveImageLocation(ImageLocation IM) {
        User user = userRepository.findByEmail(IM.getUser().getEmail()).orElse(null);
        if (user == null) return null;

        ImageLocation NI = new ImageLocation();
        NI.setUser(IM.getUser());
        NI.setLatitude(IM.getLatitude());
        NI.setImage(IM.getImage());
        NI.setLatitude(IM.getLatitude());
        IR.save(NI);
        return NI;
    }







}
