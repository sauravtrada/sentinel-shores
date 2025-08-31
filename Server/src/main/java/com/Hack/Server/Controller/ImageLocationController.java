package com.Hack.Server.Controller;

import com.Hack.Server.Model.ImageLocation;
import com.Hack.Server.Model.Result;
import com.Hack.Server.Model.User;
import com.Hack.Server.Principals.ResultPrincipals;
import com.Hack.Server.Security.JwtUtil;
import com.Hack.Server.Services.ImageLocationServices;
import com.Hack.Server.Principals.ResultPrincipals;
import com.Hack.Server.Services.UserServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/image")
public class ImageLocationController {

    @Autowired
    private ImageLocationServices imageLocationService;

    @Autowired
    private UserServices userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ResultPrincipals resultService;

    private static final String PYTHON_API_URL = "https://<your-ngrok-url>/analyze";

    @PostMapping("/save")
    public ResponseEntity<?> saveImageLocation(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ImageLocation imageLocation) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Unauthorized: Missing or invalid token");
        }

        try {
            // Extract JWT
            String token = authHeader.substring(7);

            // Extract email from JWT
            String email = jwtUtil.extractUsername(token);

            // Validate token
            if (!jwtUtil.validateToken(token, email)) {
                return ResponseEntity.status(401).body("Unauthorized: Invalid token");
            }

            // Fetch user from DB
            User user = userService.getUserByEmail(email);
            if (user == null) {
                return ResponseEntity.status(401).body("Unauthorized: Invalid user");
            }

            // Save ImageLocation first
            imageLocation.setUser(user);
            ImageLocation savedLocation = imageLocationService.SaveImageLocation(imageLocation);

            // Send request to Python API
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<ImageLocation> requestEntity = new HttpEntity<>(savedLocation, headers);
            ResponseEntity<Map> responseEntity =
                    restTemplate.postForEntity(PYTHON_API_URL, requestEntity, Map.class);

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                Map<String, Object> response = responseEntity.getBody();

                // Save into Result table
                Result result = new Result();
               result.setVegetation_loss_percent((Double) response.get("vegetation_loss_percent"));
                result.setPoisoning_detected((Boolean) response.get("poisoning_detected"));


                result.setUser(user);

                resultService.SaveResult(result);
                int FT=(int)result.getVegetation_loss_percent();
                if(FT > 5) {
                    user.setMarit(user.getMarit()+FT);
                    userService.UpdateUser(user.getId(), user);
                }
                else{
                    user.setFoulConunt(user.getFoulConunt()+1);
                    userService.UpdateUser(user.getId(), user);
                }

                return ResponseEntity.ok(Map.of(
                        "message", "Image and result saved successfully",
                        "result", result
                ));
            } else {
                return ResponseEntity.status(500).body("Error from Python API");
            }

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}






















/// ///////////  Working   /////////////////

//package com.Hack.Server.Controller;
//
//import com.Hack.Server.Model.ImageLocation;
//import com.Hack.Server.Model.User;
//import com.Hack.Server.Security.JwtUtil;
//import com.Hack.Server.Services.ImageLocationServices;
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
//    private ImageLocationServices imageLocationService;
//
//    @Autowired
//    private UserServices userService;
//
//    @Autowired
//    private JwtUtil jwtUtil;
//
//    @PostMapping("/save")
//    public ResponseEntity<?> saveImageLocation(
//            @RequestHeader("Authorization") String authHeader,
//            @RequestBody ImageLocation imageLocation) {
//
//        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
//            return ResponseEntity.status(401).body("Unauthorized: Missing or invalid token");
//        }
//
//        try {
//            //  Extract JWT
//            String token = authHeader.substring(7);
//
//            // Extract email from JWT
//            String email = jwtUtil.extractUsername(token);
//
//            //  Validate token
//            if (!jwtUtil.validateToken(token, email)) {
//                return ResponseEntity.status(401).body("Unauthorized: Invalid token");
//            }
//
//            // Fetch user from DB
//            User user = userService.getUserByEmail(email);
//            if (user == null) {
//                return ResponseEntity.status(401).body("Unauthorized: Invalid user");
//            }
//
//            //Save image location for this user
//            imageLocation.setUser(user);
//            return ResponseEntity.ok(imageLocationService.SaveImageLocation(imageLocation));
//
//        } catch (Exception e) {
//            return ResponseEntity.status(401).body("Unauthorized: " + e.getMessage());
//        }
//    }
//}
//
//
