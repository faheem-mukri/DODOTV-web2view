# PRD — DodoTV WebView

**Product Name:** DodoTV  
**Product Type:** LG webOS TV application  
**Platform:** LG webOS TV  
**Version:** 1.0.0  
**Status:** Development  
**Document Version:** 1.0  
**Target:** Personal / sideloaded application

---

# 1. Product Overview

DodoTV is a lightweight URL-based WebView application for LG webOS televisions.

The primary purpose of the application is to allow a user to enter a URL using the LG TV remote and open that website directly inside the application.

The application is designed primarily for opening web-based video players and media websites on a television without requiring a separate phone, laptop, or casting device.

The application should behave similarly to a simple browser/player wrapper:

1. Launch application.
2. Enter a URL.
3. Open the URL.
4. Display the website/video player fullscreen.
5. Allow the user to return to the URL screen or navigate backward.
6. Optionally save frequently used URLs.

The application should remain intentionally simple.

It is NOT intended to become a general-purpose browser.

---

# 2. Problem Statement

Using web-based video players on an LG TV can be inconvenient when:

- The website is not available as an official LG TV application.
- The user has to open the TV browser manually.
- Typing long URLs using the TV remote is inconvenient.
- Websites are not optimized for the TV browser.
- The user wants a dedicated application for repeatedly opening specific web players.

DodoTV solves this by providing a dedicated TV application with a simple URL input interface.

---

# 3. Product Goal

Build a lightweight LG webOS application that provides:

> "Open any compatible web URL directly on my TV."

The primary success criterion is:

**A user can launch the app, enter a URL using the LG remote, press Open, and view the website/video player fullscreen.**

---

# 4. Target Users

## Primary User

A person who:

- Owns an LG webOS TV.
- Uses web-based video players.
- Wants to access websites directly from their TV.
- Has Developer Mode enabled.
- Is comfortable sideloading `.ipk` applications.

## Secondary User

Developers or technically inclined users who want:

- A simple WebView wrapper.
- A personal webOS browser-like application.
- A lightweight alternative to opening URLs through the built-in TV browser.

---

# 5. Non-Goals

DodoTV should NOT attempt to become a full browser.

The following are explicitly out of scope for v1:

- Search engine
- Browser tabs
- Browser extensions
- Downloads
- File management
- User accounts
- Cloud synchronization
- Cross-device synchronization
- Ad blocking
- DRM bypass
- Authentication bypass
- Circumventing website restrictions
- Downloading videos
- Video piracy functionality
- Custom media extraction
- Custom video decoding
- VPN functionality
- Proxy functionality

The application should simply load URLs using the webOS web engine.

---

# 6. Core User Flow

## Flow A — Open a URL

```text
Launch App
    ↓
Home Screen
    ↓
Focus URL Input
    ↓
Enter URL using LG Remote
    ↓
Press OPEN
    ↓
Validate URL
    ↓
Load URL
    ↓
WebView
    ↓
Website / Video Player
```

---

# 7. User Experience

## 7.1 Home Screen

The home screen should be extremely simple.

Example:

```text
┌──────────────────────────────────────────────┐
│                                              │
│                  DodoTV                      │
│                                              │
│       Open a website directly on TV          │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ https://                                │  │
│  └────────────────────────────────────────┘  │
│                                              │
│                 [ OPEN ]                     │
│                                              │
│       Recent URLs                            │
│                                              │
│       example.com                            │
│       player.example.com                     │
│                                              │
└──────────────────────────────────────────────┘
```

---

# 8. URL Input

## Requirements

The URL input must:

- Accept HTTP URLs.
- Accept HTTPS URLs.
- Support long URLs.
- Support query parameters.
- Support URL paths.
- Support URL fragments.
- Automatically add `https://` when appropriate.
- Reject invalid URLs gracefully.

### Examples

Valid:

```text
https://example.com
```

```text
https://example.com/player
```

```text
https://example.com/watch?id=123
```

```text
http://example.com
```

Potentially invalid:

```text
hello
```

