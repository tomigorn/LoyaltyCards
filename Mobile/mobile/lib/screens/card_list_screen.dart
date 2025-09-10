import 'package:flutter/material.dart';
import '../widgets/custom_app_bar.dart';
import '../services/loyalty_card_service.dart';
import '../services/auth_service.dart';

class CardListPage extends StatefulWidget {
  @override
  _CardListPageState createState() => _CardListPageState();
}

class _CardListPageState extends State<CardListPage> {
  List<Map<String, dynamic>> cards = [];
  bool isLoading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _loadCards();
  }

  Future<void> _loadCards() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      final token = await AuthService().getToken();
      final result = await LoyaltyCardService.getAll(token: token);
      setState(() {
        cards = result;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load cards: $e')),
      );
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  void _showSortOptions() {
    showModalBottomSheet(
      context: context,
      builder: (BuildContext context) {
        return Container(
          padding: EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Sort by',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 16),
              ListTile(
                leading: Icon(Icons.sort),
                title: Text('Default'),
                onTap: () {
                  setState(() {
                    // Add your sorting logic here
                  });
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: Icon(Icons.sort_by_alpha),
                title: Text('Alphabetical'),
                onTap: () {
                  setState(() {
                    // Add your sorting logic here
                  });
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: Icon(Icons.access_time),
                title: Text('Date Added'),
                onTap: () {
                  setState(() {
                    // Add your sorting logic here
                  });
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showAddCardForm() {
    final _formKey = GlobalKey<FormState>();
    final nicknameController = TextEditingController();
    final storeNameController = TextEditingController();
    final barcodeController = TextEditingController();
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(builder: (context, setDialogState) {
          return AlertDialog(
            title: Text('Add New Card'),
            content: Form(
              key: _formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextFormField(
                      controller: nicknameController,
                      decoration: InputDecoration(
                        labelText: 'Nickname',
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter a nickname';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 16),
                    TextFormField(
                      controller: storeNameController,
                      decoration: InputDecoration(
                        labelText: 'Store Name',
                      ),
                    ),
                    SizedBox(height: 16),
                    TextFormField(
                      controller: barcodeController,
                      decoration: InputDecoration(
                        labelText: 'Barcode Number',
                      ),
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: isSaving ? null : () => Navigator.of(context).pop(),
                child: Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: isSaving
                    ? null
                    : () async {
                        if (!_formKey.currentState!.validate()) return;

                        // start saving
                        setDialogState(() => isSaving = true);
                        final payload = {
                          'nickname': nicknameController.text.trim(),
                          'storeName': storeNameController.text.trim(),
                          'barcodeNumber': barcodeController.text.trim(),
                        };

                        try {
                          final token = await AuthService().getToken();
                          await LoyaltyCardService.create(payload, token: token);
                          Navigator.of(context).pop(); // close dialog
                          await _loadCards(); // reload list
                          ScaffoldMessenger.of(this.context).showSnackBar(
                            SnackBar(content: Text('Card saved')),
                          );
                        } catch (e) {
                          setDialogState(() => isSaving = false);
                          ScaffoldMessenger.of(this.context).showSnackBar(
                            SnackBar(content: Text('Failed to save card: $e')),
                          );
                        }
                      },
                child: isSaving
                    ? SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text('Save'),
              ),
            ],
          );
        });
      },
    );
  }

  void _showCardDetails(Map<String, dynamic> card) {
    final nicknameController = TextEditingController(text: card['nickname'] ?? '');
    final storeNameController = TextEditingController(text: card['storeName'] ?? '');
    final barcodeController = TextEditingController(text: card['barcodeNumber'] ?? '');
    bool isEditing = false;
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(builder: (context, setDialogState) {
          return AlertDialog(
            title: Text(isEditing ? 'Edit Card' : 'Card Details'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (!isEditing) ...[
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text('Nickname', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                    SizedBox(height: 4),
                    Align(alignment: Alignment.centerLeft, child: Text(card['nickname'] ?? '')),
                    SizedBox(height: 12),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text('Store Name', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                    SizedBox(height: 4),
                    Align(alignment: Alignment.centerLeft, child: Text(card['storeName'] ?? '')),
                    SizedBox(height: 12),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text('Barcode', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                    SizedBox(height: 4),
                    Align(alignment: Alignment.centerLeft, child: Text(card['barcodeNumber'] ?? '')),
                  ] else ...[
                    TextField(
                      controller: nicknameController,
                      decoration: InputDecoration(labelText: 'Nickname'),
                    ),
                    SizedBox(height: 12),
                    TextField(
                      controller: storeNameController,
                      decoration: InputDecoration(labelText: 'Store Name'),
                    ),
                    SizedBox(height: 12),
                    TextField(
                      controller: barcodeController,
                      decoration: InputDecoration(labelText: 'Barcode Number'),
                    ),
                  ],
                ],
              ),
            ),
            actions: [
              if (isEditing)
                TextButton(
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.red,
                  ),
                  onPressed: isSaving
                      ? null
                      : () async {
                          final confirmed = await showDialog<bool>(
                            context: context,
                            builder: (context) {
                              return AlertDialog(
                                title: Text('Delete Card'),
                                content: Text('Are you sure you want to delete this card?'),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.of(context).pop(false),
                                    child: Text('Cancel'),
                                  ),
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                                    onPressed: () => Navigator.of(context).pop(true),
                                    child: Text('Delete'),
                                  ),
                                ],
                              );
                            },
                          );
                          if (confirmed != true) return;
                          setDialogState(() => isSaving = true);
                          try {
                            final token = await AuthService().getToken();
                            await LoyaltyCardService.delete(card['id'].toString(), token: token);
                            Navigator.of(context).pop(); // close details dialog
                            await _loadCards();
                            ScaffoldMessenger.of(this.context).showSnackBar(
                              SnackBar(content: Text('Card deleted')),
                            );
                          } catch (e) {
                            setDialogState(() => isSaving = false);
                            ScaffoldMessenger.of(this.context)
                                .showSnackBar(SnackBar(content: Text('Failed to delete: $e')));
                          }
                        },
                  child: isSaving
                      ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text('Delete'),
                ),
              if (!isEditing)
                TextButton(
                  onPressed: isSaving ? null : () => Navigator.of(context).pop(),
                  child: Text('Close'),
                ),
              if (!isEditing)
                TextButton(
                  onPressed: isSaving ? null : () => setDialogState(() => isEditing = true),
                  child: Text('Edit'),
                ),
              if (isEditing)
                TextButton(
                  onPressed: isSaving
                      ? null
                      : () => setDialogState(() {
                            isEditing = false;
                          }),
                  child: Text('Cancel'),
                ),
              if (isEditing)
                ElevatedButton(
                  onPressed: isSaving
                      ? null
                      : () async {
                          final nickname = nicknameController.text.trim();
                          if (nickname.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Nickname is required')));
                            return;
                          }
                          setDialogState(() => isSaving = true);
                          final payload = {
                            'nickname': nickname,
                            'storeName': storeNameController.text.trim(),
                            'barcodeNumber': barcodeController.text.trim(),
                          };
                          try {
                            final token = await AuthService().getToken();
                            await LoyaltyCardService.update(card['id'].toString(), payload, token: token);
                            Navigator.of(context).pop();
                            await _loadCards();
                            ScaffoldMessenger.of(this.context).showSnackBar(
                              SnackBar(content: Text('Card updated')),
                            );
                          } catch (e) {
                            setDialogState(() => isSaving = false);
                            ScaffoldMessenger.of(this.context)
                                .showSnackBar(SnackBar(content: Text('Failed to update: $e')));
                          }
                        },
                  child: isSaving
                      ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text('Save'),
                ),
            ],
          );
        });
      },
    );
  }

  String _displayName(Map<String, dynamic> c) {
    return (c['nickname'] ?? c['title'] ?? c['storeName'] ?? c['id'] ?? 'Card')
        .toString();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: CustomAppBar(title: 'Cards'),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: EdgeInsets.all(16),
            color: Colors.white,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${cards.length} items',
                  style: TextStyle(color: Colors.grey[600], fontSize: 14),
                ),
                ElevatedButton.icon(
                  onPressed: _showSortOptions,
                  icon: Icon(Icons.sort, size: 18),
                  label: Text('Sort'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.black87,
                    elevation: 1,
                    side: BorderSide(color: Colors.grey[300]!),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: isLoading
                ? Center(child: CircularProgressIndicator())
                : error != null
                    ? Center(child: Text('Error: $error'))
                    : RefreshIndicator(
                        onRefresh: _loadCards,
                        child: GridView.builder(
                          padding: EdgeInsets.all(16),
                          gridDelegate:
                              SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: 3 / 2,
                          ),
                          itemCount: cards.length,
                          itemBuilder: (context, index) {
                            final card = cards[index];
                            return GestureDetector(
                              onTap: () {
                                _showCardDetails(card);
                              },
                              child: Card(
                                elevation: 2,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                clipBehavior: Clip.antiAlias,
                                child: Container(
                                  color: Colors.green[600],
                                  alignment: Alignment.center,
                                  child: Padding(
                                    padding: const EdgeInsets.all(12.0),
                                    child: Text(
                                      _displayName(card),
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      maxLines: 3,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddCardForm,
        child: Icon(Icons.add),
      ),
    );
  }
}
