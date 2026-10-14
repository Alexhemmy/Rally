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
