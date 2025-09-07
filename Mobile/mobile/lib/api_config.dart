import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  static Uri get baseUrl {
    final url = dotenv.env['API_BASE_URL'] ?? 'http://localhost:5000';
    return Uri.parse(url);
  }

  // Endpoints
  static Uri healthEndpoint() => baseUrl.replace(path: '/health');
  static Uri loginEndpoint() => baseUrl.replace(path: '/api/Auth/login');
  static Uri registerEndpoint() => baseUrl.replace(path: '/api/Auth/register');
  static Uri validationRulesEndpoint() => baseUrl.replace(path: '/api/Validation/rules');
}

// Request models
class LoginRequest {
  final String email;
  final String password;

  LoginRequest({required this.email, required this.password});

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
      };
}

class RegisterRequest {
  final String email;
  final String password;
  final String confirmPassword;

  RegisterRequest({
    required this.email,
    required this.password,
    required this.confirmPassword,
  });

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
        'confirmPassword': confirmPassword,
      };
}
