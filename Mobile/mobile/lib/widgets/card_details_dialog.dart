import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/loyalty_card_service.dart';

class CardDetailsDialog extends StatefulWidget {
  final Map<String, dynamic> card;
  const CardDetailsDialog({Key? key, required this.card}) : super(key: key);

  /// Returns via Navigator.pop:
  /// {'action': 'deleted'} when deleted,
  /// {'action': 'updated'} when changed,
  /// {'action': 'closed'} when closed without changes.
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
    nicknameController.text = card['nickname'] ?? '';
    storeNameController.text = card['storeName'] ?? '';
    barcodeController.text = card['barcodeNumber'] ?? '';
    setState(() => isEditing = false);
  }

  @override
  Widget build(BuildContext context) {
    // Choose content and actions by a single conditional
    final Widget content = isEditing
        ? _CardEditForm(
            nicknameController: nicknameController,
            storeNameController: storeNameController,
            barcodeController: barcodeController,
          )
        : _CardDetailsView(card: card);

    final List<Widget> viewActions = [
      // use same spaced row style as editActionsRow for consistent spacing
      // (we'll convert this list into a single row widget below)
    ];

    final Widget viewActionsRow = Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
      child: Row(
        children: [
          Expanded(
            child: TextButton(
              onPressed: isSaving ? null : () => Navigator.of(context).pop({'action': _hasChanges ? 'updated' : 'closed'}),
              style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12)),
              child: const Text('Close'),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: TextButton(
              onPressed: isSaving ? null : () => setState(() => isEditing = true),
              style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12)),
              child: const Text('Edit'),
            ),
          ),
        ],
      ),
    );

    // Compact, nicely spaced row of actions shown while editing.
    final Widget editActionsRow = Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
      child: Row(
        children: [
          // Delete: outlined with red accent
          Expanded(
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.red),
                foregroundColor: Colors.red,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              onPressed: isSaving ? null : _deleteCard,
              child: isSaving
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Delete'),
            ),
          ),
          const SizedBox(width: 8),

          // Cancel
          Expanded(
            child: TextButton(
              onPressed: isSaving ? null : _cancelEdit,
              style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12)),
              child: const Text('Cancel'),
            ),
          ),
          const SizedBox(width: 8),

          // Save: primary action
          Expanded(
            child: ElevatedButton(
              onPressed: isSaving ? null : _saveCard,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12)),
              child: isSaving
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Save'),
            ),
          ),
        ],
      ),
    );

    return AlertDialog(
      title: Text(isEditing ? 'Edit Card' : 'Card Details'),
      content: SingleChildScrollView(child: content),
      actions: isEditing ? [editActionsRow] : [viewActionsRow],
    );
  }
}

/// Stateless widget that renders the read-only details.
class _CardDetailsView extends StatelessWidget {
  final Map<String, dynamic> card;
  const _CardDetailsView({Key? key, required this.card}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Nickname', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(card['nickname'] ?? ''),
        const SizedBox(height: 12),
        const Text('Store Name', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(card['storeName'] ?? ''),
        const SizedBox(height: 12),
        const Text('Barcode', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(card['barcodeNumber'] ?? ''),
      ],
    );
  }
}

/// Stateless widget that renders the edit form.
class _CardEditForm extends StatelessWidget {
  final TextEditingController nicknameController;
  final TextEditingController storeNameController;
  final TextEditingController barcodeController;

  const _CardEditForm({
    Key? key,
    required this.nicknameController,
    required this.storeNameController,
    required this.barcodeController,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Keep layout simple; parent handles save/cancel/delete callbacks
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        TextField(controller: nicknameController, decoration: const InputDecoration(labelText: 'Nickname')),
        const SizedBox(height: 12),
        TextField(controller: storeNameController, decoration: const InputDecoration(labelText: 'Store Name')),
        const SizedBox(height: 12),
        TextField(controller: barcodeController, decoration: const InputDecoration(labelText: 'Barcode Number')),
      ],
    );
  }
}