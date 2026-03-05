import XCTest

/**
 * Raw XCTest UI tests for the LLM Prompt Purify scanner.
 *
 * These run on an iOS Simulator through xcodebuild:
 *   xcodebuild test \
 *     -workspace ios/LLMPromptPurify.xcworkspace \
 *     -scheme LLMPromptPurify \
 *     -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
 *     -testPlan LLMPromptPurifyUITests
 *
 * Pre-requisites:
 *   1. Run `npx expo prebuild` to generate the ios/ directory
 *   2. Copy this file to: ios/LLMPromptPurifyUITests/
 *   3. Add LLMPromptPurifyUITests target to the Xcode project
 *
 * Note: React Native's `testID` maps to `accessibilityIdentifier` on iOS.
 */
final class ScannerFlowXCTest: XCTestCase {

    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    override func tearDownWithError() throws {
        app = nil
    }

    // MARK: - App Launch

    func testAppLaunches_sourceTextareaVisible() {
        let sourceInput = app.textFields["source-textarea"]
        XCTAssertTrue(sourceInput.waitForExistence(timeout: 10),
                       "Source textarea should be visible after launch")
    }

    func testAppLaunches_countryButtonVisible() {
        let btn = app.buttons["country-modal-button"]
        XCTAssertTrue(btn.waitForExistence(timeout: 10),
                       "Country modal button should be visible")
    }

    func testAppLaunches_settingsButtonVisible() {
        let btn = app.buttons["settings-button"]
        XCTAssertTrue(btn.waitForExistence(timeout: 10),
                       "Settings button should be visible")
    }

    // MARK: - Scan Workflow

    func testTypeEmail_maskedOutputAppears() {
        let sourceInput = app.textFields["source-textarea"]
        XCTAssertTrue(sourceInput.waitForExistence(timeout: 10))

        sourceInput.tap()
        sourceInput.typeText("Email me at john@example.com")

        // Wait for scan debounce
        let maskedOutput = app.staticTexts["masked-output"]
        XCTAssertTrue(maskedOutput.waitForExistence(timeout: 5),
                       "Masked output should appear after scanning email")
    }

    func testTypeSsn_maskedOutputAppears() {
        let sourceInput = app.textFields["source-textarea"]
        XCTAssertTrue(sourceInput.waitForExistence(timeout: 10))

        sourceInput.tap()
        sourceInput.typeText("SSN: 123-45-6789")

        let maskedOutput = app.staticTexts["masked-output"]
        XCTAssertTrue(maskedOutput.waitForExistence(timeout: 5),
                       "Masked output should appear after scanning SSN")
    }

    func testTypeApiKey_maskedOutputAppears() {
        let sourceInput = app.textFields["source-textarea"]
        XCTAssertTrue(sourceInput.waitForExistence(timeout: 10))

        sourceInput.tap()
        sourceInput.typeText("key: sk-proj-ABCDEFghijklmnopqrstu")

        let maskedOutput = app.staticTexts["masked-output"]
        XCTAssertTrue(maskedOutput.waitForExistence(timeout: 5),
                       "Masked output should appear after scanning API key")
    }

    func testTypeCpf_maskedOutputAppears() {
        let sourceInput = app.textFields["source-textarea"]
        XCTAssertTrue(sourceInput.waitForExistence(timeout: 10))

        sourceInput.tap()
        sourceInput.typeText("CPF: 529.982.247-25")

        let maskedOutput = app.staticTexts["masked-output"]
        XCTAssertTrue(maskedOutput.waitForExistence(timeout: 5),
                       "Masked output should appear after scanning CPF")
    }

    // MARK: - Country Scope Modal

    func testOpenCountryModal() {
        let countryBtn = app.buttons["country-modal-button"]
        XCTAssertTrue(countryBtn.waitForExistence(timeout: 10))
        countryBtn.tap()

        let brToggle = app.switches["country-toggle-BR"]
        XCTAssertTrue(brToggle.waitForExistence(timeout: 3),
                       "Brazil toggle should be visible in country modal")
    }

