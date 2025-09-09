import 'package:flutter/material.dart';
import '../services/auth_service.dart'; // Import AuthService

class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? additionalActions; // Optional extra actions

  const CustomAppBar({
    super.key,
    required this.title,
    this.additionalActions,
  });

  void _onProfileTap(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Profile'),
          content: Text('Profile menu would go here'),
          actions: [
            TextButton.icon(
              onPressed: () {
                Navigator.pop(context);
                // TODO: Implement settings
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Settings clicked')),
                );
              },
              icon: Icon(Icons.settings),
              label: Text('Settings'),
            ),
            TextButton.icon(
              onPressed: () async {
                final authService = AuthService();
                await authService.logout();
                Navigator.pop(context);
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  '/login',
                  (route) => false,
                );
              },
              icon: Icon(Icons.logout),
              label: Text('Logout'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Close'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    List<Widget> actions = [];
    
    // Add any additional actions passed in
    if (additionalActions != null) {
      actions.addAll(additionalActions!);
    }
    
    // Always add the profile button
    actions.add(
      Padding(
        padding: EdgeInsets.only(right: 16),
        child: GestureDetector(
          onTap: () => _onProfileTap(context),
          child: CircleAvatar(
            radius: 18,
            backgroundColor: Colors.blue[100],
            child: Icon(Icons.person, color: Colors.blue[700], size: 20),
          ),
        ),
      ),
    );

    return AppBar(
      backgroundColor: Colors.white,
      elevation: 1,
      title: Text(
        title,
        style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w600),
      ),
      actions: actions,
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(kToolbarHeight);
}