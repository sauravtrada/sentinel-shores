import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config.dart';
import 'signup_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final usernameController = TextEditingController();
  final passwordController = TextEditingController();
  final storage = const FlutterSecureStorage();
  bool isLoading = false;

  Future<void> login() async {
    setState(() => isLoading = true);
    final url = Uri.parse(
        "${Config.apiBaseUrl}/auth/login?username=${usernameController.text}&password=${passwordController.text}");

    final response = await http.post(url);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final token = data["token"];
      final expiresIn = data["expiresInSeconds"];
      final expiryDate =
      DateTime.now().add(Duration(seconds: expiresIn)).toIso8601String();

      await storage.write(key: "token", value: token);
      await storage.write(key: "expiresAt", value: expiryDate);

      if (!mounted) return;
      // Navigator.pushReplacement(
      //   context,
      //   MaterialPageRoute(
      //       builder: (_) => const MyHomePage(title: "NavIC Tracker")),
      // );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("❌ Login failed, try again")));
    }
    setState(() => isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: Center(
        child: SingleChildScrollView(
          child: Card(
            elevation: 8,
            shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            margin: const EdgeInsets.symmetric(horizontal: 24),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.lock_outline,
                      size: 60, color: Colors.blueAccent),
                  const SizedBox(height: 16),
                  const Text(
                    "Welcome Back",
                    style:
                    TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    "Login to continue using NavIC Tracker",
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 24),
                  TextField(
                    controller: usernameController,
                    decoration: InputDecoration(
                      labelText: "Username *",
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                      prefixIcon: const Icon(Icons.person_outline),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: passwordController,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: "Password *",
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                      prefixIcon: const Icon(Icons.lock_outline),
                    ),
                  ),
                  const SizedBox(height: 24),
                  isLoading
                      ? const CircularProgressIndicator()
                      : SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        if(usernameController.text.isEmpty || passwordController.text.isEmpty){
                          ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text("Please enter both username and password"))
                          );
                          return;
                        }
                        login();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blueAccent, // custom color
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text("Login", style: TextStyle(fontSize: 16, color: Colors.white)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const SignupPage()),
                      );
                    },
                    child: const Text("Don’t have an account? Sign up"),
                  )
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
