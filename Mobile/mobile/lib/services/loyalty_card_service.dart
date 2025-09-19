import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../api_config.dart';

class LoyaltyCardService {
  static Map<String, String> _headers([String? token]) {
    final headers = <String, String>{
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // GET /api/LoyaltyCard/getAllLoyaltyCards
  static Future<List<Map<String, dynamic>>> getAll({String? token}) async {
    final uri = ApiConfig.loyaltyCardsEndpoint();
    final res = await http.get(uri, headers: _headers(token));
    if (res.statusCode != 200) {
      throw Exception('Failed to load loyalty cards: ${res.statusCode} ${res.body}');
    }
    final body = jsonDecode(res.body);

    // Handle wrapped response: { totalCount: X, cards: [...] }
    if (body is Map && body['cards'] is List) {
      return List<Map<String, dynamic>>.from(
        (body['cards'] as List).map((e) => Map<String, dynamic>.from(e)),
      );
    }

    // Fallback: plain list response
    if (body is List) {
      return List<Map<String, dynamic>>.from(
        body.map((e) => Map<String, dynamic>.from(e)),
      );
    }

    throw Exception('Unexpected response format for getAllLoyaltyCards');
  }

  // POST /api/LoyaltyCard/createLoyaltyCard
  // payload is a Map matching backend DTO
  static Future<bool> create(Map<String, dynamic> payload, {String? token}) async {
    final uri = ApiConfig.createLoyaltyCardEndpoint();
    final res = await http
        .post(uri, headers: _headers(token), body: jsonEncode(payload))
        .timeout(
          const Duration(seconds: 10),
          onTimeout: () => throw TimeoutException('Request timed out after 10 seconds'),
        );

    if (res.statusCode == 200 || res.statusCode == 201) {
      return true;
    }

    throw Exception('Failed to create loyalty card: ${res.statusCode} ${res.body}');
  }

  // GET /api/LoyaltyCard/getLoyaltyCard/{id}
  static Future<Map<String, dynamic>> getById(String id, {String? token}) async {
    final uri = Uri.parse('${ApiConfig.loyaltyCardsEndpoint().path}/$id');
    final res = await http.get(uri, headers: _headers(token));
    if (res.statusCode != 200) {
      throw Exception('Failed to get loyalty card $id: ${res.statusCode} ${res.body}');
    }
    return Map<String, dynamic>.from(jsonDecode(res.body));
  }

  // PUT /api/LoyaltyCard/updateLoyaltyCard/{id}
  // payload should NOT include id
  static Future<bool> update(String id, Map<String, dynamic> payload, {String? token}) async {
    // make sure we have a full URL (host + path) before appending id
    final base = ApiConfig.updateLoyaltyCard().toString();
    final uri = Uri.parse('$base/$id');

    final res = await http
        .put(uri, headers: _headers(token), body: jsonEncode(payload))
        .timeout(
          const Duration(seconds: 10),
          onTimeout: () => throw TimeoutException('Request timed out after 10 seconds'),
        );

    if (res.statusCode == 200) {
      return true;
    }

    throw Exception('Failed to update loyalty card: ${res.statusCode} ${res.body}');
  }

  // DELETE /api/LoyaltyCard/deleteLoyaltyCard/{id}
  static Future<void> delete(String id, {String? token}) async {
    final base = ApiConfig.deleteLoyaltyCard().toString();
    final uri = Uri.parse('$base/$id');

    final res = await http.delete(uri, headers: _headers(token));
    if (res.statusCode != 200 && res.statusCode != 204) {
      throw Exception('Failed to delete loyalty card $id: ${res.statusCode} ${res.body}');
    }
  }
}