The application may optionally convert:

```text
example.com
```

into:

```text
https://example.com
```

---

# 9. Remote Control Navigation

The application must be fully usable using the LG TV remote.

Keyboard/mouse should NOT be required.

## Required remote interactions

| Remote Input | Action |
|---|---|
| Up | Move focus upward |
| Down | Move focus downward |
| Left | Move focus left |
| Right | Move focus right |
| OK / Enter | Select |
| Back | Navigate backward |
| Home | Exit application / system home |
| Numeric / keyboard | URL input where supported |

Focus states must be visually obvious.

---

# 10. URL Keyboard

The LG webOS input mechanism should be used where possible.

The user should be able to:

1. Select URL input.
2. Open the TV keyboard.
3. Type the URL.
4. Press Enter / Done.
5. Return to the application.
6. Select Open.

The UI should avoid requiring a physical keyboard.

---

# 11. URL Validation

Before opening a URL:

### Step 1

Trim whitespace.

### Step 2

Check whether a protocol exists.

If the input is:

```text
example.com
```

convert to:

```text
https://example.com
```

### Step 3

Validate the URL.

### Step 4

If invalid, display:

```text
Invalid URL

Please enter a valid website address.

[ OK ]
```

Do not crash the application.

---

# 12. WebView Screen

After opening a URL, the application enters WebView mode.

Example:

```text
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│              WEBSITE / PLAYER                │
│                                              │
│                                              │
│                                              │
└──────────────────────────────────────────────┘
```

The WebView should occupy the maximum available screen area.

No unnecessary browser chrome should be visible.

---

# 13. WebView Requirements

The WebView should support normal web functionality provided by the LG webOS web engine.

Expected functionality includes:

- HTML
- CSS
- JavaScript
- HTTP
- HTTPS
- Cookies
- Local storage where supported
- Video elements where supported
- HTML5 media where supported
- Website navigation

The application should NOT implement its own browser engine.

---

# 14. Video Playback

The primary reason for the application is viewing web-based video players.

The WebView should allow websites to use their own HTML5 video players.

Example:

```html
<video controls>
    <source src="video.mp4">
</video>
```

The application should not attempt to extract the video URL.

The website itself is responsible for:

- Video playback
- Player controls
- Streaming
- Authentication
- Subtitles
- Quality selection
- Playback controls

---

# 15. Fullscreen Mode

The application should support fullscreen video where the website requests it.

Expected behavior:

```text
Website
   ↓
Video Player
   ↓
Fullscreen Request
   ↓
webOS Fullscreen
```

The application should not add unnecessary overlays.

If fullscreen APIs are supported by the target webOS version, they should be used.

---

# 16. Back Navigation

The LG remote's Back button should behave intelligently.

## Case 1 — WebView has browser history

Example:

```text
Page A
 ↓
Page B
 ↓
Page C
```

Press Back:

```text
Page C
 ↓
Page B
```

Press Back again:

```text
Page B
 ↓
Page A
```

## Case 2 — No WebView history

If there is no previous page:

```text
WebView
   ↓
Home Screen
```

The user should return to the DodoTV URL screen.

---

# 17. Loading State

When a URL is loading:

```text
Loading...

example.com
```

Optionally display a lightweight progress indicator.

The loading UI should disappear automatically when the page finishes loading.

---

# 18. Error Handling

If the website cannot be loaded:

```text
Unable to load page

Check your internet connection
or verify that the URL is correct.

[ RETRY ]    [ HOME ]
```

Possible errors:

- No internet connection.
- DNS failure.
- Invalid URL.
- SSL/TLS failure.
- Server unavailable.
- Website blocks the TV browser.
- Unsupported web technology.

The application must never crash because a website fails to load.

---

# 19. Network Handling

DodoTV requires an internet connection for external websites.

The application should detect basic network failures.

If there is no network connection:

```text
No Internet Connection

Connect your TV to the internet
and try again.

[ RETRY ]
```

The application should not attempt to implement its own networking proxy.

---

# 20. Recent URLs

