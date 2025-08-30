package com.Hack.Server.Controller;

import com.Hack.Server.Model.ImageLocation;
import com.Hack.Server.Model.User;
import com.Hack.Server.Security.JwtUtil;
import com.Hack.Server.Services.ImageLocationServices;
import com.Hack.Server.Services.UserServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/image")
public class ImageLocationController {

    @Autowired
    private ImageLocationServices imageLocationService;

    @Autowired
    private UserServices userService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/save")
    public ResponseEntity<?> saveImageLocation(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ImageLocation imageLocation) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Unauthorized: Missing or invalid token");
        }

        try {
            //  Extract JWT
            String token = authHeader.substring(7);

            // Extract email from JWT
            String email = jwtUtil.extractUsername(token);

            //  Validate token
            if (!jwtUtil.validateToken(token, email)) {
                return ResponseEntity.status(401).body("Unauthorized: Invalid token");
            }

            // Fetch user from DB
            User user = userService.getUserByEmail(email);
            if (user == null) {
                return ResponseEntity.status(401).body("Unauthorized: Invalid user");
            }

            //Save image location for this user
            imageLocation.setUser(user);
            return ResponseEntity.ok(imageLocationService.SaveImageLocation(imageLocation));

        } catch (Exception e) {
            return ResponseEntity.status(401).body("Unauthorized: " + e.getMessage());
        }
    }
}


