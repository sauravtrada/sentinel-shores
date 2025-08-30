import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;

class PhotoHomePage extends StatefulWidget {
  const PhotoHomePage({super.key});

  @override
  State<PhotoHomePage> createState() => _PhotoHomePageState();
}

class _PhotoHomePageState extends State<PhotoHomePage> {
  CameraController? _cameraController;
  Future<void>? _initializeControllerFuture;
  XFile? _capturedImage;
  FlashMode _currentFlashMode = FlashMode.off;
  Position? _currentPosition;

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    final cameras = await availableCameras();
    final firstCamera = cameras.first;

    _cameraController = CameraController(
      firstCamera,
      ResolutionPreset.high,
    );

    _initializeControllerFuture = _cameraController!.initialize();
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    super.dispose();
  }

  Future<void> _capturePhoto() async {
    try {
      await _initializeControllerFuture;
      final image = await _cameraController!.takePicture();
      setState(() {
        _capturedImage = image;
      });
    } catch (e) {
      debugPrint("Error capturing photo: $e");
    }
  }

  Future<void> _pickImageFromGallery() async {
    final picker = ImagePicker();
    final pickedImage = await picker.pickImage(source: ImageSource.gallery);
    if (pickedImage != null) {
      setState(() {
        _capturedImage = XFile(pickedImage.path);
      });
    }
  }

  Future<void> _toggleFlash() async {
    if (_cameraController == null) return;

    setState(() {
      _currentFlashMode =
      _currentFlashMode == FlashMode.off ? FlashMode.always : FlashMode.off;
    });


    await _cameraController!.setFlashMode(_currentFlashMode);
  }

  Future<void> _getCurrentLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return Future.error('Location services are disabled.');
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return Future.error('Location permissions are denied');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return Future.error(
          'Location permissions are permanently denied.');
    }

    _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high);
  }

  Future<void> _captureOrPickImage(Future<void> Function() action) async {
    await action(); // capture or pick
    await _getCurrentLocation(); // get location
  }

  Future<void> _submitImage() async {
    if (_capturedImage == null || _currentPosition == null) return;

    final request = http.MultipartRequest(
      'POST',
      Uri.parse('https://yourapi.com/upload'),
    );

    request.files.add(await http.MultipartFile.fromPath(
      'image',
      _capturedImage!.path,
    ));
    request.fields['latitude'] = _currentPosition!.latitude.toString();
    request.fields['longitude'] = _currentPosition!.longitude.toString();

    final response = await request.send();
    if (response.statusCode == 200) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Image submitted!")),
      );
      setState(() => _capturedImage = null); // reset
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Failed to submit image.")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _capturedImage == null
          ? FutureBuilder(
        future: _initializeControllerFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.done) {
            return Stack(
              children: [
                Positioned.fill(
                  child: CameraPreview(_cameraController!),
                ),
                Positioned(
                  top: 40,
                  right: 20,
                  child: IconButton(
                    icon: Icon(
                      _currentFlashMode == FlashMode.off
                          ? Icons.flash_off
                          : Icons.flash_on,
                      color: Colors.white,
                      size: 30,
                    ),
                    onPressed: _toggleFlash,
                  ),
                ),
                Align(
                  alignment: Alignment.bottomCenter,
                  child: Container(
                    width: double.infinity,
                    color: Colors.black,
                    padding: const EdgeInsets.symmetric(
                        vertical: 20, horizontal: 20),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        GestureDetector(
                          onTap: () =>
                              _captureOrPickImage(_capturePhoto),
                          child: Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border:
                              Border.all(color: Colors.white, width: 4),
                              color: Colors.transparent,
                            ),
                          ),
                        ),
                        Positioned(
                          left: 0,
                          child: GestureDetector(
                            onTap: () =>
                                _captureOrPickImage(_pickImageFromGallery),
                            child: Container(
                              width: 60,
                              height: 60,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white24,
                              ),
                              child: const Icon(
                                Icons.photo_library,
                                color: Colors.white,
                                size: 30,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              ],
            );
          } else {
            return const Center(child: CircularProgressIndicator());
          }
        },
      )
          : Stack(
        children: [
          Positioned.fill(
            child: Image.file(
              File(_capturedImage!.path),
              fit: BoxFit.cover,
            ),
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              color: Colors.black.withOpacity(0.8),
              padding: const EdgeInsets.symmetric(
                  horizontal: 20, vertical: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey[800],
                    ),
                    onPressed: () {
                      setState(() => _capturedImage = null);
                    },
                    child: const Text("Back"),
                  ),
                  ElevatedButton(
                    onPressed: _submitImage,
                    child: const Text("Submit"),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
