import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  // Remove trailing slash if present from baseUrl
  static String get baseUrl {
    final url = dotenv.env['API_BASE_URL'] ?? 'http://localhost:5000';
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }
  
  static Future<void> load(String environment) async {
    await dotenv.load(fileName: 'lib/.env.$environment');
  }

  // Endpoints with single slashes
  static Uri healthEndpoint() => Uri.parse('$baseUrl/health');
  static Uri loginEndpoint() => Uri.parse('$baseUrl/api/Auth/login');
  static Uri registerEndpoint() => Uri.parse('$baseUrl/api/Auth/register');
  static Uri validationRulesEndpoint() => Uri.parse('$baseUrl/api/Validation/rules');
  static Uri loyaltyCardsEndpoint() => Uri.parse('$baseUrl/api/LoyaltyCard/getAllLoyaltyCards');
  static Uri createLoyaltyCardEndpoint() => Uri.parse('$baseUrl/api/LoyaltyCard/createLoyaltyCard');
  static Uri updateLoyaltyCard() => Uri.parse('$baseUrl/api/LoyaltyCard/updateLoyaltyCard');
  static Uri deleteLoyaltyCard() => Uri.parse('$baseUrl/api/LoyaltyCard/deleteLoyaltyCard');
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
