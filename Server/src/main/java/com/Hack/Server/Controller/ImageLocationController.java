package com.Hack.Server.Controller;

import com.Hack.Server.Services.ImageLocationServices;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ImageLocationController {

//    @PostMapping("/upload")
//    public String uploadImageLocation(@RequestBody ImageLocationServices data) {
//        // Example logic:
//        System.out.println("User ID: " + data.getUserid());
//        System.out.println("Latitude: " + data.getLatitude());
//        System.out.println("Longitude: " + data.getLongitude());
//        System.out.println("Image Base64 (first 30 chars): " + data.getImage().substring(0, 30) + "...");
//
//        return "Data received successfully.";
//    }

}