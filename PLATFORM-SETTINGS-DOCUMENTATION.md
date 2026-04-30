# Platform Settings — Admin Panel Documentation

This section covers everything available under **Settings** in the Admin Panel.
Platform Settings is organized into six tabs: General, Payment, Theme, API & Integrations, App Versions, and Translations.
Each tab is described in full below.

---

## How to Access

Log in to your Admin Panel → click **Settings** in the left sidebar.

> **Demo Mode Notice:** If Demo Mode is active, all settings are read-only and cannot be saved. You will see a banner at the top of the page indicating this.

---

## Tab 1 — General

The General tab controls the core operational settings of your platform: fees, currency, support contact, referral program values, and seller onboarding behavior.

### Support Email

The email address shown to buyers and sellers when they need help. This appears in system emails and support pages.

- Field: `support_email`
- Example: `support@yourplatform.com`

---

### Currency Symbol

The symbol displayed next to all prices across the platform and mobile apps.

- Field: `currency`
- Default: `$`
- Example: `$`, `€`, `£`

> Only the symbol is stored here. All transactions are processed in the currency configured in your Stripe account.

---

### Platform Commission (%)

The percentage your platform takes from every completed sale. This is deducted from the seller's payout automatically.

- Field: `commission`
- Example: `10` means the platform keeps 10% of each sale

---

### Stripe Fee (%)

The percentage charged by Stripe for payment processing. This is passed through to the transaction cost calculation.

- Field: `stripe_fee`
- Default Stripe rate: `2.9`
- Example: `2.9` for 2.9%

> Set this to match the Stripe fee on your account so the platform can calculate accurate seller payouts.

---

### Extra Charges (Fixed Amount)

A fixed dollar amount added to each transaction on top of the percentage fees. This corresponds to Stripe's standard fixed per-transaction fee.

- Field: `extra_charges`
- Default Stripe fixed fee: `0.30`
- Example: `0.30` for 30 cents per transaction

---

### Referral Credit ($)

The dollar amount of credit given to a new user when they sign up using a referral link. This credit is applied toward their first purchase.

- Field: `referral_credit`
- Example: `15` gives new referred users $15 in credit

---

### Referral Credit Limit ($)

The minimum order value required before the referral credit can be applied. Orders below this amount are not eligible for the referral discount.

- Field: `referral_credit_limit`
- Example: `25` means the referral credit only applies to orders of $25 or more

---

### Seller Approval Workflow

Controls how users become sellers on your platform. This is a toggle with two modes:

**Automatic Approval (toggle ON)**
Users who apply to become sellers are approved instantly without any admin action. They gain seller access immediately after submitting their application.

**Manual Approval Required (toggle OFF)**
Every seller application must be reviewed and approved by an admin. Applications appear in the **Users** section of the admin panel under a pending/seller approval queue.

- Field: `seller_auto_approve`
- Default: Enabled (automatic)

> Recommended for new platforms: start with manual approval to control quality, then switch to automatic once you are comfortable with the volume.

---

## Tab 2 — Payment

The Payment tab stores all Stripe credentials required for the platform to process payments, handle payouts to sellers, and verify webhook events.

> All keys in this tab are masked in Demo Mode and cannot be copied or modified.

---

### Stripe Publishable Key

The public-facing Stripe key used on the frontend to initialize Stripe Elements (the card input form). This key is safe to expose to browsers.

- Field: `stripepublickey`
- Format: starts with `pk_live_` (production) or `pk_test_` (testing)

---

### Stripe Secret Key

The private Stripe key used server-side to create charges, refunds, and manage customers. Keep this secret — never expose it in client-side code.

- Field: `stripeSecretKey`
- Format: starts with `sk_live_` (production) or `sk_test_` (testing)

---

### Stripe Webhook Secret (Connected Account)

The webhook signing secret used to verify incoming events from your **Stripe Connected Accounts** (individual seller accounts). This validates that payout-related events — such as `transfer.created` or `payment_intent.succeeded` on a connected account — are genuinely from Stripe.

- Field: `stripe_webhook_key`
- Format: starts with `whsec_`
- Where to find it: Stripe Dashboard → Developers → Webhooks → your Connected Account endpoint → Signing Secret

---

### Stripe Platform Webhook Key

