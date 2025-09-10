import 'package:barcode/barcode.dart';

/// Simple utility service to generate barcode SVG strings from numeric (or alphanumeric)
/// loyalty card numbers. The service focuses on generation only — rendering in the UI
/// is left to the widget that consumes the SVG.
///
/// Note: this file depends on the `barcode` package. Add it to your project:
///   flutter pub add barcode
///
/// Example:
///   final svg = BarcodeService.generateSvgForNumber('1234567890123');
///   // pass `svg` into a widget that can render SVG (e.g. flutter_svg)
///
enum BarcodeType { code128, ean13, ean8, qr }

class BarcodeService {
  /// Generate an SVG barcode for [data] using explicit [type].
  /// Width/height control the output SVG dimensions.
  /// Throws an Exception when generation fails (invalid input for chosen type).
  static String generateSvg(
    String data, {
    BarcodeType type = BarcodeType.code128,
    double width = 300,
    double height = 80,
    bool drawText = true,
  }) {
    final Barcode barcode;
    switch (type) {
      case BarcodeType.ean13:
        barcode = Barcode.ean13();
        break;
      case BarcodeType.ean8:
        barcode = Barcode.ean8();
        break;
      case BarcodeType.qr:
        barcode = Barcode.qrCode();
        break;
      case BarcodeType.code128:
      default:
        barcode = Barcode.code128();
        break;
    }

    try {
      // Barcode.toSvg will throw if the data is invalid for the selected barcode type.
      return barcode.toSvg(
        data,
        width: width,
        height: height,
        drawText: drawText,
      );
    } catch (e) {
      throw Exception('Failed to generate barcode SVG: $e');
    }
  }

  /// Try to pick a sensible barcode type for numeric loyalty card [data].
  /// - 13 digits -> EAN-13
  /// - 8 digits  -> EAN-8
  /// - otherwise -> Code 128
  static BarcodeType guessTypeFromData(String data) {
    final digitsOnly = RegExp(r'^\d+$').hasMatch(data);
    if (digitsOnly) {
      if (data.length == 13) return BarcodeType.ean13;
      if (data.length == 8) return BarcodeType.ean8;
    }
    return BarcodeType.code128;
  }

  /// Convenience: generate an SVG for numeric loyalty card [number], auto-selecting
  /// an appropriate barcode type.
  static String generateSvgForNumber(
    String number, {
    double width = 300,
    double height = 80,
    bool drawText = true,
  }) {
    final type = guessTypeFromData(number);
    return generateSvg(
      number,
      type: type,
      width: width,
      height: height,
      drawText: drawText,
    );
  }
}