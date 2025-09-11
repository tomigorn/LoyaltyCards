import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            // Main content
            SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 24),

                  // Centered profile avatar
                  const Center(
                    child: CircleAvatar(
                      radius: 36,
                      backgroundColor: Color(0xFFBBDEFB),
                      child: Icon(Icons.person, color: Color(0xFF1565C0), size: 36),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // clickable edit account info text
                  TextButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Edit account info tapped')),
                      );
                      // TODO: navigate to actual edit account screen
                    },
                    child: const Text(
                      'Edit account info',
                      style: TextStyle(fontSize: 16),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // TODO: example/placeholder settings content (can be a long list)
                  const SizedBox(height: 8),
                  const Text(
                    'Settings will go here.',
                    style: TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 24),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () async {
                        await AuthService().logout();
                        if (!context.mounted) return;
                        Navigator.of(context).pushNamedAndRemoveUntil('/login', (r) => false);
                      },
                      child: const Text('Sign out'),
                    ),
                  ),

                  const SizedBox(height: 16),
                ],
              ),
            ),

            // Close button must be after the scrollable content so it's on top and tappable
            Align(
              alignment: Alignment.topLeft,
              child: IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.of(context).pop(),
                tooltip: 'Close',
              ),
            ),
          ],
        ),
      ),
    );
  }
}