A **separate** webhook signing secret used to verify events from your **Stripe Platform account** itself (the main platform account, not the seller accounts). Platform-level events include account updates, payout completions, and application fee events.

- Field: `stripe_platform_webhook_key`
- Format: starts with `whsec_`
- Where to find it: Stripe Dashboard → Developers → Webhooks → your Platform endpoint → Signing Secret

> You need **two separate webhook endpoints and two separate signing secrets** — one for the platform account and one for connected accounts. They are different and cannot be swapped.

---

### Stripe Connect Account — Shipping Fees (`acct_...`)

The Stripe Connect account ID that receives shipping fee payments. When a buyer pays for shipping at checkout, the shipping fee portion is transferred to this account.

- Field: `stripe_connect_account`
- Format: starts with `acct_`
- Where to find it: Stripe Dashboard → Settings → Account details → Account ID

---

### Stripe Connect Account — Service Fees (`acct_...`)

A **separate** Stripe Connect account ID that receives the platform's service/commission fees. The platform commission is transferred to this account after each completed sale.

- Field: `stripe_service_fee_account`
- Format: starts with `acct_`

> Shipping fees and service fees can route to different accounts. If you want both fees to go to the same account, enter the same `acct_...` ID in both fields.

---

## How to Create Your Two Stripe Webhooks

This platform requires exactly two separate webhook endpoints registered in your Stripe account. They serve different purposes and produce different signing secrets. Both secrets must be entered in the Payment tab as described above.

---

### Why Two Webhooks?

Stripe has two types of events:

1. **Platform events** — things that happen on your main Stripe account (the account you log in to at dashboard.stripe.com), such as payouts completing and account balance changes.
2. **Connected Account events** — things that happen on your sellers' individual Stripe accounts (created when sellers complete Stripe Connect onboarding), such as a seller's payout being sent or a payment being processed on their behalf.

Stripe fires these events to different endpoints, and each endpoint has its own signing secret. If you only set up one webhook, the platform will fail to process one category of events — usually causing seller payouts to not trigger correctly.

---

### Before You Start

You will need:
- Access to your Stripe Dashboard (dashboard.stripe.com)
- Your platform's backend API URL (the live URL where your API server is running, e.g. `https://api.yourplatform.com`)
- Admin access to that Stripe account

> Webhooks must point to a **publicly accessible URL**. They will not work with localhost or a local development server. Use your production API URL.

---

### Webhook 1 — Platform Webhook

This webhook listens for events on your **main Stripe account**.

