from app.providers.carquery import normalize_fuel_type, trims_to_engines, unwrap_jsonp


def test_unwrap_jsonp_strips_callback_wrapper():
    text = 'someCallback({"Makes":[{"make_id":"1"}]});'
    data = unwrap_jsonp(text)
    assert data == {"Makes": [{"make_id": "1"}]}


def test_unwrap_jsonp_handles_plain_json():
    text = '{"Models":[]}'
    assert unwrap_jsonp(text) == {"Models": []}


def test_normalize_fuel_type_mapping():
    assert normalize_fuel_type("Electric") == "Elektrik"
    assert normalize_fuel_type("Hybrid") == "Hibrit"
    assert normalize_fuel_type("Diesel") == "Dizel"
    assert normalize_fuel_type("Petrol") == "Benzin"
    assert normalize_fuel_type(None) == "Benzin"
    assert normalize_fuel_type("LPG") == "Benzin"  # JS ile aynı: bilinmeyen -> Benzin


def test_trims_to_engines_missing_weight_stays_none():
    trims = [
        {
            "model_engine_cc": "1600",
            "model_fuel_type": "Gasoline",
            "model_trim": "GL",
            "model_weight_kg": None,
            "model_lkm_mixed": None,
        }
    ]
    engines = trims_to_engines(trims)
    assert len(engines) == 1
    # 1350 varsayılanı burada ASLA üretilmemeli — sunum katmanının işi.
    assert engines[0]["weightKg"] is None
    assert engines[0]["fuelConsumption"] is None


def test_trims_to_engines_dedup_by_cc_and_fuel_type():
    trims = [
        {"model_engine_cc": "1600", "model_fuel_type": "Gasoline", "model_trim": "A"},
        {"model_engine_cc": "1600", "model_fuel_type": "Gasoline", "model_trim": "B"},
        {"model_engine_cc": "2000", "model_fuel_type": "Gasoline", "model_trim": "C"},
    ]
    engines = trims_to_engines(trims)
    assert len(engines) == 2


def test_trims_to_engines_sorted_by_cc_descending():
    trims = [
        {"model_engine_cc": "1200", "model_fuel_type": "Gasoline"},
        {"model_engine_cc": "2000", "model_fuel_type": "Gasoline"},
    ]
    engines = trims_to_engines(trims)
    assert [e["cc"] for e in engines] == [2000, 1200]


def test_electric_label():
    trims = [{"model_engine_cc": "0", "model_fuel_type": "Electric"}]
    engines = trims_to_engines(trims)
    assert engines[0]["label"] == "Full Elektrik"
