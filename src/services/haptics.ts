// Haptic feedback for mobile — wraps navigator.vibrate safely

export function hapticLight() {
  try { navigator.vibrate?.(10) } catch {}
}

export function hapticMedium() {
  try { navigator.vibrate?.(25) } catch {}
}

export function hapticSuccess() {
  try { navigator.vibrate?.([15, 50, 15]) } catch {}
}

export function hapticError() {
  try { navigator.vibrate?.([30, 30, 30]) } catch {}
}
