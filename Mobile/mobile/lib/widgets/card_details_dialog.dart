import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/loyalty_card_service.dart';

class CardDetailsDialog extends StatefulWidget {
  final Map<String, dynamic> card;
  const CardDetailsDialog({Key? key, required this.card}) : super(key: key);

  /// Returns a map via Navigator.pop:
  /// {'action': 'deleted'} when card was deleted,
  /// {'action': 'updated'} when card was changed and dialog closed,
  /// {'action': 'closed'} when closed with no changes.
  @override
  State<CardDetailsDialog> createState() => _CardDetailsDialogState();
}

class _CardDetailsDialogState extends State<CardDetailsDialog> {
  late Map<String, dynamic> card;
  late TextEditingController nicknameController;
  late TextEditingController storeNameController;
  late TextEditingController barcodeController;
  bool isEditing = false;
  bool isSaving = false;
  bool _hasChanges = false;

  @override
  void initState() {
    super.initState();
    card = Map<String, dynamic>.from(widget.card);
    nicknameController = TextEditingController(text: card['nickname'] ?? '');
    storeNameController = TextEditingController(text: card['storeName'] ?? '');
    barcodeController = TextEditingController(text: card['barcodeNumber'] ?? '');
  }

  @override
  void dispose() {
    nicknameController.dispose();
    storeNameController.dispose();
    barcodeController.dispose();
    super.dispose();
  }

  Future<bool?> _confirmDelete() {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Card'),
        content: const Text('Are you sure you want to delete this card?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteCard() async {
    final confirmed = await _confirmDelete();
    if (confirmed != true) return;
    setState(() => isSaving = true);
    try {
      final token = await AuthService().getToken();
      await LoyaltyCardService.delete(card['id'].toString(), token: token);
      Navigator.of(context).pop({'action': 'deleted'});
    } catch (e) {
      setState(() => isSaving = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to delete: $e')));
    }
  }

  Future<void> _saveCard() async {
    final nickname = nicknameController.text.trim();
    if (nickname.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Nickname is required')));
      return;
    }

    final payload = {
      'nickname': nickname,
      'storeName': storeNameController.text.trim(),
      'barcodeNumber': barcodeController.text.trim(),
    };

    setState(() => isSaving = true);
    try {
      final token = await AuthService().getToken();
      await LoyaltyCardService.update(card['id'].toString(), payload, token: token);

      // update local card and controllers, keep dialog open in view mode
      setState(() {
        card['nickname'] = payload['nickname'];
        card['storeName'] = payload['storeName'];
        card['barcodeNumber'] = payload['barcodeNumber'];

        nicknameController.text = payload['nickname'] ?? '';
        storeNameController.text = payload['storeName'] ?? '';
        barcodeController.text = payload['barcodeNumber'] ?? '';

        isSaving = false;
        isEditing = false;
        _hasChanges = true;
      });

      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Card updated')));
    } catch (e) {
      setState(() => isSaving = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update: $e')));
    }
  }

  void _cancelEdit() {
    // revert controllers
    nicknameController.text = card['nickname'] ?? '';
    storeNameController.text = card['storeName'] ?? '';
    barcodeController.text = card['barcodeNumber'] ?? '';
    setState(() => isEditing = false);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(isEditing ? 'Edit Card' : 'Card Details'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!isEditing) ...[
              Align(alignment: Alignment.centerLeft, child: const Text('Nickname', style: TextStyle(fontWeight: FontWeight.bold))),
              const SizedBox(height: 4),
              Align(alignment: Alignment.centerLeft, child: Text(card['nickname'] ?? '')),
              const SizedBox(height: 12),
              Align(alignment: Alignment.centerLeft, child: const Text('Store Name', style: TextStyle(fontWeight: FontWeight.bold))),
              const SizedBox(height: 4),
              Align(alignment: Alignment.centerLeft, child: Text(card['storeName'] ?? '')),
              const SizedBox(height: 12),
              Align(alignment: Alignment.centerLeft, child: const Text('Barcode', style: TextStyle(fontWeight: FontWeight.bold))),
              const SizedBox(height: 4),
              Align(alignment: Alignment.centerLeft, child: Text(card['barcodeNumber'] ?? '')),
            ] else ...[
              TextField(controller: nicknameController, decoration: const InputDecoration(labelText: 'Nickname')),
              const SizedBox(height: 12),
              TextField(controller: storeNameController, decoration: const InputDecoration(labelText: 'Store Name')),
              const SizedBox(height: 12),
              TextField(controller: barcodeController, decoration: const InputDecoration(labelText: 'Barcode Number')),
            ],
          ],
        ),
      ),
      actions: [
        // Delete (left-most) - only while editing
        if (isEditing)
          TextButton(
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            onPressed: isSaving ? null : _deleteCard,
            child: isSaving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Delete'),
          ),

        // Close - only in view mode
        if (!isEditing)
          TextButton(
            onPressed: isSaving
                ? null
                : () => Navigator.of(context).pop({'action': _hasChanges ? 'updated' : 'closed'}),
            child: const Text('Close'),
          ),

        // Edit - only in view mode
        if (!isEditing)
          TextButton(
            onPressed: isSaving ? null : () => setState(() => isEditing = true),
            child: const Text('Edit'),
          ),

        // Cancel - only in edit mode
        if (isEditing)
          TextButton(
            onPressed: isSaving ? null : _cancelEdit,
            child: const Text('Cancel'),
          ),

        // Save - only in edit mode
        if (isEditing)
          ElevatedButton(
            onPressed: isSaving ? null : _saveCard,
            child: isSaving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'),
          ),
      ],
    );
  }
}