    func testToggleCountry() {
        let countryBtn = app.buttons["country-modal-button"]
        XCTAssertTrue(countryBtn.waitForExistence(timeout: 10))
        countryBtn.tap()

        let brToggle = app.switches["country-toggle-BR"]
        XCTAssertTrue(brToggle.waitForExistence(timeout: 3))

        brToggle.tap() // Turn off
        brToggle.tap() // Turn back on
    }

    // MARK: - Settings Modal

    func testOpenSettingsModal() {
        let settingsBtn = app.buttons["settings-button"]
        XCTAssertTrue(settingsBtn.waitForExistence(timeout: 10))
        settingsBtn.tap()

        let globalToggle = app.switches["global-only-toggle"]
        XCTAssertTrue(globalToggle.waitForExistence(timeout: 3),
                       "Global-only toggle should be visible in settings")
    }

    func testToggleGlobalOnly() {
        let settingsBtn = app.buttons["settings-button"]
        XCTAssertTrue(settingsBtn.waitForExistence(timeout: 10))
        settingsBtn.tap()

        let globalToggle = app.switches["global-only-toggle"]
        XCTAssertTrue(globalToggle.waitForExistence(timeout: 3))

        globalToggle.tap() // Enable global-only
        globalToggle.tap() // Disable
    }

    // MARK: - Edge Cases

    func testEmptyInput_doesNotCrash() {
        let sourceInput = app.textFields["source-textarea"]
        XCTAssertTrue(sourceInput.waitForExistence(timeout: 10))
        sourceInput.tap()
        // Clear any text (select all + delete)
        sourceInput.press(forDuration: 1.0)
        if app.menuItems["Select All"].exists {
            app.menuItems["Select All"].tap()
            app.keys["delete"].tap()
        }
        XCTAssertTrue(sourceInput.exists, "App should not crash on empty input")
    }

    func testSpecialCharacters_doesNotCrash() {
        let sourceInput = app.textFields["source-textarea"]
        XCTAssertTrue(sourceInput.waitForExistence(timeout: 10))
        sourceInput.tap()
        sourceInput.typeText("<!@#$%^&*()>")

        // Give time for scan engine
        Thread.sleep(forTimeInterval: 2.0)

        XCTAssertTrue(sourceInput.exists,
                       "App should not crash on special characters")
    }

    func testRapidTextEntry_appStaysResponsive() {
        let sourceInput = app.textFields["source-textarea"]
        XCTAssertTrue(sourceInput.waitForExistence(timeout: 10))

        let prompts = [
            "a@b.com",
            "111-22-3333",
            "sk-proj-AAABBBCCC111222333444",
            "+44 20 1234 5678",
            "529.982.247-25"
        ]

        for prompt in prompts {
            sourceInput.tap()
            sourceInput.press(forDuration: 1.0)
            if app.menuItems["Select All"].exists {
                app.menuItems["Select All"].tap()
                app.keys["delete"].tap()
            }
            sourceInput.typeText(prompt)
        }

        Thread.sleep(forTimeInterval: 3.0)
        XCTAssertTrue(sourceInput.exists,
                       "App should stay responsive after rapid text changes")
    }

    // MARK: - Match Controls

    func testGroupToggles_visible() {
        let sourceInput = app.textFields["source-textarea"]
        XCTAssertTrue(sourceInput.waitForExistence(timeout: 10))

        sourceInput.tap()
        sourceInput.typeText("Email: test@test.com and Key: sk-proj-ABCDEFGHIJKLMNOPQRSTU")

        // Wait for scan and controls to appear
        Thread.sleep(forTimeInterval: 4.0)

        let personalToggle = app.switches["group-toggle-personal"]
        let credentialToggle = app.switches["group-toggle-credential"]

        // At least one group toggle should be present
        let exists = personalToggle.exists || credentialToggle.exists
        XCTAssertTrue(exists,
                       "Group toggles should be visible after scanning mixed PII")
    }

    func testMatchToggle_visible() {
        let sourceInput = app.textFields["source-textarea"]
        XCTAssertTrue(sourceInput.waitForExistence(timeout: 10))

        sourceInput.tap()
        sourceInput.typeText("Email: test@test.com")

        Thread.sleep(forTimeInterval: 4.0)

        let matchToggle = app.switches["toggle-email-address"]
        XCTAssertTrue(matchToggle.waitForExistence(timeout: 3),
                       "Per-match toggle should be visible for email match")
    }
}
