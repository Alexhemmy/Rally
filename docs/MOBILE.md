# Mobile-only features

| Feature | Implementation |
|---------|----------------|
| Bottom tabs | `app/(tabs)/_layout.tsx` — Home, Explore, Feed, Wallet, You |
| Offline banner | `hooks/useNetwork` + `OfflineBanner` probes `/health` |
| Haptics | `hooks/useHaptics` via `Vibration` API |
| System share | `hooks/useShare` — Favorite profile & Moments |
| Pull-to-refresh | `Screen` + `RefreshControl` on tabs & Favorite |
| Safe areas | `SafeAreaProvider` / `SafeAreaView` |
| Responsive grid | `useLayout()` — phone / compact / tablet columns |
| Compose Moment | Camera/library placeholders → wire `expo-image-picker` |
| Biometrics toggle | You tab → wire `expo-local-authentication` for store builds |
| Modal login | Stack `presentation: 'modal'` |

## Responsive

- Horizontal padding scales with width
- Gift grid: 2 / 3 / 4 columns by breakpoint
- Tablet content max-width 560 centered
- Min touch targets 44–48px

## Gestures & feedback (added)

| Interaction | Behavior |
|-------------|----------|
| **Pull to back** | `SwipeBack` — pull down on detail/modals or swipe from left edge |
| **Gift animation** | `GiftBurst` spring + particle burst on successful send |
| **Hold for options** | Long-press gifts, share, wall rows → `LongPressMenu` sheet |
| **Click sounds** | `useSounds().click` on buttons (haptic tick; optional expo-av) |
| **Type sounds** | `SoundTextInput` throttled type ticks while typing |
