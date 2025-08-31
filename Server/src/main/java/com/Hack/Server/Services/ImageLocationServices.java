package com.Hack.Server.Services;

import com.Hack.Server.Model.ImageLocation;

import java.util.List;


public interface ImageLocationServices {

        ImageLocation SaveImageLocation(ImageLocation imageLocation);
        List<ImageLocation> getImagesByUserId(int userId);

}
