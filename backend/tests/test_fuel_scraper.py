from app.providers.fuel_scraper import parse_fuel_html

FULL_HTML = """
<table>
<tr><td>Kurşunsuz 95</td><td>61,12</td></tr>
<tr><td>Kurşunsuz 98</td><td>62,50</td></tr>
<tr><td>Euro Diesel</td><td>58,20</td></tr>
<tr><td>Gazyağı</td><td>58,00</td></tr>
</table>
"""

PARTIAL_HTML = """
<tr><td>95 oktan</td><strong>61.12</strong></tr>
"""


def test_parses_all_four_prices():
    result = parse_fuel_html(FULL_HTML)
    assert result is not None
    assert result["oktan95"] == 61.12
    assert result["oktan98"] == 62.50
    assert result["euroDiesel"] == 58.20
    assert result["gazyagi"] == 58.00
    assert result["partial"] is False


def test_secondary_pattern_matches_when_primary_absent():
    result = parse_fuel_html(PARTIAL_HTML)
    assert result is not None
    assert result["oktan95"] == 61.12


def test_partial_success_interpolates_missing_fields():
    result = parse_fuel_html(PARTIAL_HTML)
    assert result["partial"] is True
    assert result["oktan98"] == round(61.12 + 1.38, 2)
    assert result["euroDiesel"] == round(61.12 - 2.92, 2)
    assert result["gazyagi"] == round(61.12 - 3.12, 2)


def test_returns_none_when_p95_missing():
    assert parse_fuel_html("<p>alakasız içerik</p>") is None


def test_plausibility_gate_rejects_out_of_range_values():
    # 5 ve 500, [20,200] aralığının dışında — eşleşme reddedilmeli.
    html = "<tr><td>Kurşunsuz 95</td><td>5</td></tr>"
    assert parse_fuel_html(html) is None
    html2 = "<tr><td>Kurşunsuz 95</td><td>500</td></tr>"
    assert parse_fuel_html(html2) is None


def test_decimal_comma_is_converted():
    html = "<tr><td>Kurşunsuz 95</td><td>61,12</td></tr>"
    result = parse_fuel_html(html)
    assert result["oktan95"] == 61.12


def test_pattern_does_not_cross_newlines():
    # JS'teki .*? satır atlamaz (DOTALL yok); Python portu da aynı davranmalı.
    html = "Kurşunsuz 95\n<td>61.12</td>"
    assert parse_fuel_html(html) is None
