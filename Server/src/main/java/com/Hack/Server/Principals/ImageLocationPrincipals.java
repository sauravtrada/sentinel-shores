package com.Hack.Server.Principals;

import com.Hack.Server.Model.ImageLocation;
import com.Hack.Server.Services.ImageLocationServices;

import java.security.Principal;

public class ImageLocationPrincipals implements ImageLocationServices {


    private ImageLocationServices repository;

    @Override
    public ImageLocation SaveImageLocation(ImageLocation IM) {
        ImageLocation NI = new ImageLocation();
        NI.setUser(IM.getUser());
        NI.setLatitude(IM.getLatitude());
        NI.setImage(IM.getImage());
        NI.setLatitude(IM.getLatitude());
        repository.SaveImageLocation(NI);
        return NI;
    }
//
//    @Override
//    public List<ImageLocation> getAllImageLocations() {
//        return repository.findAll();
//    }
//
//    @Override
//    public ImageLocation getImageLocationById(int id) {
//        Optional<ImageLocation> optional = repository.findBy(id);
//        return optional.orElse(null);
//    }



}
