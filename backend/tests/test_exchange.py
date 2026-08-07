import httpx
import pytest

from app.providers import exchange


class _FakeResponse:
    def __init__(self, status_code: int, json_data: dict):
        self.status_code = status_code
        self._json = json_data

    def json(self):
        return self._json


class _FakeClient:
    """httpx.AsyncClient yerine geçen, sabit yanıt döndüren sahte istemci."""

    def __init__(self, responses: dict[str, _FakeResponse]):
        self._responses = responses

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def get(self, url, timeout=None, params=None):
        for key, resp in self._responses.items():
            if key in url:
                return resp
        raise httpx.ConnectError("mocked: no route")


@pytest.mark.asyncio
async def test_first_provider_success(monkeypatch):
    fake = _FakeClient(
        {
            "open.er-api.com": _FakeResponse(
                200, {"rates": {"TRY": 35.0, "GBP": 0.77, "EUR": 0.85}}
            )
        }
    )
    monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

    payload, source = await exchange.fetch_rates()
    assert source == "live"
    assert payload["rates"]["usd"] == 35.0
    assert round(payload["rates"]["gbp"], 4) == round(35.0 / 0.77, 4)


@pytest.mark.asyncio
async def test_falls_back_to_second_provider(monkeypatch):
    fake = _FakeClient(
        {
            "open.er-api.com": _FakeResponse(500, {}),
            "fawazahmed0": _FakeResponse(
                200, {"usd": {"try": 35.0, "gbp": 0.77, "eur": 0.85}}
            ),
        }
    )
    monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

    payload, source = await exchange.fetch_rates()
    assert source == "live"
    assert payload["rates"]["usd"] == 35.0


@pytest.mark.asyncio
async def test_both_providers_fail_raises(monkeypatch):
    fake = _FakeClient({})  # her istek ConnectError fırlatır
    monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

    with pytest.raises(RuntimeError):
        await exchange.fetch_rates()
