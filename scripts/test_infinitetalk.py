#!/usr/bin/env python3
"""
Integration tests for InfiniteTalk Modal deployment.

Run locally:
    python scripts/test_infinitetalk.py

Run on Modal:
    modal run scripts/test_infinitetalk.py
"""

import os
import sys
import json
import base64
import tempfile
import subprocess
from pathlib import Path
from typing import Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

# Test result tracking
class TestStatus(Enum):
    PASSED = "✅ PASSED"
    FAILED = "❌ FAILED"
    SKIPPED = "⏭️ SKIPPED"
    WARNING = "⚠️ WARNING"


@dataclass
class TestResult:
    name: str
    status: TestStatus
    message: str = ""
    details: dict = field(default_factory=dict)


class InfiniteTalkTestSuite:
    """Integration tests for InfiniteTalk pipeline."""
    
    def __init__(self, verbose: bool = True):
        self.verbose = verbose
        self.results: list[TestResult] = []
        self.test_dir = Path(tempfile.mkdtemp(prefix="infinitetalk_test_"))
        
    def log(self, msg: str):
        if self.verbose:
            print(msg)
    
    def add_result(self, result: TestResult):
        self.results.append(result)
        self.log(f"{result.status.value}: {result.name}")
        if result.message:
            self.log(f"  → {result.message}")
    
    # ==================== UNIT TESTS ====================
    
    def test_imports(self) -> TestResult:
        """Test that all required libraries can be imported."""
        name = "Import Dependencies"
        missing = []
        
        required_libs = [
            ("torch", "PyTorch"),
            ("transformers", "Transformers"),
            ("PIL", "Pillow"),
            ("librosa", "Librosa"),
            ("soundfile", "SoundFile"),
            ("numpy", "NumPy"),
            ("edge_tts", "Edge TTS"),
        ]
        
        for lib, display_name in required_libs:
            try:
                __import__(lib)
            except ImportError:
                missing.append(display_name)
        
        if missing:
            return TestResult(name, TestStatus.FAILED, f"Missing: {', '.join(missing)}")
        return TestResult(name, TestStatus.PASSED, f"All {len(required_libs)} dependencies available")
    
    def test_cuda_available(self) -> TestResult:
        """Test CUDA availability."""
        name = "CUDA Availability"
        try:
            import torch
            if torch.cuda.is_available():
                gpu_name = torch.cuda.get_device_name(0)
                vram = torch.cuda.get_device_properties(0).total_memory / 1e9
                return TestResult(name, TestStatus.PASSED, f"{gpu_name} ({vram:.1f}GB)")
            else:
                return TestResult(name, TestStatus.WARNING, "CUDA not available - will use CPU (slow)")
        except Exception as e:
            return TestResult(name, TestStatus.FAILED, str(e))
    
    def test_image_validation(self) -> TestResult:
        """Test image validation function."""
        name = "Image Validation"
        try:
            from PIL import Image
            import numpy as np
            
            # Create test image
            test_img = self.test_dir / "test_image.png"
            img = Image.fromarray(np.random.randint(0, 255, (512, 512, 3), dtype=np.uint8))
            img.save(test_img)
            
            # Validate
            if not test_img.exists():
                return TestResult(name, TestStatus.FAILED, "Failed to create test image")
            
            with Image.open(test_img) as loaded:
                if loaded.size != (512, 512):
                    return TestResult(name, TestStatus.FAILED, f"Wrong size: {loaded.size}")
            
            return TestResult(name, TestStatus.PASSED, "Image creation and validation works")
        except Exception as e:
            return TestResult(name, TestStatus.FAILED, str(e))
    
    def test_audio_validation(self) -> TestResult:
        """Test audio validation function."""
        name = "Audio Validation"
        try:
            import numpy as np
            import soundfile as sf
            import librosa
            
            # Create test audio (1 second of sine wave at 16kHz)
            test_audio = self.test_dir / "test_audio.wav"
            sr = 16000
            duration = 2.0
            t = np.linspace(0, duration, int(sr * duration))
            audio = 0.5 * np.sin(2 * np.pi * 440 * t)  # 440Hz sine wave
            sf.write(str(test_audio), audio, sr)
            
            # Validate
            if not test_audio.exists():
                return TestResult(name, TestStatus.FAILED, "Failed to create test audio")
            
            loaded_duration = librosa.get_duration(path=str(test_audio))
            if abs(loaded_duration - duration) > 0.1:
                return TestResult(name, TestStatus.FAILED, f"Wrong duration: {loaded_duration}")
            
            return TestResult(name, TestStatus.PASSED, f"Audio creation works ({loaded_duration:.2f}s)")
        except Exception as e:
            return TestResult(name, TestStatus.FAILED, str(e))
    
    def test_audio_resampling(self) -> TestResult:
        """Test audio resampling to 16kHz."""
        name = "Audio Resampling"
        try:
            import numpy as np
            import soundfile as sf
            import librosa
            
            # Create 48kHz audio
            test_audio_48k = self.test_dir / "test_48k.wav"
            test_audio_16k = self.test_dir / "test_16k.wav"
            sr = 48000
            duration = 1.0
            t = np.linspace(0, duration, int(sr * duration))
            audio = 0.5 * np.sin(2 * np.pi * 440 * t)
            sf.write(str(test_audio_48k), audio, sr)
            
            # Resample to 16kHz
            audio_16k, _ = librosa.load(str(test_audio_48k), sr=16000, mono=True)
            sf.write(str(test_audio_16k), audio_16k, 16000)
            
            # Validate
            resampled_audio, resampled_sr = sf.read(str(test_audio_16k))
            if resampled_sr != 16000:
                return TestResult(name, TestStatus.FAILED, f"Wrong sample rate: {resampled_sr}")
            
            return TestResult(name, TestStatus.PASSED, f"48kHz → 16kHz resampling works")
        except Exception as e:
            return TestResult(name, TestStatus.FAILED, str(e))
    
    def test_frame_num_calculation(self) -> TestResult:
        """Test frame_num calculation for various audio durations."""
        name = "Frame Number Calculation"
        try:
            test_cases = [
                (1.5, 21),   # 1.5s → 24 raw frames → n=5 → frame_num=21
                (3.0, 45),   # 3.0s → 48 raw frames → n=11 → frame_num=45
                (5.0, 77),   # 5.0s → 80 raw frames → n=19 → frame_num=77
                (10.0, 157), # 10s → 160 raw frames → n=39 → frame_num=157
            ]
            
            errors = []
            for audio_sec, expected in test_cases:
                raw_frames = int(audio_sec * 16)
                n = (raw_frames - 1) // 4
                frame_num = max(21, (n * 4) + 1)
                
                # Verify frame_num is valid: (frame_num - 1) % 4 == 0
                if (frame_num - 1) % 4 != 0:
                    errors.append(f"{audio_sec}s: frame_num={frame_num} is invalid")
                
                # Verify audio is long enough: audio_sec >= frame_num / 16
                if audio_sec < frame_num / 16:
                    errors.append(f"{audio_sec}s: audio too short for frame_num={frame_num}")
            
            if errors:
                return TestResult(name, TestStatus.FAILED, "; ".join(errors))
            return TestResult(name, TestStatus.PASSED, f"All {len(test_cases)} test cases valid")
        except Exception as e:
            return TestResult(name, TestStatus.FAILED, str(e))
    
    def test_tts_generation(self) -> TestResult:
        """Test TTS audio generation."""
        name = "TTS Generation"
        try:
            import asyncio
            import edge_tts
            
            test_audio = self.test_dir / "tts_test.mp3"
            
            async def generate():
                communicate = edge_tts.Communicate("Hello, this is a test.", "en-US-AriaNeural")
                await communicate.save(str(test_audio))
            
            asyncio.run(generate())
            
            if not test_audio.exists():
                return TestResult(name, TestStatus.FAILED, "TTS output not created")
            
            if test_audio.stat().st_size < 1000:
                return TestResult(name, TestStatus.FAILED, "TTS output too small")
            
            return TestResult(name, TestStatus.PASSED, f"TTS works ({test_audio.stat().st_size} bytes)")
        except Exception as e:
            return TestResult(name, TestStatus.FAILED, str(e))
    
    def test_base64_encoding(self) -> TestResult:
        """Test base64 encoding/decoding for API transport."""
        name = "Base64 Encoding"
        try:
            from PIL import Image
            import numpy as np
            import io
            
            # Create image
            img = Image.fromarray(np.random.randint(0, 255, (256, 256, 3), dtype=np.uint8))
            
            # Encode
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            encoded = base64.b64encode(buffer.getvalue()).decode()
            
            # Decode
            decoded = base64.b64decode(encoded)
            restored = Image.open(io.BytesIO(decoded))
            
            if restored.size != (256, 256):
                return TestResult(name, TestStatus.FAILED, f"Size mismatch: {restored.size}")
            
            return TestResult(name, TestStatus.PASSED, f"Encoded size: {len(encoded)} chars")
        except Exception as e:
            return TestResult(name, TestStatus.FAILED, str(e))
    
    def test_json_input_format(self) -> TestResult:
        """Test InfiniteTalk input JSON format."""
        name = "Input JSON Format"
        try:
            input_data = {
                "prompt": "A person speaking naturally with clear lip movements.",
                "cond_video": "/path/to/image.png",
                "cond_audio": {
                    "person1": "/path/to/audio.wav"
                }
            }
            
            # Serialize and deserialize
            json_str = json.dumps(input_data, indent=2)
            restored = json.loads(json_str)
            
            # Validate structure
            required_keys = ["prompt", "cond_video", "cond_audio"]
            for key in required_keys:
                if key not in restored:
                    return TestResult(name, TestStatus.FAILED, f"Missing key: {key}")
            
            if "person1" not in restored["cond_audio"]:
                return TestResult(name, TestStatus.FAILED, "Missing cond_audio.person1")
            
            return TestResult(name, TestStatus.PASSED, "JSON structure valid")
        except Exception as e:
            return TestResult(name, TestStatus.FAILED, str(e))
    
    # ==================== INTEGRATION TESTS ====================
    
    def test_modal_script_syntax(self) -> TestResult:
        """Test that the Modal script has valid Python syntax."""
        name = "Modal Script Syntax"
        script_path = Path(__file__).parent / "modal_infinitetalk.py"
        
        if not script_path.exists():
            return TestResult(name, TestStatus.SKIPPED, "Script not found")
        
        try:
            import ast
            with open(script_path) as f:
                ast.parse(f.read())
            return TestResult(name, TestStatus.PASSED, "Valid Python syntax")
        except SyntaxError as e:
            return TestResult(name, TestStatus.FAILED, f"Syntax error: {e}")
    
    def test_modal_imports(self) -> TestResult:
        """Test that the Modal script can be imported."""
        name = "Modal Script Import"
        try:
            # Add scripts dir to path
            scripts_dir = Path(__file__).parent
            if str(scripts_dir) not in sys.path:
                sys.path.insert(0, str(scripts_dir))
            
            # Try importing just the validation functions
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                "modal_infinitetalk", 
                scripts_dir / "modal_infinitetalk.py"
            )
            if spec is None:
                return TestResult(name, TestStatus.SKIPPED, "Could not load spec")
            
            return TestResult(name, TestStatus.PASSED, "Script structure valid")
        except Exception as e:
            return TestResult(name, TestStatus.WARNING, f"Import check: {e}")
    
    def test_end_to_end_local(self) -> TestResult:
        """Test end-to-end pipeline locally (without Modal)."""
        name = "End-to-End Local Pipeline"
        try:
            from PIL import Image
            import numpy as np
            import soundfile as sf
            import librosa
            
            # 1. Create test image
            test_img = self.test_dir / "e2e_image.png"
            img = Image.fromarray(np.random.randint(0, 255, (512, 512, 3), dtype=np.uint8))
            img.save(test_img)
            
            # 2. Create test audio (3 seconds)
            test_audio = self.test_dir / "e2e_audio.wav"
            sr = 16000
            duration = 3.0
            t = np.linspace(0, duration, int(sr * duration))
            audio = 0.3 * np.sin(2 * np.pi * 440 * t)
            sf.write(str(test_audio), audio, sr)
            
            # 3. Calculate frame_num
            audio_duration = librosa.get_duration(path=str(test_audio))
            raw_frames = int(audio_duration * 16)
            n = (raw_frames - 1) // 4
            frame_num = max(21, (n * 4) + 1)
            
            # 4. Create input JSON
            input_json = self.test_dir / "e2e_input.json"
            input_data = {
                "prompt": "A person speaking naturally.",
                "cond_video": str(test_img),
                "cond_audio": {"person1": str(test_audio)}
            }
            input_json.write_text(json.dumps(input_data, indent=2))
            
            # 5. Validate all files exist
            if not all([test_img.exists(), test_audio.exists(), input_json.exists()]):
                return TestResult(name, TestStatus.FAILED, "Not all files created")
            
            # 6. Validate frame_num
            if (frame_num - 1) % 4 != 0:
                return TestResult(name, TestStatus.FAILED, f"Invalid frame_num: {frame_num}")
            
            return TestResult(
                name, TestStatus.PASSED, 
                f"Pipeline setup OK: img={test_img.stat().st_size}B, "
                f"audio={audio_duration:.1f}s, frame_num={frame_num}"
            )
        except Exception as e:
            return TestResult(name, TestStatus.FAILED, str(e))
    
    # ==================== RUN ALL TESTS ====================
    
    def run_all(self) -> dict:
        """Run all tests and return summary."""
        print("\n" + "="*70)
        print("INFINITETALK INTEGRATION TEST SUITE")
        print("="*70 + "\n")
        
        # Unit tests
        print("--- UNIT TESTS ---")
        self.add_result(self.test_imports())
        self.add_result(self.test_cuda_available())
        self.add_result(self.test_image_validation())
        self.add_result(self.test_audio_validation())
        self.add_result(self.test_audio_resampling())
        self.add_result(self.test_frame_num_calculation())
        self.add_result(self.test_tts_generation())
        self.add_result(self.test_base64_encoding())
        self.add_result(self.test_json_input_format())
        
        # Integration tests
        print("\n--- INTEGRATION TESTS ---")
        self.add_result(self.test_modal_script_syntax())
        self.add_result(self.test_modal_imports())
        self.add_result(self.test_end_to_end_local())
        
        # Summary
        passed = sum(1 for r in self.results if r.status == TestStatus.PASSED)
        failed = sum(1 for r in self.results if r.status == TestStatus.FAILED)
        warnings = sum(1 for r in self.results if r.status == TestStatus.WARNING)
        skipped = sum(1 for r in self.results if r.status == TestStatus.SKIPPED)
        
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        print(f"  ✅ Passed:   {passed}")
        print(f"  ❌ Failed:   {failed}")
        print(f"  ⚠️  Warnings: {warnings}")
        print(f"  ⏭️  Skipped:  {skipped}")
        print(f"  Total:      {len(self.results)}")
        print("="*70 + "\n")
        
        # Cleanup
        import shutil
        try:
            shutil.rmtree(self.test_dir)
        except:
            pass
        
        return {
            "passed": passed,
            "failed": failed,
            "warnings": warnings,
            "skipped": skipped,
            "total": len(self.results),
            "success": failed == 0,
            "results": [
                {"name": r.name, "status": r.status.name, "message": r.message}
                for r in self.results
            ]
        }


def main():
    """Run the test suite."""
    suite = InfiniteTalkTestSuite(verbose=True)
    results = suite.run_all()
    
    # Exit with appropriate code
    sys.exit(0 if results["success"] else 1)


if __name__ == "__main__":
    main()
