package com.Hack.Server.Controller;

import com.Hack.Server.Model.ImageLocation;
import com.Hack.Server.Services.ImageLocationServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/login/Upload")
public class ImageLocationController {

    @Autowired
    private ImageLocationServices imageLocationServices;

    @PostMapping("/upload")
    public String uploadImageLocation(@RequestBody ImageLocation data) {
        // Example logic:
        System.out.println("User ID: " + imageLocationServices.SaveImageLocation(data));
//        System.out.println("Latitude: " + data.getLatitude());
//        System.out.println("Longitude: " + data.getLongitude());
//        System.out.println("Image Base64 (first 30 chars): " + data.getImage().substring(0, 30) + "...");

        return "Data received successfully.";
    }

}


//
//
//
//package com.Hack.Server.Controller;
//
//import com.Hack.Server.Model.ImageLocation;
//import com.Hack.Server.Model.User;
//
//
//import com.Hack.Server.Principals.ImageLocationPrincipals;
//import com.Hack.Server.Services.ImageLocationService;
//import com.Hack.Server.Services.UserServices;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//@RestController
//@RequestMapping("/image")
//public class ImageLocationController {
//
//    @Autowired
//    private ImageLocationPrincipals IP;
//    private UserServices userService;
//
//    @PostMapping("/save")
//    public ResponseEntity<?> saveImageLocation(@RequestParam int userId,
//                                               @RequestBody ImageLocation imageLocation) {
//        User user = userService.findUserById(userId);
//        if (user == null) {
//            return ResponseEntity.status(401).body("Unauthorized: Please login first");
//        }
//        imageLocation.setUser(user);
//        return ResponseEntity.ok(IP.SaveImageLocation(imageLocation));
//    }
//
//}
