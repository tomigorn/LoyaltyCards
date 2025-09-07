import 'package:flutter/material.dart';
import 'package:email_validator/email_validator.dart';
import '../services/auth_service.dart';
import '../services/registration_validation_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _authService = AuthService();
  bool _isLoading = false;
  bool _isPasswordVisible = false;
  bool _showValidation = false;
  RegistrationValidationRules? _validationRules;
  String? _apiError;

  @override
  void initState() {
    super.initState();
    _loadValidationRules();
    _passwordController.addListener(_onPasswordChanged);
    _emailController.addListener(_onEmailChanged); // Add email listener
  }

  Future<void> _loadValidationRules() async {
    _validationRules = await RegistrationValidationRules.instance;
    setState(() {});
  }

  void _onPasswordChanged() {
    if (_showValidation) {
      _formKey.currentState?.validate();
    }
  }

  void _onEmailChanged() {
    if (_showValidation) {
      _formKey.currentState?.validate();
    }
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
    List<String> errors = [];

    if (value == null || value.isEmpty) {
      return 'Password is required';
    }

    if (value.length < rules.minLength) {
      errors.add('• at least ${rules.minLength} characters');
    }

    if (rules.requireUppercase && !value.contains(RegExp(r'[A-Z]'))) {
      errors.add('• one uppercase letter');
    }

    if (rules.requireLowercase && !value.contains(RegExp(r'[a-z]'))) {
      errors.add('• one lowercase letter');
    }

    if (rules.requireDigits && !value.contains(RegExp(r'[0-9]'))) {
      errors.add('• one number');
    }

    if (rules.requireSpecialCharacters &&
        !value.contains(RegExp('[${rules.specialCharacters}]'))) {
      errors.add('• one special character (${rules.specialCharacters})');
    }

    if (errors.isEmpty) return null;

    return 'Password requirements:\n${errors.join('\n')}';
  }

  String? _validateConfirmPassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }
    if (value != _passwordController.text) {
      return 'Passwords do not match';
    }
    return null;
  }

  Future<void> _register() async {
    setState(() => _showValidation = true);

    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
      _apiError = null; // Clear any previous error
    });

    try {
      final success = await _authService.register(
        _emailController.text,
        _passwordController.text,
        _confirmPasswordController.text,
      );

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Registration successful')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      setState(() {
        _apiError = e.toString(); // Store the API error message
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Register')),
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
                  'Create Account',
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
                    errorStyle: const TextStyle(
                      color: Colors.red,
                      fontSize: 12,
                    ),
                  ),
                  validator: _validateEmail,
                  autovalidateMode: _showValidation
                      ? AutovalidateMode.always
                      : AutovalidateMode.disabled,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: !_isPasswordVisible,
                  decoration: InputDecoration(
                    hintText: 'Password',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _isPasswordVisible ? Icons.visibility : Icons.visibility_off,
                      ),
                      onPressed: () {
                        setState(() {
                          _isPasswordVisible = !_isPasswordVisible;
                        });
                      },
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    errorStyle: const TextStyle(
                      color: Colors.red,
                      fontSize: 12,
                    ),
                    errorMaxLines: 5,
                  ),
                  validator: _validatePassword,
                  autovalidateMode: _showValidation
                      ? AutovalidateMode.always
                      : AutovalidateMode.disabled,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: !_isPasswordVisible,
                  decoration: InputDecoration(
                    hintText: 'Confirm Password',
                    prefixIcon: const Icon(Icons.lock_outline),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    errorStyle: const TextStyle(
                      color: Colors.red,
                      fontSize: 12,
                    ),
                  ),
                  validator: _validateConfirmPassword,
                  autovalidateMode: _showValidation
                      ? AutovalidateMode.always
                      : AutovalidateMode.disabled,
                ),
                const SizedBox(height: 24),
                if (_apiError != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: Text(
                      _apiError!,
                      style: const TextStyle(
                        color: Colors.red,
                        fontSize: 14,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ElevatedButton(
                  onPressed: _isLoading ? null : _register,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator()
                      : const Text('Register', style: TextStyle(fontSize: 16)),
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
    _passwordController.removeListener(_onPasswordChanged);
    _emailController.removeListener(_onEmailChanged); // Remove email listener
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }
}
