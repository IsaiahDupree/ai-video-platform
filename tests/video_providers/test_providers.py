"""
Video Provider Integration Tests (NOMOCK-002)

Tests that:
1. get_video_provider() raises NotConfiguredError when MockVideoProvider is requested
2. get_video_provider() returns SoraProvider when configured
3. get_video_provider() raises NotConfiguredError for unimplemented providers
4. MockVideoProvider is no longer importable from the production package
5. MockVideoProvider still works from test directory
"""

import os
import sys
import pytest

# Ensure python/ is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'python'))


class TestNotConfiguredError:
    """Test that NotConfiguredError is properly exported and raised."""

    def test_not_configured_error_importable(self):
        from services.video_providers.base import NotConfiguredError
        assert issubclass(NotConfiguredError, Exception)

    def test_not_configured_error_in_exports(self):
        from services.video_providers import NotConfiguredError
        assert NotConfiguredError is not None


class TestGetVideoProvider:
    """Test the get_video_provider() factory function."""

    def test_mock_provider_raises_not_configured(self):
        """NOMOCK-001: Requesting 'mock' provider must raise NotConfiguredError."""
        from services.video_providers import get_video_provider, NotConfiguredError
        from services.video_providers.base import ProviderName

        with pytest.raises(NotConfiguredError, match="not available in production"):
            get_video_provider(ProviderName.MOCK)

    def test_unknown_provider_raises_not_configured(self):
        """Unknown provider env var should raise NotConfiguredError."""
        from services.video_providers import get_video_provider, NotConfiguredError

        old_val = os.environ.get("VIDEO_PROVIDER")
        try:
            os.environ["VIDEO_PROVIDER"] = "nonexistent_provider"
            with pytest.raises(NotConfiguredError, match="Unknown video provider"):
                get_video_provider()
        finally:
            if old_val is not None:
                os.environ["VIDEO_PROVIDER"] = old_val
            else:
                os.environ.pop("VIDEO_PROVIDER", None)

    def test_runway_raises_not_configured(self):
        """Runway provider should raise NotConfiguredError (not implemented)."""
        from services.video_providers import get_video_provider, NotConfiguredError
        from services.video_providers.base import ProviderName

        with pytest.raises(NotConfiguredError, match="Runway"):
            get_video_provider(ProviderName.RUNWAY)

    def test_kling_raises_not_configured(self):
        """Kling provider should raise NotConfiguredError (not implemented)."""
        from services.video_providers import get_video_provider, NotConfiguredError
        from services.video_providers.base import ProviderName

        with pytest.raises(NotConfiguredError, match="Kling"):
            get_video_provider(ProviderName.KLING)

    def test_pika_raises_not_configured(self):
        """Pika provider should raise NotConfiguredError (not implemented)."""
        from services.video_providers import get_video_provider, NotConfiguredError
        from services.video_providers.base import ProviderName

        with pytest.raises(NotConfiguredError, match="Pika"):
            get_video_provider(ProviderName.PIKA)

    def test_luma_raises_not_configured(self):
        """Luma provider should raise NotConfiguredError (not implemented)."""
        from services.video_providers import get_video_provider, NotConfiguredError
        from services.video_providers.base import ProviderName

        with pytest.raises(NotConfiguredError, match="Luma"):
            get_video_provider(ProviderName.LUMA)

    def test_sora_provider_returns_instance(self):
        """Default provider (sora) should return a SoraProvider instance."""
        from services.video_providers import get_video_provider
        from services.video_providers.base import ProviderName
        from services.video_providers.sora_provider import SoraProvider

        provider = get_video_provider(ProviderName.SORA)
        assert isinstance(provider, SoraProvider)

    def test_default_provider_is_sora(self):
        """When VIDEO_PROVIDER is not set, default should be sora."""
        from services.video_providers import get_video_provider
        from services.video_providers.sora_provider import SoraProvider

        old_val = os.environ.get("VIDEO_PROVIDER")
        try:
            os.environ.pop("VIDEO_PROVIDER", None)
            provider = get_video_provider()
            assert isinstance(provider, SoraProvider)
        finally:
            if old_val is not None:
                os.environ["VIDEO_PROVIDER"] = old_val


class TestMockProviderRemoved:
    """Test that MockVideoProvider is no longer in production code."""

    def test_mock_provider_not_importable_from_production(self):
        """MockVideoProvider should not be importable from production package."""
        with pytest.raises(ImportError):
            from services.video_providers.mock_provider import MockVideoProvider  # noqa: F401

    def test_mock_provider_in_test_dir(self):
        """MockVideoProvider should still be available from tests directory."""
        # Add test directory to path
        test_dir = os.path.dirname(__file__)
        sys.path.insert(0, test_dir)
        try:
            from mock_provider import MockVideoProvider
            assert MockVideoProvider is not None
            # Verify it still works for testing
            mock = MockVideoProvider()
            assert mock is not None
        finally:
            sys.path.remove(test_dir)


class TestProviderNameEnum:
    """Test ProviderName enum completeness."""

    def test_all_provider_names_handled(self):
        """Every ProviderName value should be handled by get_video_provider."""
        from services.video_providers import get_video_provider
        from services.video_providers.base import ProviderName, NotConfiguredError

        for name in ProviderName:
            try:
                provider = get_video_provider(name)
                # Only SORA should succeed
                assert name == ProviderName.SORA, f"Expected only SORA to succeed, but {name} did too"
            except NotConfiguredError:
                # All others should raise NotConfiguredError
                assert name != ProviderName.SORA, f"SORA should not raise NotConfiguredError"
