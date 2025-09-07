import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/registration_validation_service.dart';
import 'register_screen.dart';
import 'card_list_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authService = AuthService();
  bool _isLoading = false;
  RegistrationValidationRules? _validationRules;

  @override
  void initState() {
    super.initState();
    _loadValidationRules();
  }

  Future<void> _loadValidationRules() async {
    _validationRules = await RegistrationValidationRules.instance;
    setState(() {});
  }

  String? _validateEmail(String? value) {
    if (_validationRules == null) return null;

    if (value == null || value.isEmpty) {
      return _validationRules!.email.errorMessages['required'];
    }

    if (!RegExp(_validationRules!.email.pattern).hasMatch(value)) {
      return _validationRules!.email.errorMessages['invalid'];
    }

    return null;
  }

  String? _validatePassword(String? value) {
    if (_validationRules == null) return null;

    final rules = _validationRules!.password;

    if (value == null || value.isEmpty) {
      return 'Password is required';
    }

    if (value.length < rules.minLength) {
      return rules.errorMessages['tooShort']!
          .replaceAll('{0}', rules.minLength.toString());
    }

    if (rules.requireUppercase && !value.contains(RegExp(r'[A-Z]'))) {
      return rules.errorMessages['missingUppercase'];
    }

    if (rules.requireLowercase && !value.contains(RegExp(r'[a-z]'))) {
      return rules.errorMessages['missingLowercase'];
    }

    if (rules.requireDigits && !value.contains(RegExp(r'[0-9]'))) {
      return rules.errorMessages['missingDigit'];
    }

    if (rules.requireSpecialCharacters &&
        !value.contains(RegExp('[${rules.specialCharacters}]'))) {
      return rules.errorMessages['missingSpecial']!
          .replaceAll('{0}', rules.specialCharacters);
    }

    return null;
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() => _isLoading = true);

    final success = await _authService.login(
      _emailController.text,
      _passwordController.text,
    );

    setState(() => _isLoading = false);

    if (success && mounted) {
      // Navigate to main app screen
      // Navigate to card list screen and remove all previous routes
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => CardListPage()),
        (route) => false, // This removes all previous routes
      );

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Login successful')));
    } else if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Login failed')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Welcome To Loyalty\u00A0Cards',
                  style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 48),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    hintText: 'Email',
                    prefixIcon: const Icon(Icons.email_outlined),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  validator: _validateEmail,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    hintText: 'Password',
                    prefixIcon: const Icon(Icons.lock_outline),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  validator: _validatePassword,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isLoading ? null : _login,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator()
                      : const Text('Login', style: TextStyle(fontSize: 16)),
                ),
                const SizedBox(height: 16),
                OutlinedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const RegisterScreen(),
                      ),
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('Register', style: TextStyle(fontSize: 16)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