DodoTV should optionally maintain a small list of recently opened URLs.

Example:

```text
Recent

1. https://example.com/player
2. https://example2.com
3. https://example3.com
```

## Requirements

- Maximum 10 recent URLs.
- Newest URL appears first.
- Duplicate URLs should not create duplicate entries.
- Selecting a recent URL should populate/open it.
- User should be able to remove a recent URL.

---

# 21. Favorites

Optional feature for v1.1.

Users can save URLs.

Example:

```text
Favorites

▶ Movie Player
▶ Sports Player
▶ My Website
```

Each favorite contains:

```json
{
  "name": "My Player",
  "url": "https://example.com/player"
}
```

---

# 22. Persistence

The application should persist:

- Recent URLs.
- Favorite URLs.
- Last opened URL.
- Basic application settings.

Persistence should use the appropriate webOS-supported storage mechanism.

No external database is required.

---

# 23. Startup Behavior

On application launch:

```text
DodoTV

[ URL INPUT ]

[ OPEN ]

Recent URLs
Favorites
```

Optional behavior:

```text
Continue with previous URL?

[ OPEN ] [ CANCEL ]
```

This should NOT automatically open websites without user interaction in v1.

---

# 24. UI Design

## Design Philosophy

The UI should feel like a native TV utility rather than a modern SaaS website.

Avoid:

- Excessive animations.
- Neon colors.
- Glassmorphism.
- Gradients everywhere.
- Tiny text.
- Dense layouts.
- Mobile-first UI.
- Excessive cards.

Prioritize:

- Large typography.
- High contrast.
- Simple navigation.
- Large buttons.
- Clear focus states.
- Remote-friendly spacing.

---

# 25. Recommended Visual Style

Background:

```text
#111111
```

Primary text:

```text
#FFFFFF
```

Secondary text:

```text
#AAAAAA
```

Button background:

```text
#FFFFFF
```

Button text:

```text
#111111
```

The application should work well from a typical TV viewing distance.

---

# 26. Screen Resolution

The UI should primarily target:

```text
1920 × 1080
```

However, it should be responsive enough for other supported webOS TV resolutions.

Avoid hardcoding every element to a specific pixel position.

Use relative sizing where practical.

---

# 27. Accessibility

The application should support:

- Large readable fonts.
- Strong contrast.
- Clear focus indicators.
- Remote navigation.
- No reliance on hover.
- No tiny controls.

Example focus state:

```text
Normal:

[ OPEN ]

Focused:

╔══════════════╗
║    OPEN      ║
╚══════════════╝
```

---

# 28. Application Architecture

The application should be a lightweight webOS web application.

Suggested structure:

```text
dodotv/
│
├── src/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   │
│   ├── components/
│   │   ├── HomeScreen.js
│   │   ├── WebViewScreen.js
│   │   ├── UrlInput.js
│   │   ├── RecentUrls.js
│   │   └── ErrorScreen.js
│   │
│   ├── services/
│   │   ├── storage.js
│   │   ├── navigation.js
│   │   └── url.js
│   │
│   └── utils/
│       └── validation.js
│
├── icon.png
├── largeIcon.png
├── appinfo.json
├── package.json
└── README.md
```

The exact structure can be simplified depending on the chosen framework.

---

# 29. Technology Stack

## Required

- HTML
- CSS
- JavaScript

## Optional

- React

React is NOT required.

For a tiny TV application, plain JavaScript is preferred initially because it:

- Reduces bundle size.
- Reduces dependencies.
- Simplifies debugging.
- Reduces build complexity.
- Makes the `.ipk` easier to maintain.

---

# 30. webOS Application Package

The final application must be packaged as:

```text
DodoTV.ipk
```

The package should contain:

- Application metadata.
- Application icon.
- HTML.
- CSS.
- JavaScript.
- Required resources.

The package should be installable using webOS Dev Manager.

---

# 31. Application ID

Use a unique application ID.

Example:

```text
com.dodotv.app
```

If this ID is already registered or conflicts with another application, use:

```text
org.dodotv.webview
```

