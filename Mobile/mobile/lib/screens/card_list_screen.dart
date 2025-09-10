import 'package:flutter/material.dart';
import '../widgets/custom_app_bar.dart';
import '../services/loyalty_card_service.dart';
import '../services/auth_service.dart';
import '../widgets/card_details_dialog.dart';

enum SortField { alphabetical, dateAdded }

class CardListPage extends StatefulWidget {
  @override
  _CardListPageState createState() => _CardListPageState();
}

class _CardListPageState extends State<CardListPage> {
  List<Map<String, dynamic>> cards = [];
  bool isLoading = true;
  String? error;
  SortField _sortField = SortField.alphabetical;
  bool _ascending = true;

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
      _applySort();
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

  void _applySort() {
    setState(() {
      cards.sort((a, b) {
        if (_sortField == SortField.alphabetical) {
          final aName = (a['nickname'] ?? a['title'] ?? a['storeName'] ?? '')
              .toString()
              .toLowerCase();
          final bName = (b['nickname'] ?? b['title'] ?? b['storeName'] ?? '')
              .toString()
              .toLowerCase();
          final cmp = aName.compareTo(bName);
          return _ascending ? cmp : -cmp;
        } else {
          DateTime parseDate(Map<String, dynamic> m) {
            final raw = (m['creationDate'] ?? '').toString().trim();
            if (raw.isEmpty) return DateTime.fromMillisecondsSinceEpoch(0);
            var dt = DateTime.tryParse(raw);
            if (dt != null) return dt;
            final millis = int.tryParse(raw);
            if (millis != null) return DateTime.fromMillisecondsSinceEpoch(millis);
            return DateTime.fromMillisecondsSinceEpoch(0);
          }

          final da = parseDate(a);
          final db = parseDate(b);
          final cmp = da.compareTo(db);
          return _ascending ? cmp : -cmp;
        }
      });
    });
  }

  void _cycleSort() {
    setState(() {
      if (_sortField == SortField.alphabetical) {
        if (_ascending) {
          _ascending = false;
        } else {
          _sortField = SortField.dateAdded;
          _ascending = true;
        }
      } else {
        if (_ascending) {
          _ascending = false;
        } else {
          _sortField = SortField.alphabetical;
          _ascending = true;
        }
      }
      _applySort();
    });
    final label = _sortField == SortField.alphabetical ? 'Alphabetical' : 'Date Added';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Sorted: $label ${_ascending ? 'ascending' : 'descending'}'), duration: Duration(milliseconds: 700)),
    );
  }

  void _showSortOptions() {
    showModalBottomSheet(
      context: context,
      isDismissible: true, // allow tapping outside to close
      builder: (BuildContext context) {
        return StatefulBuilder(builder: (context, setModalState) {
          return Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.sort_by_alpha),
                  title: const Text('Alphabetical'),
                  trailing: Icon(
                    _sortField == SortField.alphabetical
                        ? (_ascending ? Icons.arrow_upward : Icons.arrow_downward)
                        : null,
                  ),
                  onTap: () {
                    setModalState(() {
                      if (_sortField == SortField.alphabetical) {
                        _ascending = !_ascending;
                      } else {
                        _sortField = SortField.alphabetical;
                        _ascending = true;
                      }
                    });
                    // apply sort immediately so user can preview results while sheet remains open
                    setState(() => _applySort());
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.access_time),
                  title: const Text('Date Added'),
                  trailing: Icon(
                    _sortField == SortField.dateAdded
                        ? (_ascending ? Icons.arrow_upward : Icons.arrow_downward)
                        : null,
                  ),
                  onTap: () {
                    setModalState(() {
                      if (_sortField == SortField.dateAdded) {
                        _ascending = !_ascending;
                      } else {
                        _sortField = SortField.dateAdded;
                        _ascending = true;
                      }
                    });
                    setState(() => _applySort());
                  },
                ),
              ],
            ),
          );
        });
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
  final double width = MediaQuery.of(context).size.width;
  final int responsiveColumns = width >= 200 ? 2 : 1;

  return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: CustomAppBar(
        title: 'Cards',
        onSortPressed: _showSortOptions,
      ),
      body: Column(
        children: [
          Expanded(
            child: isLoading
                ? Center(child: CircularProgressIndicator())
                : error != null
                    ? Center(child: Text('Error: $error'))
                    : RefreshIndicator(
                        onRefresh: _loadCards,
                        child: GridView.builder(
                    padding: const EdgeInsets.fromLTRB(8, 6, 8, 8),
                          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: responsiveColumns,
                                            childAspectRatio: responsiveColumns == 1 ? 1.4 : 1.25,
                          ),
                          itemCount: cards.length,
                          itemBuilder: (context, index) {
                            final card = cards[index];
                            return Card(
                              color: Colors.green[600],
                              elevation: 2,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              clipBehavior: Clip.antiAlias,
                              child: InkWell(
                                onTap: () => _showCardDetails(card),
                                hoverColor: Colors.black12,
                                splashColor: Colors.white24,
                                borderRadius: BorderRadius.circular(12),
                                child: Center(
                                  child: Padding(
                                    padding: const EdgeInsets.all(12.0),
                                    child: Text(
                                      _displayName(card),
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
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
