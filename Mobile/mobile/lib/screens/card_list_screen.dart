import 'package:flutter/material.dart';
import '../widgets/custom_app_bar.dart';
import '../services/loyalty_card_service.dart';
import '../services/auth_service.dart';
import '../widgets/card_details_dialog.dart'; // added import

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

  void _showCardDetails(Map<String, dynamic> card) async {
    final result = await showDialog<Map<String, String>?>(
      context: context,
      builder: (context) => CardDetailsDialog(card: card),
    );

    if (result == null) return;

    final action = result['action'];
    if (action == 'deleted' || action == 'updated') {
      await _loadCards();
    }
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