**Step 1:** Log in to [dashboard.stripe.com](https://dashboard.stripe.com)

**Step 2:** In the left sidebar, click **Developers**

**Step 3:** Click **Webhooks**

**Step 4:** Click **Add endpoint** (top right)

**Step 5:** In the **Endpoint URL** field, enter:
```
https://your-api-domain.com/webhook/stripe/platform
```
Replace `your-api-domain.com` with your actual backend API URL.

**Step 6:** Under **Listen to**, make sure **Events on your account** is selected (not "Events on Connected accounts")

**Step 7:** Click **Select events** and add the following events:

| Event | Purpose |
|---|---|
| `account.updated` | Tracks changes to your Stripe account |
| `payout.paid` | Confirms a payout has been sent |
| `payout.failed` | Alerts when a payout fails |
| `transfer.created` | Tracks transfers to connected accounts |
| `transfer.updated` | Tracks transfer status changes |
| `payment_intent.succeeded` | Confirms a payment was completed |
| `payment_intent.payment_failed` | Alerts when a payment fails |
| `charge.refunded` | Tracks refund events |

> If you are unsure, you can select **All events** for initial setup and narrow it down later.

**Step 8:** Click **Add endpoint**

**Step 9:** You are now on the endpoint detail page. Under **Signing secret**, click **Reveal** and copy the value — it starts with `whsec_`.

**Step 10:** Paste this value into the **Stripe Platform Webhook Key** field in your Admin Panel → Settings → Payment tab.

---

### Webhook 2 — Connected Account Webhook

This webhook listens for events on your **sellers' connected Stripe accounts**.

**Step 1:** In Stripe Dashboard, go to **Developers → Webhooks** again

**Step 2:** Click **Add endpoint**

**Step 3:** In the **Endpoint URL** field, enter:
```
https://your-api-domain.com/webhook/stripe
```
Replace `your-api-domain.com` with your actual backend API URL.

> Note this URL is different from the platform webhook. It does not have `/platform` at the end.

**Step 4:** Under **Listen to**, select **Events on Connected accounts** (this is the critical difference from Webhook 1)

**Step 5:** Click **Select events** and add the following events:

| Event | Purpose |
|---|---|
| `account.updated` | Tracks when a seller's connected account is updated or verified |
| `payout.paid` | Confirms a payout has been sent to a seller |
| `payout.failed` | Alerts when a seller payout fails |
| `payment_intent.succeeded` | Confirms a payment processed on a seller's account |
| `payment_intent.payment_failed` | Alerts when a payment on a seller's account fails |
| `charge.succeeded` | Confirms a charge on a seller's account |
| `charge.refunded` | Tracks refunds on seller accounts |
| `transfer.created` | Tracks incoming transfers to a seller's account |

> If you are unsure, you can select **All events** and filter later.

**Step 6:** Click **Add endpoint**

**Step 7:** On the endpoint detail page, click **Reveal** under **Signing secret** and copy the value.

**Step 8:** Paste this value into the **Stripe Webhook Secret (Connected Account)** field in your Admin Panel → Settings → Payment tab.

---

### Verifying Your Setup

After saving both secrets in the admin panel, you can test each webhook from the Stripe Dashboard:

1. Go to **Developers → Webhooks**
2. Click on one of your endpoints
3. Click **Send test webhook**
4. Choose any event from the list and click **Send test webhook**
5. Scroll down to the **Recent deliveries** section — if the response shows a `200` status, your endpoint is receiving and correctly verifying the signature

If you see a `400` or `500` error on the test event, the most common cause is the signing secret in the admin panel not matching the one shown in Stripe.

---

### Summary — Which Secret Goes Where

| Admin Panel Field | Stripe Setting | Endpoint URL Pattern |
|---|---|---|
| **Stripe Platform Webhook Key** | Events on **your account** | `/webhook/stripe/platform` |
| **Stripe Webhook Secret (Connected Account)** | Events on **Connected accounts** | `/webhook/stripe` |

---

## Tab 3 — Theme

The Theme tab controls all visual branding for both the web platform and mobile apps. Changes here affect how your platform looks to end users.

> Click **Save Theme Settings** at the bottom of this tab to apply any changes. Theme settings have their own separate save button from the General tab.

---

### App Name

The name of your platform. This is used throughout the mobile apps (splash screen, navigation, push notification sender name) and as the default browser tab title on the web.

- Field: `app_name`
- Example: `TokShop`

---

### SEO Title

The text that appears in the browser tab when users visit the web marketplace. If left empty, the App Name is used instead.

- Field: `seo_title`
- Example: `TokShop — Live Shopping Marketplace`

> A good SEO title is descriptive and includes your brand name. It helps with search engine discoverability.

---

### App Logo

The primary logo used in the mobile apps. Upload an image file directly — a preview is shown once uploaded. Click **Upload** after selecting the file, then click **Save Theme Settings**.

- Field: `app_logo`
- Recommended format: PNG or SVG with transparent background
- Recommended size: square, at least 512×512px

---

### Landing Page Logo

A separate logo shown on the web marketplace's landing/home page. This can be different from the App Logo — for example, a wider horizontal version of your logo suited for web headers.

- Field: `landing_page_logo`
- Recommended format: PNG or SVG
- Upload works the same as App Logo — select file → Upload → Save Theme Settings

---

### Slogan

A short tagline that appears alongside your logo on the landing page.

- Field: `slogan`
- Example: `Shop Live. Buy Real.`

---

### Website URL

Your main marketing or company website URL. Used in footer links and "learn more" links across the platform.

- Field: `website_url`
- Example: `https://tokshoplive.com`

---

### Theme Colors (Mobile App)

These four color values control the color scheme of your **mobile apps** (Flutter). Colors are entered in `AARRGGBB` format — an 8-character hex code where the first two characters are the alpha (opacity) channel and the last six are the standard RGB hex color.

| Field | Description | Default |
|---|---|---|
| Primary Color | Main brand color used for highlights, icons, active states | `FFFACC15` (yellow) |
| Secondary Color | Accent color for secondary UI elements | `FF0D9488` (teal) |
| Button Color | Background color of primary buttons | `FF000000` (black) |
| Button Text Color | Text color on primary buttons | `FFFFFFFF` (white) |

**AARRGGBB Format Examples:**
- `FF` at the start = fully opaque (100% opacity)
- `80` at the start = 50% transparent
- `FFFACC15` = fully opaque yellow (#FACC15)
- `FF0D9488` = fully opaque teal (#0D9488)

> These colors apply to mobile apps only. The web platform uses its own CSS theming independent of these values.

---

### Privacy Policy URL

A link to your privacy policy page. Shown to users during sign-up and in the app footer.

- Field: `privacy_url`
- Example: `https://yourplatform.com/privacy`

---

### Terms of Service URL

A link to your terms of service page. Shown to users during sign-up and seller onboarding.

- Field: `terms_url`
- Example: `https://yourplatform.com/terms`

---

### Demo Mode

When enabled, **all create, edit, and delete operations are disabled across the entire platform** — for all users including super admins. No data can be modified while Demo Mode is active. This is designed for live product demonstrations where you want to show the platform without risk of data being changed.

- Field: `demoMode`
- Default: Disabled

> Once Demo Mode is enabled, the toggle to disable it is hidden (to prevent accidental disabling during a demo). To disable Demo Mode, you must do so through the API directly or re-enable it from the backend settings.

---

## Tab 4 — API & Integrations

This tab stores credentials for all third-party services the platform depends on: Firebase, LiveKit, Shippo, and Google.

> Sensitive keys are masked in Demo Mode.

---

### Firebase Configuration

Firebase powers authentication (Google sign-in, Facebook sign-in, email/password login) and real-time features (live chat) across both web and mobile apps.

Get these values from your **Firebase Console → Project Settings → General → Your apps**.

| Field | Description | Example Value |
|---|---|---|
| Firebase Auth Domain | Authentication domain for your Firebase project | `your-project.firebaseapp.com` |
| Firebase Project ID | Unique identifier for your Firebase project | `your-project-id` |
| Firebase Storage Bucket | Cloud Storage bucket for file uploads | `your-project.appspot.com` |
| Firebase App ID | Unique ID for your specific app registration | `1:123456789:web:abc123` |
| Firebase API Key | API key for Firebase services | `AIzaSy...` |

> You need to register both a **web app** and ensure the Firebase project has Authentication enabled with your chosen sign-in methods (Google, Facebook, Email/Password) turned on in the Firebase Console.

---

### LiveKit Integration

LiveKit provides the real-time video streaming infrastructure for all live shows.

| Field | Description | Example |
|---|---|---|
| LiveKit URL | WebSocket URL of your LiveKit server | `wss://your-server.livekit.cloud` |
| LiveKit API Key | API key from your LiveKit project | `APIxxxxxxxx` |
| LiveKit API Secret | Secret key paired with the API Key | `your-livekit-secret` |

> The LiveKit URL must use the `wss://` WebSocket protocol, not `https://`. Get credentials from your LiveKit Cloud dashboard or your self-hosted LiveKit server configuration.

---

### Shippo API Key

Shippo is used for shipping label generation. When a seller creates a shipping label from the admin panel or seller hub, this key is used to communicate with Shippo's API.

- Field: `shippo_api_key`
- Format: starts with `shippo_`
- This is optional — the platform works without it, but label generation will be unavailable

---

### Google API Key

A Google Cloud API key separate from Firebase. Used for Google Maps and Google Places services, such as address autocomplete during checkout and seller address entry.

- Field: `google_api_key`
- Format: starts with `AIza`
- Where to get it: Google Cloud Console → APIs & Services → Credentials

> Enable the **Maps JavaScript API** and **Places API** in your Google Cloud project for this key to work correctly.

---

## Tab 5 — App Versions

This tab manages version numbers and store links for your mobile apps. It is also where the Force Update feature is controlled.

---

### App Version

A general version string for the app. Used as a reference version number.

- Field: `appVersion`
- Example: `2.1.0`

---

### Android Version

The current required version number for the Android app. When Force Update is enabled, Android users on a lower version are blocked until they update.

- Field: `androidVersion`
- Example: `2.1.0`

---

### iOS Version

The current required version number for the iOS app. When Force Update is enabled, iOS users on a lower version are blocked until they update.

- Field: `iosVersion`
- Example: `2.1.0`

---

### Android App URL (Play Store)

The full Google Play Store URL for your Android app. This link is used in the web platform's "Download the app" prompts and in the Force Update screen shown to users who need to update.

- Field: `android_link`
- Example: `https://play.google.com/store/apps/details?id=com.yourapp`

---

### iOS App URL (App Store)

The full Apple App Store URL for your iOS app. Used in the same "Download the app" prompts and Force Update screen.

- Field: `ios_link`
- Example: `https://apps.apple.com/app/your-app-name/id123456789`

---

### Deep Link Scheme

The custom URL scheme used to deep-link from the web platform directly into the native mobile app. When a user on mobile taps a link that should open in the app, this scheme is used to launch it.

- Field: `app_scheme`
- Format: your scheme followed by `://`
- Example: `tokshop://`

> This must match the URL scheme registered in your Flutter app's `AndroidManifest.xml` and `Info.plist`. If these do not match, deep links from web to app will not work.

---

### Force App Update

A toggle that, when enabled, prevents users from using the mobile app until they have updated to the version numbers specified in the Android Version and iOS Version fields above.

- Field: `forceUpdate`
- Default: Disabled

**How it works:**
When the app launches, it checks its version against the versions stored here. If the installed version is lower, the user sees an update prompt and cannot proceed until they update from the App Store or Play Store. The store links configured above are shown directly in this update screen.

> Only enable Force Update after you have published the new version to both app stores and it has passed review. Enabling it before the new version is live will lock out all users.

---

## Tab 6 — Translations

The Translations tab lets you manage all text strings displayed in the mobile apps across multiple languages. You can add as many languages as you need, edit every string directly in the admin panel, and export/import translations as XML files.

---

### How It Works

The platform stores a set of **translation keys** — identifiers like `home`, `profile`, `settings`, `app_name` — each paired with a translated string for every language. When the mobile app displays text, it looks up the key and shows the value for the user's selected language.

---

### Adding a Language

1. Click **Add Language**
2. Enter the 2-letter ISO language code (e.g., `en` for English, `es` for Spanish, `fr` for French, `ar` for Arabic)
3. Click **Add**
4. The new language is pre-populated with all existing keys (using English values as reference) — fill in the translations
5. Click **Save** when done

> English (`en`) is the baseline reference language and cannot be deleted.

---

### Setting the Default Language

Use the **Default Language** dropdown to choose which language the mobile apps use when a user's device language is not available. English is the recommended default.

---

### Editing Translations

1. Select the language you want to edit from the **Select Language to Edit** dropdown
2. All translation keys are listed below — enter the translated text for each key
3. The English value is shown as a placeholder for every field in non-English languages so you always know what the string should say
4. Click **Save** when done

---

### Dynamic Placeholders

Some translation values support dynamic placeholders that are automatically replaced with real values at runtime:

| Placeholder | Replaced With |
|---|---|
| `@app_name` | The platform's configured app name |
| `@name` | The user's display name |
| `@provider` | The authentication provider (Google, Facebook, etc.) |

**Example:** A translation value of `Welcome to @app_name, @name!` would display as `Welcome to TokShop, Jane!` in the app.

---

### Deleting a Language

1. Select the language you want to remove from the dropdown
2. Click the **red trash icon** button
3. Click **Save** to apply the removal

> English cannot be deleted. If you accidentally remove a language, do not save — refresh the page to restore the previous state.

---

### Download XML

Click **Download XML** to export all translations for all languages as a single XML file. This is useful for:
- Sharing with a translator to work offline
- Keeping a backup of your translations
- Bulk editing in a text editor

---

### Upload XML

After editing a downloaded XML file, click **Upload XML** and select your file to import it back. The platform will parse the XML and update all translation values. Review the changes and click **Save** to confirm.

> Only `.xml` files are accepted. The file must follow the same structure as the downloaded XML.

---

## Important Notes

- **Save buttons are per-tab.** General settings have one save button, Theme settings have their own "Save Theme Settings" button, and App Versions and Translations have their own save buttons too. Changing values in one tab and clicking save in another tab will not save the changes you made.
- **Demo Mode is platform-wide.** When enabled, no user — including super admins — can make any changes anywhere on the platform, not just in Settings.
- **API keys take effect immediately** after saving, but changes to Firebase configuration may require a deployment rebuild for the web apps to pick up the new values.