The ID must remain consistent between development and installation.

---

# 32. Developer Mode

Development will use LG webOS Developer Mode.

Development workflow:

```text
PC
 ↓
webOS Dev Manager
 ↓
LG TV Developer Mode
 ↓
Install .ipk
 ↓
Launch application
```

The TV must have Developer Mode enabled.

---

# 33. Development Workflow

## Step 1

Create project:

```text
dodotv/
```

## Step 2

Implement Home Screen.

## Step 3

Implement URL validation.

## Step 4

Implement WebView/page navigation.

## Step 5

Implement remote navigation.

## Step 6

Implement Back behavior.

## Step 7

Implement error handling.

## Step 8

Implement recent URLs.

## Step 9

Package application.

## Step 10

Install `.ipk` using webOS Dev Manager.

## Step 11

Test directly on the LG TV.

---

# 34. Testing Strategy

Testing must primarily happen on the actual LG TV.

A desktop browser is not sufficient because webOS uses its own browser engine and TV-specific APIs.

---

# 35. Functional Test Cases

## Test 1 — Launch

Expected:

```text
Application launches successfully.
Home screen appears.
```

## Test 2 — Valid URL

Input:

```text
https://example.com
```

Expected:

```text
Website loads successfully.
```

## Test 3 — URL Without Protocol

Input:

```text
example.com
```

Expected:

```text
https://example.com
```

is opened.

## Test 4 — Invalid URL

Input:

```text
hello
```

Expected:

```text
Invalid URL
```

## Test 5 — Back Navigation

Open a website and navigate to another page.

Press Back.

Expected:

```text
Previous page opens.
```

## Test 6 — Back From Root

Open URL.

Press Back when there is no page history.

Expected:

```text
Home Screen appears.
```

## Test 7 — Video

Open a compatible HTML5 video website.

Expected:

```text
Video loads.
Video controls work.
```

## Test 8 — Fullscreen

Open a website with a fullscreen video player.

Expected:

```text
Fullscreen mode works if supported by webOS and the website.
```

## Test 9 — Network Failure

Disconnect TV from internet.

Open URL.

Expected:

```text
Friendly error screen.
```

Application must not crash.

## Test 10 — Recent URLs

Open:

```text
example.com
```

Close application.

Reopen application.

Expected:

```text
example.com appears in Recent URLs.
```

---

# 36. Performance Requirements

The application should:

- Launch quickly.
- Avoid unnecessary JavaScript.
- Avoid heavy frameworks unless needed.
- Avoid memory leaks.
- Avoid continuously running background processes.
- Release WebView resources when appropriate.

Website performance is outside the application's direct control.

---

# 37. Security Requirements

DodoTV should NOT:

- Execute arbitrary local files.
- Store passwords unnecessarily.
- Intercept user credentials.
- Modify website content.
- Circumvent authentication.
- Bypass DRM.
- Proxy traffic through an external server.

The application should simply load user-requested URLs.

---

# 38. Privacy

DodoTV should not collect analytics by default.

No:

- User tracking.
- Remote telemetry.
- Advertising SDK.
- Account system.
- External analytics.

Recent URLs and favorites should remain locally on the TV.

---

# 39. Permissions

Only request permissions necessary for:

- Internet access.
- Web page loading.
- Local application storage where required.

Avoid unnecessary permissions.

---

# 40. Failure Scenarios

## Website refuses TV browser

Display:

```text
This website may not support your TV browser.

Try another compatible website.
```

Do not attempt to bypass the restriction.

## Website requires unsupported browser features

Display the website normally.

If it fails, show the generic error screen.

The application should not attempt to emulate Chrome/desktop browsers.

## Website requires DRM

The application should rely entirely on whatever DRM capabilities the LG TV/webOS browser officially supports.

DodoTV must not attempt to bypass DRM.

---

# 41. MVP

The MVP consists of:

### Must Have

