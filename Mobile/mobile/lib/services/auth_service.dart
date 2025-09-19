import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mobile/api_config.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static const String _tokenKey = 'jwt_token';

  Future<void> saveToken(String token) async {
    final sp = await SharedPreferences.getInstance();
    await sp.setString(_tokenKey, token);
    // quick debug log
    print('AuthService: saved token length=${token.length}');
  }

  Future<String?> getToken() async {
    final sp = await SharedPreferences.getInstance();
    final t = sp.getString(_tokenKey);
    print('AuthService: getToken -> ${t == null ? "null" : "len=${t.length}"}');
    return t;
  }

  Future<void> clearToken() async {
    final sp = await SharedPreferences.getInstance();
    await sp.remove(_tokenKey);
    print('AuthService: cleared token');
  }

  Future<bool> isTokenValid() async {
    final token = await getToken();
    if (token == null || token.trim().isEmpty) return false;
    final raw = token.startsWith('Bearer ') ? token.substring(7) : token;
    final parts = raw.split('.');
    if (parts.length < 2) return false;
    try {
      var payload = parts[1];
      final pad = payload.length % 4;
      if (pad != 0) payload += '=' * (4 - pad);
      final decoded = utf8.decode(base64Url.decode(payload));
      final map = jsonDecode(decoded) as Map<String, dynamic>;
      if (!map.containsKey('exp')) return false;
      final exp = map['exp'] is int ? map['exp'] as int : int.parse(map['exp'].toString());
      final expiry = DateTime.fromMillisecondsSinceEpoch(exp * 1000, isUtc: true);
      print('AuthService: token exp=$expiry (utc), now=${DateTime.now().toUtc()}');
      return DateTime.now().toUtc().isBefore(expiry);
    } catch (e) {
      print('AuthService: token parse error $e');
      return false;
    }
  }

  Future<bool> login(String email, String password) async {
    try {
      final response = await http.post(
        ApiConfig.loginEndpoint(),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'password': password,
          'rememberMe': true,
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
    await clearToken();
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