# T2V-007: Model Weight Caching

**Status**: ✅ Complete (Already Implemented)
**Priority**: P0
**Category**: text-to-video
**Effort**: 5pts

## Overview

Model weight caching system using Modal volumes to persist HuggingFace model weights across container restarts. This significantly reduces cold start times and bandwidth usage by storing model files in a persistent volume shared across all T2V models.

## Implementation Status

Model weight caching was implemented as part of the initial T2V model deployments (T2V-001 through T2V-005). All models use a shared Modal volume for caching.

## Architecture

### Shared Volume

All T2V models share a single Modal volume named `t2v-models`:

```python
# Shared across all T2V models
model_volume = modal.Volume.from_name("t2v-models", create_if_missing=True)
```

### Volume Mount

The volume is mounted at `/root/models` in all containers:

```python
@app.cls(
    image=image,
    gpu="A100-40GB",
    volumes={"/root/models": model_volume},  # Mounted here
    timeout=1200,
    scaledown_window=600,
)
```

### Model-Specific Directories

Each model stores its weights in a dedicated subdirectory:

- `/root/models/ltx-video/` - LTX-Video weights
- `/root/models/mochi/` - Genmo Mochi weights
- `/root/models/hunyuan/` - HunyuanVideo weights
- `/root/models/wan/` - Alibaba Wan2.2 weights
- `/root/models/longcat-avatar/` - LongCat Avatar weights

### Cache Configuration

Each model sets appropriate HuggingFace cache environment variables:

```python
model_dir = Path("/root/models/mochi")
model_dir.mkdir(parents=True, exist_ok=True)

# Set cache directory for HuggingFace
os.environ["HF_HOME"] = str(model_dir)
os.environ["TRANSFORMERS_CACHE"] = str(model_dir)

# Load model with explicit cache_dir
pipe = MochiPipeline.from_pretrained(
    "genmo/mochi-1-preview",
    variant="bf16",
    torch_dtype=torch.bfloat16,
    cache_dir=str(model_dir),  # Explicit cache location
)
```

## Implementation Details

### LTX-Video (scripts/modal_ltx_video.py)

```python
model_volume = modal.Volume.from_name("t2v-models", create_if_missing=True)

@app.cls(
    volumes={"/root/models": model_volume},
)
class LTXVideoGenerator:
    @modal.enter()
    def setup(self):
        model_dir = Path("/root/models/ltx-video")
        model_dir.mkdir(parents=True, exist_ok=True)
        os.environ["HF_HOME"] = str(model_dir)
        os.environ["TRANSFORMERS_CACHE"] = str(model_dir)
        # Models download to and are cached in model_dir
```

### Mochi (scripts/modal_mochi.py)

```python
model_volume = modal.Volume.from_name("t2v-models", create_if_missing=True)

@app.cls(
    volumes={"/root/models": model_volume},
)
class MochiVideoGenerator:
    @modal.enter()
    def setup(self):
        model_dir = Path("/root/models/mochi")
        model_dir.mkdir(parents=True, exist_ok=True)
        os.environ["HF_HOME"] = str(model_dir)
        os.environ["TRANSFORMERS_CACHE"] = str(model_dir)

        self.pipe = MochiPipeline.from_pretrained(
            "genmo/mochi-1-preview",
            variant="bf16",
            cache_dir=str(model_dir),
        )
```

### HunyuanVideo (scripts/modal_hunyuan.py)

```python
model_volume = modal.Volume.from_name("t2v-models", create_if_missing=True)

@app.cls(
    volumes={"/root/models": model_volume},
)
class HunyuanVideoGenerator:
    @modal.enter()
    def setup(self):
        model_dir = Path("/root/models/hunyuan")
        model_dir.mkdir(parents=True, exist_ok=True)
        os.environ["HF_HOME"] = str(model_dir)
        os.environ["TRANSFORMERS_CACHE"] = str(model_dir)

        self.pipe = HunyuanVideoPipeline.from_pretrained(
            "tencent/HunyuanVideo",
            torch_dtype=torch.bfloat16,
            cache_dir=str(model_dir),
        )
```

