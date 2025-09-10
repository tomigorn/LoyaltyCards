import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile/screens/card_list_screen.dart';
import 'package:mobile/services/auth_service.dart';
import 'screens/login_screen.dart';
import 'api_config.dart';
import 'package:flutter/foundation.dart';
import 'package:window_size/window_size.dart';

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

  final authService = AuthService();
  final isLoggedIn = await authService.isLoggedIn();

  runApp(MyApp(initialRoute: isLoggedIn ? '/cards' : '/login'));
}

class MyApp extends StatelessWidget {
  final String initialRoute;

  const MyApp({super.key, required this.initialRoute});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Loyalty Cards',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      initialRoute: initialRoute,
      routes: {
        '/login': (context) => const LoginScreen(),
        '/cards': (context) => CardListPage(),
      },
    );
  }
}
