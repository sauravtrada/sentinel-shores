package com.Hack.Server.Controller;

import com.Hack.Server.Model.User;
import com.Hack.Server.Security.JwtUtil;
import com.Hack.Server.Services.UserServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/")
public class UserController {

    @Autowired
    private UserServices userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${jwt.expiration:3600000}") // default 1 hour
    private long jwtExpirationMs;


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        boolean authenticated = userService.authenticate(loginRequest.getEmail(), loginRequest.getPassword());

        if (authenticated) {
            User user = userService.getUserByEmail(loginRequest.getEmail());

            // generate JWT with role
            String role = (user.getRole() != null) ? user.getRole() : "USER";
            String token = jwtUtil.generateToken(user.getEmail(), role);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Login successful");
            response.put("token", token);
            response.put("userId", user.getId());
            response.put("email", user.getEmail());
            response.put("role", role);

            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body("Invalid email or password");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            if (userService.getUserByEmail(user.getEmail()) != null) {
                return ResponseEntity.badRequest().body("Email is already registered");
            }

            // Default role USER if not set
            if (user.getRole() == null || user.getRole().isEmpty()) {
                user.setRole("USER");
            }

            User savedUser = userService.SaveUser(user);

            // generate JWT with role
            String token = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getRole());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "User registered successfully");
            response.put("token", token);
            response.put("userId", savedUser.getId());
            response.put("email", savedUser.getEmail());
            response.put("role", savedUser.getRole());
            response.put("expiration",jwtExpirationMs);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error saving user: " + e.getMessage());
        }
    }


    // New API: Get all users (Admin only)
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(HttpServletRequest request) {
        try {
            // Extract JWT from Authorization header
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Unauthorized: Missing token");
            }

            String token = authHeader.substring(7); // remove "Bearer "
            String role = jwtUtil.extractRole(token);

            // Allow only Admin
            if (!"ADMIN".equalsIgnoreCase(role)) {
                return ResponseEntity.status(403).body("Forbidden: Admin access only");
            }

            List<User> users = userService.GetAllUser();
            return ResponseEntity.ok(users);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}
