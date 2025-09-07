import 'dart:convert';
import 'package:http/http.dart' as http;
import '../api_config.dart';

class AuthService {
  Future<bool> login(String email, String password) async {
    try {
      final response = await http.post(
        ApiConfig.loginEndpoint(),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        return true;
      }

      // Parse the JSON response and extract just the message
      final error = json.decode(response.body);
      throw error['message'] ?? 'Login failed';
    } catch (e) {
      if (e is FormatException) {
        throw 'Login failed: Invalid response from server';
      }
      if (e is String) {
        throw e;
      }
      throw e.toString();
    }
  }

  Future<bool> register(String email, String password, String confirmPassword) async {
    try {
      final response = await http.post(
        ApiConfig.registerEndpoint(),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'password': password,
          'confirmPassword': confirmPassword,
        }),
      );

      if (response.statusCode == 200) {
        return true;
      }

      // Try to parse as JSON first, fallback to plain text if that fails
      try {
        final error = json.decode(response.body)['message'] ?? 'Registration failed';
        throw error;
      } catch (e) {
        // If JSON parsing fails, use the response body directly
        throw response.body;
      }
    } catch (e) {
      if (e is String) {
        throw e;
      }
      throw 'Registration failed: ${e.toString()}';
    }
  }
}