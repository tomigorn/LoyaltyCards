import 'package:barcode_scan2/barcode_scan2.dart';

class BarcodeScanService {
  /// Opens the native scanner UI and returns scanned code string, or null if cancelled.
  static Future<String?> scanBarcode() async {
    try {
      final result = await BarcodeScanner.scan();
      if (result.rawContent == null || result.rawContent.isEmpty) return null;
      return result.rawContent;
    } catch (e) {
      return null;
    }
  }
}