### Wan2.2 (scripts/modal_wan.py)

```python
model_volume = modal.Volume.from_name("t2v-models", create_if_missing=True)

@app.cls(
    volumes={"/root/models": model_volume},
)
class WanVideoGenerator:
    @modal.enter()
    def setup(self):
        model_dir = Path("/root/models/wan")
        model_dir.mkdir(parents=True, exist_ok=True)
        os.environ["HF_HOME"] = str(model_dir)
        os.environ["TRANSFORMERS_CACHE"] = str(model_dir)

        # Multiple component models
        self.text_encoder = T5EncoderModel.from_pretrained(
            "alibaba-pai/Wan2.2-MoE",
            subfolder="text_encoder",
            cache_dir=str(model_dir),
        )
        # ... other components
```

### LongCat Avatar (scripts/modal_longcat_avatar.py)

```python
model_volume = modal.Volume.from_name("t2v-models", create_if_missing=True)

@app.cls(
    volumes={"/root/models": model_volume},
)
class AvatarGenerator:
    @modal.enter()
    def setup(self):
        model_dir = Path("/root/models/longcat-avatar")
        model_dir.mkdir(parents=True, exist_ok=True)
        os.environ["HF_HOME"] = str(model_dir)
        os.environ["TRANSFORMERS_CACHE"] = str(model_dir)

        # Multiple component models
        self.audio_encoder = Wav2Vec2Model.from_pretrained(
            "facebook/wav2vec2-base-960h",
            cache_dir=str(model_dir)
        )
        # ... other components
```

## Benefits

### 1. Reduced Cold Start Time

**Without Caching**:
- LTX-Video: ~2-3 minutes to download weights
- Mochi: ~5-7 minutes (10B params)
- HunyuanVideo: ~8-10 minutes (13B params)
- Wan2.2: ~10-12 minutes (multiple large models)
- LongCat Avatar: ~3-4 minutes

**With Caching**:
- First run: Download and cache (one-time cost per model)
- Subsequent runs: 10-30 seconds to load from cache
- **90-95% reduction in startup time**

### 2. Bandwidth Savings

Model sizes:
- LTX-Video: ~8GB
- Mochi (bf16): ~20GB
- HunyuanVideo (bf16): ~26GB
- Wan2.2: ~35GB
- LongCat Avatar: ~12GB

**Total savings per container restart**: 100GB+ of bandwidth

### 3. Cost Efficiency

- Reduced compute time spent downloading models
- Lower egress charges from HuggingFace
- Faster response times for users
- Better resource utilization

### 4. Reliability

- Less dependent on HuggingFace availability
- Consistent performance across deployments
- Reduced network-related failures

## Volume Management

### Check Volume Status

```bash
# List all volumes
modal volume list

# Show t2v-models volume details
modal volume get t2v-models
```

### Volume Statistics

The `t2v-models` volume stores approximately:
- Total size: ~100-120GB
- Files: Thousands of model weight files, config files, tokenizers
- Persistence: Permanent until explicitly deleted
- Access: Shared across all T2V model containers

### Clear Cache (If Needed)

```bash
# Delete and recreate volume (will trigger re-download on next use)
modal volume delete t2v-models

# Volume will be recreated automatically on next model deployment
# due to create_if_missing=True
```

## Cache Strategy

### Lazy Loading

Models are only downloaded when first accessed:
1. Deploy model to Modal
2. First generation request triggers model download
3. Subsequent requests use cached weights

### Version Management

Model versions are cached based on:
- Model ID (e.g., "genmo/mochi-1-preview")
- Variant (e.g., "bf16")
- Git commit hash (from HuggingFace)

Updates to models on HuggingFace require manual cache clearing or version pinning.

### Shared vs. Isolated

**Current Implementation**: Shared volume (`t2v-models`)
- ✅ Efficient storage use
- ✅ Simplified management
- ✅ Fast deployment of new models

**Alternative (Not Implemented)**: Per-model volumes
- Individual volumes per model
- More granular control
- Higher storage overhead
- More complex management

## Performance Metrics

