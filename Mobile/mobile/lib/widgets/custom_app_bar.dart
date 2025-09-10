import 'package:flutter/material.dart';
import '../screens/settings_screen.dart';

class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? additionalActions;
  final VoidCallback? onSortPressed;

  const CustomAppBar({
    super.key,
    required this.title,
    this.additionalActions,
    this.onSortPressed,
  });

  void _onProfileTap(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const SettingsScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    List<Widget> actions = [];
    
    if (additionalActions != null) {
      actions.addAll(additionalActions!);
    }

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
 
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 1,
      title: const SizedBox.shrink(),
      leadingWidth: 56,
      leading: Align(
        alignment: Alignment.centerLeft,
        child: IconButton(
          padding: const EdgeInsets.only(left: 8.0),
          onPressed: () => _onProfileTap(context),
          icon: const CircleAvatar(
            radius: 20,
            backgroundColor: Color(0xFFBBDEFB), // preserve existing blue tint
            child: Icon(Icons.person, color: Color(0xFF1565C0), size: 30),
          ),
        ),
      ),
      actions: actions,
    );
  }
  
  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}