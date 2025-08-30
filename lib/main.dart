import 'package:flutter/material.dart';
import 'package:flutter_app/pages/login_page.dart';
import 'package:flutter_app/pages/photo_home_page.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  Future<Widget> _getStartPage() async {
    final storage = const FlutterSecureStorage();
    final token = await storage.read(key: "token");
    final expires = await storage.read(key: "expiresAt");

    if (token != null && expires != null) {
      final expiryDate = DateTime.tryParse(expires);
      if (expiryDate != null && DateTime.now().isBefore(expiryDate)) {
        return const PhotoHomePage(); // ✅ Go to photo page if token valid
      }
    }
    return const PhotoHomePage(); // ✅ Go to photo page if token valid

    return const LoginPage(); // ❌ Otherwise login
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Sentinel Shores',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
      ),
      home: FutureBuilder<Widget>(
        future: _getStartPage(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }
          if (snapshot.hasError) {
            return const Scaffold(
              body: Center(child: Text("Something went wrong")),
            );
          }
          return snapshot.data ?? const LoginPage();
        },
      ),
    );
  }
}