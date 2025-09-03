import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  static Uri get baseUrl {
    return Uri.parse(dotenv.env['API_BASE_URL'] ?? 'http://localhost:5000');
  }

  // Endpoints
  static Uri healthEndpoint() => baseUrl.replace(path: '/health');
}
