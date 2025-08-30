import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';

class PhotoHomePage extends StatefulWidget {
  const PhotoHomePage({super.key});

  @override
  State<PhotoHomePage> createState() => _PhotoHomePageState();
}

class _PhotoHomePageState extends State<PhotoHomePage> {
  CameraController? _cameraController;
  Future<void>? _initializeControllerFuture;
  XFile? _capturedImage;

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
  FlashMode _currentFlashMode = FlashMode.off;
  Future<void> _toggleFlash() async {
    if (_cameraController == null) return;

    setState(() {
      _currentFlashMode =
      _currentFlashMode == FlashMode.off ? FlashMode.always : FlashMode.off;
    });

    await _cameraController!.setFlashMode(_currentFlashMode);
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _capturedImage == null
      // 🔹 Camera mode

          ? FutureBuilder(
        future: _initializeControllerFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.done) {
            return Stack(
              children: [
                Positioned.fill(child: CameraPreview(_cameraController!)),

                // Flash toggle button (top-right)
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

                // Black bottom panel with capture button
                Align(
                  alignment: Alignment.bottomCenter,
                  child: Container(
                    width: double.infinity,  // ✅ full width
                    color: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    child: GestureDetector(
                      onTap: _capturePhoto,
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 4),
                          color: Colors.transparent,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            );
          } else {
            return const Center(child: CircularProgressIndicator());
          }
        },
      )
      // 🔹 Preview mode
          : Stack(
        children: [
          Positioned.fill(
            child: Image.file(
              File(_capturedImage!.path),
              fit: BoxFit.cover,
            ),
          ),
          // Bottom panel with Back + Submit
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              color: Colors.black.withOpacity(0.8),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Back button
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey[800],
                    ),
                    onPressed: () {
                      setState(() => _capturedImage = null);
                    },
                    child: const Text("Back"),
                  ),
                  // Submit button
                  ElevatedButton(
                    onPressed: () {
                      // TODO: Upload or handle submit
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("Image submitted!")),
                      );
                    },
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
