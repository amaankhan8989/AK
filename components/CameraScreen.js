import { useState, useRef, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const SCANNER_SIZE = width * 0.7;

export default function CameraScreen({ onScan }) {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  // State for manual trigger
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [scanned, setScanned] = useState(false);
  const scanTimeoutRef = useRef(null);

  // Delay rendering to allow native resources to free up
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsCameraReady(true);
    }, 200);
    return () => clearTimeout(timeout);
  }, []);

  // Reset scanned state when component mounts/remounts (if kept mounted, parent should handle reset)
  useEffect(() => {
    setScanned(false);
    setIsScanning(false);
    return () => {
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    if (!isScanning || scanned) return;

    // Success!
    setScanned(true);
    setIsScanning(false);
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);

    if (onScan) {
      onScan({ type, data });
    }
  };

  const handleManualScan = () => {
    if (isScanning) return;

    setIsScanning(true);
    setScanned(false);

    // Timeout if nothing found in 3 seconds
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => {
      setIsScanning(false);
      alert("No barcode detected. Please adjust position and try again.");
    }, 3000);
  };

  if (!permission || !isCameraReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="picture"
        // Only enable scanner listener when we are manually scanning
        onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "upc_e", "upc_a", "code128"],
        }}
        onCameraReady={() => console.log("Camera Ready")}
        onMountError={(e) => console.error("Camera Mount Error", e)}
      />

      {/* Scanner Overlay */}
      <View style={styles.overlay}>
        <View style={styles.unfocusedContainer} />
        <View style={styles.middleContainer}>
          <View style={styles.unfocusedContainer} />
          <View style={styles.scannerBox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.unfocusedContainer} />
        </View>
        <View style={styles.unfocusedContainer} />
      </View>

      {/* Top Controls (Flip) */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
          <Ionicons name="camera-reverse-outline" size={30} color="white" />
        </TouchableOpacity>
      </View>

      {/* Bottom Controls (Shutter/Scan) */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={styles.shutterButtonOuter}
          onPress={handleManualScan}
          disabled={isScanning}
        >
          <View style={[styles.shutterButtonInner, isScanning && styles.shutterButtonActive]} />
        </TouchableOpacity>
        <Text style={styles.hintText}>{isScanning ? "Scanning..." : "Tap to Scan"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Overlay Mask
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unfocusedContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  middleContainer: {
    flexDirection: 'row',
    height: SCANNER_SIZE,
  },
  scannerBox: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    borderWidth: 0,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Corners
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#2196F3',
    borderWidth: 4,
  },
  topLeft: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  topRight: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },

  // Controls
  topControls: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  iconButton: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 50,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  shutterButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
  shutterButtonActive: {
    backgroundColor: '#2196F3', // Change color when scanning
    transform: [{ scale: 0.9 }],
  },
  hintText: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  }
});
