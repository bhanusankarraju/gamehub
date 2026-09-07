export const ACCENT_COLORS = [
  { name: 'green', hex: '#00ff88', rgb: '0, 255, 136' },
  { name: 'cyan', hex: '#00e5ff', rgb: '0, 229, 255' },
  { name: 'orange', hex: '#ff9c00', rgb: '255, 156, 0' },
  { name: 'pink', hex: '#ff3d8b', rgb: '255, 61, 139' },
  { name: 'red', hex: '#ff4757', rgb: '255, 71, 87' },
  { name: 'blue', hex: '#3b82f6', rgb: '59, 130, 246' },
] as const;

export type AccentColorName = (typeof ACCENT_COLORS)[number]['name'];

export const GAMEPAD_BUTTON_NAMES = [
  'A', 'B', 'X', 'Y',
  'LB', 'RB', 'LT', 'RT',
  'Select', 'Start',
  'L3', 'R3',
  'D-Up', 'D-Down', 'D-Left', 'D-Right',
  'Home',
] as const;

export const STANDARD_BUTTON_MAP: Record<number, string> = {
  0: 'A',
  1: 'B',
  2: 'X',
  3: 'Y',
  4: 'LB',
  5: 'RB',
  6: 'LT',
  7: 'RT',
  8: 'Select',
  9: 'Start',
  10: 'L3',
  11: 'R3',
  12: 'D-Up',
  13: 'D-Down',
  14: 'D-Left',
  15: 'D-Right',
  16: 'Home',
};

export const STANDARD_AXIS_MAP: Record<number, string> = {
  0: 'LeftX',
  1: 'LeftY',
  2: 'RightX',
  3: 'RightY',
};

export const ACTION_OPTIONS = [
  'Jump', 'Crouch', 'Reload', 'Shoot', 'Aim', 'Sprint',
  'Interact', 'Melee', 'Weapon Switch', 'Pause', 'Map',
  'Grenade', 'Dodge', 'Heal', 'Unassigned', 'Custom',
] as const;

export const GAME_GENRES = [
  'Action', 'Adventure', 'FPS', 'Racing', 'Sports', 'RPG',
  'Strategy', 'Simulation', 'Puzzle', 'Horror', 'Sandbox', 'Fighting',
] as const;

export const PLATFORMS = [
  'PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile', 'Multi-Platform',
] as const;

export const PROFILE_TEMPLATES = [
  { name: 'FPS', description: 'First-person shooter layout with aim/shoot on triggers' },
  { name: 'Racing', description: 'Racing layout with accelerate/brake on triggers' },
  { name: 'Sports', description: 'Sports game layout with quick action buttons' },
  { name: 'Adventure', description: 'Adventure layout with interact and camera on sticks' },
  { name: 'Custom', description: 'Start from scratch and build your own layout' },
];

export const DEFAULT_MAPPINGS: Record<string, string> = {
  'A': 'Jump',
  'B': 'Crouch',
  'X': 'Reload',
  'Y': 'Weapon Switch',
  'LB': 'Grenade',
  'RB': 'Melee',
  'LT': 'Aim',
  'RT': 'Shoot',
  'Select': 'Map',
  'Start': 'Pause',
  'L3': 'Sprint',
  'R3': 'Dodge',
  'D-Up': 'Heal',
  'D-Down': 'Interact',
  'D-Left': 'Weapon Switch',
  'D-Right': 'Weapon Switch',
  'Home': 'Pause',
};

export function getButtonName(buttonIndex: number): string {
  return STANDARD_BUTTON_MAP[buttonIndex] ?? `Button ${buttonIndex}`;
}

export function getAxisName(axisIndex: number): string {
  return STANDARD_AXIS_MAP[axisIndex] ?? `Axis ${axisIndex}`;
}
