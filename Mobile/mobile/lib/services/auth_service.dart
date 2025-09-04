import 'dart:convert';
import 'package:http/http.dart' as http;
import '../api_config.dart';

class AuthService {
  Future<bool> login(String email, String password) async {
    try {
      final response = await http.post(
        ApiConfig.loginEndpoint(),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(LoginRequest(
          email: email,
          password: password,
        ).toJson()),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Login error: $e');
      return false;
    }
  }

  Future<bool> register(String email, String password, String confirmPassword) async {
    try {
      final response = await http.post(
        ApiConfig.registerEndpoint(),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(RegisterRequest(
          email: email,
          password: password,
          confirmPassword: confirmPassword,
        ).toJson()),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Registration error: $e');
      return false;
    }
  }
}