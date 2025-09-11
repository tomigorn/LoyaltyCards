import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart' as prefs;
import '../api_config.dart';

class AuthService {
  static const String _tokenKey = 'jwt_token';

  Future<void> saveToken(String token) async {
    final preferences = await prefs.SharedPreferences.getInstance();
    await preferences.setString(_tokenKey, token);
  }

  Future<String?> getToken() async {
    final preferences = await prefs.SharedPreferences.getInstance();
    return preferences.getString(_tokenKey);
  }

  Future<void> deleteToken() async {
    final preferences = await prefs.SharedPreferences.getInstance();
    await preferences.remove(_tokenKey);
  }

  Future<bool> login(String email, String password) async {
    try {
      final response = await http.post(
        ApiConfig.loginEndpoint(),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'password': password,
        }),
      ).timeout(
        const Duration(seconds: 5),
        onTimeout: () {
          throw 'Login failed: Request timed out';
        },
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final token = json['token'] as String;
        await saveToken(token);
        return true;
      }

      final error = json.decode(response.body);
      throw error['message'] ?? 'Login failed';
    } catch (e) {
      if (e is FormatException) {
        throw 'Login failed: Invalid response from server';
      }
      if (e is String) {
        rethrow;
      }
      throw e.toString();
    }
  }

  Future<void> logout() async {
    await deleteToken();
  }

  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null;
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
      ).timeout(
        const Duration(seconds: 5),
        onTimeout: () {
          throw 'Registration failed: Request timed out';
        },
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
        rethrow;
      }
      throw 'Registration failed: ${e.toString()}';
    }
  }
}