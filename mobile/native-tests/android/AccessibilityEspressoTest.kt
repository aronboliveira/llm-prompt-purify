package com.llmpromptpurify.mobile

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.*
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.*
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Raw Espresso accessibility tests.
 *
 * Validates that all interactive elements have proper content descriptions
 * and are reachable by assistive technologies (TalkBack).
 *
 * Copy to: android/app/src/androidTest/java/com/llmpromptpurify/mobile/
 */
@RunWith(AndroidJUnit4::class)
class AccessibilityEspressoTest {

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    @Test
    fun sourceTextarea_hasContentDescription() {
        onView(withContentDescription("source-textarea"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun countryModalButton_hasContentDescription() {
        onView(withContentDescription("country-modal-button"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun settingsButton_hasContentDescription() {
        onView(withContentDescription("settings-button"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun sourceTextarea_isFocusable() {
        onView(withContentDescription("source-textarea"))
            .check(matches(isFocusable()))
    }

    @Test
    fun countryModalButton_isClickable() {
        onView(withContentDescription("country-modal-button"))
            .check(matches(isClickable()))
    }

    @Test
    fun settingsButton_isClickable() {
        onView(withContentDescription("settings-button"))
            .check(matches(isClickable()))
    }

    @Test
    fun maskedOutput_appearsAfterScan() {
        onView(withContentDescription("source-textarea"))
            .perform(clearText(), typeText("test@email.com"))

        Thread.sleep(3000)

        onView(withContentDescription("masked-output"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun groupToggles_haveContentDescriptions() {
        // Pre-load content to make groups appear
        onView(withContentDescription("source-textarea"))
            .perform(
                clearText(),
                typeText("Email: test@test.com, Key: sk-proj-ABCDEFGHIJKLMNOPQRSTU")
            )

        Thread.sleep(3000)

        onView(withContentDescription("group-toggle-personal"))
            .check(matches(isDisplayed()))

        onView(withContentDescription("group-toggle-credential"))
            .check(matches(isDisplayed()))
    }
}
