import 'dart:io';
import 'package:flutter/foundation.dart';

class ApiConfig {
  // Returns the base URL depending on the platform
  static Uri get baseUrl {
    if (!kIsWeb && Platform.isAndroid) {
      // Use your PC's LAN IP here for physical device
      return Uri.parse('http://192.168.1.234:5000');
    }

    if (!kIsWeb && Platform.isIOS) {
      return Uri.parse('http://localhost:5000');
    }

    if (!kIsWeb && (Platform.isWindows || Platform.isLinux || Platform.isMacOS)) {
      return Uri.parse('http://localhost:5000');
    }

    // Web fallback
    return Uri.parse('http://localhost:5000');
  }

  // Example endpoint for /health
  static Uri healthEndpoint() => baseUrl.replace(path: '/health');
}
