import XCTest

/**
 * Raw XCTest accessibility tests for LLM Prompt Purify.
 *
 * Validates that all interactive UI elements have proper
 * accessibility identifiers and traits for VoiceOver support.
 *
 * Copy to: ios/LLMPromptPurifyUITests/
 */
final class AccessibilityXCTest: XCTestCase {

    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    override func tearDownWithError() throws {
        app = nil
    }

    // MARK: - Accessibility Identifiers

    func testSourceTextarea_hasAccessibilityId() {
        let sourceInput = app.textFields["source-textarea"]
        XCTAssertTrue(sourceInput.waitForExistence(timeout: 10),
                       "source-textarea accessibility identifier must exist")
    }

    func testCountryButton_hasAccessibilityId() {
        let btn = app.buttons["country-modal-button"]
        XCTAssertTrue(btn.waitForExistence(timeout: 10),
                       "country-modal-button accessibility identifier must exist")
    }

    func testSettingsButton_hasAccessibilityId() {
        let btn = app.buttons["settings-button"]
        XCTAssertTrue(btn.waitForExistence(timeout: 10),
                       "settings-button accessibility identifier must exist")
    }

    func testMaskedOutputArea_hasAccessibilityId() {
        let sourceInput = app.textFields["source-textarea"]
        XCTAssertTrue(sourceInput.waitForExistence(timeout: 10))

        sourceInput.tap()
        sourceInput.typeText("user@example.com")

        let maskedOutput = app.staticTexts["masked-output"]
        XCTAssertTrue(maskedOutput.waitForExistence(timeout: 5),
                       "masked-output accessibility identifier must exist")
    }

    // MARK: - Accessibility Traits

    func testSourceTextarea_isEditable() {
        let sourceInput = app.textFields["source-textarea"]
        XCTAssertTrue(sourceInput.waitForExistence(timeout: 10))
        XCTAssertTrue(sourceInput.isEnabled,
                       "Source textarea should be enabled/editable")
    }

    func testButtons_areEnabled() {
        let countryBtn = app.buttons["country-modal-button"]
        XCTAssertTrue(countryBtn.waitForExistence(timeout: 10))
        XCTAssertTrue(countryBtn.isEnabled,
                       "Country modal button should be enabled")

        let settingsBtn = app.buttons["settings-button"]
        XCTAssertTrue(settingsBtn.waitForExistence(timeout: 10))
        XCTAssertTrue(settingsBtn.isEnabled,
                       "Settings button should be enabled")
    }

    // MARK: - Modal Accessibility

    func testCountryModal_togglesHaveAccessibilityIds() {
        let countryBtn = app.buttons["country-modal-button"]
        XCTAssertTrue(countryBtn.waitForExistence(timeout: 10))
        countryBtn.tap()

        let brToggle = app.switches["country-toggle-BR"]
        XCTAssertTrue(brToggle.waitForExistence(timeout: 3),
                       "country-toggle-BR accessibility identifier must exist")
        XCTAssertTrue(brToggle.isEnabled,
                       "Country toggle should be enabled")
    }

    func testSettingsModal_globalToggleHasAccessibilityId() {
        let settingsBtn = app.buttons["settings-button"]
        XCTAssertTrue(settingsBtn.waitForExistence(timeout: 10))
        settingsBtn.tap()

        let globalToggle = app.switches["global-only-toggle"]
        XCTAssertTrue(globalToggle.waitForExistence(timeout: 3),
                       "global-only-toggle accessibility identifier must exist")
        XCTAssertTrue(globalToggle.isEnabled,
                       "Global-only toggle should be enabled")
    }

    // MARK: - Group Controls Accessibility

    func testGroupToggles_haveAccessibilityIds() {
        let sourceInput = app.textFields["source-textarea"]
        XCTAssertTrue(sourceInput.waitForExistence(timeout: 10))

        sourceInput.tap()
        sourceInput.typeText("user@mail.com and key: sk-proj-ABCDEFGHIJKLMNOPQRSTU")

        Thread.sleep(forTimeInterval: 4.0)

        // At least one group-toggle should have an accessibility identifier
        let personalToggle = app.switches["group-toggle-personal"]
        let credentialToggle = app.switches["group-toggle-credential"]

        let exists = personalToggle.exists || credentialToggle.exists
        XCTAssertTrue(exists,
                       "At least one group toggle accessibility identifier must exist")
    }

    func testMatchToggles_haveAccessibilityIds() {
        let sourceInput = app.textFields["source-textarea"]
        XCTAssertTrue(sourceInput.waitForExistence(timeout: 10))

        sourceInput.tap()
        sourceInput.typeText("user@mail.com")

        Thread.sleep(forTimeInterval: 4.0)

        let matchToggle = app.switches["toggle-email-address"]
        XCTAssertTrue(matchToggle.waitForExistence(timeout: 3),
                       "Per-match toggle accessibility identifier must exist")
    }

    func testRegenerateButtons_haveAccessibilityIds() {
        let sourceInput = app.textFields["source-textarea"]
        XCTAssertTrue(sourceInput.waitForExistence(timeout: 10))

        sourceInput.tap()
        sourceInput.typeText("user@mail.com")

        Thread.sleep(forTimeInterval: 4.0)

        let regenBtn = app.buttons["regenerate-email-address"]
        XCTAssertTrue(regenBtn.waitForExistence(timeout: 3),
                       "Per-match regenerate button accessibility identifier must exist")
    }
}