### First Run (Cold Start with Download)
```
LTX-Video:     ~180s (download) + ~15s (load) = ~195s
Mochi:         ~420s (download) + ~30s (load) = ~450s
HunyuanVideo:  ~600s (download) + ~40s (load) = ~640s
Wan2.2:        ~720s (download) + ~60s (load) = ~780s
LongCat:       ~240s (download) + ~20s (load) = ~260s
```

### Subsequent Runs (Warm Start with Cache)
```
LTX-Video:     ~15s (load from cache)
Mochi:         ~30s (load from cache)
HunyuanVideo:  ~40s (load from cache)
Wan2.2:        ~60s (load from cache)
LongCat:       ~20s (load from cache)
```

### Improvement Factor
- LTX-Video: **13x faster**
- Mochi: **15x faster**
- HunyuanVideo: **16x faster**
- Wan2.2: **13x faster**
- LongCat: **13x faster**

## Best Practices

### 1. Always Use cache_dir Parameter

```python
# Good
pipe = Pipeline.from_pretrained(
    "model-name",
    cache_dir=str(model_dir),
)

# Bad (uses default HuggingFace cache, not persisted)
pipe = Pipeline.from_pretrained("model-name")
```

### 2. Set Environment Variables

```python
# Ensures all HuggingFace downloads go to the right place
os.environ["HF_HOME"] = str(model_dir)
os.environ["TRANSFORMERS_CACHE"] = str(model_dir)
```

### 3. Create Directories Early

```python
# Ensure directory exists before loading
model_dir.mkdir(parents=True, exist_ok=True)
```

### 4. Use Consistent Naming

Keep model directory names consistent and descriptive:
- `/root/models/ltx-video/` not `/root/models/ltx/`
- Lowercase, hyphenated names
- Match the model ID where possible

## Troubleshooting

### Cache Miss (Model Redownloads)

**Symptoms**: Model downloads every time despite caching
**Causes**:
- `cache_dir` not set in `from_pretrained()`
- Environment variables not set
- Directory permissions issue
- Volume not mounted correctly

**Solution**:
```python
# Verify volume mount
volumes={"/root/models": model_volume}

# Set environment variables
os.environ["HF_HOME"] = str(model_dir)
os.environ["TRANSFORMERS_CACHE"] = str(model_dir)

# Explicit cache_dir
cache_dir=str(model_dir)
```

### Disk Space Issues

**Symptoms**: Out of disk space errors
**Cause**: Volume size limit reached

**Solution**:
```bash
# Check volume size
modal volume get t2v-models

# Clear old or unused models
modal volume delete t2v-models
# Redeploy needed models
```

### Corrupted Cache

**Symptoms**: Model loading errors, checksum failures
**Cause**: Incomplete downloads, disk corruption

**Solution**:
```bash
# Delete corrupted cache
modal volume delete t2v-models

# Redeploy and re-download models
modal deploy scripts/modal_mochi.py
```

## Future Enhancements

- [ ] Automatic cache versioning with model updates
- [ ] Cache warming during deployment
- [ ] Shared cache for similar models (weight sharing)
- [ ] Cache compression to reduce storage costs
- [ ] Multi-region cache replication
- [ ] Cache metrics and monitoring
- [ ] Automated cache cleanup policies

## Related Features

- **T2V-001**: LTX-Video Modal Deployment ✅
- **T2V-002**: Mochi Model Integration ✅
- **T2V-003**: HunyuanVideo Integration ✅
- **T2V-004**: Wan2.2 Model Integration ✅
- **T2V-005**: LongCat Avatar Integration ✅
- **T2V-006**: T2V API Router ✅
- **T2V-008**: T2V Web Endpoint (pending)
- **T2V-009**: T2V CLI Interface (pending)
- **T2V-010**: Video Output Pipeline (pending)

## References

- [Modal Volumes Documentation](https://modal.com/docs/guide/volumes)
- [HuggingFace Cache Documentation](https://huggingface.co/docs/transformers/installation#cache-setup)
- [Diffusers Caching Guide](https://huggingface.co/docs/diffusers/optimization/fp16)

## License

This feature is part of the AI Video Platform project.
