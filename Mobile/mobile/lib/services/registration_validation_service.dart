import 'dart:convert';
import 'package:http/http.dart' as http;
import '../api_config.dart';

class RegistrationValidationRules {
  static RegistrationValidationRules? _instance;
  static Future<RegistrationValidationRules> get instance async {
    _instance ??= await _loadRules();
    return _instance!;
  }

  final PasswordRules password;
  final EmailRules email;

  RegistrationValidationRules({required this.password, required this.email});

  static Future<RegistrationValidationRules> _loadRules() async {
    final response = await http.get(ApiConfig.validationRulesEndpoint());
    
    if (response.statusCode != 200) {
      throw Exception('Failed to load validation rules');
    }

    final json = jsonDecode(response.body);
    return RegistrationValidationRules(
      password: PasswordRules.fromJson(json['password']),
      email: EmailRules.fromJson(json['email']),
    );
  }
}

class PasswordRules {
  final int minLength;
  final bool requireUppercase;
  final bool requireLowercase;
  final bool requireDigits;
  final bool requireSpecialCharacters;
  final String specialCharacters;
  final Map<String, String> errorMessages;

  PasswordRules.fromJson(Map<String, dynamic> json)
      : minLength = json['minLength'],
        requireUppercase = json['requireUppercase'],
        requireLowercase = json['requireLowercase'],
        requireDigits = json['requireDigits'],
        requireSpecialCharacters = json['requireSpecialCharacters'],
        specialCharacters = json['specialCharacters'],
        errorMessages = Map<String, String>.from(json['errorMessages']);
}

class EmailRules {
  final String pattern;
  final Map<String, String> errorMessages;

  EmailRules.fromJson(Map<String, dynamic> json)
      : pattern = json['pattern'],
        errorMessages = Map<String, String>.from(json['errorMessages']);
}