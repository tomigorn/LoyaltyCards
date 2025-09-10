import 'package:flutter/material.dart';
import '../services/auth_service.dart'; // Import AuthService

class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? additionalActions; // Optional extra actions
  final VoidCallback? onSortPressed; // new: optional sort callback

  const CustomAppBar({
    super.key,
    required this.title,
    this.additionalActions,
    this.onSortPressed,
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

    // add sort button at top-right when a callback is provided
    if (onSortPressed != null) {
      actions.add(
        Padding(
          padding: const EdgeInsets.only(right: 12.0),
          child: ElevatedButton(
            onPressed: onSortPressed,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: Colors.black87,
              elevation: 1,
              side: BorderSide(color: Colors.grey[300]!),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            child: const Icon(Icons.sort, size: 20),
          ),
        ),
      );
    }
    
    // keep actions as-is (profile moved to the left as leading)
 
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 1,
      // Title removed as requested
      title: const SizedBox.shrink(),
      // moved profile button to the left
      leadingWidth: 56,
      leading: Align(
        alignment: Alignment.centerLeft,
        child: IconButton(
          padding: const EdgeInsets.only(left: 8.0),
          onPressed: () => _onProfileTap(context),
          icon: CircleAvatar(
            radius: 20,
            backgroundColor: Colors.blue[100],
            child: Icon(Icons.person, color: Colors.blue[700], size: 30),
          ),
          tooltip: 'Profile',
        ),
      ),
      actions: actions,
    );
  }
  
  @override
  Size get preferredSize => Size.fromHeight(kToolbarHeight);
}