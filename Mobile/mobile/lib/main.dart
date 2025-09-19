import 'dart:async';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/services.dart';
import 'package:mobile/screens/card_list_screen.dart';
import 'package:mobile/services/auth_service.dart';
import 'screens/login_screen.dart';
import 'api_config.dart';
import 'package:flutter/foundation.dart';
import 'package:window_size/window_size.dart';

enum StartupStatus { loading, serverDown, loggedIn, loggedOut }

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  if (defaultTargetPlatform == TargetPlatform.linux ||
      defaultTargetPlatform == TargetPlatform.windows ||
      defaultTargetPlatform == TargetPlatform.macOS) {
    const double phoneWidth = 400;
    const double phoneHeight = 800;
    setWindowTitle('My App');
    setWindowMinSize(const Size(phoneWidth, phoneHeight));
    setWindowMaxSize(const Size(phoneWidth, phoneHeight));

    // Position the window near the right edge of the primary display.
    // This queries the screen visible frame and positions the window
    // so its right edge is 100px from the screen right edge.
    try {
      final info = await getWindowInfo();
      final screenFrame = info.screen?.visibleFrame;
      if (screenFrame != null) {
        final double left = (screenFrame.right - phoneWidth - 100).clamp(screenFrame.left, screenFrame.right - phoneWidth);
        final double top = (screenFrame.top + 100).clamp(screenFrame.top, screenFrame.bottom - phoneHeight);
        setWindowFrame(Rect.fromLTWH(left, top, phoneWidth, phoneHeight));
      } else {
        // Fallback: small offset from top-left
        setWindowFrame(const Rect.fromLTWH(100, 100, phoneWidth, phoneHeight));
      }
    } catch (_) {
      // Some platforms or environments may not support getWindowInfo or may throw.
      setWindowFrame(const Rect.fromLTWH(100, 100, phoneWidth, phoneHeight));
    }
  }

  // Get environment from --dart-define or default to 'dev'
  final environment = const String.fromEnvironment('ENV', defaultValue: 'dev');
  await ApiConfig.load(environment);

  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  StartupStatus _status = StartupStatus.loading;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _runStartupCheck();
  }

  Future<void> _runStartupCheck() async {
    setState(() {
      _status = StartupStatus.loading;
      _errorMessage = null;
    });

    try {
      // quick server health check with short timeout to avoid long hangs
      final healthUri = Uri.parse('${ApiConfig.baseUrl}/health');
      final resp = await http
          .get(healthUri)
          .timeout(const Duration(seconds: 3), onTimeout: () => throw TimeoutException('Health check timed out'));

      if (resp.statusCode != 200) {
        setState(() {
          _status = StartupStatus.serverDown;
          _errorMessage = 'Server not reachable (status ${resp.statusCode})';
        });
        return;
      }

      // server reachable -> validate local token (fast, no network)
      final valid = await AuthService().isTokenValid();
      setState(() {
        _status = valid ? StartupStatus.loggedIn : StartupStatus.loggedOut;
      });
    } on TimeoutException catch (e) {
      setState(() {
        _status = StartupStatus.serverDown;
        _errorMessage = 'Server not reachable (timeout)';
      });
    } catch (e) {
      setState(() {
        _status = StartupStatus.serverDown;
        _errorMessage = 'Server not reachable';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget home;
    switch (_status) {
      case StartupStatus.loading:
        home = const Scaffold(body: Center(child: CircularProgressIndicator()));
        break;
      case StartupStatus.serverDown:
        home = Scaffold(
          appBar: AppBar(title: const Text('LoyaltyCards')),
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Server not reachable', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  if (_errorMessage != null) ...[
                    const SizedBox(height: 8),
                    Text(_errorMessage!, textAlign: TextAlign.center, style: TextStyle(color: Colors.grey[700])),
                  ],
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                    onPressed: _runStartupCheck,
                  ),
                ],
              ),
            ),
          ),
        );
        break;
      case StartupStatus.loggedIn:
        home = const CardListPage();
        break;
      case StartupStatus.loggedOut:
      default:
        home = const LoginScreen();
        break;
    }

    return MaterialApp(
      title: 'LoyaltyCards',
      theme: ThemeData(primarySwatch: Colors.green),
      home: home,
    );
  }
}