- [ ] Home screen
- [ ] URL input
- [ ] Remote keyboard support
- [ ] URL validation
- [ ] URL loading
- [ ] WebView/browser screen
- [ ] Back navigation
- [ ] Loading indicator
- [ ] Error handling
- [ ] Fullscreen website/video support where supported
- [ ] `.ipk` packaging
- [ ] webOS Dev Manager installation

### Not Required For MVP

- [ ] Favorites
- [ ] Recent history
- [ ] Settings
- [ ] Themes
- [ ] Custom video controls
- [ ] Analytics
- [ ] Accounts
- [ ] Cloud sync

---

# 42. Version 1.1

Potential features:

- Favorites
- Recent URLs
- Delete history
- Last URL
- Custom app settings
- Startup URL
- Remember fullscreen preference

---

# 43. Version 1.2

Potential features:

- QR code URL input
- Phone-to-TV URL transfer
- Remote web control
- Favorite categories
- Custom homepage
- Multiple saved profiles

---

# 44. Future Feature — Phone Companion

A useful future feature would be allowing the user to send URLs from their phone.

Example:

```text
Phone
 ↓
Scan QR code
 ↓
Open DodoTV web interface
 ↓
Paste URL
 ↓
Send to TV
 ↓
TV opens URL
```

This would solve the biggest problem with TV URL entry:

**Typing long URLs using the TV remote.**

---

# 45. Future Feature — QR URL Input

DodoTV could display:

```text
┌───────────────────────────────┐
│                               │
│        Scan to open URL       │
│                               │
│            QR                 │
│                               │
└───────────────────────────────┘
```

The user scans the QR code using their phone.

The phone provides the URL to the TV.

---

# 46. Product Principles

DodoTV should follow five principles:

## 1. Simple

The user should understand the app immediately.

## 2. TV First

Everything should be designed around a remote and a 10-foot viewing experience.

## 3. Fast

No unnecessary loading screens or dependencies.

## 4. Private

No tracking or unnecessary external services.

## 5. Reliable

A website failing should never crash the application.

---

# 47. Definition of Done

DodoTV 1.0 is complete when:

- [ ] The application builds successfully.
- [ ] `.ipk` is generated.
- [ ] `.ipk` installs through webOS Dev Manager.
- [ ] Application launches on the LG TV.
- [ ] URL input works using the TV remote.
- [ ] HTTPS URLs load.
- [ ] HTTP URLs load where supported.
- [ ] Websites render correctly within the webOS web engine.
- [ ] HTML5 video works where supported.
- [ ] Fullscreen works where supported.
- [ ] Back navigation works.
- [ ] Invalid URLs do not crash the application.
- [ ] Network errors are handled.
- [ ] Application can be closed and reopened.
- [ ] No unnecessary permissions are requested.
- [ ] No analytics/tracking are included.

---

# 48. MVP Success Metric

The primary metric is:

> **Time from launching DodoTV to successfully displaying a user-provided website.**

Target flow:

```text
Launch
 ↓
Enter URL
 ↓
Open
 ↓
Website
```

with minimal friction.

---

# 49. Example Final Experience

User launches DodoTV.

```text
DodoTV

Enter website URL

┌────────────────────────────────────┐
│ https://example.com/player         │
└────────────────────────────────────┘

              OPEN

Recent
─────────────
example2.com
example3.com
```

User presses:

```text
OPEN
```

Application transitions to:

```text
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│              VIDEO PLAYER                    │
│                                              │
│                                              │
│                                              │
└──────────────────────────────────────────────┘
```

The website handles the player.

The application simply provides the TV-friendly WebView environment.

---

# 50. Final Technical Direction

The first implementation should intentionally remain small.

Recommended stack:

```text
HTML
CSS
JavaScript
        ↓
webOS Web App
        ↓
.IPK
        ↓
webOS Dev Manager
        ↓
LG TV
```

Do NOT begin by adding:

- React
- Node.js
- Express
- Database
- Authentication
- Backend
- Cloud infrastructure

None of those are required for the core product.

The first goal is simply:

> **Build the smallest possible webOS application that accepts a URL and displays that URL reliably on an LG TV.**
