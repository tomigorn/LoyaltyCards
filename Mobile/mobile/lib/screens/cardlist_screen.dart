import 'package:flutter/material.dart';

class CardListPage extends StatefulWidget {
  @override
  _CardListPageState createState() => _CardListPageState();
}

class _CardListPageState extends State<CardListPage> {
  // Sample image URLs - replace with your actual data
  List<String> imageUrls = [
    'https://picsum.photos/300/450?random=1',
    'https://picsum.photos/300/450?random=2',
    'https://picsum.photos/300/450?random=3',
    'https://picsum.photos/300/450?random=4',
    'https://picsum.photos/300/450?random=5',
    'https://picsum.photos/300/450?random=6',
    'https://picsum.photos/300/450?random=7',
    'https://picsum.photos/300/450?random=8',
    'https://picsum.photos/300/450?random=9',
    'https://picsum.photos/300/450?random=10',
    'https://picsum.photos/300/450?random=11',
    'https://picsum.photos/300/450?random=12',
    'https://picsum.photos/300/450?random=13',
    'https://picsum.photos/300/450?random=14',
    'https://picsum.photos/300/450?random=15',
  ];

  String sortOrder = 'Default';

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
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 16),
              ListTile(
                leading: Icon(Icons.sort),
                title: Text('Default'),
                onTap: () {
                  setState(() {
                    sortOrder = 'Default';
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
                    sortOrder = 'Alphabetical';
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
                    sortOrder = 'Date Added';
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

  void _onProfileTap() {
    // Handle profile icon tap
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Profile'),
          content: Text('Profile menu would go here'),
          actions: [
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
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        title: Text(
          'Cards',
          style: TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          Padding(
            padding: EdgeInsets.only(right: 16),
            child: GestureDetector(
              onTap: _onProfileTap,
              child: CircleAvatar(
                radius: 18,
                backgroundColor: Colors.blue[100],
                child: Icon(
                  Icons.person,
                  color: Colors.blue[700],
                  size: 20,
                ),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Sort button section
          Container(
            width: double.infinity,
            padding: EdgeInsets.all(16),
            color: Colors.white,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${imageUrls.length} items',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 14,
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _showSortOptions,
                  icon: Icon(Icons.sort, size: 18),
                  label: Text('Sort: $sortOrder'),
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
          // Scrollable card list
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.all(16),
              child: GridView.builder(
                shrinkWrap: true,
                physics: NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 3/2, // This gives us the 3:2 ratio
                ),
                itemCount: imageUrls.length,
                itemBuilder: (context, index) {
                  return Card(
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Container(
                      child: Image.network(
                        imageUrls[index],
                        fit: BoxFit.cover, // This crops the image to fit the container
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return Container(
                            color: Colors.grey[200],
                            child: Center(
                              child: CircularProgressIndicator(
                                value: loadingProgress.expectedTotalBytes != null
                                    ? loadingProgress.cumulativeBytesLoaded /
                                        loadingProgress.expectedTotalBytes!
                                    : null,
                              ),
                            ),
                          );
                        },
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: Colors.grey[200],
                            child: Icon(
                              Icons.error_outline,
                              color: Colors.grey[400],
                              size: 40,
                            ),
                          );
                        },
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}