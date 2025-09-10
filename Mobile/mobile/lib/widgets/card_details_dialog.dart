import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../services/auth_service.dart';
import '../services/loyalty_card_service.dart';
import '../services/barcode_service.dart';

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
    final Widget content = isEditing
        ? _CardEditForm(
            nicknameController: nicknameController,
            storeNameController: storeNameController,
            barcodeController: barcodeController,
          )
        : _CardDetailsView(card: card);

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

    final Widget editActionsRow = Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
      child: Row(
        children: [
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

          Expanded(
            child: TextButton(
              onPressed: isSaving ? null : _cancelEdit,
              style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12)),
              child: const Text('Cancel'),
            ),
          ),
          const SizedBox(width: 8),

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
      title: Text(
        isEditing
            ? 'Edit Card'
            : ((card['nickname'] ?? '').toString().trim().isNotEmpty
                ? (card['nickname'] ?? '')
                : 'Card Details'),
        style: TextStyle(
          fontSize: isEditing ? 16 : 18,
          fontWeight: isEditing ? FontWeight.w600 : FontWeight.bold,
        ),
      ),
      content: SingleChildScrollView(child: content),
      actions: isEditing ? [editActionsRow] : [viewActionsRow],
    );
  }
}

class _CardDetailsView extends StatelessWidget {
  final Map<String, dynamic> card;
  const _CardDetailsView({Key? key, required this.card}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final String barcodeNumber = (card['barcodeNumber'] ?? '').toString().trim();
    Widget barcodeWidget = const SizedBox.shrink();

    if (barcodeNumber.isNotEmpty) {
      try {
        final svg = BarcodeService.generateSvgForNumber(barcodeNumber, width: 320, height: 100, drawText: true);
        barcodeWidget = SizedBox(
          width: double.infinity,
          height: 110,
          child: Center(
            child: SvgPicture.string(
              svg,
              width: double.infinity,
              height: 100,
              fit: BoxFit.contain,
            ),
          ),
        );
      } catch (e) {
        barcodeWidget = Padding(
          padding: const EdgeInsets.symmetric(vertical: 12.0),
          child: Text('Unable to render barcode: $e', style: TextStyle(color: Colors.red[700])),
        );
      }
    }

    final String rawCreation = (card['creationDate'] ?? '').toString().trim();
    String? formattedCreation;
    if (rawCreation.isNotEmpty) {
      DateTime? dt = DateTime.tryParse(rawCreation);
      if (dt == null) {
        final millis = int.tryParse(rawCreation);
        if (millis != null) dt = DateTime.fromMillisecondsSinceEpoch(millis);
      }
      if (dt != null) {
        final local = dt.toLocal();
        String two(int n) => n.toString().padLeft(2, '0');
        formattedCreation = '${local.year}-${two(local.month)}-${two(local.day)} ${two(local.hour)}:${two(local.minute)}';
      }
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (barcodeNumber.isNotEmpty) barcodeWidget,
        const SizedBox(height: 8),

        const Text('Store Name', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(card['storeName'] ?? ''),
        // spacer before the bottom-right creation date
        const SizedBox(height: 12),

        // creation date (small, right-aligned)
        if (formattedCreation != null)
          Align(
            alignment: Alignment.centerRight,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  'Created',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  formattedCreation,
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

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